# Bookmark App Design

**Date:** 2026-02-19
**Status:** Approved

---

## Overview

크롬 북마크를 개선하는 웹 대시보드 + 크롬 익스텐션 앱.

**MVP 범위:** 북마크 CRUD + 태그 + 기본 목록 뷰

---

## 결정 사항

| 항목 | 결정 |
|------|------|
| 개발 방식 | 공통 패키지 먼저, 웹 + 익스텐션 동시 개발 |
| 데이터 저장 | 백엔드 중심 (NestJS + SQLite) |
| 인증 | Google OAuth + JWT |
| 모노레포 구조 | 3개 앱 + 공유 패키지 강화 |
| 웹 프레임워크 | React + Vite (Next.js 아님) |

---

## 모노레포 구조

```
new-project/
├── apps/
│   ├── web/          # React + Vite - 북마크 대시보드 (기본 페이지)
│   ├── extension/    # React + Vite - 크롬 익스텐션
│   └── api/          # NestJS - REST API 서버
├── packages/
│   ├── types/        # 공통 TypeScript 타입 (Bookmark, Tag, User 등)
│   ├── ui/           # 공통 shadcn/ui 컴포넌트
│   └── api-client/   # 공통 API 클라이언트 (axios + zod 스키마)
├── turbo.json
├── pnpm-workspace.yaml
└── biome.json
```

---

## 데이터 모델

```typescript
interface User {
  id: string
  googleId: string
  email: string
  name: string
  avatar: string | null
  createdAt: Date
}

interface Bookmark {
  id: string
  userId: string
  url: string
  title: string
  description: string | null
  favicon: string | null  // URL에서 자동 추출
  createdAt: Date
  updatedAt: Date
  tags: Tag[]
}

interface Tag {
  id: string
  userId: string
  name: string
  color: string  // hex color (예: "#3B82F6")
  createdAt: Date
}

interface BookmarkTag {
  bookmarkId: string
  tagId: string
}
```

---

## API 설계

```
# Auth
GET  /auth/google           # Google OAuth 시작
GET  /auth/google/callback  # OAuth 콜백 → JWT 발급

# Bookmarks
GET    /bookmarks           # 목록 조회 (?tagId=, ?search=)
POST   /bookmarks           # 생성
GET    /bookmarks/:id       # 단건 조회
PATCH  /bookmarks/:id       # 수정
DELETE /bookmarks/:id       # 삭제

# Tags
GET    /tags                # 태그 목록
POST   /tags                # 태그 생성
PATCH  /tags/:id            # 태그 수정 (이름/색상)
DELETE /tags/:id            # 태그 삭제
```

**인증 플로우:**
1. 웹/익스텐션 → `GET /auth/google`
2. Google 인증 완료 → 서버가 JWT 발급
3. 이후 모든 요청: `Authorization: Bearer <token>`

---

## FSD 프론트엔드 아키텍처

### apps/web/src/

```
app/          # 앱 초기화, Provider (QueryClient, Auth, Router)
pages/
├── login/    # 로그인 페이지
└── home/     # 북마크 목록 페이지
widgets/
├── bookmark-list/    # 북마크 목록 전체
└── tag-sidebar/      # 태그 필터 사이드바
features/
├── bookmark-create/  # 북마크 추가
├── bookmark-edit/    # 북마크 수정
├── bookmark-delete/  # 북마크 삭제
└── tag-manage/       # 태그 생성/수정/삭제
entities/
├── bookmark/         # BookmarkCard 컴포넌트, bookmark 훅
└── tag/              # TagBadge 컴포넌트, tag 훅
shared/
├── ui/               # packages/ui 재export
├── api/              # packages/api-client 래핑
└── lib/              # 유틸, 상수
```

### apps/extension/src/

```
app/
pages/
└── popup/            # 익스텐션 팝업 (현재 탭 URL 자동 감지)
features/
├── bookmark-create/  # 현재 탭 북마크 추가
└── bookmark-edit/    # 기존 북마크 수정
entities/
└── tag/
shared/
```

**핵심 규칙:** 상위 레이어만 하위 레이어를 import
`pages` → `widgets` → `features` → `entities` → `shared`

---

## 개발 순서

### Phase 1: 기반 설정

1. `packages/types` - 공통 타입 정의
2. `packages/ui` - shadcn/ui 기본 컴포넌트 세팅
3. `packages/api-client` - axios + zod 기반 API 함수
4. `apps/api` - NestJS 초기화, drizzle-orm + SQLite 설정
5. `apps/api` - Google OAuth + JWT 인증 구현
6. `apps/api` - Bookmark/Tag CRUD API 구현

### Phase 2: 웹 + 익스텐션 병렬 개발

| apps/web | apps/extension |
|----------|----------------|
| FSD 구조 세팅 | FSD 구조 세팅 |
| Google 로그인 페이지 | Google 로그인 (chrome.identity) |
| 북마크 목록 페이지 | 팝업 UI (현재 탭 URL 자동 감지) |
| 북마크 추가/수정/삭제 | 북마크 추가/수정 |
| 태그 사이드바 필터 | 태그 선택 |

### Phase 3: 마무리

- vitest 단위 테스트 (entities, features)
- playwright E2E 테스트 (웹)
- lefthook git hook 설정
- 빌드/배포 파이프라인 정리

---

## 기술 스택

| 영역 | 스택 |
|------|------|
| 웹/익스텐션 | React, Vite, Tailwind CSS, shadcn/ui |
| 상태 관리 | @tanstack/react-query, zustand |
| 폼/검증 | react-hook-form, zod |
| 백엔드 | NestJS, drizzle-orm, SQLite |
| 공통 | TypeScript, pnpm, Turborepo, Biome |
| 테스트 | vitest, playwright |
| Git hook | lefthook |
