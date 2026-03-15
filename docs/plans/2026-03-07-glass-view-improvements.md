# Glass View Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Glass view 전면 개선 - full-width 레이아웃, 폴더/태그 관리 패널, 카드 밀도 향상, 라이트 모드 모달 테마 수정, 미분류 북마크 개별 카드 렌더링, 헤더 glass 버튼 추가, 설정 뷰 프리뷰 추가.

**Architecture:** `GlassFolderView.tsx` 전면 리팩토링 + `Header.tsx` glass 버튼 추가 + `SettingsDialog.tsx` 뷰 프리뷰 추가. Glass view에서 HomePage 레이아웃을 full-width로 전환하여 shadow 끊김 해결. 모달은 CSS 변수(light/dark 모두 대응)로 교체.

**Tech Stack:** React, TailwindCSS v4, shadcn/ui, Zustand (useSettingStore, useBookmarkFilterStore), @tanstack/react-query

---

## 파일 맵

| 파일 | 변경 유형 |
|---|---|
| `apps/web/src/widgets/header/ui/Header.tsx` | Modify |
| `apps/web/src/pages/home/ui/HomePage.tsx` | Modify |
| `apps/web/src/widgets/bookmark-list/ui/GlassFolderView.tsx` | Full rewrite |
| `apps/web/src/features/settings/ui/SettingsDialog.tsx` | Modify |

---

### Task 1: Header에 glass view 버튼 추가

**Files:**

- Modify: `apps/web/src/widgets/header/ui/Header.tsx:44-95`

**Step 1: glass 버튼을 grid/list 버튼 앞에 추가**

현재 뷰모드 토글 영역 (line 44-95):

```tsx
<div className='mr-0.5 flex items-center gap-0.5 rounded-lg bg-muted/70 p-0.5'>
  {/* 기존: grid, list 버튼 */}
</div>
```

glass 버튼을 가장 앞에 추가. 아이콘은 4개의 큰 사각형(glass grid 느낌):

```tsx
<button
  className={`rounded-md p-2 transition-all ${
    viewMode === 'glass'
      ? 'bg-background text-foreground shadow-sm'
      : 'text-muted-foreground hover:text-foreground'
  }`}
  onClick={() => setViewMode('glass')}
  title='글래스 보기'
  type='button'
>
  <svg aria-hidden='true' className='size-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
    <rect height='9' rx='2' strokeWidth='1.5' width='9' x='2' y='2' />
    <rect height='9' rx='2' strokeWidth='1.5' width='9' x='13' y='2' />
    <rect height='9' rx='2' strokeWidth='1.5' width='9' x='2' y='13' />
    <rect height='9' rx='2' strokeWidth='1.5' width='9' x='13' y='13' />
  </svg>
</button>
```

**Step 2: 검증**

```bash
pnpm check && pnpm check-types
```

**Step 3: Commit**

```bash
git add apps/web/src/widgets/header/ui/Header.tsx
git commit -m "feat(header): add glass view toggle button"
```

---

### Task 2: Settings 뷰 모드 옵션에 미리보기 SVG 추가

**Files:**

- Modify: `apps/web/src/features/settings/ui/SettingsDialog.tsx:24-78`

**Step 1: VIEW_MODE_OPTIONS에 preview SVG 추가**

각 옵션에 `preview` 필드를 추가. 각 preview는 해당 뷰 모드의 UI 구조를 간략하게 나타내는 SVG:

