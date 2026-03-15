# Chrome 북마크 실시간 동기화 수정 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 웹 앱(새 탭 페이지)에서 북마크 생성·수정·삭제 시 Chrome 동기화가 실제로 호출되도록 수정하고, extension popup과 새 탭 페이지 간의 `realtimeSync` 설정 저장 키 불일치를 해결한다.

**Architecture:** 두 가지 독립적인 버그를 순서대로 수정한다. (1) extension popup의 `useAppSettings.ts`가 `chrome.storage.local`에서 다른 키(`'settings'`)를 사용하기 때문에, 웹 앱의 Zustand store(`'setting'` 키)와 `realtimeSync` 값을 공유하지 못한다. (2) 웹 앱의 북마크 mutation 컴포넌트들(`BookmarkCreateDialog`, `BookmarkEditDialog`, `BookmarkCard`)이 `ChromeSyncService`를 전혀 호출하지 않는다. `FolderTree.tsx`가 폴더에 대해 이미 올바르게 구현한 패턴을 북마크에도 동일하게 적용한다.

**Tech Stack:** React, Zustand (persist), @tanstack/react-query, Chrome Extensions API (`chrome.storage.local`, `chrome.bookmarks`)

---

## 현재 상태 요약

| 위치 | 동기화 여부 | 비고 |
|------|------------|------|
| Extension Popup – bookmark create/edit/delete | ✅ 작동 | `PopupPage.tsx` `onSuccess`에서 호출 |
| Web App – FolderTree create/delete | ✅ 작동 | `FolderTree.tsx`에 이미 구현됨 |
| Web App – BookmarkCreateDialog | ❌ 누락 | `chromeSyncService` 호출 없음 |
| Web App – BookmarkEditDialog | ❌ 누락 | `chromeSyncService` 호출 없음 |
| Web App – BookmarkCard (삭제) | ❌ 누락 | `chromeSyncService` 호출 없음 |
| 설정 공유 (popup ↔ new tab) | ❌ 불일치 | popup: `'settings'` 키, web app: `'setting'` 키 |

---

## Task 1: Extension popup의 storage 키를 웹 앱과 통일

### 문제

- Extension popup: `chrome.storage.local.set({ settings: { realtimeSync } })`
- Web app Zustand persist: `chrome.storage.local.set({ setting: '{"state":{"viewMode":"grid","realtimeSync":true},"version":0}' })`
- 키(`'settings'` vs `'setting'`)와 포맷이 달라 설정이 공유되지 않음

### 수정 방향

`useAppSettings.ts`에서 Zustand persist 포맷(`{ state: { realtimeSync }, version }`)을 읽고 쓰도록 변경.
키는 `'setting'`으로 통일(웹 앱 기준).

**Files:**

- Modify: `apps/extension/src/shared/lib/settings/useAppSettings.ts`

**Step 1: 파일 현재 내용 확인 후 수정**

현재 파일 (`apps/extension/src/shared/lib/settings/useAppSettings.ts`):

```ts
import { type AppSettings, DEFAULT_APP_SETTINGS } from '@bookmark/types';
import { useCallback, useEffect, useState } from 'react';

const SETTINGS_KEY = 'settings';
// ...읽기: result[SETTINGS_KEY] as Partial<AppSettings>
// ...쓰기: chrome.storage.local.set({ [SETTINGS_KEY]: next })
```

수정 후:

```ts
import { type AppSettings, DEFAULT_APP_SETTINGS } from '@bookmark/types';
import { useCallback, useEffect, useState } from 'react';

// Web app의 Zustand persist 키와 동일하게 사용
const SETTINGS_KEY = 'setting';

interface ZustandPersistedState {
 state: Partial<AppSettings>;
 version: number;
}

function isChromeStorageAvailable(): boolean {
 return typeof chrome !== 'undefined' && !!chrome.storage?.local;
}

async function readPersistedSettings(): Promise<Partial<AppSettings>> {
 const result = await chrome.storage.local.get(SETTINGS_KEY);
 const raw = result[SETTINGS_KEY] as string | undefined;
 if (!raw) return {};
 try {
  const parsed = JSON.parse(raw) as ZustandPersistedState;
  return parsed.state ?? {};
 } catch {
  return {};
 }
}

async function writePersistedSettings(patch: Partial<AppSettings>): Promise<void> {
 const result = await chrome.storage.local.get(SETTINGS_KEY);
 const raw = result[SETTINGS_KEY] as string | undefined;
 let existing: ZustandPersistedState = { state: {}, version: 0 };
 if (raw) {
  try {
   existing = JSON.parse(raw) as ZustandPersistedState;
  } catch {
   // keep default
  }
 }
 const next: ZustandPersistedState = {
  ...existing,
  state: { ...existing.state, ...patch },
 };
 await chrome.storage.local.set({ [SETTINGS_KEY]: JSON.stringify(next) });
}

export function useAppSettings() {
 const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
 const [isLoaded, setIsLoaded] = useState(false);

 useEffect(() => {
  if (!isChromeStorageAvailable()) {
   setIsLoaded(true);
   return;
  }
  readPersistedSettings().then((stored) => {
   setSettings({ ...DEFAULT_APP_SETTINGS, ...stored });
   setIsLoaded(true);
  });
 }, []);

 const updateSettings = useCallback(async (patch: Partial<AppSettings>) => {
  setSettings((prev) => {
   const next = { ...prev, ...patch };
   if (isChromeStorageAvailable()) {
    writePersistedSettings(patch);
   }
   return next;
  });
 }, []);

 return { settings, isLoaded, updateSettings };
}
```

**Step 2: 타입 체크**

```bash
cd /Users/chanoo/Desktop/web/new-project
pnpm check-types
```

