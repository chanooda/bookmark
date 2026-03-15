import { Button } from '@bookmark/ui/components/button';
import { type FormEvent, useState } from 'react';

function detectInputType(input: string): 'url' | 'search' {
	const trimmed = input.trim();
	if (/^https?:\/\//i.test(trimmed)) return 'url';
	if (/^www\./i.test(trimmed)) return 'url';
	if (/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/.*)?$/.test(trimmed)) return 'url';
	return 'search';
}

export function GoogleSearchBar() {
	const [query, setQuery] = useState('');

	function handleSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const trimmed = query.trim();
		if (!trimmed) return;

		if (detectInputType(trimmed) === 'url') {
			const url = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
			window.location.href = url;
		} else {
			window.location.href = `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
		}
	}

	return (
		<div className='relative flex items-center justify-center px-6 py-10'>
			{/* Gradient glow behind the bar */}
			<div className='pointer-events-none absolute inset-x-0 top-0 h-full bg-gradient-to-b from-primary/[0.05] via-transparent to-transparent' />

			<form className='relative flex w-full max-w-2xl items-center gap-2.5' onSubmit={handleSubmit}>
				<div className='relative flex-1'>
					<svg
						aria-hidden='true'
						className='pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground/50'
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
					<input
						className='h-12 w-full rounded-xl border border-border/60 bg-card/90 pl-12 pr-4 text-base text-foreground placeholder:text-muted-foreground/35 outline-none transition-all duration-200 focus:border-primary/40 focus:ring-2 focus:ring-primary/12 shadow-xl shadow-black/25'
						onChange={(e) => setQuery(e.target.value)}
						placeholder='Google 검색 또는 URL 입력'
						value={query}
					/>
				</div>
				<Button className='h-12 shrink-0 rounded-xl px-6 text-sm font-medium' type='submit'>
					이동
				</Button>
			</form>
		</div>
	);
}
