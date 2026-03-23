import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useBookmarkFilterStore } from '@/features/bookmark';

function detectInputType(input: string): 'url' | 'search' {
	const trimmed = input.trim();
	if (/^https?:\/\//i.test(trimmed)) return 'url';
	if (/^www\./i.test(trimmed)) return 'url';
	if (/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/.*)?$/.test(trimmed)) return 'url';
	return 'search';
}

export function SearchHub() {
	const { t } = useTranslation();
	const { search, setSearch } = useBookmarkFilterStore();
	const [webQuery, setWebQuery] = useState('');

	function handleWebSearch(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const trimmed = webQuery.trim();
		if (!trimmed) return;
		if (detectInputType(trimmed) === 'url') {
			const url = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
			window.location.href = url;
		} else {
			chrome.search.query({ text: trimmed, disposition: 'CURRENT_TAB' });
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
							{t('search.bookmarkLabel')}
						</span>
					</div>
					{/* Input */}
					<input
						aria-label={t('search.bookmarkAriaLabel')}
						className='h-11 flex-1 bg-transparent px-3.5 text-sm text-foreground placeholder:text-muted-foreground/35 outline-none'
						onChange={(e) => setSearch(e.target.value)}
						placeholder={t('search.bookmarkPlaceholder')}
						value={search}
					/>
					{/* Clear button — appears when there's text */}
					{search && (
						<button
							aria-label={t('search.clearAriaLabel')}
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

				{/* ── Web Search ── */}
				<form
					className='group/ws flex flex-1 items-center overflow-hidden rounded-xl border border-border/50 bg-card/70 shadow-sm backdrop-blur-sm transition-all duration-200 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10'
					onSubmit={handleWebSearch}
				>
					{/* Label badge */}
					<div className='flex shrink-0 items-center gap-1.5 border-r border-border/40 px-3.5 py-3 transition-colors duration-200 group-focus-within/ws:border-primary/25'>
						<svg
							aria-hidden='true'
							className='h-3.5 w-3.5 shrink-0 text-primary/55 transition-colors duration-200 group-focus-within/ws:text-primary/85'
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'
						>
							<path
								d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2}
							/>
						</svg>
						<span className='font-label text-[9px] uppercase tracking-[0.13em] text-primary/50 transition-colors duration-200 group-focus-within/ws:text-primary/80'>
							{t('search.webLabel')}
						</span>
					</div>
					{/* Input */}
					<input
						aria-label={t('search.webAriaLabel')}
						className='h-11 flex-1 bg-transparent px-3.5 text-sm text-foreground placeholder:text-muted-foreground/35 outline-none'
						onChange={(e) => setWebQuery(e.target.value)}
						placeholder={t('search.webPlaceholder')}
						value={webQuery}
					/>
					{/* Submit button */}
					<button
						className='mr-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground/25 transition-all duration-200 hover:bg-primary/12 hover:text-primary group-focus-within/ws:bg-primary/8 group-focus-within/ws:text-primary/70'
						title={t('search.searchButton')}
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
