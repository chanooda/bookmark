import type { Bookmark } from '@bookmark/types';
import { useState } from 'react';
import { stripProtocol } from '@/shared/lib/url';
import { FaviconImg } from '@/shared/ui';

export interface GlassBookmarkCardProps {
	bookmark: Bookmark;
	onEdit: (bm: Bookmark) => void;
	onDelete: (bm: Bookmark) => void;
	animationDelay: number;
	zIndex?: number;
}

export function GlassBookmarkCard({
	bookmark,
	onEdit,
	onDelete,
	animationDelay,
	zIndex = 0,
}: GlassBookmarkCardProps) {
	const fallbackLetter = (bookmark.title || bookmark.url).charAt(0).toUpperCase();
	const title = bookmark.title || stripProtocol(bookmark.url);
	const [hovered, setHovered] = useState(false);

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: hover state used only for z-index stacking, not interaction
		<div
			className='group relative flex flex-col items-center gap-1.5'
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
			style={{ animationDelay: `${animationDelay}ms`, zIndex: hovered ? 1000 : zIndex }}
		>
			{/* Action buttons */}
			<div className='absolute top-1 right-1 z-20 flex items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100'>
				<button
					className='flex h-6 w-6 items-center justify-center rounded-md text-white/50 transition-all duration-150 hover:bg-white/20 hover:text-white'
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						onEdit(bookmark);
					}}
					title='수정'
					type='button'
				>
					<svg
						aria-hidden='true'
						className='h-3 w-3'
						fill='none'
						stroke='currentColor'
						viewBox='0 0 24 24'
					>
						<path
							d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth={2}
						/>
					</svg>
				</button>
				<button
					className='flex h-6 w-6 items-center justify-center rounded-md text-white/50 transition-all duration-150 hover:bg-red-500/20 hover:text-red-400'
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						onDelete(bookmark);
					}}
					title='삭제'
					type='button'
				>
					<svg
						aria-hidden='true'
						className='h-3 w-3'
						fill='none'
						stroke='currentColor'
						viewBox='0 0 24 24'
					>
						<path
							d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth={2}
						/>
					</svg>
				</button>
			</div>

			{/* Glass tile — links directly */}
			<a
				className='relative w-full h-full overflow-hidden rounded-[16px] p-2.5 transition-all duration-200 hover:scale-[1.04] active:scale-[0.96]'
				href={bookmark.url}
				rel='noopener noreferrer'
				style={{
					aspectRatio: '1',
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
				{/* Shine */}
				<div
					aria-hidden='true'
					className='pointer-events-none absolute inset-0 rounded-[16px]'
					style={{
						background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%)',
					}}
				/>

				{/* Content */}
				<div className='relative z-10 flex h-full flex-col justify-start gap-2'>
					{/* Favicon */}

					{bookmark.favicon ? (
						<FaviconImg
							globeClassName='size-6 text-white/50'
							imgClassName='size-6 object-cover'
							src={bookmark.favicon}
						/>
					) : (
						<span className='text-sm font-bold text-white'>{fallbackLetter}</span>
					)}

					{/* Title */}
					<p className='line-clamp-2 text-[13px] font-semibold leading-snug text-white/85'>
						{title}
					</p>

					{/* URL */}
					<p className='truncate font-mono text-[11px] tracking-tight text-white/30'>
						{stripProtocol(bookmark.url)}
					</p>

					{/* Description */}
					{bookmark.description && (
						<p className='line-clamp-2 text-[12px] leading-relaxed text-white/50'>
							{bookmark.description}
						</p>
					)}

					{/* Tags */}
					{bookmark.tags.length > 0 && (
						<div className='flex flex-wrap gap-1'>
							{bookmark.tags.slice(0, 2).map((tag) => (
								<span
									className='rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide'
									key={tag.id}
									style={{
										backgroundColor: `${tag.color}28`,
										color: tag.color,
										border: `1px solid ${tag.color}45`,
									}}
								>
									{tag.name}
								</span>
							))}
						</div>
					)}
				</div>
			</a>
		</div>
	);
}
