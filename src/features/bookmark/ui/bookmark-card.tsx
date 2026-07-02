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
