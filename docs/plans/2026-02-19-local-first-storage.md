# Local-First Storage Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the mandatory Google OAuth login with a local-first approach using `chrome.storage.local`, with Google login as an optional sync feature.

**Architecture:** Add a `StorageAdapter` interface with two implementations — `ChromeStorageAdapter` (local) and `ApiAdapter` (server). A `StorageProvider` wraps the app and supplies the active adapter via React context. On login, local data migrates to the server and the adapter switches to `ApiAdapter`.

**Tech Stack:** TypeScript, React context, `chrome.storage.local`, existing NestJS API, `@tanstack/react-query`

---

## Task 1: Add StorageAdapter interface to packages/types

**Files:**

- Modify: `packages/types/src/index.ts`

**Step 1: Add the interface** at the bottom of `packages/types/src/index.ts`:

```typescript
export interface StorageAdapter {
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

**Step 2: Type-check**

```bash
pnpm check-type
```

Expected: PASS

**Step 3: Commit**

```bash
git add packages/types/src/index.ts
git commit -m "feat(types): add StorageAdapter interface"
```

---

## Task 2: Add @types/chrome to packages/api-client

`ChromeStorageAdapter` uses `chrome.storage.local`, so the package needs the Chrome type definitions.

**Files:**

- Modify: `packages/api-client/package.json`

**Step 1: Install types**

```bash
pnpm --filter @bookmark/api-client add -D @types/chrome
```

**Step 2: Verify it installed**

```bash
pnpm --filter @bookmark/api-client ls @types/chrome
```

Expected: shows version

**Step 3: Commit**

```bash
git add packages/api-client/package.json pnpm-lock.yaml
git commit -m "feat(api-client): add @types/chrome dev dep"
```

---

## Task 3: Implement ChromeStorageAdapter

**Files:**

- Create: `packages/api-client/src/chrome-storage-adapter.ts`

**Step 1: Create the file**

```typescript
import type {
  Bookmark,
  BookmarkListQuery,
  CreateBookmarkDto,
  CreateTagDto,
  StorageAdapter,
  Tag,
  UpdateBookmarkDto,
  UpdateTagDto,
} from '@bookmark/types';

interface LocalStore {
  bookmarks?: Bookmark[];
  tags?: Tag[];
}

function readStore(): Promise<LocalStore> {
  return new Promise((resolve) => chrome.storage.local.get(['bookmarks', 'tags'], resolve));
}

function writeStore(data: Partial<LocalStore>): Promise<void> {
  return new Promise((resolve) => chrome.storage.local.set(data, resolve));
}

export class ChromeStorageAdapter implements StorageAdapter {
  async getBookmarks(query?: BookmarkListQuery): Promise<Bookmark[]> {
    const { bookmarks = [] } = await readStore();
    let result = bookmarks;

    if (query?.search) {
      const q = query.search.toLowerCase();
      result = result.filter(
        (b) => b.title.toLowerCase().includes(q) || b.url.toLowerCase().includes(q),
      );
    }

    if (query?.tagId) {
      result = result.filter((b) => b.tags.some((t) => t.id === query.tagId));
    }

    return result;
  }

  async createBookmark(dto: CreateBookmarkDto): Promise<Bookmark> {
    const { bookmarks = [], tags = [] } = await readStore();
    const now = new Date();
    const bookmark: Bookmark = {
      id: crypto.randomUUID(),
      userId: 'local',
      url: dto.url,
      title: dto.title,
      description: dto.description ?? null,
      favicon: null,
      createdAt: now,
      updatedAt: now,
      tags: dto.tagIds ? tags.filter((t) => dto.tagIds!.includes(t.id)) : [],
    };
    await writeStore({ bookmarks: [bookmark, ...bookmarks] });
    return bookmark;
  }

