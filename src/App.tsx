import { BookmarkCard } from './features/bookmark';
import { TopGridLayout } from './features/views';

const bookmarks = [
	{
		title: 'Tailwind CSS - Utility-First CSS Framework',
		description:
			'A utility-first CSS framework packed with classes like flex, pt-4, text-center and rotate-90 that can be composed to build any design.A utility-first CSS framework packed with classes like flex, pt-4, text-center and rotate-90 that can be composed to build any design.A utility-first CSS framework packed with classes like flex, pt-4, text-center and rotate-90 that can be composed to build any design.A utility-first CSS framework packed with classes like flex, pt-4, text-center and rotate-90 that can be composed to build any design.',
		url: 'tailwindcss.com',
		faviconUrl: 'https://www.google.com/s2/favicons?domain=tailwindcss.com&sz=64',
		tags: [
			{ id: '1', name: 'CSS', color: '#38bdf8' },
			{ id: '2', name: 'Frontend', color: '#a78bfa' },
		],
	},
	{
		title: 'GitHub',
		description:
			'GitHub is where over 100 million developers shape the future of software, together.',
		url: 'github.com',
		faviconUrl: 'https://www.google.com/s2/favicons?domain=github.com&sz=64',
		tags: [
			{ id: '3', name: 'Dev', color: '#f472b6' },
			{ id: '4', name: 'Open Source', color: '#34d399' },
		],
	},
	{
		title: 'Vercel – Deploy Frontend Apps',
		description:
			'Vercel is the platform for frontend developers, providing the speed and reliability innovators need to create at the moment of inspiration.',
		url: 'vercel.com',
		faviconUrl: 'https://www.google.com/s2/favicons?domain=vercel.com&sz=64',
		tags: [
			{ id: '5', name: 'Hosting', color: '#f59e0b' },
			{ id: '6', name: 'Deployment', color: '#60a5fa' },
		],
	},
	{
		title: 'shadcn/ui',
		description: 'Beautifully designed components built with Radix UI and Tailwind CSS.',
		url: 'ui.shadcn.com',
		faviconUrl: 'https://www.google.com/s2/favicons?domain=ui.shadcn.com&sz=64',
		tags: [
			{ id: '7', name: 'UI', color: '#a3e635' },
			{ id: '8', name: 'Components', color: '#fb923c' },
		],
	},
	{
		title: 'React – The Library for Web and Native User Interfaces',
		description: 'React lets you build user interfaces out of individual pieces called components.',
		url: 'react.dev',
		faviconUrl: 'https://www.google.com/s2/favicons?domain=react.dev&sz=64',
		tags: [
			{ id: '9', name: 'React', color: '#38bdf8' },
			{ id: '10', name: 'Frontend', color: '#a78bfa' },
		],
	},
	{
		title: 'Supabase | The Open Source Firebase Alternative',
		description:
			'Build production-grade applications with a Postgres database, Authentication, instant APIs, Realtime, Functions, Storage and Vector embeddings.',
		url: 'supabase.com',
		faviconUrl: 'https://www.google.com/s2/favicons?domain=supabase.com&sz=64',
		tags: [
			{ id: '11', name: 'Backend', color: '#34d399' },
			{ id: '12', name: 'Database', color: '#f472b6' },
		],
	},
	{
		title: 'TypeScript: JavaScript With Syntax For Types',
		description:
			'TypeScript is a strongly typed programming language that builds on JavaScript, giving you better tooling at any scale.',
		url: 'typescriptlang.org',
		faviconUrl: 'https://www.google.com/s2/favicons?domain=typescriptlang.org&sz=64',
		tags: [
			{ id: '13', name: 'TypeScript', color: '#60a5fa' },
			{ id: '14', name: 'Language', color: '#f59e0b' },
		],
	},
	{
		title: 'Vite – Next Generation Frontend Tooling',
		description: 'Get ready for a development environment that can finally catch up with you.',
		url: 'vite.dev',
		faviconUrl: 'https://www.google.com/s2/favicons?domain=vite.dev&sz=64',
		tags: [
			{ id: '15', name: 'Build', color: '#fb923c' },
			{ id: '16', name: 'Tooling', color: '#c084fc' },
		],
	},
	{
		title: 'MDN Web Docs',
		description:
			'The MDN Web Docs site provides information about Open Web technologies including HTML, CSS, and APIs for both Web sites and progressive web apps.',
		url: 'developer.mozilla.org',
		faviconUrl: 'https://www.google.com/s2/favicons?domain=developer.mozilla.org&sz=64',
		tags: [
			{ id: '17', name: 'Docs', color: '#34d399' },
			{ id: '18', name: 'Reference', color: '#f472b6' },
		],
	},
	{
		title: 'Figma: The Collaborative Interface Design Tool',
		description:
			'Figma is the leading collaborative design tool for building meaningful products. Seamlessly design, prototype, develop, and collect feedback in a single platform.',
		url: 'figma.com',
		faviconUrl: 'https://www.google.com/s2/favicons?domain=figma.com&sz=64',
		tags: [
			{ id: '19', name: 'Design', color: '#f472b6' },
			{ id: '20', name: 'UI/UX', color: '#a78bfa' },
		],
	},
];

export default function App() {
	return (
		<main className='bg-black'>
			<div className='relative z-10 h-dvh w-dvw overflow-hidden'>
				<div className='z-20 h-full w-full overflow-auto p-6'>
					<div className='mb-8 h-40 w-full bg-black' />
					<TopGridLayout>
						{[...bookmarks, ...bookmarks, ...bookmarks].map((e, idx) => (
							<BookmarkCard data={e} key={idx} />
						))}
					</TopGridLayout>
				</div>
				<div
					className='absolute inset-0 -z-10'
					style={{
						background:
							'radial-gradient(ellipse at 18% 28%, rgba(230,100,40,0.55) 0%, transparent 52%), radial-gradient(ellipse at 82% 12%, rgba(100,80,230,0.48) 0%, transparent 50%), radial-gradient(ellipse at 52% 88%, rgba(30,110,210,0.50) 0%, transparent 55%), radial-gradient(ellipse at 88% 68%, rgba(220,40,80,0.42) 0%, transparent 48%), radial-gradient(ellipse at 40% 55%, rgba(60,180,160,0.28) 0%, transparent 45%)',
					}}
				/>
			</div>
		</main>
	);
}
