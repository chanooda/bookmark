# Settings Section Registry Refactoring Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 설정 다이얼로그의 각 섹션을 독립 파일로 분리하고, `sections.ts` 레지스트리의 `enabled` 플래그 하나로 섹션을 켜고 끌 수 있게 한다.

**Architecture:** 각 섹션 컴포넌트는 props 없이 스스로 store/hook에서 상태를 가져오는 자립형(self-contained)으로 설계한다. `SettingsDialog`는 `SETTINGS_SECTIONS` 배열을 순회해 `enabled: true`인 섹션만 렌더링한다. `ChromeImportSection`이 가져오기 중 다이얼로그 닫힘을 막는 기존 동작은 얇은 `SettingsDialogContext`를 통해 유지한다.

**Tech Stack:** React 19, TypeScript, Zustand, shadcn/ui

---

## 목표 파일 구조

```
apps/web/src/features/settings/ui/
  sections/
    ViewModeSection.tsx       ← NEW (자립형)
    ThemeSection.tsx          ← NEW (자립형)
    RealtimeSyncSection.tsx   ← NEW (자립형, enabled: false)
    ChromeImportSection.tsx   ← NEW (자립형 + context 연동)
  SettingsDialogContext.ts    ← NEW (닫힘 차단 context)
  sections.ts                 ← NEW (레지스트리)
  SettingsDialog.tsx          ← MODIFY (슬림하게 재작성)
```

---

## Task 1: `sections/` 디렉터리 생성 및 `ViewModeSection.tsx`

**Files:**

- Create: `apps/web/src/features/settings/ui/sections/ViewModeSection.tsx`

**Step 1: 파일 생성**

`SettingsDialog.tsx`의 `VIEW_MODE_OPTIONS` 상수와 `ViewModeSection` 컴포넌트를 그대로 이동. `useSettingStore`를 직접 호출하도록 변경.

