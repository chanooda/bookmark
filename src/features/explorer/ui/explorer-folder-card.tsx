import { FolderIcon } from 'lucide-react';
import type { Bookmark } from '@/entities/bookmark';

interface ExplorerFolderCardProps {
	bookmark: Bookmark;
	onClick: () => void;
}

export const ExplorerFolderCard = ({ bookmark, onClick }: ExplorerFolderCardProps) => {
	const childCount = bookmark.children?.length ?? 0;

	return (
		<button
			className='group relative flex h-[88px] w-full flex-col justify-between rounded-2xl p-3 text-start'
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
				style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 55%)' }}
			/>

			{/* title row */}
			<div className='relative z-10 flex items-start justify-between gap-2'>
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
	);
};
