# Chrome → App 양방향 동기화 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 새 탭 페이지가 열려있을 때 크롬 북마크바에서 직접 추가/삭제/수정된 북마크와 폴더를 앱에 실시간으로 반영한다.

**Architecture:** 웹 앱에 `ChromeSyncGuard`(중복 방지 싱글톤)와 `useChromeBrowserSync`(이벤트 리스너 hook)를 추가한다. Guard는 웹 앱의 `ChromeSyncService`가 Chrome API를 호출할 때 표시를 남겨, 리스너가 우리 자신의 변경과 사용자 변경을 구분하게 한다. 팝업이 만든 Chrome 북마크는 150ms 지연 후 syncMap 재확인으로 처리한다.

**Tech Stack:** React (useEffect, custom hook), chrome.bookmarks API, chrome.storage.local (syncMap), @tanstack/react-query, Zustand

---

## 변경 파일 목록

| 작업 | 파일 |
|------|------|
| 신규 | `apps/web/src/shared/lib/chrome-sync/ChromeSyncGuard.ts` |
| 신규 | `apps/web/src/shared/lib/chrome-sync/useChromeBrowserSync.ts` |
| 수정 | `apps/web/src/shared/lib/chrome-sync/ChromeSyncService.ts` |
| 수정 | `apps/web/src/shared/lib/chrome-sync/index.ts` |
| 수정 | `apps/web/src/pages/home/ui/HomePage.tsx` |

> **주의:** `apps/extension/src/shared/lib/chrome-sync/ChromeSyncService.ts`는 수정하지 않는다. 팝업에는 이벤트 리스너가 없으므로 Guard 불필요.

---

## Task 1: ChromeSyncGuard 생성

웹 앱의 `ChromeSyncService`가 Chrome API 호출 시 표시를 남기는 모듈 레벨 싱글톤.

**Files:**

- Create: `apps/web/src/shared/lib/chrome-sync/ChromeSyncGuard.ts`

**Step 1: 파일 생성**

```ts
// apps/web/src/shared/lib/chrome-sync/ChromeSyncGuard.ts

/**
 * Module-level guard that prevents the Chrome bookmark event listener
 * from treating our own sync operations as user-initiated changes.
 *
 * Keys:
 *   pendingCreates — `${title}|||${url}` for bookmarks, `folder|||${name}` for folders
 *   pendingRemoves — Chrome node ID
 *   pendingUpdates — Chrome node ID
 */
export const ChromeSyncGuard = {
 pendingCreates: new Set<string>(),
 pendingRemoves: new Set<string>(),
 pendingUpdates: new Set<string>(),
};
```

**Step 2: lint 확인**

```bash
cd /Users/chanoo/Desktop/web/new-project && pnpm check
```

Expected: `Checked N files in Xms. No fixes applied.` (web 패키지)

**Step 3: commit**

```bash
git add apps/web/src/shared/lib/chrome-sync/ChromeSyncGuard.ts
git commit -m "feat: add ChromeSyncGuard for deduplication"
```

---

## Task 2: 웹 앱 ChromeSyncService에 Guard 적용

`ChromeSyncService`의 Chrome API 호출마다 Guard에 표시를 남겨, `useChromeBrowserSync` 리스너가 우리 자신의 변경을 무시하도록 한다.

**Files:**

- Modify: `apps/web/src/shared/lib/chrome-sync/ChromeSyncService.ts`

**Step 1: 파일 전체 교체**

