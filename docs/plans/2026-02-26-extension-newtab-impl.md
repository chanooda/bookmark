# Extension New Tab: Single-Page + Dialog 전환 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** web 앱의 multi-page 라우팅을 제거하고 단일 페이지 + Dialog 구조로 전환해 Chrome extension new tab에서 정상 동작하도록 한다.

**Architecture:** React Router를 완전 제거하고 `chrome.identity.launchWebAuthFlow`로 OAuth를 처리한다. 백엔드에 code-exchange 전용 엔드포인트를 추가해 extension이 직접 인증 코드를 교환할 수 있도록 한다. LoginPage/AuthCallbackPage는 단일 `LoginDialog`로 통합된다.

**Tech Stack:** React 19, Vite, NestJS, `chrome.identity` API, `@repo/api-client`, `@repo/ui`

---

## 사전 확인 사항

- `apps/extension/public/manifest.json`의 `permissions`에 `"identity"` 이미 포함됨 ✓
- `apps/web/package.json`의 devDependencies에 `@types/chrome` 이미 포함됨 ✓
- `apps/api/src/auth/auth.service.ts`에 `findOrCreateUser()` 메서드 이미 존재 ✓
- Google Cloud Console에서 `https://<ext-id>.chromiumapp.org/` redirect URI 등록 필요 (배포 전 별도 작업)

---

## Task 1: Backend — Google code exchange 엔드포인트 추가

**Files:**
- Modify: `apps/api/src/auth/auth.service.ts`
- Modify: `apps/api/src/auth/auth.controller.ts`

### Step 1: auth.service.ts에 exchangeGoogleCode 메서드 추가

`findOrCreateUser` 메서드 아래에 추가:

```ts
async exchangeGoogleCode(code: string, redirectUri: string): Promise<{ token: string }> {
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) throw new Error('Google token exchange failed');

  const tokens = (await tokenRes.json()) as { access_token: string };

  const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userInfoRes.ok) throw new Error('Failed to fetch Google user info');

  const profile = (await userInfoRes.json()) as {
    id: string;
    email: string;
    name: string;
    picture: string | null;
  };

  const user = await this.findOrCreateUser({
    googleId: profile.id,
    email: profile.email,
    name: profile.name,
    avatar: profile.picture ?? null,
  });

  return { token: this.signToken(user.id) };
}
```

### Step 2: auth.controller.ts에 exchange 엔드포인트 추가

`import` 라인에 `Post`, `Body` 추가 후, `googleCallback` 아래에 추가:

```ts
@Post('google/exchange')
async googleExchange(@Body() body: { code: string; redirectUri: string }) {
  return this.authService.exchangeGoogleCode(body.code, body.redirectUri);
}
```

### Step 3: 타입 체크 확인

```bash
pnpm --filter @repo/api check-types
```

Expected: 에러 없음

### Step 4: 커밋

```bash
git add apps/api/src/auth/auth.service.ts apps/api/src/auth/auth.controller.ts
git commit -m "feat(api): add POST /auth/google/exchange endpoint for extension OAuth"
```

---

## Task 2: Web — react-router 제거 및 main.tsx 단순화

**Files:**
- Modify: `apps/web/package.json`
- Modify: `apps/web/src/main.tsx`
- Delete: `apps/web/src/app/router/index.tsx`

### Step 1: package.json에서 react-router 제거

`apps/web/package.json`의 `dependencies`에서 `"react-router"` 라인 삭제.

### Step 2: pnpm install 실행

```bash
pnpm install
```

### Step 3: main.tsx 수정

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Providers } from './app/providers';
import { HomePage } from './pages/home/ui/HomePage';
import '@repo/ui/styles/globals.css';

