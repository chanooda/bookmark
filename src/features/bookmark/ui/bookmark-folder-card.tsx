import { PointerSensor } from '@dnd-kit/react';
import { useSortable } from '@dnd-kit/react/sortable';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FolderIcon, MoreVerticalIcon } from 'lucide-react';
import { useEffect } from 'react';
import type { Bookmark } from '@/entities/bookmark';
import { mutations, queries } from '@/shared/api';
import { extractFavicon } from '@/shared/libs/chrome';

interface BookmarkCardProps {
	bookmark: Bookmark;
	index: number;
}

export const BookmarkFolderCard = ({ index, bookmark }: BookmarkCardProps) => {
	const queryClient = useQueryClient();
	const { ref, sortable } = useSortable({
		id: bookmark.id,
		index,
		group: 'root-bookmark',
		sensors: [PointerSensor.configure({ preventActivation: () => false })],
	});

	const { mutate: move } = useMutation({
		...mutations.bookmark.move(),
		onSuccess() {
			queryClient.invalidateQueries({
				queryKey: queries.bookmarks.all.queryKey,
			});
		},
	});

	useEffect(() => {
		console.log(bookmark.title, sortable.index);
		move({
			id: bookmark.id,
			index: sortable.index,
			parentId: bookmark.parentId,
		});
	}, [sortable.index]);

	return (
		<div className='@container h-full w-full' ref={ref}>
			<div className='group relative flex h-full min-h-[100cqw] w-full flex-col items-center gap-1.5'>
				{/* Action buttons */}
				<div className='absolute top-2 right-2 z-20 flex items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100'>
					<button
						className='flex h-6 w-6 items-center justify-center rounded-md text-white/50 transition-all duration-150 hover:bg-white/20 hover:text-white'
						title='수정'
						type='button'
					>
						<MoreVerticalIcon aria-hidden='true' className='h-3 w-3' />
					</button>
				</div>

				<button
					className='relative flex h-full w-full select-none flex-col rounded-[16px] p-2.5 text-start transition-all duration-200 hover:scale-[1.04] active:scale-[0.96]'
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
							{bookmark?.children?.slice(0, 6).map((bookmark) => {
								if (!bookmark.children)
									return (
										<li className='flex w-full gap-2 text-white/75 text-xs' key={bookmark.id}>
											<img
												alt={`${bookmark.title} favicon`}
												className='h-4 w-4'
												src={extractFavicon(bookmark.url) || ''}
											/>
											<p className='line-clamp-1'>{bookmark.title}</p>
										</li>
									);
								else {
									return (
										<li className='flex w-full gap-2 text-white/75 text-xs' key={bookmark.id}>
											<FolderIcon className='size-4 text-blue-200/80' fill='currentColor' />
											<p className='line-clamp-1'>{bookmark.title}</p>
										</li>
									);
								}
							})}
						</ul>
					</div>
					{/* bookmark list */}
				</button>
			</div>
		</div>
	);
};
