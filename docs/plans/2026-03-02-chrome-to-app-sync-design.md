# Chrome → App 양방향 동기화 Design

## Goal

새 탭 페이지가 열려있을 때, 크롬 북마크바에서 직접 추가/삭제/수정된 북마크와 폴더를 우리 앱에 실시간으로 반영한다.

## Scope

- **동기화 방향:** Chrome → App (App → Chrome은 이미 구현됨)
- **활성 조건:** `realtimeSync` 설정 ON + 새 탭 페이지가 열려있을 때
- **대상:** 크롬 북마크바의 모든 변경 (직접 추가한 것 포함, 하위 폴더 포함)
- **제외:** 백그라운드 서비스 워커 (새 탭이 닫혀있을 때는 동기화 안 함)

---

## Architecture

### 데이터 흐름

```
크롬 북마크바 변경 (user action)
  → chrome.bookmarks.onCreated/onRemoved/onChanged 이벤트
  → useChromeBrowserSync hook (새 탭 페이지에서 수신)
  → ChromeSyncGuard 중복 방지 체크
  → storageAdapter 직접 호출 (create/update/delete)
  → React Query 캐시 무효화 → UI 갱신
```

### 파일 목록

| 작업 | 파일 |
|------|------|
| 신규 | `apps/web/src/shared/lib/chrome-sync/ChromeSyncGuard.ts` |
| 신규 | `apps/web/src/shared/lib/chrome-sync/useChromeBrowserSync.ts` |
| 수정 | `apps/web/src/shared/lib/chrome-sync/ChromeSyncService.ts` |
| 수정 | `apps/extension/src/shared/lib/chrome-sync/ChromeSyncService.ts` |
| 수정 | `apps/web/src/shared/lib/chrome-sync/index.ts` |
| 수정 | `apps/web/src/pages/home/ui/HomePage.tsx` |

---

## Section 1: ChromeSyncGuard

무한루프 방지를 위한 모듈 레벨 싱글톤. `ChromeSyncService`가 Chrome API를 호출하기 **직전**에 표시하고, 이벤트 리스너가 체크한다.

```ts
// apps/web/src/shared/lib/chrome-sync/ChromeSyncGuard.ts
export const ChromeSyncGuard = {
  pendingCreates: new Set<string>(), // key: `${title}|||${url}` or `folder|||${name}`
  pendingRemoves: new Set<string>(), // chrome node id
  pendingUpdates: new Set<string>(), // chrome node id
};
```

**키 형식:**
- 북마크 생성: `` `${title}|||${url}` ``
- 폴더 생성: `` `folder|||${name}` ``
- 삭제/수정: Chrome node ID

---

## Section 2: ChromeSyncService 수정

각 Chrome API 호출을 Guard로 감싼다. `apps/web`과 `apps/extension` 양쪽 모두 적용.

```ts
async syncCreateBookmark(bookmark, folders) {
  const key = `${bookmark.title}|||${bookmark.url}`;
  ChromeSyncGuard.pendingCreates.add(key);
  try {
    const node = await chrome.bookmarks.create({ ... });
    await updateSyncMap({ bookmarks: { [bookmark.id]: node.id } });
  } finally {
    ChromeSyncGuard.pendingCreates.delete(key);
  }
}

async syncDeleteBookmark(appBookmarkId) {
  const map = await readSyncMap();
  const chromeId = map.bookmarks[appBookmarkId];
  if (!chromeId) return;

  ChromeSyncGuard.pendingRemoves.add(chromeId);
  try {
    await chrome.bookmarks.remove(chromeId);
    // syncMap 정리 ...
  } finally {
    ChromeSyncGuard.pendingRemoves.delete(chromeId);
  }
}

async syncUpdateBookmark(bookmark, folders) {
  const map = await readSyncMap();
  const chromeId = map.bookmarks[bookmark.id];
  if (!chromeId) { await this.syncCreateBookmark(bookmark, folders); return; }

  ChromeSyncGuard.pendingUpdates.add(chromeId);
  try {
    await chrome.bookmarks.update(chromeId, { title: bookmark.title, url: bookmark.url });
    await chrome.bookmarks.move(chromeId, { parentId: targetParentId });
  } catch {
    await this.syncCreateBookmark(bookmark, folders);
  } finally {
    ChromeSyncGuard.pendingUpdates.delete(chromeId);
  }
}

// _doEnsureFolder도 동일하게 Guard 적용
private async _doEnsureFolder(appFolderId, allFolders) {
  const key = `folder|||${appFolder.name}`;
  ChromeSyncGuard.pendingCreates.add(key);
  try {
    const node = await chrome.bookmarks.create({ ... });
    await updateSyncMap({ folders: { [appFolderId]: node.id } });
    return node.id;
  } finally {
    ChromeSyncGuard.pendingCreates.delete(key);
  }
}
```

