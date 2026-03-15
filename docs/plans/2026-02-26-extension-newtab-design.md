# Extension New Tab: Single-Page + Dialog 전환 설계

**Date:** 2026-02-26
**Scope:** apps/web

## 배경

web 앱을 Chrome extension의 new tab 페이지로 사용하기 위해 번들링 환경을 구성했다 (build:ext 모드, newtab/ 복사 파이프라인). 이에 맞춰 UI 아키텍처도 multi-page routing에서 single-page + dialog 조합으로 전환한다.

## 결정 사항

| 항목 | 결정 |
|---|---|
| 레이아웃 | 좌측 TagSidebar + 우측 BookmarkList 유지 |
| 라우팅 | React Router 완전 제거 (pure state-based) |
| 로그인 UX | 로컬 북마크 기본 표시, 헤더 "동기화" 버튼 → LoginDialog |
| OAuth | `chrome.identity.launchWebAuthFlow` 사용 |
| 콜백 처리 | chrome.identity가 내부 처리, 별도 콜백 라우트 불필요 |

## 아키텍처

### Before

```
main.tsx
└── Providers
    └── AppRouter (BrowserRouter)
        ├── / → HomePage
        ├── /login → LoginPage
        └── /auth/callback → AuthCallbackPage
```

### After

```
main.tsx
└── Providers
    └── HomePage  ← 단일 루트, 라우터 없음
        ├── Header
        ├── TagSidebar + BookmarkList
        ├── LoginDialog
        ├── BookmarkCreateDialog
        └── BookmarkEditDialog
```

## Auth Flow

```
헤더 "동기화" 버튼 클릭
    └── LoginDialog 열림
        └── "Google로 로그인" 클릭
            └── chrome.identity.launchWebAuthFlow({ url: googleOAuthUrl, interactive: true })
                ├── [성공] redirectUrl에서 code 추출
                │   └── POST /auth/google { code, redirect_uri } → JWT 토큰
                │       └── localStorage 저장 + axios 헤더 설정
                │           └── StorageContext → API 모드 전환
                │               └── migrateLocalToApi() 실행
                │                   └── Dialog 닫힘
                └── [실패] Dialog 내 에러 메시지 표시
```

**redirect_uri:** `chrome.identity.getRedirectURL()` → `https://<ext-id>.chromiumapp.org/`
> Google Cloud Console에 해당 URI 등록 필요

## 상태 관리

```ts
// HomePage 상태 (추가분만 표시)
const [loginOpen, setLoginOpen] = useState(false);

// 기존 유지
const [selectedTagId, setSelectedTagId] = useState<string | undefined>();
const [search, setSearch] = useState('');
const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
const [createOpen, setCreateOpen] = useState(false);
const [editTarget, setEditTarget] = useState<Bookmark | null>(null);
```

`StorageContext.mode`로 인증 상태 판별:
- `'local'` → 헤더에 "동기화" 버튼 → `setLoginOpen(true)`
- `'api'` → 헤더에 "로그아웃" 버튼

## 파일 변경 목록

### 삭제

- `src/app/router/index.tsx`
- `src/pages/login/ui/LoginPage.tsx`
- `src/pages/login/ui/AuthCallbackPage.tsx`

### 신규 생성

- `src/features/auth/model/useLaunchWebAuthFlow.ts`
- `src/features/auth/ui/LoginDialog.tsx`

### 수정

- `src/main.tsx` — AppRouter 제거, HomePage 직접 렌더
- `src/pages/home/ui/HomePage.tsx` — loginOpen 상태 + LoginDialog 추가
- `apps/web/package.json` — react-router 의존성 제거

## 외부 조건

- 백엔드 `/auth/google` 엔드포인트가 `{ code, redirect_uri }` 수신 방식 지원 필요
- Google Cloud Console에 `https://<ext-id>.chromiumapp.org/` redirect URI 등록 필요
