import { useQuery } from '@tanstack/react-query';
import { SearchX } from 'lucide-react';
import { overlay } from 'overlay-kit';
import { useMemo } from 'react';
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
								<span className='font-medium text-foreground/60'>'{search}'</span>에 대한 검색
								결과가 없습니다.
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
