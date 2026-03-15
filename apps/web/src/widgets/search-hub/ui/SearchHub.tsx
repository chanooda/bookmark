import { type FormEvent, useState } from 'react';
import { useBookmarkFilterStore } from '@/features/bookmark';

function detectInputType(input: string): 'url' | 'search' {
	const trimmed = input.trim();
	if (/^https?:\/\//i.test(trimmed)) return 'url';
	if (/^www\./i.test(trimmed)) return 'url';
	if (/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/.*)?$/.test(trimmed)) return 'url';
	return 'search';
}

function GoogleIcon() {
	return (
		<svg aria-hidden='true' className='h-3.5 w-3.5 shrink-0' viewBox='0 0 24 24'>
			<path
				d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
				fill='#4285F4'
			/>
			<path
				d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
				fill='#34A853'
			/>
			<path
				d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
				fill='#FBBC05'
			/>
			<path
				d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
				fill='#EA4335'
			/>
		</svg>
	);
}

export function SearchHub() {
	const { search, setSearch } = useBookmarkFilterStore();
	const [googleQuery, setGoogleQuery] = useState('');

	function handleGoogleSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const trimmed = googleQuery.trim();
		if (!trimmed) return;
		if (detectInputType(trimmed) === 'url') {
			const url = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
			window.location.href = url;
		} else {
			window.location.href = `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
		}
	}

	return (
		<div className='relative my-4 shrink-0'>
			{/* Atmospheric glows — purely decorative */}
			<div aria-hidden='true' className='pointer-events-none absolute inset-0 overflow-hidden'>
				<div className='absolute top-1/2 left-1/4 h-16 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.07] blur-3xl' />
				<div className='absolute top-1/2 right-1/4 h-16 w-40 -translate-y-1/2 translate-x-1/2 rounded-full bg-blue-500/[0.07] blur-3xl' />
			</div>

			<div className='flex gap-3'>
				{/* ── Bookmark Search ── */}
				<div className='group/bm flex flex-1 items-center overflow-hidden rounded-xl border border-border/50 bg-card/70 shadow-sm backdrop-blur-sm transition-all duration-200 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10'>
					{/* Label badge */}
					<div className='flex shrink-0 items-center gap-1.5 border-r border-border/40 px-3.5 py-3 transition-colors duration-200 group-focus-within/bm:border-primary/25'>
						<svg
							aria-hidden='true'
							className='h-3.5 w-3.5 shrink-0 text-primary/55 transition-colors duration-200 group-focus-within/bm:text-primary/85'
							fill='currentColor'
							viewBox='0 0 24 24'
						>
							<path d='M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z' />
						</svg>
						<span className='font-label text-[9px] uppercase tracking-[0.13em] text-primary/50 transition-colors duration-200 group-focus-within/bm:text-primary/80'>
							북마크
						</span>
					</div>
					{/* Input */}
					<input
						aria-label='북마크 검색'
						className='h-11 flex-1 bg-transparent px-3.5 text-sm text-foreground placeholder:text-muted-foreground/35 outline-none'
						onChange={(e) => setSearch(e.target.value)}
						placeholder='저장한 북마크 검색...'
						value={search}
					/>
					{/* Clear button — appears when there's text */}
					{search && (
						<button
							aria-label='검색어 지우기'
							className='mr-3 flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground/35 transition-colors duration-150 hover:text-foreground/60'
							onClick={() => setSearch('')}
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
									d='M6 18L18 6M6 6l12 12'
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
								/>
							</svg>
						</button>
					)}
				</div>

				{/* ── Google Search ── */}
				<form
					className='group/gl flex flex-1 items-center overflow-hidden rounded-xl border border-border/50 bg-card/70 shadow-sm backdrop-blur-sm transition-all duration-200 focus-within:border-blue-400/40 focus-within:ring-2 focus-within:ring-blue-400/10'
					onSubmit={handleGoogleSubmit}
				>
					{/* Label badge — clickable link to google.com */}
					<a
						aria-label='Google 홈으로 이동'
						className='flex shrink-0 items-center gap-1.5 border-r border-border/40 px-3.5 py-3 transition-all duration-200 group-focus-within/gl:border-blue-400/25 hover:bg-blue-500/5'
						href='https://www.google.com'
						title='google.com으로 이동'
					>
						<GoogleIcon />
						<span className='font-label text-[9px] uppercase tracking-[0.13em] text-blue-400/50 transition-colors duration-200 group-focus-within/gl:text-blue-400/85'>
							Google
						</span>
					</a>
					{/* Input */}
					<input
						aria-label='Google 검색 또는 URL 입력'
						className='h-11 flex-1 bg-transparent px-3.5 text-sm text-foreground placeholder:text-muted-foreground/35 outline-none'
						onChange={(e) => setGoogleQuery(e.target.value)}
						placeholder='검색어 또는 URL 입력...'
						value={googleQuery}
					/>
					{/* Submit button */}
					<button
						className='mr-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground/25 transition-all duration-200 hover:bg-blue-500/12 hover:text-blue-400 group-focus-within/gl:bg-blue-500/8 group-focus-within/gl:text-blue-400/70'
						title='검색'
						type='submit'
					>
						<svg
							aria-hidden='true'
							className='h-3.5 w-3.5'
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'
						>
							<path
								d='M14 5l7 7m0 0l-7 7m7-7H3'
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2}
							/>
						</svg>
					</button>
				</form>
			</div>
		</div>
	);
}