```tsx
const VIEW_MODE_OPTIONS: { value: ViewMode; label: string; icon: ReactNode; preview: ReactNode }[] = [
  {
    value: 'glass',
    label: '글래스',
    icon: (/* 기존 아이콘 */),
    preview: (
      <svg viewBox='0 0 80 52' className='w-full h-auto' fill='none'>
        {/* 큰 유리 카드 4개 2x2 그리드 */}
        <rect x='4' y='4' width='34' height='20' rx='4' fill='currentColor' opacity='0.15' stroke='currentColor' strokeOpacity='0.3' strokeWidth='0.8'/>
        <rect x='42' y='4' width='34' height='20' rx='4' fill='currentColor' opacity='0.15' stroke='currentColor' strokeOpacity='0.3' strokeWidth='0.8'/>
        <rect x='4' y='28' width='34' height='20' rx='4' fill='currentColor' opacity='0.10' stroke='currentColor' strokeOpacity='0.25' strokeWidth='0.8'/>
        <rect x='42' y='28' width='34' height='20' rx='4' fill='currentColor' opacity='0.10' stroke='currentColor' strokeOpacity='0.25' strokeWidth='0.8'/>
        {/* 카드 내부 아이템 줄 */}
        <rect x='10' y='10' width='6' height='6' rx='1.5' fill='currentColor' opacity='0.4'/>
        <rect x='20' y='11' width='14' height='2' rx='1' fill='currentColor' opacity='0.35'/>
        <rect x='20' y='15' width='10' height='1.5' rx='0.75' fill='currentColor' opacity='0.2'/>
        <rect x='48' y='10' width='6' height='6' rx='1.5' fill='currentColor' opacity='0.4'/>
        <rect x='58' y='11' width='14' height='2' rx='1' fill='currentColor' opacity='0.35'/>
        <rect x='58' y='15' width='10' height='1.5' rx='0.75' fill='currentColor' opacity='0.2'/>
      </svg>
    ),
  },
  {
    value: 'grid',
    label: '그리드',
    icon: (/* 기존 아이콘 */),
    preview: (
      <svg viewBox='0 0 80 52' className='w-full h-auto' fill='none'>
        {/* 3열 카드 그리드 */}
        <rect x='2' y='2' width='22' height='22' rx='3' fill='currentColor' opacity='0.12' stroke='currentColor' strokeOpacity='0.25' strokeWidth='0.8'/>
        <rect x='29' y='2' width='22' height='22' rx='3' fill='currentColor' opacity='0.12' stroke='currentColor' strokeOpacity='0.25' strokeWidth='0.8'/>
        <rect x='56' y='2' width='22' height='22' rx='3' fill='currentColor' opacity='0.12' stroke='currentColor' strokeOpacity='0.25' strokeWidth='0.8'/>
        <rect x='2' y='28' width='22' height='22' rx='3' fill='currentColor' opacity='0.08' stroke='currentColor' strokeOpacity='0.2' strokeWidth='0.8'/>
        <rect x='29' y='28' width='22' height='22' rx='3' fill='currentColor' opacity='0.08' stroke='currentColor' strokeOpacity='0.2' strokeWidth='0.8'/>
        <rect x='56' y='28' width='22' height='22' rx='3' fill='currentColor' opacity='0.08' stroke='currentColor' strokeOpacity='0.2' strokeWidth='0.8'/>
        {/* 아이콘+텍스트 */}
        <rect x='6' y='6' width='6' height='6' rx='1.5' fill='currentColor' opacity='0.35'/>
        <rect x='6' y='14' width='14' height='1.5' rx='0.75' fill='currentColor' opacity='0.3'/>
        <rect x='6' y='17' width='10' height='1.5' rx='0.75' fill='currentColor' opacity='0.2'/>
      </svg>
    ),
  },
  {
    value: 'list',
    label: '목록',
    icon: (/* 기존 아이콘 */),
    preview: (
      <svg viewBox='0 0 80 52' className='w-full h-auto' fill='none'>
        {/* 리스트 행들 */}
        {[0,1,2,3,4,5].map((i) => (
          <g key={i} transform={`translate(0, ${i * 8})`}>
            <rect x='4' y='2' width='72' height='6' rx='2' fill='currentColor' opacity={0.12 - i * 0.015}/>
            <rect x='8' y='4' width='4' height='2' rx='1' fill='currentColor' opacity='0.4'/>
            <rect x='16' y='4' width='24' height='2' rx='1' fill='currentColor' opacity='0.3'/>
            <rect x='52' y='4' width='16' height='2' rx='1' fill='currentColor' opacity='0.15'/>
          </g>
        ))}
      </svg>
    ),
  },
];
```