```ts
// apps/web/src/shared/lib/chrome-sync/ChromeSyncService.ts
import type { Bookmark, Folder } from '@bookmark/types';
import { ChromeSyncGuard } from './ChromeSyncGuard';
import { readSyncMap, updateSyncMap, writeSyncMap } from './syncMap';

const BOOKMARKS_BAR_ID = '1';

export class ChromeSyncService {
 private readonly _pendingFolders = new Map<string, Promise<string>>();

 private async ensureFolderSynced(appFolderId: string, allFolders: Folder[]): Promise<string> {
  const pending = this._pendingFolders.get(appFolderId);
  if (pending) return pending;

  const promise = this._doEnsureFolder(appFolderId, allFolders).finally(() => {
   this._pendingFolders.delete(appFolderId);
  });
  this._pendingFolders.set(appFolderId, promise);
  return promise;
 }

 private async _doEnsureFolder(appFolderId: string, allFolders: Folder[]): Promise<string> {
  const map = await readSyncMap();
  if (map.folders[appFolderId]) {
   return map.folders[appFolderId] as string;
  }

  const appFolder = allFolders.find((f) => f.id === appFolderId);
  if (!appFolder) throw new Error(`Folder not found in app: ${appFolderId}`);

  const parentChromeId = await this.getChromeFolderParent(appFolder, allFolders);

  const key = `folder|||${appFolder.name}`;
  ChromeSyncGuard.pendingCreates.add(key);
  const chromeNode = await chrome.bookmarks
   .create({ parentId: parentChromeId, title: appFolder.name })
   .finally(() => ChromeSyncGuard.pendingCreates.delete(key));

  await updateSyncMap({ folders: { [appFolderId]: chromeNode.id } });
  return chromeNode.id;
 }

 private async getChromeFolderParent(appFolder: Folder, allFolders: Folder[]): Promise<string> {
  if (appFolder.parentId === null) return BOOKMARKS_BAR_ID;
  return this.ensureFolderSynced(appFolder.parentId, allFolders);
 }

 async syncCreateBookmark(appBookmark: Bookmark, allFolders: Folder[]): Promise<void> {
  let parentId = BOOKMARKS_BAR_ID;
  if (appBookmark.folderId) {
   parentId = await this.ensureFolderSynced(appBookmark.folderId, allFolders);
  }

  const key = `${appBookmark.title}|||${appBookmark.url}`;
  ChromeSyncGuard.pendingCreates.add(key);
  const chromeNode = await chrome.bookmarks
   .create({ parentId, title: appBookmark.title, url: appBookmark.url })
   .finally(() => ChromeSyncGuard.pendingCreates.delete(key));

  await updateSyncMap({ bookmarks: { [appBookmark.id]: chromeNode.id } });
 }

 async syncUpdateBookmark(appBookmark: Bookmark, allFolders: Folder[]): Promise<void> {
  const map = await readSyncMap();
  const chromeId = map.bookmarks[appBookmark.id];

  if (!chromeId) {
   await this.syncCreateBookmark(appBookmark, allFolders);
   return;
  }

  let targetParentId = BOOKMARKS_BAR_ID;
  if (appBookmark.folderId) {
   targetParentId = await this.ensureFolderSynced(appBookmark.folderId, allFolders);
  }

  ChromeSyncGuard.pendingUpdates.add(chromeId);
  try {
   await chrome.bookmarks.update(chromeId, {
    title: appBookmark.title,
    url: appBookmark.url,
   });
   await chrome.bookmarks.move(chromeId, { parentId: targetParentId });
  } catch {
   await this.syncCreateBookmark(appBookmark, allFolders);
  } finally {
   ChromeSyncGuard.pendingUpdates.delete(chromeId);
  }
 }

 async syncDeleteBookmark(appBookmarkId: string): Promise<void> {
  const map = await readSyncMap();
  const chromeId = map.bookmarks[appBookmarkId];
  if (!chromeId) return;

  ChromeSyncGuard.pendingRemoves.add(chromeId);
  try {
   await chrome.bookmarks.remove(chromeId);
  } catch {
   // Chrome node may have been manually deleted — ignore
  } finally {
   ChromeSyncGuard.pendingRemoves.delete(chromeId);
  }

  const updatedBookmarks = { ...map.bookmarks };
  delete updatedBookmarks[appBookmarkId];
  await writeSyncMap({ folders: map.folders, bookmarks: updatedBookmarks });
 }

 async syncCreateFolder(appFolder: Folder, allFolders: Folder[]): Promise<void> {
  await this.ensureFolderSynced(appFolder.id, allFolders);
 }

 async syncDeleteFolder(appFolderId: string): Promise<void> {
  const map = await readSyncMap();
  const chromeId = map.folders[appFolderId];
  if (!chromeId) return;

  ChromeSyncGuard.pendingRemoves.add(chromeId);
  try {
   await chrome.bookmarks.removeTree(chromeId);
  } catch {
   // Chrome node may have been manually deleted — ignore
  } finally {
   ChromeSyncGuard.pendingRemoves.delete(chromeId);
  }

  const updatedFolders = { ...map.folders };
  delete updatedFolders[appFolderId];
  await writeSyncMap({ folders: updatedFolders, bookmarks: map.bookmarks });
 }
}
```

**Step 2: 타입 체크 및 lint**

```bash
cd /Users/chanoo/Desktop/web/new-project && pnpm check && pnpm check-types
```

Expected: 6 packages all successful, 에러 없음

**Step 3: commit**

```bash
git add apps/web/src/shared/lib/chrome-sync/ChromeSyncService.ts
git commit -m "feat: apply ChromeSyncGuard to web app ChromeSyncService"
```

---

## Task 3: useChromeBrowserSync hook 생성

크롬 북마크 이벤트를 수신해 앱 스토리지를 갱신하는 React hook.

**Files:**

- Create: `apps/web/src/shared/lib/chrome-sync/useChromeBrowserSync.ts`

**Step 1: 파일 생성**