```tsx
import type { ReactNode } from 'react';
import { Label } from '@bookmark/ui/components/label';
import type { ViewMode } from '@/entities/bookmark';
import { useSettingStore } from '../../model/settingStore';

const VIEW_MODE_OPTIONS: { value: ViewMode; label: string; icon: ReactNode; preview: ReactNode }[] =
 [
  {
   value: 'glass',
   label: '글래스',
   icon: (
    <svg aria-hidden='true' className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
     <rect height='8' rx='2' strokeWidth='1.5' width='8' x='3' y='3' />
     <rect height='8' rx='2' strokeWidth='1.5' width='8' x='13' y='3' />
     <rect height='8' rx='2' strokeWidth='1.5' width='8' x='3' y='13' />
     <rect height='8' rx='2' strokeWidth='1.5' width='8' x='13' y='13' />
    </svg>
   ),
   preview: (
    <svg aria-hidden='true' className='h-auto w-full' fill='none' viewBox='0 0 80 48'>
     <rect fill='currentColor' fillOpacity='0.13' height='20' rx='3' stroke='currentColor' strokeOpacity='0.25' strokeWidth='0.7' width='35' x='3' y='3' />
     <rect fill='currentColor' fillOpacity='0.13' height='20' rx='3' stroke='currentColor' strokeOpacity='0.25' strokeWidth='0.7' width='35' x='42' y='3' />
     <rect fill='currentColor' fillOpacity='0.08' height='20' rx='3' stroke='currentColor' strokeOpacity='0.18' strokeWidth='0.7' width='35' x='3' y='26' />
     <rect fill='currentColor' fillOpacity='0.08' height='20' rx='3' stroke='currentColor' strokeOpacity='0.18' strokeWidth='0.7' width='35' x='42' y='26' />
     <rect fill='currentColor' fillOpacity='0.35' height='5' rx='1.5' width='5' x='8' y='8' />
     <rect fill='currentColor' fillOpacity='0.28' height='1.5' rx='0.75' width='14' x='16' y='9' />
     <rect fill='currentColor' fillOpacity='0.18' height='1.5' rx='0.75' width='10' x='16' y='12' />
     <rect fill='currentColor' fillOpacity='0.35' height='5' rx='1.5' width='5' x='47' y='8' />
     <rect fill='currentColor' fillOpacity='0.28' height='1.5' rx='0.75' width='14' x='55' y='9' />
     <rect fill='currentColor' fillOpacity='0.18' height='1.5' rx='0.75' width='10' x='55' y='12' />
    </svg>
   ),
  },
  {
   value: 'grid',
   label: '그리드',
   icon: (
    <svg aria-hidden='true' className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
     <rect height='7' rx='1' strokeWidth='1.5' width='7' x='3' y='3' />
     <rect height='7' rx='1' strokeWidth='1.5' width='7' x='14' y='3' />
     <rect height='7' rx='1' strokeWidth='1.5' width='7' x='3' y='14' />
     <rect height='7' rx='1' strokeWidth='1.5' width='7' x='14' y='14' />
    </svg>
   ),
   preview: (
    <svg aria-hidden='true' className='h-auto w-full' fill='none' viewBox='0 0 80 48'>
     {[0, 1, 2].map((col) =>
      [0, 1].map((row) => (
       <rect
        fill='currentColor'
        fillOpacity={row === 0 ? 0.11 : 0.07}
        height='20'
        key={`${col}-${row}`}
        rx='2.5'
        stroke='currentColor'
        strokeOpacity='0.2'
        strokeWidth='0.7'
        width='21'
        x={3 + col * 26}
        y={3 + row * 24}
       />
      )),
     )}
     <rect fill='currentColor' fillOpacity='0.3' height='4' rx='1' width='4' x='7' y='7' />
     <rect fill='currentColor' fillOpacity='0.25' height='1.5' rx='0.75' width='11' x='13' y='8' />
     <rect fill='currentColor' fillOpacity='0.15' height='1.5' rx='0.75' width='8' x='13' y='11' />
    </svg>
   ),
  },
  {
   value: 'list',
   label: '목록',
   icon: (
    <svg aria-hidden='true' className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
     <line strokeLinecap='round' strokeWidth='1.5' x1='3' x2='21' y1='6' y2='6' />
     <line strokeLinecap='round' strokeWidth='1.5' x1='3' x2='21' y1='12' y2='12' />
     <line strokeLinecap='round' strokeWidth='1.5' x1='3' x2='21' y1='18' y2='18' />
    </svg>
   ),
   preview: (
    <svg aria-hidden='true' className='h-auto w-full' fill='none' viewBox='0 0 80 48'>
     {[0, 1, 2, 3, 4, 5].map((i) => (
      <g key={i}>
       <rect fill='currentColor' fillOpacity={Math.max(0.04, 0.11 - i * 0.013)} height='6' rx='1.5' width='72' x='4' y={3 + i * 8} />
       <rect fill='currentColor' fillOpacity='0.35' height='3' rx='0.75' width='3' x='7' y={4.5 + i * 8} />
       <rect fill='currentColor' fillOpacity='0.25' height='1.5' rx='0.75' width='22' x='13' y={5.25 + i * 8} />
       <rect fill='currentColor' fillOpacity='0.12' height='1.5' rx='0.75' width='14' x='52' y={5.25 + i * 8} />
      </g>
     ))}
    </svg>
   ),
  },
 ];

export function ViewModeSection() {
 const { viewMode, setViewMode } = useSettingStore();

 return (
  <div className='flex flex-col gap-2'>
   <Label>뷰 모드</Label>
   <div className='flex gap-2'>
    {VIEW_MODE_OPTIONS.map((option) => (
     <button
      className={`flex flex-1 flex-col items-center gap-1.5 overflow-hidden rounded-lg border px-2 py-2 text-xs transition-all ${
       viewMode === option.value
        ? 'border-primary bg-primary/10 text-primary'
        : 'border-border text-muted-foreground hover:border-border/80 hover:text-foreground'
      }`}
      key={option.value}
      onClick={() => setViewMode(option.value)}
      type='button'
     >
      <div className={`w-full overflow-hidden rounded transition-opacity ${viewMode === option.value ? 'opacity-80' : 'opacity-50'}`}>
       {option.preview}
      </div>
      <div className='flex items-center gap-1'>
       {option.icon}
       {option.label}
      </div>
     </button>
    ))}
   </div>
  </div>
 );
}
```

**Step 2: 확인**

파일이 생성되었는지 확인한다.

---

## Task 2: `ThemeSection.tsx`

**Files:**

- Create: `apps/web/src/features/settings/ui/sections/ThemeSection.tsx`

**Step 1: 파일 생성**

`SettingsDialog.tsx`의 `THEME_OPTIONS`와 `ThemeSection`을 그대로 이동. `useTheme`을 직접 호출.