  async updateBookmark(id: string, dto: UpdateBookmarkDto): Promise<Bookmark> {
    const { bookmarks = [], tags = [] } = await readStore();
    const index = bookmarks.findIndex((b) => b.id === id);
    if (index === -1) throw new Error(`Bookmark not found: ${id}`);

    const updated: Bookmark = {
      ...bookmarks[index],
      ...(dto.url && { url: dto.url }),
      ...(dto.title && { title: dto.title }),
      description: dto.description ?? bookmarks[index].description,
      tags:
        dto.tagIds !== undefined
          ? tags.filter((t) => dto.tagIds!.includes(t.id))
          : bookmarks[index].tags,
      updatedAt: new Date(),
    };
    bookmarks[index] = updated;
    await writeStore({ bookmarks });
    return updated;
  }

  async deleteBookmark(id: string): Promise<void> {
    const { bookmarks = [] } = await readStore();
    await writeStore({ bookmarks: bookmarks.filter((b) => b.id !== id) });
  }

  async getTags(): Promise<Tag[]> {
    const { tags = [] } = await readStore();
    return tags;
  }

  async createTag(dto: CreateTagDto): Promise<Tag> {
    const { tags = [] } = await readStore();
    const tag: Tag = {
      id: crypto.randomUUID(),
      userId: 'local',
      name: dto.name,
      color: dto.color,
      createdAt: new Date(),
    };
    await writeStore({ tags: [...tags, tag] });
    return tag;
  }

  async updateTag(id: string, dto: UpdateTagDto): Promise<Tag> {
    const { tags = [] } = await readStore();
    const index = tags.findIndex((t) => t.id === id);
    if (index === -1) throw new Error(`Tag not found: ${id}`);

    const updated = {
      ...tags[index],
      ...(dto.name && { name: dto.name }),
      ...(dto.color && { color: dto.color }),
    };
    tags[index] = updated;
    await writeStore({ tags });
    return updated;
  }

  async deleteTag(id: string): Promise<void> {
    const { tags = [] } = await readStore();
    await writeStore({ tags: tags.filter((t) => t.id !== id) });
  }
}
```

**Step 2: Type-check**

```bash
pnpm check-type
```

Expected: PASS

**Step 3: Commit**

```bash
git add packages/api-client/src/chrome-storage-adapter.ts
git commit -m "feat(api-client): implement ChromeStorageAdapter"
```

---

## Task 4: Implement ApiAdapter

**Files:**

- Create: `packages/api-client/src/api-adapter.ts`

**Step 1: Create the file**

```typescript
import type {
  Bookmark,
  BookmarkListQuery,
  CreateBookmarkDto,
  CreateTagDto,
  StorageAdapter,
  Tag,
  UpdateBookmarkDto,
  UpdateTagDto,
} from '@bookmark/types';
import { bookmarksApi } from './bookmarks';
import { tagsApi } from './tags';

export class ApiAdapter implements StorageAdapter {
  getBookmarks(query?: BookmarkListQuery): Promise<Bookmark[]> {
    return bookmarksApi.list(query);
  }

  createBookmark(dto: CreateBookmarkDto): Promise<Bookmark> {
    return bookmarksApi.create(dto);
  }

  updateBookmark(id: string, dto: UpdateBookmarkDto): Promise<Bookmark> {
    return bookmarksApi.update(id, dto);
  }

  deleteBookmark(id: string): Promise<void> {
    return bookmarksApi.remove(id);
  }

  getTags(): Promise<Tag[]> {
    return tagsApi.list();
  }

  createTag(dto: CreateTagDto): Promise<Tag> {
    return tagsApi.create(dto);
  }

  updateTag(id: string, dto: UpdateTagDto): Promise<Tag> {
    return tagsApi.update(id, dto);
  }

  deleteTag(id: string): Promise<void> {
    return tagsApi.remove(id);
  }
}
```

**Step 2: Export both adapters from `packages/api-client/src/index.ts`**

Add to the existing exports:

```typescript
export { ApiAdapter } from './api-adapter';
export { ChromeStorageAdapter } from './chrome-storage-adapter';
```

**Step 3: Type-check**

```bash
pnpm check-type
```

Expected: PASS

**Step 4: Commit**

```bash
git add packages/api-client/src/api-adapter.ts packages/api-client/src/index.ts
git commit -m "feat(api-client): implement ApiAdapter and export adapters"
```

---

## Task 5: Create StorageContext in apps/web

**Files:**

- Create: `apps/web/src/shared/lib/storage/StorageContext.tsx`
- Create: `apps/web/src/shared/lib/storage/migrate.ts`
- Create: `apps/web/src/shared/lib/storage/index.ts`

**Step 1: Create `StorageContext.tsx`**

```typescript
import { ApiAdapter, ChromeStorageAdapter, setAuthToken } from '@bookmark/api-client';
import type { StorageAdapter } from '@bookmark/types';
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