```ts
// apps/web/src/shared/lib/chrome-sync/useChromeBrowserSync.ts
import type { CreateBookmarkDto, CreateFolderDto } from '@bookmark/types';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { bookmarkKeys } from '@/entities/bookmark';
import { folderKeys } from '@/entities/folder';
import { useSettingStore } from '@/features/settings';
import { useStorageAdapter } from '@/shared/lib/storage';
import { ChromeSyncGuard } from './ChromeSyncGuard';
import { readSyncMap, updateSyncMap, writeSyncMap } from './syncMap';

/**
 * Returns the app-side ID (key) whose synced Chrome ID (value) matches `chromeId`.
 */
function findAppId(chromeId: string, map: Record<string, string>): string | undefined {
 return Object.entries(map).find(([, v]) => v === chromeId)?.[0];
}

/**
 * Listens to chrome.bookmarks events and reflects user-initiated Chrome bookmark
 * changes into the app storage. Only active when `realtimeSync` is enabled and
 * the new-tab page is open.
 *
 * Deduplication strategy:
 * - Same-page guard: ChromeSyncGuard tracks in-flight operations from ChromeSyncService
 * - Cross-page guard: 150ms delay + syncMap re-check for changes from the popup
 */
export function useChromeBrowserSync(): void {
 const { realtimeSync } = useSettingStore();
 const adapter = useStorageAdapter();
 const queryClient = useQueryClient();

 useEffect(() => {
  if (!realtimeSync || typeof chrome === 'undefined' || !chrome.bookmarks) return;

  const handleCreated = async (
   id: string,
   node: chrome.bookmarks.BookmarkTreeNode,
  ): Promise<void> => {
   if (node.url) {
    // ── Bookmark ──
    const key = `${node.title}|||${node.url}`;
    if (ChromeSyncGuard.pendingCreates.has(key)) return;

    // Check syncMap immediately, then after 150ms to catch cross-page race
    let syncMap = await readSyncMap();
    if (findAppId(id, syncMap.bookmarks)) return;

    await new Promise<void>((resolve) => setTimeout(resolve, 150));
    syncMap = await readSyncMap();
    if (findAppId(id, syncMap.bookmarks)) return;

    const appParentId = node.parentId
     ? findAppId(node.parentId, syncMap.folders)
     : undefined;

    try {
     const dto: CreateBookmarkDto = {
      url: node.url,
      title: node.title,
      folderId: appParentId,
     };
     const bookmark = await adapter.createBookmark(dto);
     await updateSyncMap({ bookmarks: { [bookmark.id]: id } });
     queryClient.invalidateQueries({ queryKey: bookmarkKeys.all });
    } catch {
     toast.error('Chrome 북마크 가져오기에 실패했습니다.');
    }
   } else {
    // ── Folder ──
    const key = `folder|||${node.title}`;
    if (ChromeSyncGuard.pendingCreates.has(key)) return;

    let syncMap = await readSyncMap();
    if (findAppId(id, syncMap.folders)) return;

    await new Promise<void>((resolve) => setTimeout(resolve, 150));
    syncMap = await readSyncMap();
    if (findAppId(id, syncMap.folders)) return;

    const appParentId = node.parentId
     ? findAppId(node.parentId, syncMap.folders)
     : undefined;

    try {
     const dto: CreateFolderDto = { name: node.title, parentId: appParentId };
     const folder = await adapter.createFolder(dto);
     await updateSyncMap({ folders: { [folder.id]: id } });
     queryClient.invalidateQueries({ queryKey: folderKeys.all });
    } catch {
     toast.error('Chrome 폴더 가져오기에 실패했습니다.');
    }
   }
  };

  const handleRemoved = async (
   id: string,
   _removeInfo: chrome.bookmarks.BookmarkRemoveInfo,
  ): Promise<void> => {
   if (ChromeSyncGuard.pendingRemoves.has(id)) return;

   const syncMap = await readSyncMap();
   const appBookmarkId = findAppId(id, syncMap.bookmarks);
   const appFolderId = findAppId(id, syncMap.folders);

   if (appBookmarkId) {
    try {
     await adapter.deleteBookmark(appBookmarkId);
    } catch {
     // ignore — may already be deleted
    }
    const updatedBookmarks = { ...syncMap.bookmarks };
    delete updatedBookmarks[appBookmarkId];
    await writeSyncMap({ folders: syncMap.folders, bookmarks: updatedBookmarks });
    queryClient.invalidateQueries({ queryKey: bookmarkKeys.all });
   } else if (appFolderId) {
    try {
     await adapter.deleteFolder(appFolderId);
    } catch {
     // ignore — may already be deleted
    }
    const updatedFolders = { ...syncMap.folders };
    delete updatedFolders[appFolderId];
    await writeSyncMap({ folders: updatedFolders, bookmarks: syncMap.bookmarks });
    queryClient.invalidateQueries({ queryKey: folderKeys.all });
    queryClient.invalidateQueries({ queryKey: bookmarkKeys.all });
   }
   // Chrome ID not in syncMap → user's own Chrome bookmark, ignore
  };

  const handleChanged = async (
   id: string,
   changeInfo: chrome.bookmarks.BookmarkChangeInfo,
  ): Promise<void> => {
   if (ChromeSyncGuard.pendingUpdates.has(id)) return;

   const syncMap = await readSyncMap();
   const appBookmarkId = findAppId(id, syncMap.bookmarks);
   if (!appBookmarkId) return;

   try {
    await adapter.updateBookmark(appBookmarkId, {
     title: changeInfo.title,
     ...(changeInfo.url !== undefined ? { url: changeInfo.url } : {}),
    });
    queryClient.invalidateQueries({ queryKey: bookmarkKeys.all });
   } catch {
    toast.error('Chrome 북마크 수정 반영에 실패했습니다.');
   }
  };

  chrome.bookmarks.onCreated.addListener(handleCreated);
  chrome.bookmarks.onRemoved.addListener(handleRemoved);
  chrome.bookmarks.onChanged.addListener(handleChanged);

  return () => {
   chrome.bookmarks.onCreated.removeListener(handleCreated);
   chrome.bookmarks.onRemoved.removeListener(handleRemoved);
   chrome.bookmarks.onChanged.removeListener(handleChanged);
  };
 }, [realtimeSync, adapter, queryClient]);
}
```