```tsx
import { Label } from '@bookmark/ui/components/label';
import type { Theme } from '@/shared/lib/theme';
import { useTheme } from '@/shared/lib/theme';

const THEME_OPTIONS: { value: Theme; label: string; icon: string }[] = [
 { value: 'light', label: '라이트', icon: '☀️' },
 { value: 'dark', label: '다크', icon: '🌙' },
 { value: 'system', label: '시스템', icon: '💻' },
];

export function ThemeSection() {
 const { theme, setTheme } = useTheme();

 return (
  <div className='flex flex-col gap-2'>
   <Label>테마</Label>
   <div className='flex gap-2'>
    {THEME_OPTIONS.map((option) => (
     <button
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-all ${
       theme === option.value
        ? 'border-primary bg-primary/10 text-primary'
        : 'border-border text-muted-foreground hover:border-border/80 hover:text-foreground'
      }`}
      key={option.value}
      onClick={() => setTheme(option.value)}
      type='button'
     >
      <span aria-hidden='true'>{option.icon}</span>
      {option.label}
     </button>
    ))}
   </div>
  </div>
 );
}
```

---

## Task 3: `RealtimeSyncSection.tsx`

**Files:**

- Create: `apps/web/src/features/settings/ui/sections/RealtimeSyncSection.tsx`

**Step 1: 파일 생성**

기존 `_RealtimeSyncSection`을 그대로 이동. 이름을 `RealtimeSyncSection`으로 복원하고 `useSettingStore`를 직접 호출.

```tsx
import { Label } from '@bookmark/ui/components/label';
import { Switch } from '@bookmark/ui/components/switch';
import { useSettingStore } from '../../model/settingStore';

export function RealtimeSyncSection() {
 const { realtimeSync, setRealtimeSync } = useSettingStore();

 return (
  <div className='flex flex-col gap-2'>
   <div className='flex items-center justify-between'>
    <Label htmlFor='settings-realtime-sync'>실시간 동기화</Label>
    <Switch
     checked={realtimeSync}
     id='settings-realtime-sync'
     onCheckedChange={setRealtimeSync}
    />
   </div>
   <p className='text-xs text-muted-foreground'>
    extension에서 북마크를 추가·수정·삭제할 때 Chrome 브라우저 북마크에도 자동 반영됩니다.
   </p>
   <p className='text-xs text-destructive'>
    ⚠ 폴더 또는 북마크 삭제 시 Chrome 북마크에서도 영구적으로 삭제됩니다.
   </p>
  </div>
 );
}
```

---

## Task 4: `SettingsDialogContext.ts` 생성

**Files:**

- Create: `apps/web/src/features/settings/ui/SettingsDialogContext.ts`

**Step 1: 파일 생성**

`ChromeImportSection`이 가져오기 중 다이얼로그 닫힘을 차단하기 위해 사용하는 얇은 context.

```ts
import { createContext, useContext } from 'react';

interface SettingsDialogContextValue {
 setBlocking: (value: boolean) => void;
}

export const SettingsDialogContext = createContext<SettingsDialogContextValue>({
 setBlocking: () => {},
});

export function useSettingsDialogContext() {
 return useContext(SettingsDialogContext);
}
```

---

## Task 5: `ChromeImportSection.tsx`

**Files:**

- Create: `apps/web/src/features/settings/ui/sections/ChromeImportSection.tsx`

**Step 1: 파일 생성**

`useChromeBookmarkImport`를 내부에서 호출. context를 통해 다이얼로그 닫힘을 차단. `settingsOpen`이 false가 되면 스스로 reset.

```tsx
import { Button } from '@bookmark/ui/components/button';
import { useEffect } from 'react';
import { useSettingStore } from '../../model/settingStore';
import { useChromeBookmarkImport } from '../../model/useChromeBookmarkImport';
import { useSettingsDialogContext } from '../SettingsDialogContext';

export function ChromeImportSection() {
 const { importChromeBookmarks, progress, reset, isChromeBookmarksAvailable } =
  useChromeBookmarkImport();
 const { setBlocking } = useSettingsDialogContext();
 const { settingsOpen } = useSettingStore();

 useEffect(() => {
  setBlocking(progress.status === 'importing');
 }, [progress.status, setBlocking]);

 useEffect(() => {
  if (!settingsOpen) reset();
 }, [settingsOpen, reset]);

 if (!isChromeBookmarksAvailable) return null;

 const isImporting = progress.status === 'importing';
 const isDone = progress.status === 'done';
 const isError = progress.status === 'error';
 const progressPercent =
  progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

 return (
  <div className='flex flex-col gap-3'>
   <div>
    <h3 className='text-sm font-medium'>Chrome 북마크 가져오기</h3>
    <p className='mt-0.5 text-xs text-muted-foreground'>
     현재 Chrome 브라우저의 북마크를 앱으로 가져옵니다. 이미 있는 URL은 건너뜁니다.
    </p>
   </div>

   {(isImporting || isDone) && progress.total > 0 && (
    <div className='flex flex-col gap-1.5'>
     <div className='h-2 overflow-hidden rounded-full bg-secondary'>
      <div
       className='h-full rounded-full bg-primary transition-all duration-300'
       style={{ width: `${progressPercent}%` }}
      />
     </div>
     <p className='text-xs text-muted-foreground'>
      {isDone
       ? `완료 — ${progress.total}개 중 ${progress.current}개 처리됨`
       : `${progress.current} / ${progress.total} 처리 중...`}
     </p>
    </div>
   )}

   {isError && (
    <p className='text-xs text-destructive'>오류: {progress.error ?? '알 수 없는 오류'}</p>
   )}

   <Button
    className='w-full gap-2'
    disabled={isImporting}
    onClick={importChromeBookmarks}
    variant={isDone ? 'outline' : 'default'}
   >
    <svg aria-hidden='true' className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
     <circle cx='12' cy='12' r='10' strokeWidth={2} />
     <circle cx='12' cy='12' r='4' strokeWidth={2} />
     <line strokeWidth={2} x1='21.17' x2='12' y1='8' y2='8' />
     <line strokeWidth={2} x1='3.95' x2='8.54' y1='6.06' y2='14' />
     <line strokeWidth={2} x1='10.88' x2='15.46' y1='21.94' y2='14' />
    </svg>
    {isImporting
     ? `가져오는 중... (${progressPercent}%)`
     : isDone
      ? '다시 가져오기'
      : 'Chrome 북마크 가져오기'}
   </Button>
  </div>
 );
}
```

---

## Task 6: `sections.ts` 레지스트리 생성

**Files:**

- Create: `apps/web/src/features/settings/ui/sections.ts`

**Step 1: 파일 생성**

섹션 추가/제거/활성화는 이 파일만 수정하면 된다.

```ts
import type { ComponentType } from 'react';
import { ChromeImportSection } from './sections/ChromeImportSection';
import { RealtimeSyncSection } from './sections/RealtimeSyncSection';
import { ThemeSection } from './sections/ThemeSection';
import { ViewModeSection } from './sections/ViewModeSection';