interface StorageContextValue {
  adapter: StorageAdapter;
  mode: 'local' | 'api';
  switchToApi: () => void;
  logout: () => void;
}

const StorageContext = createContext<StorageContextValue | null>(null);

export function StorageProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<'local' | 'api'>(() =>
    !!localStorage.getItem('auth_token') ? 'api' : 'local',
  );

  const adapter = useMemo(
    () => (mode === 'api' ? new ApiAdapter() : new ChromeStorageAdapter()),
    [mode],
  );

  function switchToApi() {
    setMode('api');
  }

  function logout() {
    localStorage.removeItem('auth_token');
    setAuthToken(null);
    setMode('local');
  }

  return (
    <StorageContext value={{ adapter, mode, switchToApi, logout }}>
      {children}
    </StorageContext>
  );
}

export function useStorageAdapter(): StorageAdapter {
  const ctx = useContext(StorageContext);
  if (!ctx) throw new Error('useStorageAdapter must be used within StorageProvider');
  return ctx.adapter;
}

export function useStorageContext(): StorageContextValue {
  const ctx = useContext(StorageContext);
  if (!ctx) throw new Error('useStorageContext must be used within StorageProvider');
  return ctx;
}
```

**Step 2: Create `migrate.ts`**

```typescript
import { ApiAdapter, ChromeStorageAdapter } from '@bookmark/api-client';

export async function migrateLocalToApi(apiAdapter: ApiAdapter): Promise<void> {
  const localAdapter = new ChromeStorageAdapter();
  const [bookmarks, tags] = await Promise.all([
    localAdapter.getBookmarks(),
    localAdapter.getTags(),
  ]);

  if (!bookmarks.length && !tags.length) return;

  // Migrate tags in parallel, build local→server ID map
  const migratedTags = await Promise.all(
    tags.map(async (tag) => {
      const created = await apiAdapter.createTag({ name: tag.name, color: tag.color });
      return { localId: tag.id, serverId: created.id };
    }),
  );
  const tagMap = new Map(migratedTags.map(({ localId, serverId }) => [localId, serverId]));

  // Migrate bookmarks in parallel with remapped tagIds
  await Promise.all(
    bookmarks.map((bookmark) => {
      const tagIds = bookmark.tags
        .map((t) => tagMap.get(t.id))
        .filter((id): id is string => !!id);
      return apiAdapter.createBookmark({
        url: bookmark.url,
        title: bookmark.title,
        description: bookmark.description ?? undefined,
        tagIds,
      });
    }),
  );

  // Clear local data
  await new Promise<void>((resolve) =>
    chrome.storage.local.remove(['bookmarks', 'tags'], resolve),
  );
}
```

**Step 3: Create `index.ts` barrel**

```typescript
export { StorageProvider, useStorageAdapter, useStorageContext } from './StorageContext';
export { migrateLocalToApi } from './migrate';
```

**Step 4: Type-check**

```bash
pnpm check-type
```

Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/shared/lib/storage/
git commit -m "feat(web): add StorageContext, StorageProvider, and migration utility"
```

---

## Task 6: Wire StorageProvider into apps/web providers

**Files:**

- Modify: `apps/web/src/app/providers/index.tsx`

**Step 1: Replace the file content**

Current file initializes the axios token globally. Move that logic inside `StorageProvider` (it already calls `setAuthToken` on `switchToApi`/`logout`), and simply wrap with `StorageProvider`:

```typescript
import { setAuthToken } from '@/shared/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { StorageProvider } from '@/shared/lib/storage';

// Initialize axios token on app start
const token = localStorage.getItem('auth_token');
if (token) setAuthToken(token);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60, retry: 1 },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <StorageProvider>{children}</StorageProvider>
    </QueryClientProvider>
  );
}
```

