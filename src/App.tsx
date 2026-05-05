import { useQuery } from '@tanstack/react-query';
import { BookmarkCard, BookmarkFolderCard } from './features/bookmark';
import { TopGridLayout } from './features/views';
import { queries } from './shared/api';

export default function App() {
	const { data } = useQuery({
		...queries.bookmarks.all,
	});

	console.log(data);

	return (
		<main className='bg-black'>
			<div className='relative z-10 h-dvh w-dvw overflow-hidden'>
				<div className='z-20 h-full w-full overflow-auto p-6'>
					<div className='mb-8 h-40 w-full bg-black' />
					<TopGridLayout>
						{data?.map((bookmark, idx) => {
							if (!bookmark.children) {
								return <BookmarkCard bookmark={bookmark} index={idx} key={bookmark.id} />;
							}
							return <BookmarkFolderCard bookmark={bookmark} index={idx} key={bookmark.id} />;
						})}
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