interface SettingsSection {
 id: string;
 enabled: boolean;
 component: ComponentType<Record<string, never>>;
}

export const SETTINGS_SECTIONS: SettingsSection[] = [
 { id: 'view-mode', enabled: true, component: ViewModeSection },
 { id: 'theme', enabled: true, component: ThemeSection },
 // TODO: 추후 버전에서 클라우드 동기화 기능 오픈 예정
 { id: 'realtime-sync', enabled: false, component: RealtimeSyncSection },
 { id: 'chrome-import', enabled: true, component: ChromeImportSection },
];
```

**새 섹션 추가 방법:**

1. `sections/MyNewSection.tsx` 파일 생성 (props 없는 자립형 컴포넌트)
2. `sections.ts`에 배열 항목 하나 추가
3. 끝

---

## Task 7: `SettingsDialog.tsx` 재작성

**Files:**

- Modify: `apps/web/src/features/settings/ui/SettingsDialog.tsx`

**Step 1: 파일 전체 교체**

다이얼로그 로직만 남기고 섹션 렌더링은 레지스트리에 위임.

```tsx
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogHeader,
 DialogTitle,
} from '@bookmark/ui/components/dialog';
import { useState } from 'react';
import { useSettingStore } from '../model/settingStore';
import { SettingsDialogContext } from './SettingsDialogContext';
import { SETTINGS_SECTIONS } from './sections';

export function SettingsDialog() {
 const { settingsOpen, setSettingsOpen } = useSettingStore();
 const [isBlocking, setIsBlocking] = useState(false);

 function handleOpenChange(open: boolean) {
  if (!open && !isBlocking) {
   setSettingsOpen(false);
  }
 }

 return (
  <SettingsDialogContext value={{ setBlocking: setIsBlocking }}>
   <Dialog onOpenChange={handleOpenChange} open={settingsOpen}>
    <DialogContent className='sm:max-w-md'>
     <DialogHeader>
      <DialogTitle>설정</DialogTitle>
      <DialogDescription>앱 설정 및 데이터 관리</DialogDescription>
     </DialogHeader>

     <div className='flex flex-col gap-6 pt-2'>
      {SETTINGS_SECTIONS.filter((s) => s.enabled).map(({ id, component: Section }) => (
       <Section key={id} />
      ))}
     </div>
    </DialogContent>
   </Dialog>
  </SettingsDialogContext>
 );
}
```

---

## Task 8: 검증

**Step 1: lint + format**

```bash
pnpm check
```

Expected: `Fixed 0 files` 또는 자동 수정 후 경고 없음.

**Step 2: 타입 체크**

```bash
pnpm check-types
```

Expected: 오류 없음.

**Step 3: 런타임 확인**

개발 서버를 열어 설정 다이얼로그가 정상 동작하는지 확인:

- 뷰 모드 선택이 동작하는가
- 테마 전환이 동작하는가
- Chrome 북마크 가져오기가 동작하는가 (extension 환경)
- 가져오기 중 다이얼로그가 닫히지 않는가

---

## Task 9: 커밋

```bash
git add apps/web/src/features/settings/
git commit -m "refactor: settings sections registry pattern for easy add/remove/toggle"
```
