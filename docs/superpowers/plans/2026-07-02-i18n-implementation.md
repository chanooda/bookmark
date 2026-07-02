# i18n (한국어/영어/중국어/일본어) 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `mark.` Chrome 새 탭 확장의 React UI 텍스트를 `react-i18next`로 국제화하고, 브라우저 언어 자동 감지 + 헤더의 설정 모달을 통한 수동 언어 전환(ko/en/ja/zh-CN)을 제공한다.

**Architecture:** `react-i18next` + `i18next-browser-languagedetector`를 `src/shared/i18n`에 초기화하고, FSD의 각 UI 컴포넌트에서 `useTranslation()` 훅으로 번역 키를 사용한다. 언어 선택 상태는 `i18next-browser-languagedetector`가 자체적으로 `localStorage`에 캐싱하므로 별도 스토어를 두지 않는다. 새 `src/features/settings` 슬라이스에 언어 전환 UI(설정 모달)를 만들고 헤더에 진입점(gear 아이콘)을 추가한다.

**Tech Stack:** React 19, Vite, TypeScript, `react-i18next` ^17, `i18next` ^26, `i18next-browser-languagedetector` ^8, Biome(포맷/린트), pnpm.

## Global Constraints

- 지원 언어 코드는 정확히 `ko`, `en`, `ja`, `zh-CN` 4개다.
- 언어 감지 순서: `localStorage` → `navigator.language` → fallback `en`. 사용자가 설정 모달에서 언어를 선택하면 `localStorage`에 자동 저장되어 다음 실행에도 유지된다.
- 리소스 파일 위치는 `src/shared/i18n/locales/{en,ko,ja,zh-CN}.json`, 초기화 코드는 `src/shared/i18n/index.ts`.
- 이 프로젝트에는 테스트 러너가 없다(`package.json`에 `test` 스크립트 없음, vitest/jest 미설치). 각 작업의 검증은 `pnpm check-types`(tsc --noEmit)와 `pnpm check`(biome, 자동 포맷/수정)로 하고, 마지막 작업에서 개발 서버로 4개 언어를 수동 확인한다.
- 코드 스타일은 기존 코드와 동일하게 유지한다: 탭 들여쓰기, 작은따옴표, 세미콜론 사용. `pnpm check`가 최종적으로 포맷을 맞춰준다.
- 목(mock) 데이터(`src/shared/api/bookmark.query.ts`)와 `src/shared/libs/chrome.ts`의 내부 가드 에러 메시지는 번역 대상에서 제외한다(설계 문서 참고: `docs/superpowers/specs/2026-07-02-i18n-design.md`).
- 코드 주석 속 한국어(예: `explorer-content.tsx`의 `// biome-ignore ... 스켈레톤`)는 번역 대상이 아니다. 이는 사용자에게 노출되지 않는 개발자용 주석이다.

---

### Task 1: 의존성 설치 + i18n 초기화 + 번역 리소스 생성

**Files:**
- Modify: `package.json` (의존성 3개 추가 — `pnpm add`로 처리)
- Create: `src/shared/i18n/locales/ko.json`
- Create: `src/shared/i18n/locales/en.json`
- Create: `src/shared/i18n/locales/ja.json`
- Create: `src/shared/i18n/locales/zh-CN.json`
- Create: `src/shared/i18n/index.ts`
- Modify: `src/main.tsx`

**Interfaces:**
- Consumes: 없음 (최초 작업)
- Produces: `src/shared/i18n/index.ts`가 `default export`로 초기화된 `i18next` 인스턴스를 내보내고, `SUPPORTED_LANGUAGES: readonly ['ko', 'en', 'ja', 'zh-CN']`를 named export한다. `main.tsx`에서 이 모듈을 side-effect import하여 앱 렌더링 전에 `i18next.init()`이 실행되도록 한다. 이후 모든 작업은 `react-i18next`의 `useTranslation()` 훅과 아래에 정의된 번역 키(`common.*`, `header.*`, `search.*`, `app.*`, `bookmark.*`, `folder.*`, `explorer.*`, `bookmarkForm.*`, `folderForm.*`, `itemForm.*`, `settings.*`)를 사용한다.

- [ ] **Step 1: 의존성 설치**

```bash
pnpm add react-i18next@^17.0.8 i18next@^26.3.4 i18next-browser-languagedetector@^8.2.1
```

Expected: `package.json`의 `dependencies`에 세 패키지가 추가되고 `pnpm-lock.yaml`이 갱신된다. 종료 코드 0.

- [ ] **Step 2: 한국어 번역 리소스 작성**

`src/shared/i18n/locales/ko.json` 생성:

```json
{
	"common": {
		"cancel": "취소",
		"save": "저장",
		"add": "추가",
		"delete": "삭제",
		"edit": "수정",
		"rename": "이름 변경",
		"more": "더보기",
		"bookmark": "북마크",
		"folder": "폴더"
	},
	"header": {
		"toggleTheme": "테마 변경",
		"addBookmark": "북마크 추가"
	},
	"search": {
		"bookmarkLabel": "북마크",
		"bookmarkAriaLabel": "북마크 검색",
		"bookmarkPlaceholder": "북마크 검색...",
		"clearAriaLabel": "검색어 초기화",
		"googleAriaLabel": "구글 검색",
		"googleInputAriaLabel": "구글 검색창",
		"googlePlaceholder": "검색어 또는 URL 입력...",
		"submitTitle": "검색 버튼"
	},
	"app": {
		"noSearchResults": "'<query>{{query}}</query>'에 대한 검색 결과가 없습니다."
	},
	"bookmark": {
		"deleteConfirmTitle": "북마크 삭제",
		"deleteConfirmDescription": "\"{{title}}\" 북마크가 삭제됩니다. 이 작업은 되돌릴 수 없습니다."
	},
	"folder": {
		"deleteConfirmTitle": "폴더 삭제",
		"deleteConfirmDescription": "\"{{title}}\" 폴더와 모든 항목이 삭제됩니다. 이 작업은 되돌릴 수 없습니다.",
		"itemCount_other": "{{count}}개 항목",
		"empty": "비어 있음"
	},
	"explorer": {
		"closeSidebarAriaLabel": "사이드바 닫기",
		"folderDialogLabel": "폴더 - {{title}}",
		"emptyFolder": "비어 있는 폴더입니다",
		"foldersLabel": "폴더"
	},
	"bookmarkForm": {
		"urlPlaceholder": "URL (https://...)",
		"namePlaceholder": "이름",
		"editTitle": "북마크 수정"
	},
	"folderForm": {
		"namePlaceholder": "폴더 이름",
		"editTitle": "폴더 이름 수정"
	},
	"itemForm": {
		"addBookmarkTitle": "새 북마크 추가",
		"addFolderTitle": "새 폴더 만들기",
		"createFolderSubmit": "만들기"
	},
	"settings": {
		"title": "설정",
		"language": "언어"
	}
}
```

- [ ] **Step 3: 영어 번역 리소스 작성**

`src/shared/i18n/locales/en.json` 생성:

```json
{
	"common": {
		"cancel": "Cancel",
		"save": "Save",
		"add": "Add",
		"delete": "Delete",
		"edit": "Edit",
		"rename": "Rename",
		"more": "More",
		"bookmark": "Bookmark",
		"folder": "Folder"
	},
	"header": {
		"toggleTheme": "Toggle theme",
		"addBookmark": "Add Bookmark"
	},
	"search": {
		"bookmarkLabel": "Bookmark",
		"bookmarkAriaLabel": "Search bookmarks",
		"bookmarkPlaceholder": "Search bookmarks...",
		"clearAriaLabel": "Clear search",
		"googleAriaLabel": "Google search",
		"googleInputAriaLabel": "Google search box",
		"googlePlaceholder": "Enter a search term or URL...",
		"submitTitle": "Search"
	},
	"app": {
		"noSearchResults": "No results found for '<query>{{query}}</query>'."
	},
	"bookmark": {
		"deleteConfirmTitle": "Delete bookmark",
		"deleteConfirmDescription": "\"{{title}}\" will be deleted. This action cannot be undone."
	},
	"folder": {
		"deleteConfirmTitle": "Delete folder",
		"deleteConfirmDescription": "\"{{title}}\" and everything in it will be deleted. This action cannot be undone.",
		"itemCount_one": "{{count}} item",
		"itemCount_other": "{{count}} items",
		"empty": "Empty"
	},
	"explorer": {
		"closeSidebarAriaLabel": "Close sidebar",
		"folderDialogLabel": "Folder - {{title}}",
		"emptyFolder": "This folder is empty",
		"foldersLabel": "Folders"
	},
	"bookmarkForm": {
		"urlPlaceholder": "URL (https://...)",
		"namePlaceholder": "Name",
		"editTitle": "Edit bookmark"
	},
	"folderForm": {
		"namePlaceholder": "Folder name",
		"editTitle": "Edit folder name"
	},
	"itemForm": {
		"addBookmarkTitle": "Add new bookmark",
		"addFolderTitle": "Create new folder",
		"createFolderSubmit": "Create"
	},
	"settings": {
		"title": "Settings",
		"language": "Language"
	}
}
```

- [ ] **Step 4: 일본어 번역 리소스 작성**

`src/shared/i18n/locales/ja.json` 생성:

```json
{
	"common": {
		"cancel": "キャンセル",
		"save": "保存",
		"add": "追加",
		"delete": "削除",
		"edit": "編集",
		"rename": "名前を変更",
		"more": "その他",
		"bookmark": "ブックマーク",
		"folder": "フォルダ"
	},
	"header": {
		"toggleTheme": "テーマを切り替え",
		"addBookmark": "ブックマークを追加"
	},
	"search": {
		"bookmarkLabel": "ブックマーク",
		"bookmarkAriaLabel": "ブックマークを検索",
		"bookmarkPlaceholder": "ブックマークを検索...",
		"clearAriaLabel": "検索語をクリア",
		"googleAriaLabel": "Google検索",
		"googleInputAriaLabel": "Google検索ボックス",
		"googlePlaceholder": "検索語またはURLを入力...",
		"submitTitle": "検索"
	},
	"app": {
		"noSearchResults": "「<query>{{query}}</query>」の検索結果はありません。"
	},
	"bookmark": {
		"deleteConfirmTitle": "ブックマークを削除",
		"deleteConfirmDescription": "「{{title}}」ブックマークが削除されます。この操作は元に戻せません。"
	},
	"folder": {
		"deleteConfirmTitle": "フォルダを削除",
		"deleteConfirmDescription": "「{{title}}」フォルダとすべての項目が削除されます。この操作は元に戻せません。",
		"itemCount_other": "{{count}}個の項目",
		"empty": "空です"
	},
	"explorer": {
		"closeSidebarAriaLabel": "サイドバーを閉じる",
		"folderDialogLabel": "フォルダ - {{title}}",
		"emptyFolder": "空のフォルダです",
		"foldersLabel": "フォルダ"
	},
	"bookmarkForm": {
		"urlPlaceholder": "URL (https://...)",
		"namePlaceholder": "名前",
		"editTitle": "ブックマークを編集"
	},
	"folderForm": {
		"namePlaceholder": "フォルダ名",
		"editTitle": "フォルダ名を編集"
	},
	"itemForm": {
		"addBookmarkTitle": "新しいブックマークを追加",
		"addFolderTitle": "新しいフォルダを作成",
		"createFolderSubmit": "作成"
	},
	"settings": {
		"title": "設定",
		"language": "言語"
	}
}
```

