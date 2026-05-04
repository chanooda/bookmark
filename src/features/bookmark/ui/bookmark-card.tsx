import { SquarePen, Trash2 } from 'lucide-react';

interface BookmarkCardProps {
	data: {
		title: string;
		description?: string;
		url: string;
		faviconUrl: string;
		tags: {
			color: string;
			name: string;
			id: string;
		}[];
	};
}

export const BookmarkCard = ({ data }: BookmarkCardProps) => {
	const { title, faviconUrl, tags, url, description } = data;
	return (
		<div className='@container h-full w-full'>
		<div className='group relative flex h-full min-h-[100cqw] w-full flex-col items-center gap-1.5'>
			{/* shine */}
			<div
				aria-hidden='true'
				className='pointer-events-none absolute inset-0 rounded-[16px]'
				style={{
					background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%)',
				}}
			/>

			{/* Action buttons */}
			<div className='absolute top-1 right-1 z-20 flex items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100'>
				<button
					className='flex h-6 w-6 items-center justify-center rounded-md text-white/50 transition-all duration-150 hover:bg-white/20 hover:text-white'
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
					}}
					title='수정'
					type='button'
				>
					<SquarePen aria-hidden='true' className='h-3 w-3' />
				</button>
				<button
					className='flex h-6 w-6 items-center justify-center rounded-md text-white/50 transition-all duration-150 hover:bg-red-500/20 hover:text-red-400'
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
					}}
					title='삭제'
					type='button'
				>
					<Trash2 aria-hidden='true' className='h-3 w-3' />
				</button>
			</div>

			<a
				className='relative flex h-full w-full flex-col rounded-[16px] p-2.5 transition-all duration-200 hover:scale-[1.04] active:scale-[0.96]'
				href='https://naver.com'
				rel='noopener noreferrer'
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
				{/* content */}
				<div className='content relative z-10 flex h-full flex-col gap-2'>
					<div className='flex w-full justify-start'>
						<img
							alt='test'
							className='block aspect-square h-6 w-6'
							src={faviconUrl}
							// src='https://www.google.com/s2/favicons?domain=ui.shadcn.com&sz=64'
						/>
					</div>
					{/* Title */}
					<p className='line-clamp-2 shrink-0 font-semibold text-[13px] text-white/85 leading-snug'>
						{title}
					</p>
					{/* URL */}
					<p className='shrink-0 truncate font-mono text-[11px] text-white/30 tracking-tight'>
						{url}
					</p>
					{/* Description */}
					<p className='line-clamp-3 shrink-0 text-[12px] text-white/50'>{description}</p>
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
