import { createQueryKeys } from '@lukemorales/query-key-factory';
import { assertChromeBookmarks, getChromeBookmarks } from '../libs/chrome';

// depth 1: root level
// depth 2: inside root folders
// depth 3: inside depth-2 folders
// depth 4: inside depth-3 folders (deepest)
const mock = [
	// --- 루트 레벨 북마크 ---
	{
		id: 'm001',
		parentId: '1',
		index: 0,
		title: 'Google',
		url: 'https://www.google.com/',
		dateAdded: 1550201855000,
		dateLastUsed: 1777172512467,
		syncing: true,
	},
	{
		id: 'm002',
		parentId: '1',
		index: 1,
		title: 'GitHub',
		url: 'https://github.com/',
		dateAdded: 1775183942229,
		syncing: true,
	},
	{
		id: 'm003',
		parentId: '1',
		index: 2,
		title: 'YouTube',
		url: 'https://www.youtube.com/',
		dateAdded: 1776577594530,
		syncing: true,
	},

	// --- depth 1: 개발 폴더 (depth 2~4 중첩 테스트) ---
	{
		id: 'm100',
		parentId: '1',
		index: 3,
		title: '개발',
		dateAdded: 1773320674234,
		dateGroupModified: 1773552992532,
		syncing: true,
		children: [
			{
				id: 'm101',
				parentId: 'm100',
				index: 0,
				title: 'MDN Web Docs',
				url: 'https://developer.mozilla.org/ko/',
				dateAdded: 1769039901306,
				syncing: true,
			},
			{
				id: 'm102',
				parentId: 'm100',
				index: 1,
				title: 'DevOps Daily',
				url: 'https://devops-daily.com/',
				dateAdded: 1758845694428,
				syncing: true,
			},

			// depth 2: 프론트엔드 폴더
			{
				id: 'm110',
				parentId: 'm100',
				index: 2,
				title: '프론트엔드',
				dateAdded: 1773320674241,
				dateGroupModified: 1773552992526,
				syncing: true,
				children: [
					{
						id: 'm111',
						parentId: 'm110',
						index: 0,
						title: 'React',
						url: 'https://ko.react.dev/',
						dateAdded: 1729556147827,
						syncing: true,
					},
					{
						id: 'm112',
						parentId: 'm110',
						index: 1,
						title: 'Tailwind CSS',
						url: 'https://tailwindcss.com/',
						dateAdded: 1769732400888,
						syncing: true,
					},

					// depth 3: 프레임워크 폴더
					{
						id: 'm120',
						parentId: 'm110',
						index: 2,
						title: '프레임워크',
						dateAdded: 1773320674241,
						dateGroupModified: 1773552992526,
						syncing: true,
						children: [
							{
								id: 'm121',
								parentId: 'm120',
								index: 0,
								title: 'Next.js 한글 문서',
								url: 'https://nextjs-ko.org/docs',
								dateAdded: 1729556122895,
								syncing: true,
							},
							{
								id: 'm122',
								parentId: 'm120',
								index: 1,
								title: 'Remix',
								url: 'https://remix.run/docs',
								dateAdded: 1769733859294,
								syncing: true,
							},

							// depth 4: 상태관리 폴더
							{
								id: 'm130',
								parentId: 'm120',
								index: 2,
								title: '상태관리',
								dateAdded: 1773320674244,
								dateGroupModified: 1773552992513,
								syncing: true,
								children: [
									{
										id: 'm131',
										parentId: 'm130',
										index: 0,
										title: 'Zustand',
										url: 'https://zustand.docs.pmnd.rs/',
										dateAdded: 1772345981129,
										syncing: true,
									},
									{
										id: 'm132',
										parentId: 'm130',
										index: 1,
										title: 'Jotai',
										url: 'https://jotai.org/docs/introduction',
										dateAdded: 1769734221058,
										syncing: true,
									},
									{
										id: 'm133',
										parentId: 'm130',
										index: 2,
										title: 'TanStack Query',
										url: 'https://tanstack.com/query/latest',
										dateAdded: 1769733888660,
										syncing: true,
									},
								],
							},
						],
					},

					// depth 3: UI 라이브러리 폴더
					{
						id: 'm140',
						parentId: 'm110',
						index: 3,
						title: 'UI 라이브러리',
						dateAdded: 1773320674244,
						dateGroupModified: 1773552992517,
						syncing: true,
						children: [
							{
								id: 'm141',
								parentId: 'm140',
								index: 0,
								title: 'shadcn/ui',
								url: 'https://ui.shadcn.com/docs/components',
								dateAdded: 1769923319806,
								syncing: true,
							},
							{
								id: 'm142',
								parentId: 'm140',
								index: 1,
								title: 'Radix UI',
								url: 'https://www.radix-ui.com/',
								dateAdded: 1769732362189,
								syncing: true,
							},
							{
								id: 'm143',
								parentId: 'm140',
								index: 2,
								title: 'Magic UI',
								url: 'https://magicui.design/',
								dateAdded: 1769731896633,
								syncing: true,
							},
						],
					},
				],
			},

			// depth 2: 백엔드 폴더
			{
				id: 'm150',
				parentId: 'm100',
				index: 3,
				title: '백엔드',
				dateAdded: 1773320674239,
				dateGroupModified: 1773552992530,
				syncing: true,
				children: [
					{
						id: 'm151',
						parentId: 'm150',
						index: 0,
						title: 'FastAPI',
						url: 'https://fastapi.tiangolo.com/ko/',
						dateAdded: 1735300399861,
						syncing: true,
					},
					{
						id: 'm152',
						parentId: 'm150',
						index: 1,
						title: 'NestJS',
						url: 'https://docs.nestjs.com/',
						dateAdded: 1735300396371,
						syncing: true,
					},

					// depth 3: 데이터베이스 폴더
					{
						id: 'm160',
						parentId: 'm150',
						index: 2,
						title: '데이터베이스',
						dateAdded: 1773320674239,
						dateGroupModified: 1773552992530,
						syncing: true,
						children: [
							{
								id: 'm161',
								parentId: 'm160',
								index: 0,
								title: 'PostgreSQL Docs',
								url: 'https://www.postgresql.org/docs/',
								dateAdded: 1735300392448,
								syncing: true,
							},
							{
								id: 'm162',
								parentId: 'm160',
								index: 1,
								title: 'Prisma',
								url: 'https://www.prisma.io/docs',
								dateAdded: 1735300390239,
								syncing: true,
							},

							// depth 4: ORM 폴더
							{
								id: 'm170',
								parentId: 'm160',
								index: 2,
								title: 'ORM',
								dateAdded: 1773320674239,
								dateGroupModified: 1773552992530,
								syncing: true,
								children: [
									{
										id: 'm171',
										parentId: 'm170',
										index: 0,
										title: 'Drizzle ORM',
										url: 'https://orm.drizzle.team/',
										dateAdded: 1760417239164,
										syncing: true,
									},
									{
										id: 'm172',
										parentId: 'm170',
										index: 1,
										title: 'TypeORM',
										url: 'https://typeorm.io/',
										dateAdded: 1748578466256,
										syncing: true,
									},
								],
							},
						],
					},
				],
			},
		],
	},

	// --- depth 1: AI 폴더 (depth 2~3 중첩) ---
	{
		id: 'm200',
		parentId: '1',
		index: 4,
		title: 'AI',
		dateAdded: 1773320674239,
		dateGroupModified: 1773552992530,
		syncing: true,
		children: [
			{
				id: 'm201',
				parentId: 'm200',
				index: 0,
				title: 'Claude',
				url: 'https://claude.ai/new',
				dateAdded: 1770641741017,
				syncing: true,
			},
			{
				id: 'm202',
				parentId: 'm200',
				index: 1,
				title: 'Hugging Face',
				url: 'https://huggingface.co/',
				dateAdded: 1735300396371,
				syncing: true,
			},

			// depth 2: API 폴더
			{
				id: 'm210',
				parentId: 'm200',
				index: 2,
				title: 'API',
				dateAdded: 1773320674239,
				dateGroupModified: 1773552992530,
				syncing: true,
				children: [
					{
						id: 'm211',
						parentId: 'm210',
						index: 0,
						title: 'OpenAI API',
						url: 'https://platform.openai.com/docs',
						dateAdded: 1735646425720,
						syncing: true,
					},
					{
						id: 'm212',
						parentId: 'm210',
						index: 1,
						title: 'Anthropic API',
						url: 'https://docs.anthropic.com/',
						dateAdded: 1748578466256,
						syncing: true,
					},
					{
						id: 'm213',
						parentId: 'm210',
						index: 2,
						title: 'Smithery MCP Registry',
						url: 'https://smithery.ai/',
						dateAdded: 1748578466256,
						syncing: true,
					},

					// depth 3: 도구 폴더
					{
						id: 'm220',
						parentId: 'm210',
						index: 3,
						title: '도구',
						dateAdded: 1773320674239,
						dateGroupModified: 1773552992530,
						syncing: true,
						children: [
							{
								id: 'm221',
								parentId: 'm220',
								index: 0,
								title: 'LangChain',
								url: 'https://docs.langchain.com/',
								dateAdded: 1760417239164,
								syncing: true,
							},
							{
								id: 'm222',
								parentId: 'm220',
								index: 1,
								title: 'Streamlit',
								url: 'https://streamlit.io/',
								dateAdded: 1735300390239,
								syncing: true,
							},
						],
					},
				],
			},
		],
	},

	// --- depth 1: 도구 폴더 (depth 2만) ---
	{
		id: 'm300',
		parentId: '1',
		index: 5,
		title: '도구',
		dateAdded: 1773320674242,
		dateGroupModified: 1773552992521,
		syncing: true,
		children: [
			{
				id: 'm301',
				parentId: 'm300',
				index: 0,
				title: 'regex101',
				url: 'https://regex101.com/',
				dateAdded: 1744697301813,
				syncing: true,
			},
			{
				id: 'm302',
				parentId: 'm300',
				index: 1,
				title: 'DownGit',
				url: 'https://downgit.github.io/#/home',
				dateAdded: 1770637489051,
				syncing: true,
			},
			{
				id: 'm303',
				parentId: 'm300',
				index: 2,
				title: 'PNG to WEBP',
				url: 'https://picflow.com/convert/png-to-webp',
				dateAdded: 1760510351261,
				syncing: true,
			},

			// depth 2: 변환 폴더
			{
				id: 'm310',
				parentId: 'm300',
				index: 3,
				title: '변환',
				dateAdded: 1773320674242,
				dateGroupModified: 1773552992523,
				syncing: true,
				children: [
					{
						id: 'm311',
						parentId: 'm310',
						index: 0,
						title: 'Util Support',
						url: 'https://util.support/?menu=convert',
						dateAdded: 1760510356628,
						syncing: true,
					},
					{
						id: 'm312',
						parentId: 'm310',
						index: 1,
						title: 'JSON Formatter',
						url: 'https://jsonformatter.curiousconcept.com/',
						dateAdded: 1769041471817,
						syncing: true,
					},
				],
			},
		],
	},

	// --- 루트 레벨 단일 북마크 ---
	{
		id: 'm400',
		parentId: '1',
		index: 6,
		title: 'NAVER',
		url: 'https://www.naver.com/',
		dateAdded: 1773143252262,
		syncing: true,
	},
];

const flatten = (nodes: chrome.bookmarks.BookmarkTreeNode[]): chrome.bookmarks.BookmarkTreeNode[] =>
	nodes.flatMap((n) => (n.children ? [n, ...flatten(n.children)] : [n]));

export const bookmarks = createQueryKeys('bookmarks', {
	all: {
		queryKey: ['list'],
		queryFn: async () => {
			try {
				assertChromeBookmarks();
				const res = await getChromeBookmarks();
				const tree = (res[0]?.children?.flatMap((b) => b.children) ??
					[]) as chrome.bookmarks.BookmarkTreeNode[];
				return { tree, flat: flatten(tree) };
			} catch {
				const tree = mock as chrome.bookmarks.BookmarkTreeNode[];
				return { tree, flat: flatten(tree) };
			}
		},
	},
});