- [ ] **Step 5: 중국어(간체) 번역 리소스 작성**

`src/shared/i18n/locales/zh-CN.json` 생성:

```json
{
	"common": {
		"cancel": "取消",
		"save": "保存",
		"add": "添加",
		"delete": "删除",
		"edit": "编辑",
		"rename": "重命名",
		"more": "更多",
		"bookmark": "书签",
		"folder": "文件夹"
	},
	"header": {
		"toggleTheme": "切换主题",
		"addBookmark": "添加书签"
	},
	"search": {
		"bookmarkLabel": "书签",
		"bookmarkAriaLabel": "搜索书签",
		"bookmarkPlaceholder": "搜索书签...",
		"clearAriaLabel": "清除搜索",
		"googleAriaLabel": "谷歌搜索",
		"googleInputAriaLabel": "谷歌搜索框",
		"googlePlaceholder": "输入搜索词或网址...",
		"submitTitle": "搜索"
	},
	"app": {
		"noSearchResults": "未找到与“<query>{{query}}</query>”相关的搜索结果。"
	},
	"bookmark": {
		"deleteConfirmTitle": "删除书签",
		"deleteConfirmDescription": "“{{title}}”书签将被删除。此操作无法撤销。"
	},
	"folder": {
		"deleteConfirmTitle": "删除文件夹",
		"deleteConfirmDescription": "“{{title}}”文件夹及其所有内容将被删除。此操作无法撤销。",
		"itemCount_other": "{{count}} 个项目",
		"empty": "空文件夹"
	},
	"explorer": {
		"closeSidebarAriaLabel": "关闭侧边栏",
		"folderDialogLabel": "文件夹 - {{title}}",
		"emptyFolder": "这是一个空文件夹",
		"foldersLabel": "文件夹"
	},
	"bookmarkForm": {
		"urlPlaceholder": "URL (https://...)",
		"namePlaceholder": "名称",
		"editTitle": "编辑书签"
	},
	"folderForm": {
		"namePlaceholder": "文件夹名称",
		"editTitle": "编辑文件夹名称"
	},
	"itemForm": {
		"addBookmarkTitle": "添加新书签",
		"addFolderTitle": "创建新文件夹",
		"createFolderSubmit": "创建"
	},
	"settings": {
		"title": "设置",
		"language": "语言"
	}
}
```

Note: 중국어 따옴표(`"`/`"`)는 이스케이프 문제를 피하기 위해 `“`/`”` 유니코드 이스케이프로 작성했다 (렌더링 결과는 동일하게 " " 문자로 표시된다).

- [ ] **Step 6: i18next 초기화 파일 작성**

`src/shared/i18n/index.ts` 생성:

```ts
import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import zhCN from './locales/zh-CN.json';

export const SUPPORTED_LANGUAGES = ['ko', 'en', 'ja', 'zh-CN'] as const;

i18n
	.use(LanguageDetector)
	.use(initReactI18next)
	.init({
		resources: {
			ko: { translation: ko },
			en: { translation: en },
			ja: { translation: ja },
			'zh-CN': { translation: zhCN },
		},
		fallbackLng: 'en',
		supportedLngs: SUPPORTED_LANGUAGES,
		nonExplicitSupportedLngs: true,
		interpolation: {
			escapeValue: false,
		},
		detection: {
			order: ['localStorage', 'navigator'],
			caches: ['localStorage'],
			lookupLocalStorage: 'i18nextLng',
		},
	});

export default i18n;
```

- [ ] **Step 7: `main.tsx`에 i18n 초기화 연결**

`src/main.tsx`를 아래 내용으로 교체:

```tsx
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import './shared/i18n';
import { QueryProvider } from './app/query-provider';
import { ThemeProvider } from './shared/libs/theme';

createRoot(document.getElementById('root')!).render(
	<ThemeProvider>
		<QueryProvider>
			<App />
		</QueryProvider>
	</ThemeProvider>,
);
```

- [ ] **Step 8: 검증**

```bash
pnpm check-types
pnpm check
```

Expected: 두 명령 모두 종료 코드 0. (`pnpm check`는 포맷을 자동 정리할 수 있음)

```bash
pnpm dev
```

브라우저에서 `http://localhost:5173`(또는 출력된 포트)을 열어 페이지가 정상 렌더링되는지 확인 (기존과 동일하게 한국어로 보여야 함 — 아직 컴포넌트들을 번역하지 않았으므로 텍스트는 그대로 한국어). 콘솔에 i18next 관련 에러가 없는지 확인 후 서버 종료.

- [ ] **Step 9: 커밋**

```bash
git add package.json pnpm-lock.yaml src/shared/i18n src/main.tsx
git commit -m "$(cat <<'EOF'
feat: initialize react-i18next with ko/en/ja/zh-CN resources

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: `App.tsx` + `widgets/search` 번역 적용

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/widgets/search/ui/search.tsx`

**Interfaces:**
- Consumes: Task 1의 `src/shared/i18n`(전역 초기화됨), 번역 키 `app.noSearchResults`(interpolation: `query`, 안에 `<query>` 태그 포함), `search.bookmarkLabel`, `search.bookmarkAriaLabel`, `search.bookmarkPlaceholder`, `search.clearAriaLabel`, `search.googleAriaLabel`, `search.googleInputAriaLabel`, `search.googlePlaceholder`, `search.submitTitle`
- Produces: 없음 (리프 컴포넌트)

- [ ] **Step 1: `App.tsx` 수정**

`src/App.tsx`를 아래 내용으로 교체 (검색 결과 없음 문구를 `Trans` 컴포넌트로 렌더링하여 `{search}` 부분의 볼드 스타일을 언어별로 유지):

```tsx
import { useQuery } from '@tanstack/react-query';
import { SearchX } from 'lucide-react';
import { overlay } from 'overlay-kit';
import { useMemo } from 'react';
import { Trans } from 'react-i18next';
import { BookmarkCard, useFilterStore } from './features/bookmark';
import { Explorer } from './features/explorer';
import { FolderCard } from './features/folder';
import { TopGridLayout } from './features/views';
import { queries } from './shared/api';
import { useTheme } from './shared/libs/theme';
import { Dialog } from './shared/shadcn/components/ui/dialog';
import { Header } from './widgets/header';
import { Search } from './widgets/search';

const DARK_GRADIENT =
	'radial-gradient(ellipse at 18% 28%, rgba(230,100,40,0.55) 0%, transparent 52%), radial-gradient(ellipse at 82% 12%, rgba(100,80,230,0.48) 0%, transparent 50%), radial-gradient(ellipse at 52% 88%, rgba(30,110,210,0.50) 0%, transparent 55%), radial-gradient(ellipse at 88% 68%, rgba(220,40,80,0.42) 0%, transparent 48%), radial-gradient(ellipse at 40% 55%, rgba(60,180,160,0.28) 0%, transparent 45%)';

const LIGHT_GRADIENT =
	'radial-gradient(ellipse at 18% 28%, rgba(255,160,100,0.30) 0%, transparent 52%), radial-gradient(ellipse at 82% 12%, rgba(150,130,255,0.25) 0%, transparent 50%), radial-gradient(ellipse at 52% 88%, rgba(100,170,255,0.28) 0%, transparent 55%), radial-gradient(ellipse at 88% 68%, rgba(255,120,150,0.22) 0%, transparent 48%), radial-gradient(ellipse at 40% 55%, rgba(80,210,190,0.18) 0%, transparent 45%)';

export default function App() {
	const { theme } = useTheme();
	const isDark =
		theme === 'dark' ||
		(theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

	const { data } = useQuery({
		...queries.bookmarks.all,
	});
	const search = useFilterStore((s) => s.search ?? '');

	const displayItems = useMemo(() => {
		if (!data) return [];
		const q = search.trim().toLowerCase();
		if (!q) return data.tree;
		return data.flat.filter(
			(b) => b.title.toLowerCase().includes(q) || b.url?.toLowerCase().includes(q),
		);
	}, [data, search]);

	return (
		<main className='bg-background'>
			<div className='relative z-10 flex h-dvh w-dvw flex-col overflow-hidden'>
				<Header />
				<div className='z-20 h-full w-full overflow-auto p-6'>
					<Search />
					{displayItems.length === 0 && search.trim() ? (
						<div className='flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground'>
							<SearchX className='h-10 w-10 opacity-30' />
							<p className='text-sm'>
								<Trans
									components={{ query: <span className='font-medium text-foreground/60' /> }}
									i18nKey='app.noSearchResults'
									values={{ query: search }}
								/>
							</p>
						</div>
					) : (
						<TopGridLayout>
							{displayItems.map((bookmark, idx) => {
								if (!bookmark.children) {
									return <BookmarkCard bookmark={bookmark} index={idx} key={bookmark.id} />;
								}
								return (
									<FolderCard
										bookmark={bookmark}
										index={idx}
										key={bookmark.id}
										onClick={() => {
											overlay.open(({ isOpen, close, unmount }) => (
												<Dialog
													onOpenChange={(isOpen) => {
														if (!isOpen) {
															close();
															unmount();
														}
													}}
													open={isOpen}
												>
													<Explorer id={bookmark.id} />
												</Dialog>
											));
										}}
									/>
								);
							})}
						</TopGridLayout>
					)}
				</div>
				<div
					className='absolute inset-0 -z-10'
					style={{ background: isDark ? DARK_GRADIENT : LIGHT_GRADIENT }}
				/>
			</div>
		</main>
	);
}
```

- [ ] **Step 2: `search.tsx` 수정**

`src/widgets/search/ui/search.tsx`를 아래 내용으로 교체:

```tsx
import { debounce } from '@chanooda/libs';
import { ArrowRight, Bookmark, X } from 'lucide-react';
import { type ChangeEvent, type FormEvent, useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFilterStore } from '@/features/bookmark';
import { GoogleIcon } from '@/shared/assets';

export const Search = () => {
	const { t } = useTranslation();
	const setSearch = useFilterStore((store) => store.setSearch);
	const [inputValue, setInputValue] = useState('');
	const [googleQuery, setGoogleQuery] = useState('');
	const inputRef = useRef<HTMLInputElement>(null);

	const debouncedSetSearch = useCallback(
		debounce((value: string) => setSearch(value), 500),
		[],
	);

	const handleChangeBookmarkInput = (e: ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setInputValue(value);
		debouncedSetSearch(value);
	};

	const handleGoogleSearch = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!googleQuery.trim()) return;
		location.href = `https://www.google.com/search?q=${encodeURIComponent(googleQuery)}`;
	};

	const handleClear = () => {
		setInputValue('');
		setSearch('');
		if (inputRef.current) inputRef.current.focus();
	};

	return (
		<header className='mb-6 flex w-full items-end'>
			<div className='flex w-full gap-4'>
				<div className='group/bm flex flex-1 items-center overflow-hidden rounded-xl border border-border/50 bg-card/70 shadow-sm backdrop-blur-sm transition-all duration-200 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10'>
					{/* Label badge */}
					<div className='flex shrink-0 items-center gap-1.5 border-border/40 border-r px-3.5 py-3 transition-colors duration-200 group-focus-within/bm:border-primary/25'>
						<Bookmark
							aria-hidden='true'
							className='h-3.5 w-3.5 shrink-0 text-primary/55 transition-colors duration-200 group-focus-within/bm:text-primary/85'
							fill='currentColor'
						/>
						<span className='font-label text-[9px] text-primary/50 uppercase tracking-[0.13em] transition-colors duration-200 group-focus-within/bm:text-primary/80'>
							{t('search.bookmarkLabel')}
						</span>
					</div>
					{/* Input */}
					<input
						aria-label={t('search.bookmarkAriaLabel')}
						className='h-11 flex-1 bg-transparent px-3.5 text-foreground text-sm outline-none placeholder:text-muted-foreground/35'
						onChange={handleChangeBookmarkInput}
						placeholder={t('search.bookmarkPlaceholder')}
						ref={inputRef}
						value={inputValue}
					/>
					{/* Clear button — appears when there's text */}
					{inputValue && (
						<button
							aria-label={t('search.clearAriaLabel')}
							className='mr-3 flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground/35 transition-colors duration-150 hover:text-foreground/60'
							onClick={handleClear}
							type='button'
						>
							<X aria-hidden='true' className='h-3 w-3' />
						</button>
					)}
				</div>
				<form
					className='group/gl flex flex-1 items-center overflow-hidden rounded-xl border border-border/50 bg-card/70 shadow-sm backdrop-blur-sm transition-all duration-200 focus-within:border-blue-400/40 focus-within:ring-2 focus-within:ring-blue-400/10'
					onSubmit={handleGoogleSearch}
				>
					{/* Label badge — clickable link to google.com */}
					<a
						aria-label={t('search.googleAriaLabel')}
						className='flex shrink-0 items-center gap-1.5 border-border/40 border-r px-3.5 py-3 transition-all duration-200 hover:bg-blue-500/5 group-focus-within/gl:border-blue-400/25'
						href='https://www.google.com'
						title={t('search.googleAriaLabel')}
					>
						<GoogleIcon />
						<span className='font-label text-[9px] text-blue-400/50 uppercase tracking-[0.13em] transition-colors duration-200 group-focus-within/gl:text-blue-400/85'>
							Google
						</span>
					</a>
					{/* Input */}
					<input
						aria-label={t('search.googleInputAriaLabel')}
						className='h-11 flex-1 bg-transparent px-3.5 text-foreground text-sm outline-none placeholder:text-muted-foreground/35'
						onChange={(e) => setGoogleQuery(e.target.value)}
						onFocus={(e) => e.target.select()}
						placeholder={t('search.googlePlaceholder')}
						value={googleQuery}
					/>
					{/* Submit button */}
					<button
						className='mr-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground/25 transition-all duration-200 hover:bg-blue-500/12 hover:text-blue-400 group-focus-within/gl:bg-blue-500/8 group-focus-within/gl:text-blue-400/70'
						title={t('search.submitTitle')}
						type='submit'
					>
						<ArrowRight aria-hidden='true' className='h-3.5 w-3.5' />
					</button>
				</form>
			</div>
		</header>
	);
};
```

- [ ] **Step 3: 검증**

```bash
pnpm check-types
pnpm check
grep -nP '[\x{AC00}-\x{D7A3}]' src/App.tsx src/widgets/search/ui/search.tsx
```

Expected: `check-types`/`check` 종료 코드 0. `grep`은 매치 없음(exit code 1)이어야 한다 — 두 파일에서 하드코딩된 한국어 텍스트가 모두 제거되었음을 의미.

- [ ] **Step 4: 커밋**

```bash
git add src/App.tsx src/widgets/search/ui/search.tsx
git commit -m "$(cat <<'EOF'
feat: translate App and search widget UI text

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: 설정(Settings) 기능 슬라이스 신규 생성

**Files:**
- Create: `src/features/settings/ui/settings-dialog.tsx`
- Create: `src/features/settings/index.ts`

**Interfaces:**
- Consumes: Task 1의 `react-i18next`(`useTranslation`), 번역 키 `settings.title`, `settings.language`. `@/shared/shadcn/components/ui/dialog`의 `Dialog`/`DialogContent`/`DialogHeader`/`DialogTitle`, `@/shared/shadcn/components/ui/select`의 `Select`/`SelectContent`/`SelectItem`/`SelectTrigger`/`SelectValue` (기존 컴포넌트, 이번 작업에서 신규 생성하지 않음).
- Produces: `SettingsDialog` 컴포넌트 — props `{ close: () => void; isOpen: boolean; unmount: () => void }`. `src/features/settings/index.ts`에서 `export * from './ui/settings-dialog'`로 재노출되어 Task 4의 `header.tsx`에서 `import { SettingsDialog } from '@/features/settings'`로 사용한다.

- [ ] **Step 1: 설정 모달 컴포넌트 작성**

`src/features/settings/ui/settings-dialog.tsx` 생성:

```tsx
import { useTranslation } from 'react-i18next';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/shared/shadcn/components/ui/dialog';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/shared/shadcn/components/ui/select';

const LANGUAGE_OPTIONS = [
	{ code: 'ko', label: '한국어' },
	{ code: 'en', label: 'English' },
	{ code: 'ja', label: '日本語' },
	{ code: 'zh-CN', label: '中文' },
] as const;

interface SettingsDialogProps {
	close: () => void;
	isOpen: boolean;
	unmount: () => void;
}

export const SettingsDialog = ({ isOpen, close, unmount }: SettingsDialogProps) => {
	const { t, i18n } = useTranslation();

	const handleClose = () => {
		close();
		unmount();
	};

	return (
		<Dialog onOpenChange={(open) => !open && handleClose()} open={isOpen}>
			<DialogContent showCloseButton={false}>
				<DialogHeader>
					<DialogTitle>{t('settings.title')}</DialogTitle>
				</DialogHeader>
				<div className='flex items-center justify-between py-2'>
					<span className='text-sm'>{t('settings.language')}</span>
					<Select
						onValueChange={(value) => i18n.changeLanguage(value)}
						value={i18n.resolvedLanguage}
					>
						<SelectTrigger className='w-36'>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{LANGUAGE_OPTIONS.map((option) => (
								<SelectItem key={option.code} value={option.code}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</DialogContent>
		</Dialog>
	);
};
```

- [ ] **Step 2: index 배럴 파일 작성**

`src/features/settings/index.ts` 생성:

```ts
export * from './ui/settings-dialog';
```

- [ ] **Step 3: 검증**

```bash
pnpm check-types
pnpm check
```

Expected: 종료 코드 0. (아직 어디에서도 import하지 않으므로 미사용 경고는 없어야 하며, `settings-dialog.tsx`는 named export이므로 unused-export 린트 규칙이 없는 한 문제 없음)

- [ ] **Step 4: 커밋**

```bash
git add src/features/settings
git commit -m "$(cat <<'EOF'
feat: add settings feature with language switcher dialog

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: 헤더에 번역 적용 + 설정 버튼 연결

**Files:**
- Modify: `src/widgets/header/ui/header.tsx`

**Interfaces:**
- Consumes: Task 1의 `useTranslation`, 번역 키 `header.toggleTheme`, `header.addBookmark`, `settings.title`. Task 3의 `SettingsDialog`(`@/features/settings`).
- Produces: 없음 (최상위 위젯)

- [ ] **Step 1: `header.tsx` 수정**

`src/widgets/header/ui/header.tsx`를 아래 내용으로 교체 (테마 토글 버튼 옆에 설정 gear 버튼 추가):

```tsx
import { Bookmark, Moon, Plus, Settings, Sun } from 'lucide-react';
import { overlay } from 'overlay-kit';
import { useTranslation } from 'react-i18next';
import { SettingsDialog } from '@/features/settings';
import { BOOKMARK_ROOT_ID } from '@/shared/config';
import { useTheme } from '@/shared/libs/theme';
import { Button } from '@/shared/shadcn/components/ui/button';
import { ItemFormDialog } from '@/shared/ui/item-form-dialog';