**Step 2: Run checks**

```bash
pnpm check && pnpm check-type
```

Expected: PASS

**Step 3: Commit**

```bash
git add apps/web/src/app/providers/index.tsx
git commit -m "feat(web): add StorageProvider to app providers"
```

---

## Task 7: Update useBookmarks to use adapter

**Files:**

- Modify: `apps/web/src/entities/bookmark/model/useBookmarks.ts`

**Step 1: Replace the file content**

```typescript
import type { BookmarkListQuery } from '@bookmark/types';
import { useQuery } from '@tanstack/react-query';
import { useStorageAdapter } from '@/shared/lib/storage';

export const bookmarkKeys = {
  all: ['bookmarks'] as const,
  list: (query: BookmarkListQuery) => [...bookmarkKeys.all, query] as const,
};

export function useBookmarks(query: BookmarkListQuery = {}) {
  const adapter = useStorageAdapter();
  return useQuery({
    queryKey: bookmarkKeys.list(query),
    queryFn: () => adapter.getBookmarks(query),
  });
}
```

**Step 2: Run checks**

```bash
pnpm check && pnpm check-type
```

Expected: PASS

**Step 3: Commit**

```bash
git add apps/web/src/entities/bookmark/model/useBookmarks.ts
git commit -m "feat(web): update useBookmarks to use StorageAdapter"
```

---

## Task 8: Update useTags to use adapter

**Files:**

- Modify: `apps/web/src/entities/tag/model/useTags.ts`

**Step 1: Replace the file content**

```typescript
import { useQuery } from '@tanstack/react-query';
import { useStorageAdapter } from '@/shared/lib/storage';

export const tagKeys = {
  all: ['tags'] as const,
};

export function useTags() {
  const adapter = useStorageAdapter();
  return useQuery({
    queryKey: tagKeys.all,
    queryFn: () => adapter.getTags(),
  });
}
```

**Step 2: Run checks**

```bash
pnpm check && pnpm check-type
```

Expected: PASS

**Step 3: Commit**

```bash
git add apps/web/src/entities/tag/model/useTags.ts
git commit -m "feat(web): update useTags to use StorageAdapter"
```

---

## Task 9: Update mutation features to use adapter

**Files:**

- Modify: `apps/web/src/features/bookmark-delete/model/useDeleteBookmark.ts`
- Modify: `apps/web/src/features/bookmark-create/ui/BookmarkCreateDialog.tsx`

**Step 1: Replace `useDeleteBookmark.ts`**

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bookmarkKeys } from '@/entities/bookmark/model/useBookmarks';
import { useStorageAdapter } from '@/shared/lib/storage';

export function useDeleteBookmark() {
  const adapter = useStorageAdapter();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adapter.deleteBookmark(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookmarkKeys.all });
    },
  });
}
```

**Step 2: Replace `mutationFn` in `BookmarkCreateDialog.tsx`**

Change only the import and the `mutationFn` — the rest of the component stays the same:

Remove:

```typescript
import { bookmarksApi } from '@/shared/api';
```

Add:

```typescript
import { useStorageAdapter } from '@/shared/lib/storage';
```

Inside the component, add before the mutation:

```typescript
const adapter = useStorageAdapter();
```

Change the mutation:

```typescript
const { mutate, isPending } = useMutation({
  mutationFn: (dto: CreateBookmarkDto) => adapter.createBookmark(dto),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: bookmarkKeys.all });
    onOpenChange(false);
  },
});
```

**Step 3: Run checks**

```bash
pnpm check && pnpm check-type
```

Expected: PASS

**Step 4: Commit**

```bash
git add apps/web/src/features/bookmark-delete/model/useDeleteBookmark.ts \
        apps/web/src/features/bookmark-create/ui/BookmarkCreateDialog.tsx