Expected: 타입 에러 없음

**Step 3: lint 체크**

```bash
pnpm check
```

Expected: 에러 없음

**Step 4: Commit**

```bash
git add apps/extension/src/shared/lib/settings/useAppSettings.ts
git commit -m "fix: unify realtimeSync storage key between popup and new tab page"
```

---

## Task 2: BookmarkCreateDialog에 Chrome 동기화 연결

북마크 생성 성공 시 `chromeSyncService.syncCreateBookmark(bookmark, folders)`를 호출한다.
`FolderTree.tsx`의 패턴을 참고.

**Files:**

- Modify: `apps/web/src/features/bookmark/ui/BookmarkCreateDialog.tsx`

**Step 1: 파일 수정**

추가할 import:

```ts
import { toast } from 'sonner';
import { useSettingStore } from '@/features/settings';
import { useChromeSyncService } from '@/shared/lib/chrome-sync';
```

`BookmarkCreateDialog` 함수 내 훅 추가 (기존 훅 선언 근처):

```ts
const { realtimeSync } = useSettingStore();
const chromeSyncService = useChromeSyncService(realtimeSync);
```

`handleSubmit` 내 `mutate` 호출의 `onSuccess` 수정:

```ts
mutate(dto, {
  onSuccess: (bookmark) => {
    queryClient.invalidateQueries({ queryKey: bookmarkKeys.all });
    if (chromeSyncService) {
      chromeSyncService
        .syncCreateBookmark(bookmark, folders)
        .catch(() => toast.error('Chrome 북마크 동기화에 실패했습니다.'));
    }
    setCreateOpen(false);
  },
});
```

**Step 2: 타입 체크 및 lint**

```bash
pnpm check && pnpm check-types
```

Expected: 에러 없음

**Step 3: Commit**

```bash
git add apps/web/src/features/bookmark/ui/BookmarkCreateDialog.tsx
git commit -m "feat: sync Chrome bookmark on create from new tab page"
```

---

## Task 3: BookmarkEditDialog에 Chrome 동기화 연결

북마크 수정 성공 시 `chromeSyncService.syncUpdateBookmark(bookmark, folders)`를 호출한다.

**Files:**

- Modify: `apps/web/src/features/bookmark/ui/BookmarkEditDialog.tsx`

**Step 1: 파일 수정**

추가할 import:

```ts
import { toast } from 'sonner';
import { useSettingStore } from '@/features/settings';
import { useChromeSyncService } from '@/shared/lib/chrome-sync';
```

`BookmarkEditDialog` 함수 내 훅 추가:

```ts
const { realtimeSync } = useSettingStore();
const chromeSyncService = useChromeSyncService(realtimeSync);
```

`handleSubmit` 내 `mutate` 호출의 `onSuccess` 수정:

```ts
mutate(
  { id: editTarget.id, dto },
  {
    onSuccess: (bookmark) => {
      queryClient.invalidateQueries({ queryKey: bookmarkKeys.all });
      if (chromeSyncService) {
        chromeSyncService
          .syncUpdateBookmark(bookmark, folders)
          .catch(() => toast.error('Chrome 북마크 동기화에 실패했습니다.'));
      }
      setEditTarget(null);
    },
  },
);
```

**Step 2: 타입 체크 및 lint**

```bash
pnpm check && pnpm check-types
```

Expected: 에러 없음

**Step 3: Commit**

```bash
git add apps/web/src/features/bookmark/ui/BookmarkEditDialog.tsx
git commit -m "feat: sync Chrome bookmark on edit from new tab page"
```

---

## Task 4: BookmarkCard 삭제 시 Chrome 동기화 연결

북마크 삭제 성공 시 `chromeSyncService.syncDeleteBookmark(id)`를 호출한다.
`syncDeleteBookmark`는 folders 데이터가 필요 없으므로 `useFolders`는 추가 불필요.

**Files:**

- Modify: `apps/web/src/widgets/bookmark-list/ui/BookmarkCard.tsx`

**Step 1: 파일 수정**

추가할 import:

```ts
import { toast } from 'sonner';
import { useChromeSyncService } from '@/shared/lib/chrome-sync';
```

`BookmarkCard` 함수 내:

- 기존: `const { viewMode = 'grid' } = useSettingStore();`
- 수정: `const { viewMode = 'grid', realtimeSync } = useSettingStore();`

훅 추가:

```ts
const chromeSyncService = useChromeSyncService(realtimeSync);
```

`handleDelete` 수정:

```ts
function handleDelete() {
  deleteBookmark(bookmark.id, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookmarkKeys.all });
      if (chromeSyncService) {
        chromeSyncService
          .syncDeleteBookmark(bookmark.id)
          .catch(() => toast.error('Chrome 북마크 동기화에 실패했습니다.'));
      }
    },
  });
}
```

**Step 2: 타입 체크 및 lint**

```bash
pnpm check && pnpm check-types
```

Expected: 에러 없음

**Step 3: Commit**

```bash
git add apps/web/src/widgets/bookmark-list/ui/BookmarkCard.tsx
git commit -m "feat: sync Chrome bookmark on delete from new tab page"
```

---

## 최종 검증

1. 새 탭 페이지에서 실시간 동기화 설정 ON
2. 북마크 추가 → Chrome 북마크 바에 반영되는지 확인
3. 북마크 수정 → Chrome 북마크에 반영되는지 확인
4. 북마크 삭제 → Chrome 북마크에서도 삭제되는지 확인
5. Extension popup에서 동기화 설정 ON/OFF → 새 탭 페이지 새로고침 후 동일한 설정이 유지되는지 확인

```bash
pnpm check && pnpm check-types
```
