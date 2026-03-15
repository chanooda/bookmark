# Folders, Auto Title, Favicon Preview — Design

Date: 2026-02-28

## Overview

세 가지 기능을 추가한다:

1. **계층형 폴더** — Chrome 북마크 브라우저 스타일의 중첩 폴더
2. **자동 제목** — URL 입력 시 웹사이트 제목 자동 가져오기
3. **파비콘 미리보기** — 북마크 폼에서 URL 입력 시 파비콘 실시간 표시

---

## 1. 데이터 모델

### 새 타입 (`packages/types/src/index.ts`)

```ts
export interface Folder {
  id: string
  userId: string
  name: string
  parentId: string | null  // null = 최상위 폴더
  createdAt: Date
}

export interface CreateFolderDto {
  name: string
  parentId?: string
}

export interface UpdateFolderDto {
  name?: string
  parentId?: string
}
```

### Bookmark 타입 변경

```ts
export interface Bookmark {
  // 기존 필드 유지
  folderId: string | null  // null = 미분류
}

export interface CreateBookmarkDto {
  // 기존 필드 유지
  folderId?: string
}

export interface UpdateBookmarkDto {
  // 기존 필드 유지
  folderId?: string | null
}
```

### BookmarkListQuery 변경

```ts
export interface BookmarkListQuery {
  tagId?: string
  search?: string
  folderId?: string | 'unorganized'  // 'unorganized' = folderId null인 북마크만
}
```

### StorageAdapter 인터페이스 확장

```ts
export interface StorageAdapter {
  // 기존 메서드 유지
  getFolders(): Promise<Folder[]>
  createFolder(dto: CreateFolderDto): Promise<Folder>
  updateFolder(id: string, dto: UpdateFolderDto): Promise<Folder>
  deleteFolder(id: string): Promise<void>
}
```

### Metadata 타입 (API 응답)

```ts
export interface UrlMetadata {
  title: string | null
  favicon: string | null
}
```

---

## 2. Backend (`apps/api`)

### DB 스키마 (drizzle-orm + SQLite)

```ts
// folders 테이블
export const folders = sqliteTable('folders', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  parentId: text('parent_id').references(() => folders.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

// bookmarks 테이블에 컬럼 추가
folderId: text('folder_id').references(() => folders.id)
```

### 새 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| GET | `/folders` | 사용자 폴더 전체 조회 (트리 구성은 클라이언트에서) |
| POST | `/folders` | 폴더 생성 |
| PATCH | `/folders/:id` | 폴더 이름/부모 변경 |
| DELETE | `/folders/:id` | 폴더 삭제 (하위 폴더 + 북마크 cascade) |
| GET | `/metadata?url=xxx` | URL 메타데이터 조회 (title, favicon) |

### `/metadata` 엔드포인트 동작

1. URL 파라미터로 외부 URL을 받음
2. `fetch`로 HTML 가져오기 (timeout 5초)
3. `<title>` 태그 파싱
4. favicon: `https://www.google.com/s2/favicons?domain={hostname}&sz=64` 반환
5. 오류 시 `{ title: null, favicon: null }` 반환

---

## 3. ChromeStorageAdapter (`packages/api-client`)

### LocalStore 확장

```ts
interface LocalStore {
  bookmarks?: Bookmark[]
  tags?: Tag[]
  folders?: Folder[]
}
```

### 동작

- 폴더 CRUD: 메모리(chrome.storage.local) 기반으로 구현
- `deleteFolder`: 하위 폴더 재귀 삭제 + 해당 폴더 북마크 `folderId = null` 처리
- `getBookmarks`: `folderId` 필터 추가 (`'unorganized'`이면 `folderId === null`인 것만)
- 자동 제목/파비콘: `/api/metadata` 엔드포인트 호출 (로컬 모드에서도 API 서버가 있으면 호출, 없으면 생략)

---

## 4. Web 앱 UI (`apps/web`)

### 사이드바 구조

현재 `TagSidebar` 위젯을 확장하여 폴더 트리 섹션 추가.

