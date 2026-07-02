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
					className='flex h-6 w-6 items-center justify-center rounded-md text-foreground/50 transition-all duration-150 hover:bg-foreground/20 hover:text-foreground'
					onClick={handleEdit}
					title={t('common.edit')}
					type='button'
				>
					<SquarePen className='h-3 w-3' />
				</button>
				<button
					className='flex h-6 w-6 items-center justify-center rounded-md text-foreground/50 transition-all duration-150 hover:bg-red-500/20 hover:text-red-400'
					onClick={handleDelete}
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
						<GlobeIcon className='size-4 shrink-0 text-foreground/35' />
					)}
					<p className='line-clamp-2 font-semibold text-[13px] text-foreground/85 leading-snug'>
						{bookmark.title}
					</p>
				</div>

				{/* hostname */}
				<p className='relative z-10 truncate font-mono text-[11px] text-foreground/30'>
					{hostname}
				</p>
			</a>
		</div>
	);
};
