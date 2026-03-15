# 실시간 동기화 규칙 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 설계 문서(`2026-03-12-realtime-sync-rules-design.md`)에 정의된 동기화 규칙을 코드에 반영하고, 누락된 sync 호출을 보완한다.

**Architecture:** Operation-level Guard 방식 유지. 각 UI 컴포넌트의 mutation onSuccess에서 `ChromeSyncService`를 호출하는 기존 패턴을 표준화하고 누락 지점을 채운다.

**Tech Stack:** React, React Query, Zustand, Chrome Bookmarks API, ChromeSyncService, ChromeSyncGuard

---

## 현재 상태 요약

### 동기화 호출 지점 현황

| 위치 | create | update | delete |
|------|--------|--------|--------|
| BookmarkCreateDialog | `syncCreateBookmark` ✅ | - | - |
| BookmarkEditDialog | - | `syncUpdateBookmark` ✅ | - |
| FolderCreateDialog | `syncCreateFolder` ✅ | - | - |
| GlassFolderView | - | `syncUpdateFolder` ✅ | `syncDeleteBookmark` ✅, `syncDeleteFolder` ✅ |
| FolderTree | - | `syncUpdateFolder` ✅ | `syncDeleteFolder` ✅ |
| BookmarkCard | - | - | `syncDeleteBookmark` ✅ |
| **FileExplorerModal** | - | - | **`syncDeleteFolder` ❌ 누락** |

### 모드 격리 현황

| 규칙 | 구현 상태 |
|------|---------|
| `chrome-to-web` → ChromeSyncService null 반환 | ✅ `useChromeSyncService`가 이미 처리 |
| `web-to-chrome` → Chrome 이벤트 리스너 미등록 | ✅ `useChromeBrowserSync`가 이미 처리 |
| Guard try/finally | ✅ `ChromeSyncService` 내부에서 처리 |

### 결론

**핵심 작업은 1개:** `FileExplorerModal`의 `deleteFolder` onSuccess에 `syncDeleteFolder` 추가.
나머지는 검증 및 테스트.

---

## Task 1: FileExplorerModal - syncDeleteFolder 추가

**Files:**
- Modify: `apps/web/src/widgets/bookmark-list/ui/FileExplorerModal.tsx`

### Step 1: 현재 deleteFolder 코드 위치 확인

파일에서 `deleteFolder` 호출 부분을 찾는다 (약 lines 364-380).
현재 패턴:

```typescript
deleteFolder(folder.id, {
  onSuccess: () => {
    if (folder.id === currentFolderId) {
      if (folder.parentId) setCurrentFolderId(folder.parentId);
      else onClose();
    }
  },
  onError: () => toast.error('폴더 삭제에 실패했습니다.'),
});
```

### Step 2: chromeSyncService 인스턴스 확인

파일 상단에 `useChromeSyncService` import 및 사용이 있는지 확인.
없으면 추가:

```typescript
import { useChromeSyncService } from '@/shared/lib/chrome-sync';
// ...
const { syncMode } = useSettingStore();
const chromeSyncService = useChromeSyncService(syncMode);
```

### Step 3: syncDeleteFolder 호출 추가

```typescript
deleteFolder(folder.id, {
  onSuccess: () => {
    if (chromeSyncService) {
      chromeSyncService
        .syncDeleteFolder(folder.id)
        .catch(() => toast.error('Chrome 폴더 동기화에 실패했습니다.'));
    }
    if (folder.id === currentFolderId) {
      if (folder.parentId) setCurrentFolderId(folder.parentId);
      else onClose();
    }
  },
  onError: () => toast.error('폴더 삭제에 실패했습니다.'),
});
```

### Step 4: pnpm check 실행

```bash
pnpm check
```

Expected: 에러 없음

### Step 5: pnpm check-types 실행

```bash
pnpm check-types
```

Expected: 에러 없음

### Step 6: 커밋

```bash
git add apps/web/src/widgets/bookmark-list/ui/FileExplorerModal.tsx
git commit -m "fix: add missing syncDeleteFolder in FileExplorerModal"
```

---

