# Local-First Storage Design

**Date**: 2026-02-19
**Status**: Approved

## Problem

The app currently requires Google OAuth login to use any feature. All data is stored server-side (NestJS + SQLite). Non-logged-in users cannot use the app at all, which conflicts with the intended design.

## Goal

- Non-logged-in users can use the app fully via `chrome.storage.local`
- Logged-in users sync data to the server (optional, for backup/multi-device)
- When a user logs in, local data migrates to the server
- `apps/web` runs as Chrome extension new tab page only — always has access to `chrome.storage.local`

## Architecture: Storage Adapter Pattern

### Interface (`packages/types`)

```typescript
interface StorageAdapter {
  getBookmarks(query?: BookmarkListQuery): Promise<Bookmark[]>
  createBookmark(dto: CreateBookmarkDto): Promise<Bookmark>
  updateBookmark(id: string, dto: UpdateBookmarkDto): Promise<Bookmark>
  deleteBookmark(id: string): Promise<void>

  getTags(): Promise<Tag[]>
  createTag(dto: CreateTagDto): Promise<Tag>
  updateTag(id: string, dto: UpdateTagDto): Promise<Tag>
  deleteTag(id: string): Promise<void>
}
```

### Implementations (`packages/api-client`)

| Class | Storage | Used when |
|---|---|---|
| `ChromeStorageAdapter` | `chrome.storage.local` | Not logged in |
| `ApiAdapter` | NestJS REST API | Logged in |

**ChromeStorageAdapter** local schema:
```json
{
  "bookmarks": [...],
  "tags": [...]
}
```
IDs generated with `crypto.randomUUID()`.

**ApiAdapter** wraps existing `bookmarksApi` and `tagsApi` from `@repo/api-client`.

### StorageContext (`apps/web/src/shared/lib/storage`)

```typescript
const StorageContext = createContext<StorageAdapter>(...)

function StorageProvider({ children }) {
  const isLoggedIn = !!localStorage.getItem('auth_token')
  const adapter = isLoggedIn ? new ApiAdapter() : new ChromeStorageAdapter()
  return <StorageContext value={adapter}>{children}</StorageContext>
}

function useStorageAdapter(): StorageAdapter {
  return useContext(StorageContext)
}
```

### Hook changes (minimal)

```typescript
// useBookmarks.ts
export function useBookmarks(query = {}) {
  const adapter = useStorageAdapter()
  return useQuery({
    queryKey: bookmarkKeys.list(query),
    queryFn: () => adapter.getBookmarks(query),
  })
}
```

## Login / Migration Flow

```
1. User clicks "Google 로그인 / 동기화" in header
2. Google OAuth → JWT token issued
3. Token saved to localStorage as 'auth_token'
4. Migration:
   a. Read all data from chrome.storage.local
   b. If data exists → POST /bookmarks/migrate + POST /tags/migrate (batch)
   c. Server saves with new server-generated UUIDs
5. StorageContext switches adapter: ChromeStorage → Api
6. chrome.storage.local data cleared
7. React Query cache invalidated → re-renders with server data
```

## Router Changes

- Remove `ProtectedRoute` — homepage always accessible
- `/login` page kept for OAuth callback flow
- `/auth/callback` kept as-is
- Header shows login/sync button when not logged in; user info + logout when logged in

## Backend Changes

Two new endpoints added to the NestJS API:

```
POST /bookmarks/migrate   — accepts Bookmark[] (bulk create, skips userId override)
POST /tags/migrate        — accepts Tag[] (bulk create)
```

Existing endpoints unchanged.

## Affected Files

| Location | Change |
|---|---|
| `packages/types/src/index.ts` | Add `StorageAdapter` interface |
| `packages/api-client/src/chrome-storage.ts` | New `ChromeStorageAdapter` |
| `packages/api-client/src/api-adapter.ts` | New `ApiAdapter` wrapping existing API |
| `packages/api-client/src/index.ts` | Export new classes |
| `apps/web/src/shared/lib/storage/` | `StorageContext.tsx`, `useStorageAdapter.ts` |
| `apps/web/src/app/providers/index.tsx` | Add `StorageProvider` |
| `apps/web/src/app/router/index.tsx` | Remove `ProtectedRoute` |
| `apps/web/src/entities/bookmark/model/useBookmarks.ts` | Use adapter |
| `apps/web/src/entities/tag/model/useTags.ts` | Use adapter |
| `apps/web/src/features/bookmark-create` | Use adapter |
| `apps/web/src/features/bookmark-delete` | Use adapter |
| `apps/web/src/features/bookmark-edit` | Use adapter |
| `apps/web/src/features/tag-manage` | Use adapter |
| `apps/web/src/widgets/` | Add header with login/logout UI |
| `apps/extension/src/` | Use same `ChromeStorageAdapter` |
| `apps/api/src/bookmarks/` | Add migrate endpoint |
| `apps/api/src/tags/` | Add migrate endpoint |

## Out of Scope

- Conflict resolution (server wins after migration)
- Offline mode for logged-in users
- Multi-device sync without login