---

## Section 3: useChromeBrowserSync hook

새 탭 페이지가 마운트될 때 이벤트 리스너를 등록하고, 언마운트 시 제거한다.

### 역방향 조회 헬퍼

```ts
function findAppId(chromeId: string, map: Record<string, string>): string | undefined {
  return Object.entries(map).find(([, v]) => v === chromeId)?.[0];
}
```

### onCreated 처리

```ts
chrome.bookmarks.onCreated.addListener(async (id, node) => {
  const syncMap = await readSyncMap();

  if (node.url) {
    // 북마크
    const key = `${node.title}|||${node.url}`;
    if (ChromeSyncGuard.pendingCreates.has(key)) return;
    if (findAppId(id, syncMap.bookmarks)) return; // 이미 추적 중

    const appParentId = node.parentId ? findAppId(node.parentId, syncMap.folders) : undefined;
    const bookmark = await adapter.createBookmark({
      url: node.url,
      title: node.title,
      folderId: appParentId,
    });
    await updateSyncMap({ bookmarks: { [bookmark.id]: id } });
  } else {
    // 폴더
    const key = `folder|||${node.title}`;
    if (ChromeSyncGuard.pendingCreates.has(key)) return;
    if (findAppId(id, syncMap.folders)) return;

    const appParentId = node.parentId ? findAppId(node.parentId, syncMap.folders) : undefined;
    const folder = await adapter.createFolder({ name: node.title, parentId: appParentId });
    await updateSyncMap({ folders: { [folder.id]: id } });
  }

  queryClient.invalidateQueries({ queryKey: bookmarkKeys.all });
  queryClient.invalidateQueries({ queryKey: folderKeys.all });
});
```

### onRemoved 처리

```ts
chrome.bookmarks.onRemoved.addListener(async (id, removeInfo) => {
  if (ChromeSyncGuard.pendingRemoves.has(id)) return;

  const syncMap = await readSyncMap();
  const appBookmarkId = findAppId(id, syncMap.bookmarks);
  const appFolderId = findAppId(id, syncMap.folders);

  if (appBookmarkId) {
    await adapter.deleteBookmark(appBookmarkId);
    // syncMap에서 제거
    queryClient.invalidateQueries({ queryKey: bookmarkKeys.all });
  } else if (appFolderId) {
    await adapter.deleteFolder(appFolderId);
    queryClient.invalidateQueries({ queryKey: folderKeys.all });
    queryClient.invalidateQueries({ queryKey: bookmarkKeys.all });
  }
  // syncMap에 없으면 무시 (우리가 모르는 크롬 북마크)
});
```

### onChanged 처리

```ts
chrome.bookmarks.onChanged.addListener(async (id, changeInfo) => {
  if (ChromeSyncGuard.pendingUpdates.has(id)) return;

  const syncMap = await readSyncMap();
  const appBookmarkId = findAppId(id, syncMap.bookmarks);
  if (!appBookmarkId) return; // 추적하지 않는 북마크

  await adapter.updateBookmark(appBookmarkId, {
    title: changeInfo.title,
    url: changeInfo.url,
  });
  queryClient.invalidateQueries({ queryKey: bookmarkKeys.all });
});
```

### hook 시그니처

```ts
export function useChromeBrowserSync(): void
// - realtimeSync가 false면 리스너 등록 안 함
// - chrome.bookmarks API 없으면 조기 반환
// - useEffect cleanup에서 리스너 제거
```

### 마운트 위치

`apps/web/src/pages/home/ui/HomePage.tsx`에서 호출:
```ts
useChromeBrowserSync();
```

---

## 에러 처리

- 어댑터 호출 실패 시: `toast.error()`로 사용자에게 알림
- 크롬 API 에러: try/catch로 감싸 무시 (silent fail)

## 한계

- 새 탭이 닫혀있을 때 크롬에서 변경한 내용은 다음에 새 탭을 열 때 반영되지 않음
- API 모드(서버 스토리지)에서는 `onChanged`에 `url` 필드가 없을 수 있음 → `changeInfo.url ?? undefined` 처리