createRoot(document.getElementById('root') as HTMLElement).render(
	<StrictMode>
		<Providers>
			<HomePage />
		</Providers>
	</StrictMode>,
);
```

### Step 4: router/index.tsx 삭제

```bash
rm apps/web/src/app/router/index.tsx
```

### Step 5: 타입 체크 및 린트

```bash
pnpm --filter @repo/web check-types
pnpm --filter @repo/web check
```

Expected: 에러 없음 (react-router import 참조가 모두 제거되었는지 확인)

### Step 6: 커밋

```bash
git add apps/web/package.json apps/web/src/main.tsx
git rm apps/web/src/app/router/index.tsx
git commit -m "refactor(web): remove react-router, render HomePage directly"
```

---

## Task 3: LoginPage, AuthCallbackPage 삭제

**Files:**
- Delete: `apps/web/src/pages/login/ui/LoginPage.tsx`
- Delete: `apps/web/src/pages/login/ui/AuthCallbackPage.tsx`

### Step 1: 파일 삭제

```bash
rm apps/web/src/pages/login/ui/LoginPage.tsx
rm apps/web/src/pages/login/ui/AuthCallbackPage.tsx
```

`apps/web/src/pages/login/ui/` 디렉토리가 비었으면 함께 삭제:

```bash
rmdir apps/web/src/pages/login/ui apps/web/src/pages/login 2>/dev/null || true
```

### Step 2: 타입 체크

```bash
pnpm --filter @repo/web check-types
```

Expected: 에러 없음

### Step 3: 커밋

```bash
git rm apps/web/src/pages/login/ui/LoginPage.tsx apps/web/src/pages/login/ui/AuthCallbackPage.tsx
git commit -m "refactor(web): remove LoginPage and AuthCallbackPage (replaced by LoginDialog)"
```

---

## Task 4: useLaunchWebAuthFlow 훅 생성

**Files:**
- Create: `apps/web/src/features/auth/model/useLaunchWebAuthFlow.ts`
- Create: `apps/web/src/features/auth/model/useLaunchWebAuthFlow.test.ts`

### Step 1: 테스트 파일 먼저 작성

`apps/web/src/features/auth/model/useLaunchWebAuthFlow.test.ts`:

```ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useLaunchWebAuthFlow } from './useLaunchWebAuthFlow';

// chrome.identity 모킹
const mockLaunchWebAuthFlow = vi.fn();
const mockGetRedirectURL = vi.fn(() => 'https://ext-id.chromiumapp.org/');

vi.stubGlobal('chrome', {
  identity: {
    launchWebAuthFlow: mockLaunchWebAuthFlow,
    getRedirectURL: mockGetRedirectURL,
  },
  runtime: { lastError: null },
});

// fetch 모킹
global.fetch = vi.fn();

// StorageContext 모킹
vi.mock('@/shared/lib/storage', () => ({
  useStorageContext: () => ({ switchToApi: vi.fn() }),
  migrateLocalToApi: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@repo/api-client', () => ({
  ApiAdapter: vi.fn(),
  setAuthToken: vi.fn(),
}));

describe('useLaunchWebAuthFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('성공 시 토큰을 저장하고 switchToApi를 호출한다', async () => {
    // chrome.identity 성공 응답
    mockLaunchWebAuthFlow.mockImplementation((_opts, cb) =>
      cb('https://ext-id.chromiumapp.org/?code=auth_code_123'),
    );

    // 백엔드 응답 모킹
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ token: 'jwt_token_abc' }),
    });

    const { result } = renderHook(() => useLaunchWebAuthFlow());

    await act(async () => {
      await result.current.launch();
    });

    expect(localStorage.getItem('auth_token')).toBe('jwt_token_abc');
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('chrome.identity 실패 시 error 상태를 설정한다', async () => {
    mockLaunchWebAuthFlow.mockImplementation((_opts, cb) => {
      Object.defineProperty(chrome.runtime, 'lastError', {
        value: { message: 'User cancelled' },
        configurable: true,
      });
      cb(undefined);
    });

    const { result } = renderHook(() => useLaunchWebAuthFlow());

    await act(async () => {
      await result.current.launch();
    });

    expect(result.current.error).toBeTruthy();
    expect(localStorage.getItem('auth_token')).toBeNull();
  });

  it('백엔드 토큰 교환 실패 시 error 상태를 설정한다', async () => {
    mockLaunchWebAuthFlow.mockImplementation((_opts, cb) =>
      cb('https://ext-id.chromiumapp.org/?code=auth_code_123'),
    );

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
    });

    const { result } = renderHook(() => useLaunchWebAuthFlow());

    await act(async () => {
      await result.current.launch();
    });

    expect(result.current.error).toBeTruthy();
  });
});
```

### Step 2: 테스트 실행 (실패 확인)

```bash
pnpm --filter @repo/web test
```

Expected: `useLaunchWebAuthFlow` 파일이 없어 FAIL

### Step 3: 훅 구현

`apps/web/src/features/auth/model/useLaunchWebAuthFlow.ts`:

```ts
import { ApiAdapter, setAuthToken } from '@repo/api-client';
import { useState } from 'react';
import { migrateLocalToApi, useStorageContext } from '@/shared/lib/storage';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

