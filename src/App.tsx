import { useQuery } from '@tanstack/react-query';
import { FolderPlus } from 'lucide-react';
import { overlay } from 'overlay-kit';
import { useState } from 'react';
import { BookmarkCard } from './features/bookmark';
import { Explorer } from './features/explorer';
import { FolderCard, FolderFormDialog } from './features/folder';
import { TopGridLayout } from './features/views';
import { queries } from './shared/api';
import { BOOKMARK_ROOT_ID } from './shared/config/chrome.const';
import { Button } from './shared/shadcn/components/ui/button';
import { Dialog } from './shared/shadcn/components/ui/dialog';

export default function App() {
	const { data } = useQuery({
		...queries.bookmarks.all,
	});

	const [id, setId] = useState('');

	return (
		<>
			<main className='bg-background'>
				<div className='relative z-10 h-dvh w-dvw overflow-hidden'>
					<div className='z-20 h-full w-full overflow-auto p-6'>
						<div className='mb-8 flex h-40 w-full items-end pb-4'>
							<Button
								className='gap-1.5'
								onClick={() =>
									overlay.open(({ isOpen, close, unmount }) => (
										<FolderFormDialog
											close={close}
											isOpen={isOpen}
											parentId={String(BOOKMARK_ROOT_ID)}
											unmount={unmount}
										/>
									))
								}
								size='sm'
								variant='outline'
							>
								<FolderPlus className='h-4 w-4' />새 폴더
							</Button>
						</div>
						<TopGridLayout>
							{data?.map((bookmark, idx) => {
								if (!bookmark.children) {
									return <BookmarkCard bookmark={bookmark} index={idx} key={bookmark.id} />;
								}
								return (
									<FolderCard
										bookmark={bookmark}
										index={idx}
										key={bookmark.id}
										onClick={() => setId(bookmark.id)}
									/>
								);
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
			<Dialog onOpenChange={(isOpen) => !isOpen && setId('')} open={!!id}>
				<Explorer id={id} />
			</Dialog>
		</>
	);
}