**Step 2: 타입 체크 및 lint**

```bash
cd /Users/chanoo/Desktop/web/new-project && pnpm check && pnpm check-types
```

Expected: 6 packages all successful, 에러 없음

**Step 3: commit**

```bash
git add apps/web/src/shared/lib/chrome-sync/useChromeBrowserSync.ts
git commit -m "feat: add useChromeBrowserSync hook for Chrome→App sync"
```

---

## Task 4: index.ts 배럴 export 업데이트

**Files:**

- Modify: `apps/web/src/shared/lib/chrome-sync/index.ts`

**Step 1: 파일 수정**

현재:

```ts
export { ChromeSyncService } from './ChromeSyncService';
export type { SyncMap } from './syncMap';
export { readSyncMap, updateSyncMap, writeSyncMap } from './syncMap';
export { useChromeSyncService } from './useChromeSyncService';
```

수정 후:

```ts
export { ChromeSyncGuard } from './ChromeSyncGuard';
export { ChromeSyncService } from './ChromeSyncService';
export type { SyncMap } from './syncMap';
export { readSyncMap, updateSyncMap, writeSyncMap } from './syncMap';
export { useChromeBrowserSync } from './useChromeBrowserSync';
export { useChromeSyncService } from './useChromeSyncService';
```

**Step 2: lint 확인**

```bash
cd /Users/chanoo/Desktop/web/new-project && pnpm check
```

Expected: 에러 없음

**Step 3: commit**

```bash
git add apps/web/src/shared/lib/chrome-sync/index.ts
git commit -m "chore: export ChromeSyncGuard and useChromeBrowserSync from barrel"
```

---

## Task 5: HomePage에 hook 마운트

새 탭 페이지가 열릴 때 이벤트 리스너를 자동으로 등록한다.

**Files:**

- Modify: `apps/web/src/pages/home/ui/HomePage.tsx`

**Step 1: 현재 파일 읽기 후 수정**

`HomePage.tsx`를 먼저 읽어 내용을 확인한 후 아래 두 가지를 추가:

1. import 추가:

```ts
import { useChromeBrowserSync } from '@/shared/lib/chrome-sync';
```

1. 컴포넌트 함수 본문 상단에 hook 호출 추가:

```ts
export function HomePage() {
  useChromeBrowserSync(); // Chrome → App 실시간 동기화
  // ... 나머지 기존 코드
}
```

**Step 2: 타입 체크 및 lint**

```bash
cd /Users/chanoo/Desktop/web/new-project && pnpm check && pnpm check-types
```

Expected: 6 packages all successful, 에러 없음

**Step 3: commit**

```bash
git add apps/web/src/pages/home/ui/HomePage.tsx
git commit -m "feat: mount useChromeBrowserSync in HomePage for Chrome→App sync"
```

---

## 최종 검증

1. Chrome 확장 빌드 후 설치
2. 새 탭 열기 → 설정에서 "실시간 동기화" ON
3. Chrome 북마크바에서 북마크 추가 → 새 탭 앱에 반영되는지 확인
4. Chrome 북마크바에서 북마크 삭제 → 앱에서도 사라지는지 확인
5. Chrome 북마크 제목 수정 → 앱에서도 수정되는지 확인
6. 앱에서 북마크 추가 → Chrome 북마크바에 반영 + 앱에 중복 생성되지 않는지 확인 (무한루프 없음)

```bash
pnpm check && pnpm check-types
```