**Step 2: 버튼 렌더링에 preview 추가**

기존 버튼을 세로로 확장하여 preview 포함:

```tsx
<button
  className={`flex flex-1 flex-col items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs transition-all ${
    viewMode === option.value
      ? 'border-primary bg-primary/10 text-primary'
      : 'border-border text-muted-foreground hover:border-border/80 hover:text-foreground'
  }`}
  key={option.value}
  onClick={() => setViewMode(option.value)}
  type='button'
>
  <div className='w-full rounded overflow-hidden opacity-70'>
    {option.preview}
  </div>
  <div className='flex items-center gap-1'>
    {option.icon}
    {option.label}
  </div>
</button>
```

**Step 3: 검증**

```bash
pnpm check && pnpm check-types
```

**Step 4: Commit**

```bash
git add apps/web/src/features/settings/ui/SettingsDialog.tsx
git commit -m "feat(settings): add view mode preview thumbnails"
```

---

### Task 3: HomePage glass view full-width 레이아웃

**Files:**

- Modify: `apps/web/src/pages/home/ui/HomePage.tsx:72-87`

**Step 1: glass 모드일 때 max-width 제거 및 px 조정**

현재:

```tsx
<div className='mx-auto flex w-full max-w-[1400px] flex-1 flex-col overflow-hidden px-6'>
  <SearchHub />
  <div className='flex flex-1 gap-7 overflow-hidden'>
    {!isGlass && <Sidebar />}
    <main className='min-w-0 h-full flex-1 overflow-y-auto py-4'>
      <BookmarkList />
    </main>
  </div>
</div>
```

변경:

```tsx
<div className={cn(
  'mx-auto flex w-full flex-1 flex-col overflow-hidden',
  isGlass ? 'px-0' : 'max-w-[1400px] px-6'
)}>
  <div className={isGlass ? 'px-6' : ''}>
    <SearchHub />
  </div>
  <div className='flex flex-1 gap-7 overflow-hidden'>
    {!isGlass && <Sidebar />}
    <main className={cn(
      'min-w-0 h-full flex-1 overflow-y-auto',
      isGlass ? '' : 'py-4'
    )}>
      <BookmarkList />
    </main>
  </div>
</div>
```

`cn` import 추가 필요: `import { cn } from '@bookmark/ui/lib/utils';`

**Step 2: 검증**

```bash
pnpm check && pnpm check-types
```

**Step 3: Commit**

```bash
git add apps/web/src/pages/home/ui/HomePage.tsx
git commit -m "feat(home): glass view full-width layout"
```

---

### Task 4: GlassFolderView - 전면 개선

**Files:**

- Rewrite: `apps/web/src/widgets/bookmark-list/ui/GlassFolderView.tsx`

이 Task는 아래 5가지 Design 요구사항을 한 파일에서 모두 처리한다:

- D1: full-width (Task 3에서 레이아웃 처리, 여기선 grid 패딩 제거)
- D2: 폴더/태그 선택·추가·수정 패널
- D3: 카드 크기 축소 + 5열 + 위에서부터 채우기
- D4: 모달 라이트 테마 대응
- D5: 모달에 설명+태그 표시
- D6: 미분류 북마크 개별 카드 렌더링

**Step 1: imports 및 타입 확인**

사용할 hooks:

- `useBookmarkFilterStore` → `selectedTagId, setSelectedTagId, selectedFolderId, setSelectedFolderId, search`
- `useFolders` → folders 목록
- `useTags` → tags 목록
- `useFolderDialogStore` → `setCreateOpen as setFolderCreateOpen`
- `useTagDialogStore` → `setCreateOpen as setTagCreateOpen, setEditTarget as setTagEditTarget`

**Step 2: GlassFolderFilterBar 컴포넌트 추가**