git commit -m "feat(web): update bookmark mutation features to use StorageAdapter"
```

---

## Task 10: Remove ProtectedRoute from router

**Files:**

- Modify: `apps/web/src/app/router/index.tsx`

**Step 1: Replace the file content**

```typescript
import { BrowserRouter, Route, Routes } from 'react-router';
import { AuthCallbackPage } from '@/pages/login/ui/AuthCallbackPage';
import { LoginPage } from '@/pages/login/ui/LoginPage';
import { HomePage } from '@/pages/home/ui/HomePage';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<HomePage />} path='/' />
        <Route element={<LoginPage />} path='/login' />
        <Route element={<AuthCallbackPage />} path='/auth/callback' />
      </Routes>
    </BrowserRouter>
  );
}
```

**Step 2: Run checks**

```bash
pnpm check && pnpm check-type
```

Expected: PASS

**Step 3: Commit**

```bash
git add apps/web/src/app/router/index.tsx
git commit -m "feat(web): remove ProtectedRoute, homepage accessible without login"
```

---

## Task 11: Update AuthCallbackPage to run migration

**Files:**

- Modify: `apps/web/src/pages/login/ui/AuthCallbackPage.tsx`

**Step 1: Replace the file content**

```typescript
import { ApiAdapter, setAuthToken } from '@bookmark/api-client';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { migrateLocalToApi, useStorageContext } from '@/shared/lib/storage';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { switchToApi } = useStorageContext();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    localStorage.setItem('auth_token', token);
    setAuthToken(token);

    const apiAdapter = new ApiAdapter();
    migrateLocalToApi(apiAdapter)
      .catch(() => {
        // migration failure is non-fatal — local data just won't be migrated
      })
      .finally(() => {
        switchToApi();
        navigate('/', { replace: true });
      });
  }, [navigate, switchToApi]);

  return (
    <div className='flex min-h-screen items-center justify-center'>
      <p className='text-sm text-muted-foreground'>로그인 중...</p>
    </div>
  );
}
```

**Step 2: Run checks**

```bash
pnpm check && pnpm check-type
```

Expected: PASS

**Step 3: Commit**

```bash
git add apps/web/src/pages/login/ui/AuthCallbackPage.tsx
git commit -m "feat(web): add local-to-api migration on login callback"
```

---

## Task 12: Add sync/logout button to HomePage header

**Files:**

- Modify: `apps/web/src/pages/home/ui/HomePage.tsx`

**Step 1: Add import and use `useStorageContext`**

Add these imports at the top:

```typescript
import { setAuthToken } from '@bookmark/api-client';
import { useStorageContext } from '@/shared/lib/storage';
```

Inside the component, add:

```typescript
const { mode, logout } = useStorageContext();
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
```

**Step 2: Add the button to the header**

In the header JSX, replace the existing `<Button onClick={() => setCreateOpen(true)} size='sm'>+ 추가</Button>` section with:

```tsx
<div className='flex items-center gap-2'>
  {mode === 'local' ? (
    <Button asChild size='sm' variant='outline'>
      <a href={`${API_URL}/auth/google`}>동기화</a>
    </Button>
  ) : (
    <Button onClick={logout} size='sm' variant='ghost'>
      로그아웃
    </Button>
  )}
  <Button onClick={() => setCreateOpen(true)} size='sm'>
    + 추가
  </Button>
</div>
```

**Step 3: Run checks**

```bash
pnpm check && pnpm check-type
```

Expected: PASS

**Step 4: Commit**

```bash
git add apps/web/src/pages/home/ui/HomePage.tsx
git commit -m "feat(web): add sync/logout button to homepage header"
```

---

## Task 13: Add StorageProvider to apps/extension

**Files:**

- Create: `apps/extension/src/shared/lib/storage/StorageContext.tsx`
- Create: `apps/extension/src/shared/lib/storage/migrate.ts`
- Create: `apps/extension/src/shared/lib/storage/index.ts`
- Modify: `apps/extension/src/app/providers/index.tsx`

**Step 1: Copy the storage lib files**

The extension uses the same storage layer as the web app. Copy the three files created in Task 5 verbatim:

- `apps/extension/src/shared/lib/storage/StorageContext.tsx` — same as web
- `apps/extension/src/shared/lib/storage/migrate.ts` — same as web
- `apps/extension/src/shared/lib/storage/index.ts` — same as web

> Note: The path alias `@/` resolves to `src/` in both apps, so imports work the same way.

**Step 2: Update `apps/extension/src/app/providers/index.tsx`**

```typescript
import { setAuthToken } from '@bookmark/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { StorageProvider } from '@/shared/lib/storage';