## Task 2: SyncMode 모드 격리 검증

**Files:**
- Read: `apps/web/src/shared/lib/chrome-sync/useChromeSyncService.ts`
- Read: `apps/web/src/shared/lib/chrome-sync/useChromeBrowserSync.ts`

### Step 1: chrome-to-web 격리 확인

`useChromeSyncService.ts`에서 다음 조건이 있는지 확인:

```typescript
const isAvailable =
  (syncMode === 'web-to-chrome' || syncMode === 'bidirectional') &&
  typeof chrome !== 'undefined' &&
  !!chrome.bookmarks;
```

`chrome-to-web` 모드는 `isAvailable = false` → `null` 반환 → 모든 sync 호출이 `if (chromeSyncService)` 체크로 차단됨.

✅ 이미 올바르게 구현됨. 변경 불필요.

### Step 2: web-to-chrome 리스너 격리 확인

`useChromeBrowserSync.ts`에서 리스너 등록 부분이 다음 조건 내에 있는지 확인:

```typescript
if (syncMode === 'chrome-to-web' || syncMode === 'bidirectional') {
  chrome.bookmarks.onCreated.addListener(handleCreated);
  chrome.bookmarks.onRemoved.addListener(handleRemoved);
  chrome.bookmarks.onChanged.addListener(handleChanged);
  // cleanup return
}
```

`web-to-chrome` 모드에서는 리스너 등록 코드 블록 자체에 진입하지 않음.

✅ 이미 올바르게 구현됨. 변경 불필요.

---

## Task 3: Guard 패턴 검증

**Files:**
- Read: `apps/web/src/shared/lib/chrome-sync/ChromeSyncService.ts`

### Step 1: 각 메서드의 Guard try/finally 확인

다음 6개 메서드 모두 이 패턴을 따르는지 확인:

```typescript
// syncCreateBookmark 패턴
const guardKey = `${appBookmark.title}|||${appBookmark.url}`;
ChromeSyncGuard.pendingCreates.add(guardKey);
try {
  // chrome API call
} finally {
  ChromeSyncGuard.pendingCreates.delete(guardKey);
}

// syncUpdateBookmark / syncUpdateFolder 패턴
ChromeSyncGuard.pendingUpdates.add(chromeId);
try {
  // chrome API call
} finally {
  ChromeSyncGuard.pendingUpdates.delete(chromeId);
}

// syncDeleteBookmark / syncDeleteFolder 패턴
ChromeSyncGuard.pendingRemoves.add(chromeId);
try {
  // chrome API call
} finally {
  ChromeSyncGuard.pendingRemoves.delete(chromeId);
}
```

### Step 2: syncCreateFolder Guard 확인

`syncCreateFolder`는 내부적으로 `ensureFolderSynced`를 호출하는데,
`ensureFolderSynced` 내에서 Guard가 적용되는지 확인.
폴더 생성 키: `"folder|||${appFolder.name}"`

### Step 3: 문제 발견 시 수정

Guard가 누락된 메서드가 있으면 위 패턴으로 수정.

### Step 4: 수정 시 커밋

```bash
git add apps/web/src/shared/lib/chrome-sync/ChromeSyncService.ts
git commit -m "fix: ensure Guard try/finally pattern in ChromeSyncService"
```

---

## Task 4: 테스트 작성

**Files:**
- Create: `apps/web/__tests__/chrome-sync/syncRules.test.ts`

### Step 1: 테스트 파일 생성

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChromeSyncGuard } from '@/shared/lib/chrome-sync/ChromeSyncGuard';
import { ChromeSyncService } from '@/shared/lib/chrome-sync/ChromeSyncService';

// Chrome API mock
const mockChrome = {
  bookmarks: {
    create: vi.fn(),
    update: vi.fn(),
    move: vi.fn(),
    remove: vi.fn(),
    removeTree: vi.fn(),
    getChildren: vi.fn(),
  },
  storage: {
    local: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
    },
  },
};