export const Header = () => {
	const { t } = useTranslation();
	const { theme, setTheme } = useTheme();

	const handleClickAddBookmarkBtn = () => {
		overlay.open(({ isOpen, close, unmount }) => (
			<ItemFormDialog
				close={close}
				defaultTab='bookmark'
				isOpen={isOpen}
				parentId={String(BOOKMARK_ROOT_ID)}
				unmount={unmount}
			/>
		));
	};

	const handleClickSettingsBtn = () => {
		overlay.open(({ isOpen, close, unmount }) => (
			<SettingsDialog close={close} isOpen={isOpen} unmount={unmount} />
		));
	};

	const isDark =
		theme === 'dark' ||
		(theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

	const toggleTheme = () => {
		setTheme(isDark ? 'light' : 'dark');
	};

	return (
		<div className='w-full bg-background px-6 py-4'>
			<div className='flex w-full justify-between'>
				<div className='flex items-center gap-2'>
					<div className='flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/25 ring-inset'>
						<Bookmark
							aria-hidden='true'
							className='h-3.5 w-3.5 text-primary'
							fill='currentColor'
							onClick={handleClickAddBookmarkBtn}
						/>
					</div>
					<span className='font-brand font-semibold text-[1.15rem] text-foreground/90 leading-none tracking-tight'>
						mark.
					</span>
				</div>

				<div className='flex items-center gap-2'>
					<Button
						aria-label={t('settings.title')}
						onClick={handleClickSettingsBtn}
						size='icon'
						type='button'
						variant='ghost'
					>
						<Settings aria-hidden='true' className='h-4 w-4' />
					</Button>
					<Button
						aria-label={t('header.toggleTheme')}
						onClick={toggleTheme}
						size='icon'
						type='button'
						variant='ghost'
					>
						{isDark ? (
							<Sun aria-hidden='true' className='h-4 w-4' />
						) : (
							<Moon aria-hidden='true' className='h-4 w-4' />
						)}
					</Button>
					<Button
						className='h-10 rounded-lg font-medium text-xs'
						onClick={handleClickAddBookmarkBtn}
						size='sm'
						type='button'
					>
						<Plus aria-hidden='true' className='mr-1 h-3 w-3' /> {t('header.addBookmark')}
					</Button>
				</div>
			</div>
		</div>
	);
};
```

- [ ] **Step 2: 검증**

```bash
pnpm check-types
pnpm check
grep -nP '[\x{AC00}-\x{D7A3}]' src/widgets/header/ui/header.tsx
```

Expected: `check-types`/`check` 종료 코드 0, `grep` 매치 없음.

```bash
pnpm dev
```

브라우저에서 헤더 우측에 gear 아이콘 버튼이 테마 토글 버튼 왼쪽에 나타나는지 확인하고, 클릭 시 설정 모달이 열리는지, 언어 Select에서 4개 언어가 모두 나오는지, 선택 시 헤더의 "북마크 추가" 버튼 텍스트가 즉시 바뀌는지 확인. 확인 후 서버 종료.

- [ ] **Step 3: 커밋**

```bash
git add src/widgets/header/ui/header.tsx
git commit -m "$(cat <<'EOF'
feat: wire settings dialog into header and translate header text

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: `features/bookmark`, `features/folder` 카드 번역 적용

**Files:**
- Modify: `src/features/bookmark/ui/bookmark-card.tsx`
- Modify: `src/features/folder/ui/folder-card.tsx`

**Interfaces:**
- Consumes: Task 1의 `useTranslation`, 번역 키 `common.edit`, `common.delete`, `common.more`, `common.rename`, `bookmark.deleteConfirmTitle`, `bookmark.deleteConfirmDescription`(interpolation: `title`), `folder.deleteConfirmTitle`, `folder.deleteConfirmDescription`(interpolation: `title`). 기존 `DeleteConfirmDialog`(`@/shared/ui/delete-confirm-dialog`)의 `title`/`description` string prop.
- Produces: 없음

- [ ] **Step 1: `bookmark-card.tsx` 수정**

`src/features/bookmark/ui/bookmark-card.tsx`를 아래 내용으로 교체:

```tsx
import { PointerSensor } from '@dnd-kit/react';
import { useSortable } from '@dnd-kit/react/sortable';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { GlobeIcon, SquarePen, Trash2 } from 'lucide-react';
import { overlay } from 'overlay-kit';
import { type MouseEvent, memo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Bookmark, Tag } from '@/entities/bookmark';
import { mutations, queries } from '@/shared/api';
import { extractFavicon } from '@/shared/libs/chrome';
import { BookmarkFormDialog } from '@/shared/ui/bookmark-form-dialog';
import { DeleteConfirmDialog } from '@/shared/ui/delete-confirm-dialog';

interface BookmarkCardProps {
	bookmark: Bookmark;
	index: number;
}

const _BookmarkCard = ({ bookmark, index }: BookmarkCardProps) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const { ref, sortable } = useSortable({
		id: bookmark.id,
		index: index,
		group: 'root-bookmark',
		sensors: [PointerSensor.configure({ preventActivation: () => false })],
	});

	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: queries.bookmarks.all.queryKey });

	const { mutate: move } = useMutation({
		...mutations.bookmark.move(),
		onSuccess: invalidate,
	});

	const { mutate: deleteBookmark } = useMutation({
		...mutations.bookmark.deleteBookmark(),
		onSuccess: invalidate,
	});

	const handleClickEditButton = (e: MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();
		e.stopPropagation();
		overlay.open(({ isOpen, close, unmount }) => (
			<BookmarkFormDialog
				bookmarkId={bookmark.id}
				close={close}
				initialTitle={bookmark.title}
				initialUrl={bookmark.url ?? ''}
				isOpen={isOpen}
				parentId={bookmark.parentId ?? ''}
				unmount={unmount}
			/>
		));
	};

	const handleClickDeleteButton = (e: MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();
		e.stopPropagation();
		overlay.open(({ isOpen, close, unmount }) => (
			<DeleteConfirmDialog
				close={close}
				description={t('bookmark.deleteConfirmDescription', { title: bookmark.title })}
				isOpen={isOpen}
				onConfirm={() => deleteBookmark({ id: bookmark.id })}
				title={t('bookmark.deleteConfirmTitle')}
				unmount={unmount}
			/>
		));
	};

	const faviconUrl = extractFavicon(bookmark.url);
	const tags: Tag[] = [];

	useEffect(() => {
		if (sortable.isDropping) {
			move({ id: bookmark.id, index: sortable.index, parentId: bookmark.parentId });
		}
	}, [sortable.isDropping, sortable.index, bookmark.id, bookmark.parentId, move]);

	return (
		<div className='@container h-full w-full' ref={ref}>
			<div className='group relative flex h-full min-h-[100cqw] w-full flex-col items-center gap-1.5'>
				{/* Action buttons */}
				<div className='absolute top-2 right-2 z-20 flex items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100'>
					<button
						className='flex h-6 w-6 items-center justify-center rounded-md text-white/50 transition-all duration-150 hover:bg-white/20 hover:text-white'
						onClick={handleClickEditButton}
						title={t('common.edit')}
						type='button'
					>
						<SquarePen aria-hidden='true' className='h-3 w-3' />
					</button>
					<button
						className='flex h-6 w-6 items-center justify-center rounded-md text-white/50 transition-all duration-150 hover:bg-red-500/20 hover:text-red-400'
						onClick={handleClickDeleteButton}
						title={t('common.delete')}
						type='button'
					>
						<Trash2 aria-hidden='true' className='h-3 w-3' />
					</button>
				</div>

				<a
					className='relative flex h-full w-full select-none flex-col rounded-[16px] p-2.5 text-start transition-all duration-200 hover:scale-[1.04] active:scale-[0.96]'
					href={bookmark.url}
					rel='noopener referrer'
					style={{
						backdropFilter: 'blur(24px)',
						WebkitBackdropFilter: 'blur(24px)',
						background: 'rgba(255,255,255,0.09)',
						border: '1px solid rgba(255,255,255,0.18)',
						boxShadow: '0 4px 20px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.18)',
						display: 'block',
						transition: 'transform 0.2s cubic-bezier(0.34,1.4,0.64,1), box-shadow 0.2s ease',
					}}
					target='_blank'
				>
					{/* shine */}
					<div
						aria-hidden='true'
						className='pointer-events-none absolute inset-0 rounded-[16px]'
						style={{
							background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%)',
						}}
					/>
					{/* content */}
					<div className='content relative z-10 flex h-full flex-col gap-2'>
						<div className='flex w-full justify-start'>
							{faviconUrl ? (
								<img alt='test' className='block aspect-square h-6 w-6' src={faviconUrl} />
							) : (
								<GlobeIcon className='h-6 w-6 text-white' />
							)}
						</div>
						{/* Title */}
						<p className='line-clamp-2 shrink-0 font-semibold text-[13px] text-white/85 leading-snug'>
							{bookmark.title}
						</p>
						{/* URL */}
						<p className='shrink-0 truncate font-mono text-[11px] text-white/30 tracking-tight'>
							{bookmark.url}
						</p>
						{/* Description */}
						<p className='line-clamp-3 shrink-0 text-[12px] text-white/50'>{bookmark.title}</p>
						<div className='flex flex-wrap gap-1'>
							{tags.map((tag) => {
								return (
									<span
										className='rounded-full px-1.5 py-0.5 font-semibold text-[10px] uppercase tracking-wide'
										key={tag.id}
										style={{
											backgroundColor: `${tag.color}28`,
											color: tag.color,
											border: `1px solid ${tag.color}45`,
										}}
									>
										{tag.name}
									</span>
								);
							})}
						</div>
					</div>
				</a>
			</div>
		</div>
	);
};

export const BookmarkCard = memo(_BookmarkCard);
```

- [ ] **Step 2: `folder-card.tsx` 수정**

`src/features/folder/ui/folder-card.tsx`를 아래 내용으로 교체:

```tsx
import { PointerSensor } from '@dnd-kit/react';
import { useSortable } from '@dnd-kit/react/sortable';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FolderIcon, MoreVerticalIcon, PencilLine, Trash2 } from 'lucide-react';
import { overlay } from 'overlay-kit';
import { memo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Bookmark } from '@/entities/bookmark';
import { mutations, queries } from '@/shared/api';
import { extractFavicon } from '@/shared/libs/chrome';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/shared/shadcn/components/ui/dropdown-menu';
import { DeleteConfirmDialog } from '@/shared/ui/delete-confirm-dialog';
import { FolderFormDialog } from '@/shared/ui/folder-form-dialog';

interface FolderCard {
	bookmark: Bookmark;
	index: number;
	onClick: () => void;
}

const _FolderCard = ({ index, bookmark, onClick }: FolderCard) => {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const { ref, sortable } = useSortable({
		id: bookmark.id,
		index,
		group: 'root-bookmark',
		sensors: [PointerSensor.configure({ preventActivation: () => false })],
	});

	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: queries.bookmarks.all.queryKey });

	const { mutate: move } = useMutation({
		...mutations.bookmark.move(),
		onSuccess: invalidate,
	});

	const { mutate: deleteFolder } = useMutation({
		...mutations.bookmark.deleteFolder(),
		onSuccess: invalidate,
	});

	useEffect(() => {
		if (sortable.isDropping) {
			move({ id: bookmark.id, index: sortable.index, parentId: bookmark.parentId });
		}
	}, [sortable.isDropping, sortable.index, bookmark.id, bookmark.parentId, move]);

	return (
		<div className='@container h-full w-full' ref={ref}>
			<div className='group relative flex h-full min-h-[100cqw] w-full flex-col items-center gap-1.5'>
				{/* Action buttons */}
				<div className='absolute top-2 right-2 z-20 flex items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100'>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button
								className='flex h-6 w-6 items-center justify-center rounded-md text-white/50 transition-all duration-150 hover:bg-white/20 hover:text-white'
								onClick={(e) => e.stopPropagation()}
								title={t('common.more')}
								type='button'
							>
								<MoreVerticalIcon aria-hidden='true' className='h-3 w-3' />
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align='end'>
							<DropdownMenuItem
								onClick={() =>
									overlay.open(({ isOpen, close, unmount }) => (
										<FolderFormDialog
											close={close}
											folderId={bookmark.id}
											initialTitle={bookmark.title}
											isOpen={isOpen}
											parentId={bookmark.parentId ?? ''}
											unmount={unmount}
										/>
									))
								}
							>
								<PencilLine className='h-3.5 w-3.5' />
								{t('common.rename')}
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={() =>
									overlay.open(({ isOpen, close, unmount }) => (
										<DeleteConfirmDialog
											close={close}
											description={t('folder.deleteConfirmDescription', { title: bookmark.title })}
											isOpen={isOpen}
											onConfirm={() => deleteFolder({ id: bookmark.id })}
											title={t('folder.deleteConfirmTitle')}
											unmount={unmount}
										/>
									))
								}
								variant='destructive'
							>
								<Trash2 className='h-3.5 w-3.5' />
								{t('common.delete')}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				<button
					className='relative flex h-full w-full select-none flex-col rounded-[16px] p-2.5 text-start transition-all duration-200 hover:scale-[1.04] active:scale-[0.96]'
					onClick={onClick}
					style={{
						backdropFilter: 'blur(24px)',
						WebkitBackdropFilter: 'blur(24px)',
						background: 'rgba(255,255,255,0.09)',
						border: '1px solid rgba(255,255,255,0.18)',
						boxShadow: '0 4px 20px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.18)',
						display: 'block',
						transition: 'transform 0.2s cubic-bezier(0.34,1.4,0.64,1), box-shadow 0.2s ease',
					}}
					type='button'
				>
					{/* shine */}
					<div
						aria-hidden='true'
						className='pointer-events-none absolute inset-0 rounded-[16px]'
						style={{
							background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%)',
						}}
					/>
					{/* content */}
					<div className='content relative z-10 flex h-full flex-col'>
						<div className='flex items-center gap-3'>
							<FolderIcon className='size-6 text-blue-200/80' fill='currentColor' />
							<p className='line-clamp-2 shrink-0 font-semibold text-[13px] text-white/85 leading-snug'>
								{bookmark.title}
							</p>
						</div>
						<div className='my-2 h-px w-full bg-white/15' />
						<ul className='flex w-full flex-col gap-3'>
							{bookmark?.children?.slice(0, 6).map((child) => {
								if (!child.children)
									return (
										<li className='flex w-full gap-2 text-white/75 text-xs' key={child.id}>
											<img
												alt={`${child.title} favicon`}
												className='h-4 w-4'
												src={extractFavicon(child.url) || ''}
											/>
											<p className='line-clamp-1'>{child.title}</p>
										</li>
									);
								return (
									<li className='flex w-full gap-2 text-white/75 text-xs' key={child.id}>
										<FolderIcon className='size-4 text-blue-200/80' fill='currentColor' />
										<p className='line-clamp-1'>{child.title}</p>
									</li>
								);
							})}
						</ul>
					</div>
				</button>
			</div>
		</div>
	);
};

export const FolderCard = memo(_FolderCard);
```

- [ ] **Step 3: 검증**

```bash
pnpm check-types
pnpm check
grep -nP '[\x{AC00}-\x{D7A3}]' src/features/bookmark/ui/bookmark-card.tsx src/features/folder/ui/folder-card.tsx
```

Expected: `check-types`/`check` 종료 코드 0, `grep` 매치 없음.

- [ ] **Step 4: 커밋**

```bash
git add src/features/bookmark/ui/bookmark-card.tsx src/features/folder/ui/folder-card.tsx
git commit -m "$(cat <<'EOF'
feat: translate bookmark and folder card UI text

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: `features/explorer` 번역 적용

**Files:**
- Modify: `src/features/explorer/ui/explorer.tsx`
- Modify: `src/features/explorer/ui/explorer-bookmark-card.tsx`
- Modify: `src/features/explorer/ui/explorer-content.tsx`
- Modify: `src/features/explorer/ui/explorer-content-header.tsx`
- Modify: `src/features/explorer/ui/explorer-folder-card.tsx`
- Modify: `src/features/explorer/ui/explorer-sidebar.tsx`

**Interfaces:**
- Consumes: Task 1의 `useTranslation`, 번역 키 `explorer.closeSidebarAriaLabel`, `explorer.folderDialogLabel`(interpolation: `title`), `explorer.emptyFolder`, `explorer.foldersLabel`, `common.edit`, `common.delete`, `common.rename`, `common.folder`, `common.bookmark`, `bookmark.deleteConfirmTitle`, `bookmark.deleteConfirmDescription`, `folder.deleteConfirmTitle`, `folder.deleteConfirmDescription`, `folder.itemCount`(pluralized, interpolation: `count`), `folder.empty`, `folderForm.editTitle`.
- Produces: 없음

- [ ] **Step 1: `explorer.tsx` 수정**

`src/features/explorer/ui/explorer.tsx`를 아래 내용으로 교체:

```tsx
import { useQuery } from '@tanstack/react-query';
import { VisuallyHidden } from 'radix-ui';
import { useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { findById } from '@/entities/bookmark/libs/findBookmarkById';
import { queries } from '@/shared/api';
import {
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/shared/shadcn/components/ui/dialog';
import { useExplorerStore } from '../model/explorer.store';
import { ExplorerContent } from './explorer-content';
import { ExplorerLeftSideBar } from './explorer-sidebar';

interface ExplorerProps {
	id: string;
}

export const Explorer = ({ id }: ExplorerProps) => {
	const { t } = useTranslation();
	const init = useExplorerStore((s) => s.init);

	const { data } = useQuery({
		...queries.bookmarks.all,
	});

	const bookmark = findById(data?.flat || [], id);

	const sidebarOpen = useExplorerStore((s) => s.sidebarOpen);
	const closeSidebar = useExplorerStore((s) => s.closeSidebar);

	useLayoutEffect(() => {
		init(id);
	}, [id, init]);

	const folderDialogLabel = t('explorer.folderDialogLabel', { title: bookmark?.title });

	return (
		<DialogContent
			className='w-full overflow-hidden rounded-4xl bg-background/95 p-0 shadow-2xl ring-1 ring-border/50 backdrop-blur-2xl sm:max-w-[90dvw]'
			showCloseButton={false}
		>
			<VisuallyHidden.Root>
				<DialogHeader>
					<DialogTitle>{folderDialogLabel}</DialogTitle>
					<DialogDescription>{folderDialogLabel}</DialogDescription>
				</DialogHeader>
			</VisuallyHidden.Root>
			<div className='relative flex h-[82dvh] w-full overflow-hidden'>
				{/* Mobile backdrop */}
				<button
					aria-label={t('explorer.closeSidebarAriaLabel')}
					className={`absolute inset-0 z-10 bg-black/50 transition-opacity md:hidden ${
						sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
					}`}
					onClick={closeSidebar}
					onKeyDown={(e) => e.key === 'Enter' && closeSidebar()}
					tabIndex={sidebarOpen ? 0 : -1}
					type='button'
				/>
				{/* Sidebar: overlay on mobile, static on desktop */}
				<div
					className={`absolute inset-y-0 left-0 z-20 w-52 transition-transform duration-200 md:relative md:z-auto md:translate-x-0 md:transition-none ${
						sidebarOpen ? 'translate-x-0' : '-translate-x-full'
					}`}
				>
					<ExplorerLeftSideBar />
				</div>
				<ExplorerContent />
			</div>
		</DialogContent>
	);
};
```

- [ ] **Step 2: `explorer-bookmark-card.tsx` 수정**

`src/features/explorer/ui/explorer-bookmark-card.tsx`를 아래 내용으로 교체:

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { GlobeIcon, SquarePen, Trash2 } from 'lucide-react';
import { overlay } from 'overlay-kit';
import type { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { Bookmark } from '@/entities/bookmark';
import { mutations, queries } from '@/shared/api';
import { extractFavicon } from '@/shared/libs/chrome';
import { BookmarkFormDialog } from '@/shared/ui/bookmark-form-dialog';
import { DeleteConfirmDialog } from '@/shared/ui/delete-confirm-dialog';

interface ExplorerBookmarkCardProps {
	bookmark: Bookmark;
}

export const ExplorerBookmarkCard = ({ bookmark }: ExplorerBookmarkCardProps) => {
	const { t } = useTranslation();
	const faviconUrl = extractFavicon(bookmark.url);

	let hostname = '';
	try {
		if (bookmark.url) hostname = new URL(bookmark.url).hostname;
	} catch {
		hostname = bookmark.url ?? '';
	}

	const queryClient = useQueryClient();
	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: queries.bookmarks.all.queryKey });

	const { mutate: deleteBookmark } = useMutation({
		...mutations.bookmark.deleteBookmark(),
		onSuccess: invalidate,
	});

	const handleEdit = (e: MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();
		e.stopPropagation();
		overlay.open(({ isOpen, close, unmount }) => (
			<BookmarkFormDialog
				bookmarkId={bookmark.id}
				close={close}
				initialTitle={bookmark.title}
				initialUrl={bookmark.url ?? ''}
				isOpen={isOpen}
				parentId={bookmark.parentId ?? ''}
				unmount={unmount}
			/>
		));
	};

	const handleDelete = (e: MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();
		e.stopPropagation();
		overlay.open(({ isOpen, close, unmount }) => (
			<DeleteConfirmDialog
				close={close}
				description={t('bookmark.deleteConfirmDescription', { title: bookmark.title })}
				isOpen={isOpen}
				onConfirm={() => deleteBookmark({ id: bookmark.id })}
				title={t('bookmark.deleteConfirmTitle')}
				unmount={unmount}
			/>
		));
	};

	return (
		<div className='group relative h-[88px] w-full'>
			{/* action buttons */}
			<div className='absolute top-2 right-2 z-20 flex items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100'>
				<button
					className='flex h-6 w-6 items-center justify-center rounded-md transition-all duration-150'
					onClick={handleEdit}
					onMouseEnter={(e) => {
						e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
						e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.background = 'transparent';
						e.currentTarget.style.color = 'rgba(255,255,255,0.45)';
					}}
					style={{ color: 'rgba(255,255,255,0.45)' }}
					title={t('common.edit')}
					type='button'
				>
					<SquarePen className='h-3 w-3' />
				</button>
				<button
					className='flex h-6 w-6 items-center justify-center rounded-md transition-all duration-150'
					onClick={handleDelete}
					onMouseEnter={(e) => {
						e.currentTarget.style.background = 'rgba(239,68,68,0.2)';
						e.currentTarget.style.color = 'rgba(252,165,165,0.9)';
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.background = 'transparent';
						e.currentTarget.style.color = 'rgba(255,255,255,0.45)';
					}}
					style={{ color: 'rgba(255,255,255,0.45)' }}
					title={t('common.delete')}
					type='button'
				>
					<Trash2 className='h-3 w-3' />
				</button>
			</div>

			<a
				className='relative flex h-full w-full flex-col justify-between rounded-2xl p-3'
				href={bookmark.url}
				onMouseEnter={(e) => {
					e.currentTarget.style.transform = 'scale(1.025)';
					e.currentTarget.style.boxShadow =
						'0 6px 20px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.12)';
					e.currentTarget.style.background = 'rgba(255,255,255,0.09)';
				}}
				onMouseLeave={(e) => {
					e.currentTarget.style.transform = 'scale(1)';
					e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.1)';
					e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
				}}
				rel='noopener noreferrer'
				style={{
					backdropFilter: 'blur(20px)',
					WebkitBackdropFilter: 'blur(20px)',
					background: 'rgba(255,255,255,0.06)',
					border: '1px solid rgba(255,255,255,0.11)',
					boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
					transition:
						'transform 0.18s cubic-bezier(0.34,1.4,0.64,1), box-shadow 0.2s ease, background 0.2s ease',
				}}
				target='_blank'
			>
				{/* shine */}
				<div
					aria-hidden='true'
					className='pointer-events-none absolute inset-0 rounded-2xl'
					style={{
						background: 'linear-gradient(135deg, rgba(255,255,255,0.09) 0%, transparent 55%)',
					}}
				/>

				{/* title row */}
				<div className='relative z-10 flex items-center gap-2 pr-14'>
					{faviconUrl ? (
						<img
							alt=''
							className='size-4 shrink-0 rounded-sm'
							onError={(e) => {
								e.currentTarget.style.display = 'none';
							}}
							src={faviconUrl}
						/>
					) : (
						<GlobeIcon className='size-4 shrink-0' style={{ color: 'rgba(255,255,255,0.35)' }} />
					)}
					<p
						className='line-clamp-2 font-semibold text-[13px] leading-snug'
						style={{ color: 'rgba(255,255,255,0.85)' }}
					>
						{bookmark.title}
					</p>
				</div>

				{/* hostname */}
				<p
					className='relative z-10 truncate font-mono text-[11px]'
					style={{ color: 'rgba(255,255,255,0.28)' }}
				>
					{hostname}
				</p>
			</a>
		</div>
	);
};
```

- [ ] **Step 3: `explorer-content.tsx` 수정**

`src/features/explorer/ui/explorer-content.tsx`를 아래 내용으로 교체:

```tsx
import { useQuery } from '@tanstack/react-query';
import { FolderIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { findById } from '@/entities/bookmark/libs/findBookmarkById';
import { queries } from '@/shared/api';
import { useExplorerStore } from '../model/explorer.store';
import { ExplorerBookmarkCard } from './explorer-bookmark-card';
import { ExplorerContentHeader } from './explorer-content-header';
import { ExplorerFolderCard } from './explorer-folder-card';

const EmptyState = () => {
	const { t } = useTranslation();
	return (
		<div className='flex h-full flex-col items-center justify-center gap-3 pb-8'>
			<div
				className='flex size-12 items-center justify-center rounded-2xl'
				style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
			>
				<FolderIcon
					className='size-5'
					fill='currentColor'
					style={{ color: 'rgba(255,255,255,0.25)' }}
				/>
			</div>
			<p className='text-[13px]' style={{ color: 'rgba(255,255,255,0.3)' }}>
				{t('explorer.emptyFolder')}
			</p>
		</div>
	);
};

const SkeletonCard = () => (
	<div
		className='h-22 w-full animate-pulse rounded-2xl'
		style={{ background: 'rgba(255,255,255,0.05)' }}
	/>
);

export const ExplorerContent = () => {
	const currentId = useExplorerStore((s) => s.currentId);
	const navigate = useExplorerStore((s) => s.navigate);

	const { data, isLoading } = useQuery({
		...queries.bookmarks.all,
		enabled: !!currentId,
	});

	const bookmarkById = findById(data?.flat || [], currentId);
	const children = bookmarkById?.children || [];
	const isEmpty = !isLoading && children?.length === 0;

	return (
		<div className='flex h-full w-full flex-col overflow-auto'>
			<ExplorerContentHeader />

			<div
				className='flex-1 overflow-y-auto px-4 py-3'
				style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.12) transparent' }}
			>
				{isLoading ? (
					<div className='grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3'>
						{Array.from({ length: 6 }).map((_, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: 	스켈레톤
							<SkeletonCard key={i} />
						))}
					</div>
				) : isEmpty ? (
					<EmptyState />
				) : (
					<div className='grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3'>
						{children?.map((item) =>
							item.children !== undefined ? (
								<ExplorerFolderCard
									bookmark={item}
									key={item.id}
									onClick={() => navigate(item.id)}
								/>
							) : (
								<ExplorerBookmarkCard bookmark={item} key={item.id} />
							),
						)}
					</div>
				)}
			</div>
		</div>
	);
};
```

- [ ] **Step 4: `explorer-content-header.tsx` 수정**

`src/features/explorer/ui/explorer-content-header.tsx`를 아래 내용으로 교체:

```tsx
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Menu, PencilLine, Plus, Trash2, X } from 'lucide-react';
import { overlay } from 'overlay-kit';
import { useTranslation } from 'react-i18next';
import { findById } from '@/entities/bookmark/libs/findBookmarkById';
import { mutations, queries } from '@/shared/api';
import { DialogClose } from '@/shared/shadcn/components/ui/dialog';
import { DeleteConfirmDialog } from '@/shared/ui/delete-confirm-dialog';
import { FolderFormDialog } from '@/shared/ui/folder-form-dialog';
import { ItemFormDialog } from '@/shared/ui/item-form-dialog';
import { findPath } from '../lib/find-path';
import { useExplorerStore } from '../model/explorer.store';

export const ExplorerContentHeader = () => {
	const { t } = useTranslation();
	const rootId = useExplorerStore((s) => s.rootId);
	const currentId = useExplorerStore((s) => s.currentId);
	const navigate = useExplorerStore((s) => s.navigate);
	const toggleSidebar = useExplorerStore((s) => s.toggleSidebar);

	const queryClient = useQueryClient();
	const { data } = useQuery({ ...queries.bookmarks.all });

	const fullPath = data ? findPath(data.flat, currentId) : [];
	const rootIndex = fullPath.findIndex((n) => n.id === rootId);
	const path = rootIndex >= 0 ? fullPath.slice(rootIndex) : fullPath;
	const isRoot = path.length <= 1;

	const currentFolder = data ? findById(data.flat, currentId) : null;

	const handleBack = () => {
		const parent = path[path.length - 2];
		if (parent) navigate(parent.id);
	};

	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: queries.bookmarks.all.queryKey });

	const { mutate: deleteFolder } = useMutation({
		...mutations.bookmark.deleteFolder(),
		onSuccess() {
			invalidate();
			handleBack();
		},
	});

	return (
		<div className='flex h-12 w-full shrink-0 items-center justify-between border-b px-3'>
			{/* breadcrumb */}
			<div className='flex min-w-0 items-center gap-0.5'>
				<button
					className='flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden'
					onClick={toggleSidebar}
					type='button'
				>
					<Menu className='h-4 w-4' />
				</button>
				{!isRoot && (
					<button
						className='flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'
						onClick={handleBack}
						type='button'
					>
						<ChevronLeft className='h-4 w-4' />
					</button>
				)}
				{path.map((node, i) => {
					const isLast = i === path.length - 1;
					return (
						<div className='flex min-w-0 items-center' key={node.id}>
							{i > 0 && (
								<ChevronRight className='mx-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/40' />
							)}
							<button
								className={`max-w-[200px] truncate rounded px-1 py-0.5 text-sm transition-colors ${
									isLast
										? 'font-semibold text-foreground'
										: 'text-muted-foreground hover:text-foreground'
								}`}
								disabled={isLast}
								onClick={() => !isLast && navigate(node.id)}
								type='button'
							>
								{node.title}
							</button>
						</div>
					);
				})}
			</div>

			{/* actions */}
			<div className='flex shrink-0 items-center'>
				<button
					className='flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'
					onClick={() =>
						overlay.open(({ isOpen, close, unmount }) => (
							<FolderFormDialog
								close={close}
								folderId={currentId}
								initialTitle={currentFolder?.title ?? ''}
								isOpen={isOpen}
								parentId={currentFolder?.parentId ?? ''}
								unmount={unmount}
							/>
						))
					}
					title={t('folderForm.editTitle')}
					type='button'
				>
					<PencilLine className='h-3.5 w-3.5' />
				</button>
				<button
					className='flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'
					onClick={() =>
						overlay.open(({ isOpen, close, unmount }) => (
							<DeleteConfirmDialog
								close={close}
								description={t('folder.deleteConfirmDescription', {
									title: currentFolder?.title,
								})}
								isOpen={isOpen}
								onConfirm={() => deleteFolder({ id: currentId })}
								title={t('folder.deleteConfirmTitle')}
								unmount={unmount}
							/>
						))
					}
					title={t('folder.deleteConfirmTitle')}
					type='button'
				>
					<Trash2 className='h-3.5 w-3.5' />
				</button>

				<div className='mx-2 h-4 w-px bg-border' />

				<button
					className='flex h-7 items-center gap-1 rounded-lg px-2 text-muted-foreground text-xs transition-colors hover:bg-accent hover:text-foreground'
					onClick={() =>
						overlay.open(({ isOpen, close, unmount }) => (
							<ItemFormDialog
								close={close}
								defaultTab='folder'
								isOpen={isOpen}
								parentId={currentId}
								unmount={unmount}
							/>
						))
					}
					type='button'
				>
					<Plus className='h-3.5 w-3.5' />
					{t('common.folder')}
				</button>
				<button
					className='flex h-7 items-center gap-1 rounded-lg px-2 text-muted-foreground text-xs transition-colors hover:bg-accent hover:text-foreground'
					onClick={() =>
						overlay.open(({ isOpen, close, unmount }) => (
							<ItemFormDialog
								close={close}
								defaultTab='bookmark'
								isOpen={isOpen}
								parentId={currentId}
								unmount={unmount}
							/>
						))
					}
					type='button'
				>
					<Plus className='h-3.5 w-3.5' />
					{t('common.bookmark')}
				</button>

				<div className='mx-2 h-4 w-px bg-border' />

				<DialogClose asChild>
					<button
						className='flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'
						type='button'
					>
						<X className='h-4 w-4' />
					</button>
				</DialogClose>
			</div>
		</div>
	);
};
```

- [ ] **Step 5: `explorer-folder-card.tsx` 수정**

`src/features/explorer/ui/explorer-folder-card.tsx`를 아래 내용으로 교체:

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FolderIcon, PencilLine, Trash2 } from 'lucide-react';
import { overlay } from 'overlay-kit';
import type { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { Bookmark } from '@/entities/bookmark';
import { mutations, queries } from '@/shared/api';
import { DeleteConfirmDialog } from '@/shared/ui/delete-confirm-dialog';
import { FolderFormDialog } from '@/shared/ui/folder-form-dialog';

interface ExplorerFolderCardProps {
	bookmark: Bookmark;
	onClick: () => void;
}

export const ExplorerFolderCard = ({ bookmark, onClick }: ExplorerFolderCardProps) => {
	const { t } = useTranslation();
	const childCount = bookmark.children?.length ?? 0;

	const queryClient = useQueryClient();
	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: queries.bookmarks.all.queryKey });

	const { mutate: deleteFolder } = useMutation({
		...mutations.bookmark.deleteFolder(),
		onSuccess: invalidate,
	});

	const handleEdit = (e: MouseEvent<HTMLButtonElement>) => {
		e.stopPropagation();
		overlay.open(({ isOpen, close, unmount }) => (
			<FolderFormDialog
				close={close}
				folderId={bookmark.id}
				initialTitle={bookmark.title}
				isOpen={isOpen}
				parentId={bookmark.parentId ?? ''}
				unmount={unmount}
			/>
		));
	};

	const handleDelete = (e: MouseEvent<HTMLButtonElement>) => {
		e.stopPropagation();
		overlay.open(({ isOpen, close, unmount }) => (
			<DeleteConfirmDialog
				close={close}
				description={t('folder.deleteConfirmDescription', { title: bookmark.title })}
				isOpen={isOpen}
				onConfirm={() => deleteFolder({ id: bookmark.id })}
				title={t('folder.deleteConfirmTitle')}
				unmount={unmount}
			/>
		));
	};

	return (
		<div className='group relative h-[88px] w-full'>
			{/* action buttons */}
			<div className='absolute top-2 right-2 z-20 flex items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100'>
				<button
					className='flex h-6 w-6 items-center justify-center rounded-md transition-all duration-150'
					onClick={handleEdit}
					onMouseEnter={(e) => {
						e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
						e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.background = 'transparent';
						e.currentTarget.style.color = 'rgba(255,255,255,0.45)';
					}}
					style={{ color: 'rgba(255,255,255,0.45)' }}
					title={t('common.rename')}
					type='button'
				>
					<PencilLine className='h-3 w-3' />
				</button>
				<button
					className='flex h-6 w-6 items-center justify-center rounded-md transition-all duration-150'
					onClick={handleDelete}
					onMouseEnter={(e) => {
						e.currentTarget.style.background = 'rgba(239,68,68,0.2)';
						e.currentTarget.style.color = 'rgba(252,165,165,0.9)';
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.background = 'transparent';
						e.currentTarget.style.color = 'rgba(255,255,255,0.45)';
					}}
					style={{ color: 'rgba(255,255,255,0.45)' }}
					title={t('common.delete')}
					type='button'
				>
					<Trash2 className='h-3 w-3' />
				</button>
			</div>

			<button
				className='group/card relative flex h-full w-full flex-col justify-between rounded-2xl p-3 text-start'
				onClick={onClick}
				onMouseEnter={(e) => {
					e.currentTarget.style.transform = 'scale(1.025)';
					e.currentTarget.style.boxShadow =
						'0 6px 24px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,200,80,0.15)';
					e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
				}}
				onMouseLeave={(e) => {
					e.currentTarget.style.transform = 'scale(1)';
					e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,0,0,0.12)';
					e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
				}}
				style={{
					backdropFilter: 'blur(20px)',
					WebkitBackdropFilter: 'blur(20px)',
					background: 'rgba(255,255,255,0.07)',
					border: '1px solid rgba(255,255,255,0.13)',
					boxShadow: '0 2px 16px rgba(0,0,0,0.12)',
					transition:
						'transform 0.18s cubic-bezier(0.34,1.4,0.64,1), box-shadow 0.2s ease, background 0.2s ease',
				}}
				type='button'
			>
				{/* shine */}
				<div
					aria-hidden='true'
					className='pointer-events-none absolute inset-0 rounded-2xl'
					style={{
						background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 55%)',
					}}
				/>

				{/* title row */}
				<div className='relative z-10 flex items-start justify-between gap-2 pr-14'>
					<div className='flex min-w-0 items-center gap-2'>
						<FolderIcon
							className='size-4 shrink-0'
							fill='currentColor'
							style={{ color: 'rgba(251,191,36,0.8)' }}
						/>
						<p
							className='line-clamp-2 font-semibold text-[13px] leading-snug'
							style={{ color: 'rgba(255,255,255,0.85)' }}
						>
							{bookmark.title}
						</p>
					</div>
					{childCount > 0 && (
						<span
							className='shrink-0 rounded-full px-1.5 py-0.5 font-mono text-[10px] tabular-nums'
							style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}
						>
							{childCount}
						</span>
					)}
				</div>

				{/* item count */}
				<p className='relative z-10 text-[11px]' style={{ color: 'rgba(255,255,255,0.28)' }}>
					{childCount > 0 ? t('folder.itemCount', { count: childCount }) : t('folder.empty')}
				</p>
			</button>
		</div>
	);
};
```

- [ ] **Step 6: `explorer-sidebar.tsx` 수정**

`src/features/explorer/ui/explorer-sidebar.tsx`를 아래 내용으로 교체:

```tsx
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, FolderIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Bookmark } from '@/entities/bookmark';
import { queries } from '@/shared/api';
import { useExplorerStore } from '../model/explorer.store';