폴더/태그를 수평 스크롤 가능한 pill 형태로 표시. Glass 스타일(backdrop-blur, rgba 배경).
선택된 항목은 강조, 추가 버튼(+) 포함. 태그는 dot 색상 표시.

```tsx
// glass view 전용 필터바 - 폴더 + 태그 선택/추가/수정
function GlassFilterBar() {
  const { selectedTagId, setSelectedTagId, selectedFolderId, setSelectedFolderId } = useBookmarkFilterStore();
  const { data: folders = [] } = useFolders();
  const { data: tags = [] } = useTags();
  const { setCreateOpen: setFolderCreateOpen } = useFolderDialogStore();
  const { setCreateOpen: setTagCreateOpen, setEditTarget: setTagEditTarget } = useTagDialogStore();

  return (
    <div className='flex flex-col gap-2 px-6 pb-3 pt-1'>
      {/* 폴더 필터 */}
      <div className='flex items-center gap-2'>
        <span className='shrink-0 text-[9px] font-medium uppercase tracking-[0.15em] text-white/35 w-8'>폴더</span>
        <div className='flex flex-1 items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none'>
          {/* 전체 버튼 */}
          <button
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-all ${
              !selectedFolderId
                ? 'bg-white/25 text-white shadow-sm'
                : 'bg-white/8 text-white/55 hover:bg-white/15 hover:text-white/80'
            }`}
            onClick={() => { setSelectedFolderId(undefined); setSelectedTagId(undefined); }}
            type='button'
          >
            전체
          </button>
          {folders.map((folder) => (
            <button
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                selectedFolderId === folder.id
                  ? 'bg-white/25 text-white shadow-sm'
                  : 'bg-white/8 text-white/55 hover:bg-white/15 hover:text-white/80'
              }`}
              key={folder.id}
              onClick={() => { setSelectedFolderId(folder.id); setSelectedTagId(undefined); }}
              type='button'
            >
              {folder.name}
            </button>
          ))}
          {/* 폴더 추가 */}
          <button
            className='shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-white/8 text-white/40 transition-all hover:bg-white/18 hover:text-white/70'
            onClick={() => setFolderCreateOpen(true, 'root')}
            title='폴더 추가'
            type='button'
          >
            <svg className='h-3 w-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path d='M12 4v16m8-8H4' strokeLinecap='round' strokeLinejoin='round' strokeWidth={2.5} />
            </svg>
          </button>
        </div>
      </div>

      {/* 태그 필터 */}
      <div className='flex items-center gap-2'>
        <span className='shrink-0 text-[9px] font-medium uppercase tracking-[0.15em] text-white/35 w-8'>태그</span>
        <div className='flex flex-1 items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none'>
          {tags.map((tag) => (
            <button
              className={`shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                selectedTagId === tag.id
                  ? 'bg-white/22 text-white shadow-sm'
                  : 'bg-white/8 text-white/55 hover:bg-white/15 hover:text-white/80'
              }`}
              key={tag.id}
              onClick={() => { setSelectedTagId(tag.id); setSelectedFolderId(undefined); }}
              type='button'
            >
              <span className='h-1.5 w-1.5 rounded-full shrink-0' style={{ backgroundColor: tag.color }} />
              {tag.name}
            </button>
          ))}
          <button
            className='shrink-0 flex items-center gap-1 rounded-full bg-white/8 px-2.5 py-1 text-[10px] text-white/40 transition-all hover:bg-white/18 hover:text-white/70'
            onClick={() => setTagCreateOpen(true)}
            title='태그 추가'
            type='button'
          >
            <svg className='h-3 w-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path d='M12 4v16m8-8H4' strokeLinecap='round' strokeLinejoin='round' strokeWidth={2.5} />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Step 3: GlassFolderCard 카드 크기 축소**

현재 `aspectRatio: '1'` + `p-3.5` + 4개 북마크 표시 → 더 작게:

- `p-2.5` 로 축소
- `aspectRatio: '1'` 유지 (정사각형)
- `rounded-[16px]` (기존 20px에서 축소)
- `displayBookmarks.slice(0, 3)` (4→3개)
- 북마크 favicon 크기: h-7 w-7 → h-6 w-6
- 텍스트: text-xs → text-[11px]

**Step 4: GlassFolderView 그리드 컬럼 증가**

```tsx
// 기존
<div className='p-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3'>

// 변경: 패딩 제거(HomePage에서 px-6 처리), 컬럼 증가
<div className='px-6 pt-2 pb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'>
```

**Step 5: 미분류 북마크 개별 카드 렌더링 (D6)**

`folderGroups` 중 `id === null` (미분류)를 찾아, 폴더 카드 대신 개별 `GlassBookmarkCard` 목록으로 렌더링.

```tsx
// 새 컴포넌트: GlassBookmarkCard (개별 북마크 카드, 정사각형 타일)
function GlassBookmarkCard({ bookmark, onEdit, onDelete, animationDelay }: { ... }) {
  // 북마크의 favicon + 제목 + url + description + tags를 모두 표시
  // 카드 크기는 GlassFolderCard와 동일한 격자에 맞춤
}

// GlassFolderView 렌더링에서
{folderGroups.map((group, i) => {
  if (group.id === null) {
    // 미분류: 개별 북마크 카드로 렌더링
    return group.bookmarks.map((bm, j) => (
      <GlassBookmarkCard
        key={bm.id}
        bookmark={bm}
        animationDelay={(i + j) * 30}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    ));
  }
  // 일반 폴더 카드
  return (
    <GlassFolderCard key={group.id} ... />
  );
})}
```

**Step 6: FolderModal 라이트 테마 대응 (D4) + 설명/태그 표시 (D5)**

모달 패널에서 하드코딩된 dark 색상을 CSS 변수 기반으로 교체:

```tsx
// 기존 (dark hardcoded)
const panelStyle = {
  background: 'rgba(12,10,14,0.93)',
  border: '1px solid rgba(255,255,255,0.12)',
  ...
}

// 변경: 테마 대응
// tailwind 클래스 사용
// light: bg-background/95 border-border
// dark: 기존 스타일 유지
```

구체적으로 `panelStyle` inline style 대신 Tailwind 클래스로 교체:

```tsx
<div
  className={`relative flex w-full flex-col overflow-hidden rounded-[32px] bg-background/95 border border-border shadow-2xl backdrop-blur-[48px] transition-all duration-300 ${
    visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-7 pointer-events-none'
  }`}
  style={{ maxWidth: '860px', maxHeight: '88vh' }}
>
```

모달 내부 텍스트, 헤더, 구분선 등도 Tailwind 클래스(text-foreground, border-border 등)로 교체.

BookmarkCard 내 description 추가:

```tsx
{bookmark.description && (
  <p className='mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground/70'>
    {bookmark.description}
  </p>
)}
```

**Step 7: 검증**

```bash
pnpm check && pnpm check-types
```

**Step 8: Commit**

```bash
git add apps/web/src/widgets/bookmark-list/ui/GlassFolderView.tsx
git commit -m "feat(glass-view): full-width grid, filter bar, smaller cards, light theme modal, description, uncategorized cards"
```

---

## 검증 체크리스트

- [ ] `pnpm check` 통과 (lint/format)
- [ ] `pnpm check-types` 통과
- [ ] glass view가 full-width로 렌더링됨 (shadow 끊김 없음)
- [ ] glass view 상단에 폴더/태그 필터바 표시됨
- [ ] 폴더/태그 선택 시 필터링 작동
- [ ] 폴더/태그 추가 버튼 작동
- [ ] glass view 카드가 6열(xl)로 렌더링됨
- [ ] 미분류 북마크가 개별 카드로 표시됨
- [ ] 상세 모달에서 light 모드 테마 정상
- [ ] 상세 모달에서 description, tags 표시됨
- [ ] Header에 glass 버튼 표시 및 클릭 작동
- [ ] Settings에서 각 뷰 모드 미리보기 표시됨
- [ ] 런타임 에러 없음