const token = localStorage.getItem('auth_token');
if (token) setAuthToken(token);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60, retry: 1 },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <StorageProvider>{children}</StorageProvider>
    </QueryClientProvider>
  );
}
```

**Step 3: Run checks**

```bash
pnpm check && pnpm check-type
```

Expected: PASS

**Step 4: Commit**

```bash
git add apps/extension/src/shared/lib/storage/ \
        apps/extension/src/app/providers/index.tsx
git commit -m "feat(extension): add StorageProvider"
```

---

## Task 14: Update extension PopupPage to use adapter

**Files:**

- Modify: `apps/extension/src/pages/popup/ui/PopupPage.tsx`

The current `PopupPage` blocks usage when not logged in and calls `bookmarksApi`/`tagsApi` directly. Replace with adapter-based calls and remove the auth gate.

**Step 1: Replace the file content**

```typescript
import { setAuthToken } from '@bookmark/api-client';
import type { CreateBookmarkDto } from '@bookmark/types';
import { Button } from '@bookmark/ui/components/button';
import { Input } from '@bookmark/ui/components/input';
import { Label } from '@bookmark/ui/components/label';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { TagSelector } from '@/entities/tag/ui/TagSelector';
import { tagKeys } from '@/entities/tag/model/useTags';
import { useStorageAdapter, useStorageContext, migrateLocalToApi } from '@/shared/lib/storage';
import { ApiAdapter } from '@bookmark/api-client';
import { useQuery } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export function PopupPage() {
  const adapter = useStorageAdapter();
  const { mode, switchToApi } = useStorageContext();
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [currentTab, setCurrentTab] = useState({ url: '', title: '' });
  const queryClient = useQueryClient();

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        if (tab) setCurrentTab({ url: tab.url ?? '', title: tab.title ?? '' });
      });
    }
  }, []);

  const { data: tags = [] } = useQuery({
    queryKey: tagKeys.all,
    queryFn: () => adapter.getTags(),
  });

  const {
    mutate: createBookmark,
    isPending,
    isSuccess,
  } = useMutation({
    mutationFn: (dto: CreateBookmarkDto) => adapter.createBookmark(dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookmarks'] }),
  });

  // Handle login token refresh after OAuth in new tab
  function handleLoginDone() {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    setAuthToken(token);
    const apiAdapter = new ApiAdapter();
    migrateLocalToApi(apiAdapter)
      .catch(() => {})
      .finally(() => {
        switchToApi();
        queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
        queryClient.invalidateQueries({ queryKey: tagKeys.all });
      });
  }

  if (isSuccess) {
    return (
      <div className='flex h-[200px] w-[320px] flex-col items-center justify-center gap-3 p-6'>
        <div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary'>
          <svg
            aria-hidden='true'
            className='h-5 w-5'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path d='M5 13l4 4L19 7' strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} />
          </svg>
        </div>
        <p className='text-sm font-medium'>북마크가 저장됐어요!</p>
        <Button onClick={() => window.close()} size='sm' variant='outline'>
          닫기
        </Button>
      </div>
    );
  }

  return (
    <form
      className='flex w-[320px] flex-col gap-3 p-4'
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        createBookmark({
          url: data.get('url') as string,
          title: data.get('title') as string,
          description: (data.get('description') as string) || undefined,
          tagIds: selectedTagIds,
        });
      }}
    >
      <div className='flex items-center justify-between pb-1'>
        <div className='flex items-center gap-2'>
          <svg
            aria-hidden='true'
            className='h-4 w-4 shrink-0'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              d='M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z'
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
            />
          </svg>
          <span className='text-sm font-semibold'>북마크 추가</span>
        </div>
        {mode === 'local' ? (
          <div className='flex items-center gap-1'>
            <Button asChild className='h-6 text-xs' size='sm' variant='ghost'>
              <a href={`${API_URL}/auth/google`} rel='noreferrer' target='_blank'>
                동기화
              </a>
            </Button>
            <Button className='h-6 text-xs' onClick={handleLoginDone} size='sm' variant='ghost'>
              로그인했어요
            </Button>
          </div>
        ) : null}
      </div>

      <div className='flex flex-col gap-1'>
        <Label className='text-xs' htmlFor='url'>URL</Label>
        <Input
          className='h-8 text-xs'
          defaultValue={currentTab.url}
          id='url'
          name='url'
          required
          type='url'
        />
      </div>
      <div className='flex flex-col gap-1'>
        <Label className='text-xs' htmlFor='title'>제목</Label>
        <Input
          className='h-8 text-xs'
          defaultValue={currentTab.title}
          id='title'
          name='title'
          required
        />
      </div>
      <div className='flex flex-col gap-1'>
        <Label className='text-xs' htmlFor='description'>설명</Label>
        <Input className='h-8 text-xs' id='description' name='description' placeholder='선택' />
      </div>

      {tags.length > 0 && (
        <div className='flex flex-col gap-1'>
          <Label className='text-xs'>태그</Label>
          <TagSelector
            onToggle={(id) =>
              setSelectedTagIds((prev) =>
                prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
              )
            }
            selected={selectedTagIds}
            tags={tags}
          />
        </div>
      )}

      <Button className='mt-1' disabled={isPending} size='sm' type='submit'>
        {isPending ? '저장 중...' : '저장'}
      </Button>
    </form>
  );
}
```

**Step 2: Add `useTags` hook to extension** (same pattern as web)

Check if `apps/extension/src/entities/tag/model/useTags.ts` exists. If not, create it:

```typescript
import { useQuery } from '@tanstack/react-query';
import { useStorageAdapter } from '@/shared/lib/storage';

