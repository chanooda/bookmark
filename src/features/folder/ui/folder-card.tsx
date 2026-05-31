import { PointerSensor } from '@dnd-kit/react';
import { useSortable } from '@dnd-kit/react/sortable';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FolderIcon, MoreVerticalIcon, PencilLine, Trash2 } from 'lucide-react';
import { overlay } from 'overlay-kit';
import { memo, useEffect } from 'react';
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
import { ItemFormDialog } from '@/shared/ui/item-form-dialog';

interface FolderCard {
	bookmark: Bookmark;
	index: number;
	onClick: () => void;
}

const _FolderCard = ({ index, bookmark, onClick }: FolderCard) => {
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
								title='더보기'
								type='button'
							>
								<MoreVerticalIcon aria-hidden='true' className='h-3 w-3' />
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align='end'>
							<DropdownMenuItem
								onClick={() =>
									overlay.open(({ isOpen, close, unmount }) => (
										<ItemFormDialog
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
								이름 변경
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={() =>
									overlay.open(({ isOpen, close, unmount }) => (
										<DeleteConfirmDialog
											close={close}
											description={`"${bookmark.title}" 폴더와 모든 항목이 삭제됩니다. 이 작업은 되돌릴 수 없습니다.`}
											isOpen={isOpen}
											onConfirm={() => deleteFolder({ id: bookmark.id })}
											title='폴더 삭제'
											unmount={unmount}
										/>
									))
								}
								variant='destructive'
							>
								<Trash2 className='h-3.5 w-3.5' />
								삭제
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