vi.stubGlobal('chrome', mockChrome);
```

### Step 2: Guard 피드백 루프 방지 테스트

```typescript
describe('ChromeSyncGuard - 피드백 루프 방지', () => {
  beforeEach(() => {
    ChromeSyncGuard.pendingCreates.clear();
    ChromeSyncGuard.pendingUpdates.clear();
    ChromeSyncGuard.pendingRemoves.clear();
    vi.clearAllMocks();
  });

  it('syncCreateBookmark 실행 중 Chrome onCreated 이벤트가 Guard에 의해 차단되어야 한다', async () => {
    const service = new ChromeSyncService();
    const bookmark = { id: 'bm1', title: 'Test', url: 'https://test.com', folderId: null };

    mockChrome.bookmarks.create.mockImplementation(async (data: unknown) => {
      // Chrome API 호출 중 Guard 상태 확인
      const key = `${bookmark.title}|||${bookmark.url}`;
      expect(ChromeSyncGuard.pendingCreates.has(key)).toBe(true);
      return { id: 'chrome1', ...data };
    });

    await service.syncCreateBookmark(bookmark as Bookmark, []);

    // 완료 후 Guard가 정리되어야 함
    const key = `${bookmark.title}|||${bookmark.url}`;
    expect(ChromeSyncGuard.pendingCreates.has(key)).toBe(false);
  });

  it('syncCreateBookmark 실패 시에도 Guard가 정리되어야 한다', async () => {
    const service = new ChromeSyncService();
    const bookmark = { id: 'bm1', title: 'Test', url: 'https://test.com', folderId: null };

    mockChrome.bookmarks.create.mockRejectedValue(new Error('Chrome API error'));

    // 에러가 throw되든 catch되든 Guard는 정리되어야 함
    await service.syncCreateBookmark(bookmark as Bookmark, []);

    const key = `${bookmark.title}|||${bookmark.url}`;
    expect(ChromeSyncGuard.pendingCreates.has(key)).toBe(false);
  });
});
```

### Step 3: 모드 격리 테스트

```typescript
describe('useChromeSyncService - 모드 격리', () => {
  it('chrome-to-web 모드에서 null을 반환해야 한다', () => {
    const { result } = renderHook(() => useChromeSyncService('chrome-to-web'));
    expect(result.current).toBeNull();
  });

  it('web-to-chrome 모드에서 서비스 인스턴스를 반환해야 한다', () => {
    const { result } = renderHook(() => useChromeSyncService('web-to-chrome'));
    expect(result.current).toBeInstanceOf(ChromeSyncService);
  });

  it('off 모드에서 null을 반환해야 한다', () => {
    const { result } = renderHook(() => useChromeSyncService('off'));
    expect(result.current).toBeNull();
  });
});
```

### Step 4: 테스트 실행

```bash
pnpm --filter @repo/web test
```

Expected: 모든 테스트 통과

### Step 5: 커밋

```bash
git add apps/web/__tests__/chrome-sync/syncRules.test.ts
git commit -m "test: add Chrome sync Guard and mode isolation tests"
```

---

## Task 5: 최종 검증

### Step 1: 전체 체크 실행

```bash
pnpm check && pnpm check-types && pnpm --filter @repo/web test
```

Expected: 모든 단계 통과

### Step 2: 런타임 검증 체크리스트

- [ ] `web-to-chrome` 모드: 북마크 생성 시 Chrome에 즉시 반영되는지
- [ ] `web-to-chrome` 모드: 북마크 삭제 시 Chrome에서 즉시 제거되는지
- [ ] `chrome-to-web` 모드: 웹앱에서 삭제해도 Chrome에 영향 없는지
- [ ] `bidirectional` 모드: Chrome에서 추가한 북마크가 웹앱에 반영되는지
- [ ] `bidirectional` 모드: 웹앱에서 폴더 삭제 시 Chrome에서도 제거되는지
- [ ] FileExplorerModal에서 폴더 삭제 시 Chrome sync 실행되는지

### Step 3: 설계 문서 및 플랜 커밋

```bash
git add docs/plans/2026-03-12-realtime-sync-rules-design.md docs/plans/2026-03-12-realtime-sync-impl.md
git commit -m "docs: add real-time sync design and implementation plan"
```