export const ExplorerLeftSideBar = () => {
	const { t } = useTranslation();
	const currentId = useExplorerStore((s) => s.currentId);
	const navigate = useExplorerStore((s) => s.navigate);

	const { data } = useQuery({
		...queries.bookmarks.all,
	});

	if (!data) return null;
	const bookmarks = data.tree;

	return (
		<div className='flex h-full w-52 shrink-0 flex-col overflow-auto border-r bg-black'>
			<div className='flex h-12 items-center border-b px-4'>
				<span className='font-semibold text-[10px] text-muted-foreground/50 uppercase tracking-widest'>
					{t('explorer.foldersLabel')}
				</span>
			</div>
			<div className='h-full flex-1 overflow-y-auto p-2'>
				{bookmarks.map((bookmark) => (
					<ExplorerTreeNode
						bookmark={bookmark}
						currentId={currentId}
						key={bookmark.id}
						navigateFolder={navigate}
					/>
				))}
			</div>
		</div>
	);
};

export const ExplorerTreeNode = ({
	bookmark,
	currentId,
	navigateFolder,
}: {
	bookmark: Bookmark;
	currentId: string;
	navigateFolder: (id: string) => void;
}) => {
	const children = bookmark?.children || [];
	const isActive = bookmark.id === currentId;
	const isFolder = children.length > 0;
	const hasFolderChildren = children.some((child) => (child?.children || [])?.length > 0);
	const [expanded, setExpanded] = useState(isActive);

	useEffect(() => {
		if (isActive) setExpanded(true);
	}, [isActive]);

	if (!isFolder) return null;

	return (
		<div>
			<div
				className={`flex items-center gap-0.5 rounded-lg transition-colors duration-100 ${
					isActive
						? 'bg-accent text-foreground'
						: 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
				}`}
			>
				<button
					className='flex h-6 w-5 shrink-0 items-center justify-center'
					onClick={() => hasFolderChildren && setExpanded((v) => !v)}
					type='button'
				>
					{hasFolderChildren && (
						<ChevronRight
							aria-hidden='true'
							className={`h-3 w-3 transition-transform duration-150 ${expanded ? 'rotate-90' : ''}`}
						/>
					)}
				</button>
				<button
					className='flex min-w-0 flex-1 items-center gap-1.5 truncate py-1.5 pr-2 text-left font-medium text-xs'
					onClick={() => navigateFolder(bookmark.id)}
					type='button'
				>
					<FolderIcon
						aria-hidden='true'
						className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-foreground' : 'text-muted-foreground/60'}`}
					/>
					<span className='truncate'>{bookmark.title}</span>
				</button>
			</div>

			{expanded && hasFolderChildren && (
				<div className='ml-3 border-border/30 border-l pl-1.5'>
					{(bookmark?.children || []).map((child) => (
						<ExplorerTreeNode
							bookmark={child}
							currentId={currentId}
							key={child.id}
							navigateFolder={navigateFolder}
						/>
					))}
				</div>
			)}
		</div>
	);
};
```

- [ ] **Step 7: 검증**

```bash
pnpm check-types
pnpm check
grep -nP '[\x{AC00}-\x{D7A3}]' src/features/explorer/ui/*.tsx
```

Expected: `check-types`/`check` 종료 코드 0. `grep`은 `explorer-content.tsx`의 `// biome-ignore lint/suspicious/noArrayIndexKey: 스켈레톤` 주석 한 줄만 매치되어야 한다(주석은 번역 대상이 아님, Global Constraints 참고). 그 외 매치가 있으면 안 된다.

- [ ] **Step 8: 커밋**

```bash
git add src/features/explorer/ui
git commit -m "$(cat <<'EOF'
feat: translate explorer feature UI text

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: `shared/ui` 다이얼로그 번역 적용

**Files:**
- Modify: `src/shared/ui/bookmark-form-dialog.tsx`
- Modify: `src/shared/ui/folder-form-dialog.tsx`
- Modify: `src/shared/ui/item-form-dialog.tsx`
- Modify: `src/shared/ui/delete-confirm-dialog.tsx`

**Interfaces:**
- Consumes: Task 1의 `useTranslation`, 번역 키 `common.cancel`, `common.save`, `common.add`, `common.bookmark`, `common.folder`, `common.delete`, `bookmarkForm.urlPlaceholder`, `bookmarkForm.namePlaceholder`, `bookmarkForm.editTitle`, `folderForm.namePlaceholder`, `folderForm.editTitle`, `itemForm.addBookmarkTitle`, `itemForm.addFolderTitle`, `itemForm.createFolderSubmit`.
- Produces: `BookmarkFormContent`의 `submitLabel` prop이 이제 optional이며 미지정 시 `common.save`("저장"/"Save"/...)로 폴백한다 — Task 5/6에서 이미 사용 중인 `BookmarkFormDialog`/`FolderFormDialog`(내부적으로 `submitLabel` 미전달)의 동작은 동일하게 유지된다(그대로 저장 라벨 표시).

- [ ] **Step 1: `bookmark-form-dialog.tsx` 수정**

`src/shared/ui/bookmark-form-dialog.tsx`를 아래 내용으로 교체 (`submitLabel` 기본값을 컴포넌트 바디 안에서 `t('common.save')`로 폴백하도록 변경 — 파라미터 기본값 자리에서는 `useTranslation()` 결과를 아직 쓸 수 없기 때문):

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Globe } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { mutations, queries } from '@/shared/api';
import { Button } from '@/shared/shadcn/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/shared/shadcn/components/ui/dialog';
import { Input } from '@/shared/shadcn/components/ui/input';

const getFaviconUrl = (url: string): string | null => {
	try {
		const { hostname } = new URL(url);
		return hostname ? `https://favicon.im/${hostname}` : null;
	} catch {
		return null;
	}
};

interface BookmarkFormContentProps {
	bookmarkId?: string;
	initialTitle?: string;
	initialUrl?: string;
	onClose: () => void;
	parentId: string;
	submitLabel?: string;
}

export const BookmarkFormContent = ({
	parentId,
	onClose,
	submitLabel,
	bookmarkId,
	initialTitle = '',
	initialUrl = '',
}: BookmarkFormContentProps) => {
	const { t } = useTranslation();
	const isEdit = !!bookmarkId;

	const [title, setTitle] = useState(isEdit ? initialTitle : '');
	const [url, setUrl] = useState(isEdit ? initialUrl : '');
	const [faviconError, setFaviconError] = useState(false);

	const faviconUrl = getFaviconUrl(url);

	const queryClient = useQueryClient();
	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: queries.bookmarks.all.queryKey });

	const onSuccess = () => {
		invalidate();
		onClose();
	};

	const { mutate: createBookmark, isPending: isCreating } = useMutation({
		...mutations.bookmark.createBookmark(),
		onSuccess,
	});

	const { mutate: updateBookmark, isPending: isUpdating } = useMutation({
		...mutations.bookmark.updateBookmark(),
		onSuccess,
	});

	const isPending = isCreating || isUpdating;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const trimmedTitle = title.trim();
		const trimmedUrl = url.trim();
		if (!trimmedTitle || !trimmedUrl) return;
		if (isEdit && bookmarkId) {
			updateBookmark({ id: bookmarkId, title: trimmedTitle, url: trimmedUrl });
		} else {
			createBookmark({ parentId, title: trimmedTitle, url: trimmedUrl });
		}
	};

	const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setUrl(e.target.value);
		setFaviconError(false);
	};

	return (
		<form className='flex flex-col gap-3 pt-4' onSubmit={handleSubmit}>
			<div className='flex items-center gap-2'>
				<div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-md border bg-muted'>
					{faviconUrl && !faviconError ? (
						<img
							alt='favicon'
							className='h-6 w-6 object-contain'
							onError={() => setFaviconError(true)}
							src={faviconUrl}
						/>
					) : (
						<Globe className='h-6 w-6 text-muted-foreground' />
					)}
				</div>
				<Input
					autoFocus
					className='h-12'
					onChange={handleUrlChange}
					placeholder={t('bookmarkForm.urlPlaceholder')}
					type='url'
					value={url}
				/>
			</div>
			<Input
				className='h-12'
				onChange={(e) => setTitle(e.target.value)}
				placeholder={t('bookmarkForm.namePlaceholder')}
				value={title}
			/>
			<DialogFooter className='mt-2'>
				<Button onClick={onClose} size='lg' type='button' variant='outline'>
					{t('common.cancel')}
				</Button>
				<Button disabled={isPending || !title.trim() || !url.trim()} size='lg' type='submit'>
					{submitLabel ?? t('common.save')}
				</Button>
			</DialogFooter>
		</form>
	);
};

interface BookmarkFormDialogProps {
	bookmarkId: string;
	close: () => void;
	initialTitle?: string;
	initialUrl?: string;
	isOpen: boolean;
	parentId: string;
	unmount: () => void;
}

export const BookmarkFormDialog = ({
	isOpen,
	close,
	unmount,
	parentId,
	bookmarkId,
	initialTitle,
	initialUrl,
}: BookmarkFormDialogProps) => {
	const { t } = useTranslation();
	const handleClose = () => {
		close();
		unmount();
	};

	return (
		<Dialog onOpenChange={(open) => !open && handleClose()} open={isOpen}>
			<DialogContent showCloseButton={false}>
				<DialogHeader>
					<DialogTitle>{t('bookmarkForm.editTitle')}</DialogTitle>
				</DialogHeader>
				<BookmarkFormContent
					bookmarkId={bookmarkId}
					initialTitle={initialTitle}
					initialUrl={initialUrl}
					onClose={handleClose}
					parentId={parentId}
				/>
			</DialogContent>
		</Dialog>
	);
};
```

- [ ] **Step 2: `folder-form-dialog.tsx` 수정**

`src/shared/ui/folder-form-dialog.tsx`를 아래 내용으로 교체:

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { mutations, queries } from '@/shared/api';
import { Button } from '@/shared/shadcn/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/shared/shadcn/components/ui/dialog';
import { Input } from '@/shared/shadcn/components/ui/input';

interface FolderFormContentProps {
	folderId?: string;
	initialTitle?: string;
	onClose: () => void;
	parentId: string;
	submitLabel?: string;
}

export const FolderFormContent = ({
	parentId,
	onClose,
	submitLabel,
	folderId,
	initialTitle = '',
}: FolderFormContentProps) => {
	const { t } = useTranslation();
	const isEdit = !!folderId;

	const [title, setTitle] = useState(isEdit ? initialTitle : '');

	const queryClient = useQueryClient();
	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: queries.bookmarks.all.queryKey });

	const onSuccess = () => {
		invalidate();
		onClose();
	};

	const { mutate: createFolder, isPending: isCreating } = useMutation({
		...mutations.bookmark.createFolder(),
		onSuccess,
	});

	const { mutate: updateFolder, isPending: isUpdating } = useMutation({
		...mutations.bookmark.updateFolder(),
		onSuccess,
	});

	const isPending = isCreating || isUpdating;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const trimmed = title.trim();
		if (!trimmed) return;
		if (isEdit && folderId) {
			updateFolder({ id: folderId, title: trimmed });
		} else {
			createFolder({ parentId, title: trimmed });
		}
	};

	return (
		<form className='pt-4' onSubmit={handleSubmit}>
			<Input
				autoFocus={!isEdit}
				className='mt-1'
				onChange={(e) => setTitle(e.target.value)}
				placeholder={t('folderForm.namePlaceholder')}
				value={title}
			/>
			<DialogFooter className='mt-4'>
				<Button onClick={onClose} type='button' variant='outline'>
					{t('common.cancel')}
				</Button>
				<Button disabled={isPending || !title.trim()} type='submit'>
					{submitLabel ?? t('common.save')}
				</Button>
			</DialogFooter>
		</form>
	);
};

interface FolderFormDialogProps {
	close: () => void;
	folderId: string;
	initialTitle?: string;
	isOpen: boolean;
	parentId: string;
	unmount: () => void;
}

export const FolderFormDialog = ({
	isOpen,
	close,
	unmount,
	parentId,
	folderId,
	initialTitle,
}: FolderFormDialogProps) => {
	const { t } = useTranslation();
	const handleClose = () => {
		close();
		unmount();
	};

	return (
		<Dialog onOpenChange={(open) => !open && handleClose()} open={isOpen}>
			<DialogContent showCloseButton={false}>
				<DialogHeader>
					<DialogTitle>{t('folderForm.editTitle')}</DialogTitle>
				</DialogHeader>
				<FolderFormContent
					folderId={folderId}
					initialTitle={initialTitle}
					onClose={handleClose}
					parentId={parentId}
				/>
			</DialogContent>
		</Dialog>
	);
};
```

- [ ] **Step 3: `item-form-dialog.tsx` 수정**

`src/shared/ui/item-form-dialog.tsx`를 아래 내용으로 교체:

```tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/shared/shadcn/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/shadcn/components/ui/tabs';
import { BookmarkFormContent } from './bookmark-form-dialog';
import { FolderFormContent } from './folder-form-dialog';

interface ItemFormDialogProps {
	close: () => void;
	defaultTab?: 'bookmark' | 'folder';
	isOpen: boolean;
	parentId: string;
	unmount: () => void;
}

export const ItemFormDialog = ({
	isOpen,
	close,
	unmount,
	parentId,
	defaultTab = 'bookmark',
}: ItemFormDialogProps) => {
	const { t } = useTranslation();
	const [tab, setTab] = useState<'bookmark' | 'folder'>(defaultTab);

	const handleClose = () => {
		close();
		unmount();
	};

	return (
		<Dialog onOpenChange={(open) => !open && handleClose()} open={isOpen}>
			<DialogContent showCloseButton={false}>
				<DialogHeader>
					<DialogTitle>
						{tab === 'bookmark' ? t('itemForm.addBookmarkTitle') : t('itemForm.addFolderTitle')}
					</DialogTitle>
				</DialogHeader>
				<Tabs onValueChange={(v) => setTab(v as 'bookmark' | 'folder')} value={tab}>
					<TabsList className='w-full'>
						<TabsTrigger className='flex-1' value='bookmark'>
							{t('common.bookmark')}
						</TabsTrigger>
						<TabsTrigger className='flex-1' value='folder'>
							{t('common.folder')}
						</TabsTrigger>
					</TabsList>
					<TabsContent value='bookmark'>
						<BookmarkFormContent
							onClose={handleClose}
							parentId={parentId}
							submitLabel={t('common.add')}
						/>
					</TabsContent>
					<TabsContent value='folder'>
						<FolderFormContent
							onClose={handleClose}
							parentId={parentId}
							submitLabel={t('itemForm.createFolderSubmit')}
						/>
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
};
```

- [ ] **Step 4: `delete-confirm-dialog.tsx` 수정**

`src/shared/ui/delete-confirm-dialog.tsx`를 아래 내용으로 교체:

```tsx
import { useTranslation } from 'react-i18next';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/shared/shadcn/components/ui/alert-dialog';

interface DeleteConfirmDialogProps {
	close: () => void;
	description: string;
	isOpen: boolean;
	onConfirm: () => void;
	title: string;
	unmount: () => void;
}

export const DeleteConfirmDialog = ({
	isOpen,
	close,
	unmount,
	title,
	description,
	onConfirm,
}: DeleteConfirmDialogProps) => {
	const { t } = useTranslation();

	const handleConfirm = () => {
		onConfirm();
		close();
		unmount();
	};

	const handleCancel = () => {
		close();
		unmount();
	};

	return (
		<AlertDialog onOpenChange={(open) => !open && handleCancel()} open={isOpen}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel onClick={handleCancel}>{t('common.cancel')}</AlertDialogCancel>
					<AlertDialogAction onClick={handleConfirm} variant='destructive'>
						{t('common.delete')}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};
```

- [ ] **Step 5: 검증**

```bash
pnpm check-types
pnpm check
grep -nP '[\x{AC00}-\x{D7A3}]' src/shared/ui/bookmark-form-dialog.tsx src/shared/ui/folder-form-dialog.tsx src/shared/ui/item-form-dialog.tsx src/shared/ui/delete-confirm-dialog.tsx
```

Expected: `check-types`/`check` 종료 코드 0, `grep` 매치 없음.

- [ ] **Step 6: 커밋**

```bash
git add src/shared/ui/bookmark-form-dialog.tsx src/shared/ui/folder-form-dialog.tsx src/shared/ui/item-form-dialog.tsx src/shared/ui/delete-confirm-dialog.tsx
git commit -m "$(cat <<'EOF'
feat: translate bookmark/folder form and delete confirm dialogs

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: 전체 스윕 검증 및 브라우저 수동 확인

**Files:**
- 없음 (검증 전용 작업, 코드 변경 없음)

**Interfaces:**
- Consumes: Task 1~7에서 완료된 모든 파일
- Produces: 없음

- [ ] **Step 1: 번역 대상 15개 파일 전체에 대해 잔여 한국어 텍스트 스캔**

```bash
grep -rnP '[\x{AC00}-\x{D7A3}]' \
  src/App.tsx \
  src/widgets/header/ui/header.tsx \
  src/widgets/search/ui/search.tsx \
  src/features/bookmark/ui/bookmark-card.tsx \
  src/features/folder/ui/folder-card.tsx \
  src/features/explorer/ui/explorer.tsx \
  src/features/explorer/ui/explorer-bookmark-card.tsx \
  src/features/explorer/ui/explorer-content.tsx \
  src/features/explorer/ui/explorer-content-header.tsx \
  src/features/explorer/ui/explorer-folder-card.tsx \
  src/features/explorer/ui/explorer-sidebar.tsx \
  src/shared/ui/bookmark-form-dialog.tsx \
  src/shared/ui/folder-form-dialog.tsx \
  src/shared/ui/item-form-dialog.tsx \
  src/shared/ui/delete-confirm-dialog.tsx
```

Expected: `explorer-content.tsx`의 `// biome-ignore lint/suspicious/noArrayIndexKey: 스켈레톤` 주석 한 줄만 출력되어야 한다. 그 외의 매치가 있다면 해당 파일의 번역 누락이므로 Task 2~7로 돌아가 수정한다.

- [ ] **Step 2: 타입체크 및 린트 전체 재실행**

```bash
pnpm check-types
pnpm check
```

Expected: 두 명령 모두 종료 코드 0.

- [ ] **Step 3: 프로덕션 빌드 확인**

```bash
pnpm build
```

Expected: 종료 코드 0, `dist/` 산출물 생성. (JSON import, `Trans` 컴포넌트 사용 등이 번들링 단계에서도 문제없는지 확인)

- [ ] **Step 4: 개발 서버에서 4개 언어 수동 확인**

```bash
pnpm dev
```

브라우저에서 앱을 열고 다음을 확인한다:
1. 최초 로드 시 브라우저 언어에 맞는 언어로 표시되는지 확인 (Chrome 설정 언어가 한국어라면 한국어로 표시).
2. 헤더의 gear 아이콘 → 설정 모달 → 언어 Select에서 순서대로 **한국어 → English → 日本語 → 中文**을 선택하며 아래 화면들이 즉시 해당 언어로 바뀌는지 확인:
   - 헤더("북마크 추가" 버튼, 테마/설정 버튼 aria-label)
   - 검색창(북마크 검색 placeholder, Google 검색 placeholder)
   - 검색어 입력 후 결과 없음 문구 (`'{{query}}'에 대한 검색 결과가 없습니다.` 등, 강조된 검색어 스타일이 유지되는지)
   - 북마크/폴더 카드의 수정/삭제/이름변경 툴팁과 삭제 확인 다이얼로그
   - 헤더의 "+" 버튼으로 여는 새 북마크/폴더 추가 다이얼로그(탭 라벨, 제출 버튼)
   - 폴더 카드를 클릭해 연 탐색기 화면(사이드바 "폴더" 라벨, 상단 폴더/북마크 추가 버튼, 빈 폴더 문구, 항목 개수 문구)
3. 언어를 변경한 뒤 브라우저를 새로고침해도 마지막으로 선택한 언어가 유지되는지 확인 (localStorage 캐싱).

문제를 발견하면 해당 컴포넌트를 수정하고 Step 1부터 다시 검증한다. 확인 후 서버 종료.

- [ ] **Step 5: 최종 커밋 (필요 시)**

Step 4에서 발견된 수정 사항이 있다면 커밋한다. 수정이 없다면 이 작업은 커밋 없이 종료한다.

```bash
git status
```

수정된 파일이 있다면:

```bash
git add <수정된 파일>
git commit -m "$(cat <<'EOF'
fix: address i18n verification findings

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```