export function useLaunchWebAuthFlow() {
	const { switchToApi } = useStorageContext();
	const [isPending, setIsPending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function launch() {
		setIsPending(true);
		setError(null);

		try {
			const redirectUri = chrome.identity.getRedirectURL();
			const oauthUrl =
				'https://accounts.google.com/o/oauth2/v2/auth?' +
				`client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
				`&redirect_uri=${encodeURIComponent(redirectUri)}` +
				'&response_type=code' +
				`&scope=${encodeURIComponent('email profile')}` +
				'&access_type=offline' +
				'&prompt=consent';

			const responseUrl = await new Promise<string>((resolve, reject) => {
				chrome.identity.launchWebAuthFlow({ url: oauthUrl, interactive: true }, (url) => {
					if (chrome.runtime.lastError) {
						reject(new Error(chrome.runtime.lastError.message));
					} else if (!url) {
						reject(new Error('No response URL'));
					} else {
						resolve(url);
					}
				});
			});

			const code = new URL(responseUrl).searchParams.get('code');
			if (!code) throw new Error('No auth code in response');

			const res = await fetch(`${API_URL}/auth/google/exchange`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ code, redirectUri }),
			});

			if (!res.ok) throw new Error('Token exchange failed');

			const { token } = (await res.json()) as { token: string };
			localStorage.setItem('auth_token', token);
			setAuthToken(token);

			const apiAdapter = new ApiAdapter();
			await migrateLocalToApi(apiAdapter).catch(() => {
				// migration failure is non-fatal
			});

			switchToApi();
		} catch (e) {
			setError(e instanceof Error ? e.message : '로그인에 실패했습니다');
		} finally {
			setIsPending(false);
		}
	}

	return { launch, isPending, error };
}
```

### Step 4: 테스트 실행 (통과 확인)

```bash
pnpm --filter @repo/web test
```

Expected: 3개 테스트 모두 PASS

### Step 5: 타입 체크 및 린트

```bash
pnpm --filter @repo/web check-types
pnpm --filter @repo/web check
```

### Step 6: 커밋

```bash
git add apps/web/src/features/auth/
git commit -m "feat(web): add useLaunchWebAuthFlow hook for chrome.identity OAuth"
```

---

## Task 5: LoginDialog 생성

**Files:**
- Create: `apps/web/src/features/auth/ui/LoginDialog.tsx`

### Step 1: LoginDialog 구현

```tsx
import { Button } from '@repo/ui/components/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@repo/ui/components/dialog';
import { useLaunchWebAuthFlow } from '../model/useLaunchWebAuthFlow';

interface LoginDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
	const { launch, isPending, error } = useLaunchWebAuthFlow();

	async function handleLogin() {
		await launch();
		if (!error) onOpenChange(false);
	}

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className='sm:max-w-sm'>
				<DialogHeader>
					<DialogTitle>클라우드 동기화</DialogTitle>
					<DialogDescription>
						Google 계정으로 로그인하면 북마크를 여러 기기에서 동기화할 수 있습니다.
					</DialogDescription>
				</DialogHeader>
				<div className='flex flex-col gap-3 pt-2'>
					{error && <p className='text-sm text-destructive'>{error}</p>}
					<Button className='w-full gap-2' disabled={isPending} onClick={handleLogin}>
						<svg aria-hidden='true' className='h-4 w-4' viewBox='0 0 24 24'>
							<path
								d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
								fill='currentColor'
							/>
							<path
								d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
								fill='currentColor'
							/>
							<path
								d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
								fill='currentColor'
							/>
							<path
								d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
								fill='currentColor'
							/>
						</svg>
						{isPending ? '로그인 중...' : 'Google로 로그인'}
					</Button>
					<p className='text-center text-xs text-muted-foreground'>
						로컬 데이터는 자동으로 이전됩니다
					</p>
				</div>
			</DialogContent>
		</Dialog>
	);
}
```

### Step 2: 타입 체크 및 린트

```bash
pnpm --filter @repo/web check-types
pnpm --filter @repo/web check
```

Expected: 에러 없음

### Step 3: 커밋

```bash
git add apps/web/src/features/auth/ui/LoginDialog.tsx
git commit -m "feat(web): add LoginDialog replacing LoginPage"
```

---

## Task 6: HomePage 업데이트

**Files:**
- Modify: `apps/web/src/pages/home/ui/HomePage.tsx`

### Step 1: 다음 변경사항 적용

1. `loginOpen` 상태 추가
2. `API_URL` 상수 제거 (더 이상 사용 안 함)
3. "동기화" 버튼을 `<a>` 대신 `<Button onClick>`으로 변경
4. `LoginDialog` import 및 추가

변경 후 import 섹션:

```tsx
import type { Bookmark } from '@repo/types';
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { useState } from 'react';
import { LoginDialog } from '@/features/auth/ui/LoginDialog';
import { BookmarkCreateDialog } from '@/features/bookmark-create/ui/BookmarkCreateDialog';
import { BookmarkEditDialog } from '@/features/bookmark-edit/ui/BookmarkEditDialog';
import { useStorageContext } from '@/shared/lib/storage';
import { BookmarkList, type ViewMode } from '@/widgets/bookmark-list/ui/BookmarkList';
import { TagSidebar } from '@/widgets/tag-sidebar/ui/TagSidebar';
```

변경 후 상태 선언:

```tsx
const { mode, logout } = useStorageContext();
const [selectedTagId, setSelectedTagId] = useState<string | undefined>();
const [search, setSearch] = useState('');
const [createOpen, setCreateOpen] = useState(false);
const [editTarget, setEditTarget] = useState<Bookmark | null>(null);
const [viewMode, setViewMode] = useState<ViewMode>('grid');
const [loginOpen, setLoginOpen] = useState(false);
```

변경 후 동기화/로그아웃 버튼 (기존 `<Button asChild>` → `<Button onClick>`):

```tsx
{mode === 'local' ? (
  <Button onClick={() => setLoginOpen(true)} size='sm' variant='outline'>
    동기화
  </Button>
) : (
  <Button onClick={logout} size='sm' variant='ghost'>
    로그아웃
  </Button>
)}
```

변경 후 JSX 최하단 (`BookmarkEditDialog` 아래):

```tsx
<LoginDialog onOpenChange={setLoginOpen} open={loginOpen} />
```

### Step 2: 타입 체크 및 린트

```bash
pnpm --filter @repo/web check-types
pnpm --filter @repo/web check
```

Expected: 에러 없음

### Step 3: 커밋

```bash
git add apps/web/src/pages/home/ui/HomePage.tsx
git commit -m "feat(web): integrate LoginDialog into HomePage, remove sync link"
```

---

## Task 7: 환경 변수 설정

**Files:**
- Create: `apps/web/.env.example`
- Create: `apps/api/.env.example` (있으면 업데이트)

### Step 1: apps/web/.env.example 생성

```bash
VITE_API_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### Step 2: 로컬 .env 생성

```bash
cp apps/web/.env.example apps/web/.env
# VITE_GOOGLE_CLIENT_ID 값을 실제 클라이언트 ID로 채움
```

### Step 3: .gitignore 확인

```bash
grep '.env' .gitignore
```

`.env` (not `.env.example`)가 gitignore에 포함되어 있는지 확인. 없으면 추가.

### Step 4: 커밋

```bash
git add apps/web/.env.example
git commit -m "chore(web): add .env.example with VITE_GOOGLE_CLIENT_ID"
```

---

## Task 8: 전체 빌드 검증

### Step 1: 전체 lint + 타입 체크

```bash
pnpm check
pnpm check-types
```

Expected: 모든 패키지 통과

### Step 2: Extension 빌드 실행

```bash
pnpm build
```

Expected:
- `@repo/web#build:ext` 먼저 완료
- `@repo/extension#build` 완료 + `[copy-newtab] web 빌드 결과물을 dist/newtab/ 에 복사 완료` 출력

### Step 3: 빌드 결과 구조 확인

```bash
ls apps/extension/dist/
# 출력: assets  manifest.json  newtab  popup.html

cat apps/extension/dist/manifest.json | grep newtab
# 출력: "newtab": "newtab/index.html"

cat apps/extension/dist/newtab/index.html | grep assets
# 출력: src="./assets/..." (상대 경로 확인)
```

### Step 4: Extension 로드 테스트

1. Chrome에서 `chrome://extensions/` 열기
2. 개발자 모드 활성화
3. "압축해제된 확장 프로그램을 로드합니다" → `apps/extension/dist/` 선택
4. 새 탭 열기 → 북마크 앱 UI 표시 확인
5. "동기화" 버튼 클릭 → LoginDialog 표시 확인

### Step 5: 최종 커밋 (필요 시)

변경사항이 있으면 커밋.

---

## 외부 조건 (개발자가 별도 처리 필요)

| 항목 | 설명 |
|---|---|
| Google Cloud Console | `https://<ext-id>.chromiumapp.org/` redirect URI 등록 |
| `.env` 파일 | `VITE_GOOGLE_CLIENT_ID`에 실제 클라이언트 ID 입력 |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | 백엔드 `.env`에 이미 설정되어 있어야 함 |

Extension ID 확인: Chrome 확장 로드 후 `chrome://extensions/`에서 확인 가능
