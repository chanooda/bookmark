import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FolderIcon, PencilLine, Trash2 } from 'lucide-react';
import { overlay } from 'overlay-kit';
import type { MouseEvent } from 'react';
import type { Bookmark } from '@/entities/bookmark';
import { FolderFormDialog } from '@/features/folder';
import { mutations, queries } from '@/shared/api';
import { DeleteConfirmDialog } from '@/shared/ui/delete-confirm-dialog';

interface ExplorerFolderCardProps {
	bookmark: Bookmark;
	onClick: () => void;
}

export const ExplorerFolderCard = ({ bookmark, onClick }: ExplorerFolderCardProps) => {
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
				description={`"${bookmark.title}" 폴더와 모든 항목이 삭제됩니다. 이 작업은 되돌릴 수 없습니다.`}
				isOpen={isOpen}
				onConfirm={() => deleteFolder({ id: bookmark.id })}
				title='폴더 삭제'
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
					title='이름 변경'
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
					title='삭제'
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
					{childCount > 0 ? `${childCount}개 항목` : '비어 있음'}
				</p>
			</button>
		</div>
	);
};