```
┌─────────────────────┐
│ 📁 전체             │  ← 모든 북마크
│ 📁 미분류           │  ← folderId = null
│                     │
│ ── 폴더 ──────────  │
│ ▼ 📁 Work           │
│   ├ 📁 Frontend     │
│   └ 📁 Backend      │
│ ▶ 📁 Personal       │
│   [+ 폴더 추가]     │
│                     │
│ ── 태그 ──────────  │
│ 🏷 React            │
│ 🏷 TypeScript       │
└─────────────────────┘
```

- 폴더 항목 hover 시 `+` (하위 폴더), `✏️` (이름 변경), `🗑` (삭제) 버튼 표시
- 폴더 삭제 시 확인 다이얼로그 (하위 내용 삭제 경고 포함)
- 폴더 클릭 → 해당 폴더 + 모든 하위 폴더의 북마크 표시

### BookmarkCreateDialog / BookmarkEditDialog 변경

1. **파비콘 미리보기**: URL input 옆에 `<img>` 추가, URL 변경 시 Google S2 URL로 즉시 업데이트
2. **자동 제목**: URL 입력 후 500ms debounce → `/api/metadata` 호출 → title 필드가 비어있으면 자동 입력
3. **폴더 선택**: Select 컴포넌트로 폴더 트리를 indent로 표현

```
┌─────────────────────────────────────┐
│ 북마크 추가                         │
├─────────────────────────────────────┤
│ URL *                               │
│ [🌐] [https://react.dev          ]  │
│                                     │
│ 제목 *                              │
│ [React                           ]  │← 자동 입력
│                                     │
│ 설명                                │
│ [                                ]  │
│                                     │
│ 폴더                                │
│ [Work > Frontend              ▼  ]  │
│                                     │
│ 태그                                │
│ [React] [TypeScript]                │
└─────────────────────────────────────┘
```

---

## 5. Extension UI (`apps/extension`)

### PopupPage 변경

- URL 입력 변경 시 파비콘 미리보기 (URL 옆)
- URL 변경 시 자동 제목 fetch (현재 탭 URL이 바뀐 경우)
- 폴더 선택 드롭다운 추가 (태그 선택 아래)

---

## 6. 구현 순서

| 단계 | 작업 | 위치 |
|------|------|------|
| 1 | Folder 타입/DTO, Bookmark 타입 수정, StorageAdapter 인터페이스 확장 | `packages/types` |
| 2 | ChromeStorageAdapter 폴더 CRUD + folderId 필터 | `packages/api-client` |
| 3 | DB 마이그레이션 (folders 테이블, bookmarks.folderId) | `apps/api` |
| 4 | NestJS folders 모듈 (CRUD) | `apps/api` |
| 5 | NestJS metadata 엔드포인트 | `apps/api` |
| 6 | ApiAdapter 폴더 CRUD + metadata 메서드 | `packages/api-client` |
| 7 | Web 사이드바 폴더 트리 UI | `apps/web` |
| 8 | Web BookmarkCreateDialog / BookmarkEditDialog 수정 (파비콘 미리보기, 자동 제목, 폴더 선택) | `apps/web` |
| 9 | Extension PopupPage 수정 (파비콘 미리보기, 자동 제목, 폴더 선택) | `apps/extension` |

---

## 7. 주요 결정 사항

- **폴더 삭제 정책**: 하위 폴더 cascade 삭제, 해당 폴더의 북마크는 `folderId = null` (미분류)로 변경 (삭제하지 않음)
- **자동 제목 트리거**: title 필드가 비어있을 때만 자동 입력 (사용자가 직접 입력한 경우 덮어쓰지 않음)
- **파비콘 소스**: Google S2 API (`https://www.google.com/s2/favicons?domain=xxx&sz=64`) — 이미 저장 시 사용 중이므로 일관성 유지
- **폴더 트리 구성**: 서버/스토리지는 flat list 반환, 클라이언트에서 parentId로 트리 구성
