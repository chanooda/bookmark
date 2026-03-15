# Bookmark & Folder Order Sync Design

**Date:** 2026-03-12
**Status:** Approved

## Problem

Chrome and the web app display bookmarks/folders in different orders. The sync system only handles content (create/update/delete) but not position. Additionally, `runWebToChromeSyncInitial` was using `createdAt` as a proxy for order, which does not match the web app's actual display order.

## Goals

- `web-to-chrome`: reflect the web app's order in Chrome
- `chrome-to-web`: reflect Chrome's order in the web app
- `bidirectional`: Chrome wins (chrome→web runs first, then web→chrome follows)

## Design

### 1. Data Model

Add `order: number` to `Bookmark` and `Folder` types. Semantics: **position within parent** (same as Chrome's `index` — per-folder for bookmarks, per-parent for folders).

```typescript
// packages/types/src/index.ts
interface Folder   { ...; order: number }
interface Bookmark { ...; order: number }

interface UpdateBookmarkDto { ...; order?: number }
interface UpdateFolderDto   { ...; order?: number }
```

UI create (non-sync): auto-assign `MAX(order within same parent) + 1`.

### 2. DB Schema & Migration

```typescript
// apps/api/src/db/schema.ts
bookmarks: { ..., order: integer('order').notNull().default(0) }
folders:   { ..., order: integer('order').notNull().default(0) }
```

Migration backfill:
- Existing bookmarks: assign `order` by `createdAt DESC` rank within each folder
- Existing folders: assign `order` by `createdAt ASC` rank within each parent

### 3. API Services

- `bookmarks.service.ts`: `ORDER BY order ASC` (replaces `createdAt DESC`)
- `folders.service.ts`: `ORDER BY order ASC` (adds missing ORDER BY)
- Both services: auto-assign `order = MAX(order in same parent) + 1` on create

### 4. Chrome Storage Adapter

Same changes as API services:
- `getBookmarks()` / `getFolders()`: sort by `order ASC`
- create: auto-assign `order = MAX(order in same parent) + 1`
- Drop the current prepend pattern (`[bookmark, ...bookmarks]`) in favour of order-based sorting

### 5. Sync Changes

#### chrome→web (`runInitialSync`)
- When creating a folder/bookmark from Chrome, pass Chrome node's `index` as `order`
- When a chrome-side item already exists in the app, update its `order` to match Chrome's `index`

#### web→chrome (`runWebToChromeSyncInitial` + `syncOrderInChrome`)
- Replace `createdAt`-based sorting with `order ASC`
- `syncUpdateBookmark` / `syncUpdateFolder`: pass `index: item.order` to `chrome.bookmarks.move()`

#### Real-time listener (`onCreated`)
- Store Chrome node's `index` as `order` when creating app items from Chrome events

#### `ChromeSyncService`
- `syncCreateBookmark`: `chrome.bookmarks.create({ ..., index: bookmark.order })`
- `syncUpdateBookmark`: `chrome.bookmarks.move({ parentId, index: bookmark.order })`
- `syncCreateFolder` / `syncUpdateFolder`: same pattern

### 6. UI

No changes needed. `BookmarkList` and `FolderTree` already render items in the order received from the adapter.

## Conflict Resolution

**bidirectional mode — Chrome wins:**
`runInitialSync` (chrome→web) executes first and overwrites `order` with Chrome's indices. `runWebToChromeSyncInitial` then runs with the already-updated `order` values, so Chrome's order is preserved end-to-end.

## Affected Files

| File | Change |
|------|--------|
| `packages/types/src/index.ts` | Add `order` to types and DTOs |
| `apps/api/src/db/schema.ts` | Add `order` column |
| `apps/api/src/db/migrations/` | Migration with backfill |
| `apps/api/src/bookmarks/bookmarks.service.ts` | Sort + auto-assign order |
| `apps/api/src/folders/folders.service.ts` | Sort + auto-assign order |
| `packages/api-client/src/chrome-storage-adapter.ts` | Sort + auto-assign order |
| `apps/web/src/shared/lib/chrome-sync/ChromeSyncService.ts` | Pass `index` on create/move |
| `apps/web/src/shared/lib/chrome-sync/useChromeBrowserSync.ts` | chrome→web sets `order`, web→chrome uses `order` |
| `apps/extension/src/shared/lib/chrome-sync/ChromeSyncService.ts` | Same as web ChromeSyncService |
