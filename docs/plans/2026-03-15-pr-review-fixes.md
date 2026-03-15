# PR Review Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all critical and important issues found in the comprehensive PR review of the last 5 commits.

**Architecture:** Fixes are grouped by severity and file proximity. Critical bugs are fixed first (data correctness), then error handling improvements, then test coverage additions.

**Tech Stack:** TypeScript, React, @dnd-kit, Zustand, React Query, Vitest, Chrome Extension APIs

---

### Task 1: Remove debug console.log before null guard

**Files:**
- Modify: `packages/api-client/src/chrome-storage-adapter.ts:32`

**Fix:** Delete `console.log(chrome.storage)` line — it crashes if `chrome` is undefined (before the guard).

### Task 2: Sort folder tree children by `order` field

**Files:**
- Modify: `apps/web/src/entities/folder/model/folderTree.ts:14`

**Fix:** Add `.sort((a, b) => a.order - b.order)` before `.map()` in `buildFolderTree`.

### Task 3: Fix `useSortableReorder` stale state sync bugs

**Files:**
- Modify: `apps/web/src/shared/lib/dnd/useSortableReorder.ts`

**Bugs:**
1. `syncedItems = serverItems.length > 0 ? items : serverItems` — always returns stale local state after server updates
2. `handleDragEnd` closes over stale `displayItems` — use ref to avoid staleness
3. `setItems` exposed in return value — replace with `reset()` for safe external reset

**Fix:** Use `useEffect` to sync from server, `useRef` for latest items in callback.

### Task 4: Fix `PopupPage` SyncMode type mismatch

**Files:**
- Modify: `apps/extension/src/pages/popup/ui/PopupPage.tsx:27`

**Fix:** Change `useChromeSyncService(settings.syncMode !== 'off')` to `useChromeSyncService(settings.syncMode)`.

### Task 5: Fix `migrateLocalToApi` error handling in PopupPage

**Files:**
- Modify: `apps/extension/src/pages/popup/ui/PopupPage.tsx:156-162`

**Fix:** Only call `switchToApi()` on success, show error toast on failure.

### Task 6: Add error logging to ChromeSyncService catch blocks

**Files:**
- Modify: `apps/web/src/shared/lib/chrome-sync/ChromeSyncService.ts`

**Fix:** Add `console.error(error)` before fallback in all 5 catch blocks.

### Task 7: Add default `onError` to mutation hooks

**Files:**
- Modify: `apps/web/src/entities/bookmark/api/useReorderBookmarks.ts`
- Modify: `apps/web/src/entities/folder/api/useReorderFolders.ts`

**Fix:** Add `onError: () => toast.error(...)` at mutation definition level.

### Task 8: Add `onError` to `GlassFolderView.handleDelete`

**Files:**
- Modify: `apps/web/src/widgets/bookmark-list/ui/GlassFolderView.tsx`

**Fix:** Add `onError: () => toast.error('북마크 삭제에 실패했습니다.')` to deleteBookmark call.

### Task 9: Add SyncMode runtime validation in settingStore

**Files:**
- Modify: `apps/web/src/features/settings/model/settingStore.ts`

**Fix:** Add `isSyncMode` type guard and use it in the `migrate` function.

### Task 10: Add folder deletion confirmation in FolderTree and GlassFolderView

**Files:**
- Modify: `apps/web/src/widgets/sidebar/ui/FolderTree.tsx`
- Modify: `apps/web/src/widgets/bookmark-list/ui/GlassFolderView.tsx`
- Modify: `apps/web/src/widgets/bookmark-list/ui/FileExplorerModal.tsx`

**Fix:** Add `window.confirm()` before `deleteFolder` calls. Simple and no new dependencies.

### Task 11: Fix fixture `order` field in ChromeSyncService tests

**Files:**
- Modify: `apps/web/__tests__/shared/lib/chrome-sync/ChromeSyncService.test.ts`

**Fix:** Add `order: 0` to `makeFolder` and `makeBookmark` fixtures.

### Task 12: Add syncReorder* tests to ChromeSyncService.test.ts

**Files:**
- Modify: `apps/web/__tests__/shared/lib/chrome-sync/ChromeSyncService.test.ts`

**New tests:** `syncReorderBookmarks` and `syncReorderFolders` — sorted order, syncMap skips, guard lifecycle.

### Task 13: Write useSortableReorder tests

**Files:**
- Create: `apps/web/__tests__/shared/lib/dnd/useSortableReorder.test.ts`

**Tests:** drag ordering, no-op on same position, null ID exclusion, server sync, ID change reset.