export const tagKeys = {
  all: ['tags'] as const,
};

export function useTags() {
  const adapter = useStorageAdapter();
  return useQuery({
    queryKey: tagKeys.all,
    queryFn: () => adapter.getTags(),
  });
}
```

**Step 3: Run checks**

```bash
pnpm check && pnpm check-type
```

Expected: PASS

**Step 4: Commit**

```bash
git add apps/extension/src/pages/popup/ui/PopupPage.tsx \
        apps/extension/src/entities/
git commit -m "feat(extension): update PopupPage to use StorageAdapter, no login required"
```

---

## Task 15: Final verification

**Step 1: Full lint + type check**

```bash
pnpm check && pnpm check-type
```

Expected: PASS with no errors

**Step 2: Start dev server and verify no runtime errors**

```bash
pnpm dev
```

Verify:

- [ ] Homepage loads without redirecting to `/login`
- [ ] Bookmarks list renders (empty on first load is fine)
- [ ] "동기화" button appears in header when not logged in
- [ ] "+ 추가" creates a bookmark (stored in `chrome.storage.local` — verify in DevTools → Application → Extension Storage)
- [ ] After Google login, migration runs and adapter switches to API

**Step 3: Final commit if any cleanup needed**

```bash
git add -A
git commit -m "feat: complete local-first storage with StorageAdapter pattern"
```

---

## Summary of Changes

| Layer | What changed |
|---|---|
| `packages/types` | `StorageAdapter` interface added |
| `packages/api-client` | `ChromeStorageAdapter`, `ApiAdapter` added; `@types/chrome` added |
| `apps/web/src/shared/lib/storage` | `StorageContext`, `StorageProvider`, `migrateLocalToApi` added |
| `apps/web/src/app/providers` | `StorageProvider` added |
| `apps/web/src/app/router` | `ProtectedRoute` removed |
| `apps/web/src/entities/*/model` | `useBookmarks`, `useTags` use adapter |
| `apps/web/src/features/*/model` | Mutation hooks use adapter |
| `apps/web/src/pages/login/ui` | `AuthCallbackPage` runs migration |
| `apps/web/src/pages/home/ui` | Header has sync/logout button |
| `apps/extension/src/shared/lib/storage` | Same storage layer as web |
| `apps/extension/src/app/providers` | `StorageProvider` added |
| `apps/extension/src/pages/popup/ui` | `PopupPage` uses adapter, no auth gate |
