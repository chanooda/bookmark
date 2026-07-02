import { debounce } from '@chanooda/libs';
import { ArrowRight, Bookmark, X } from 'lucide-react';
import { type ChangeEvent, type FormEvent, useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFilterStore } from '@/features/bookmark';
import { GoogleIcon } from '@/shared/assets';

export const Search = () => {
	const { t } = useTranslation();
	const setSearch = useFilterStore((store) => store.setSearch);
	const [inputValue, setInputValue] = useState('');
	const [googleQuery, setGoogleQuery] = useState('');
	const inputRef = useRef<HTMLInputElement>(null);

	const debouncedSetSearch = useCallback(
		debounce((value: string) => setSearch(value), 500),
		[],
	);

	const handleChangeBookmarkInput = (e: ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setInputValue(value);
		debouncedSetSearch(value);
	};

	const handleGoogleSearch = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!googleQuery.trim()) return;
		location.href = `https://www.google.com/search?q=${encodeURIComponent(googleQuery)}`;
	};

	const handleClear = () => {
		setInputValue('');
		setSearch('');
		if (inputRef.current) inputRef.current.focus();
	};

	return (
		<header className='mb-6 flex w-full items-end'>
			<div className='flex w-full gap-4'>
				<div className='group/bm flex flex-1 items-center overflow-hidden rounded-xl border border-border/50 bg-card/70 shadow-sm backdrop-blur-sm transition-all duration-200 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10'>
					{/* Label badge */}
					<div className='flex shrink-0 items-center gap-1.5 border-border/40 border-r px-3.5 py-3 transition-colors duration-200 group-focus-within/bm:border-primary/25'>
						<Bookmark
							aria-hidden='true'
							className='h-3.5 w-3.5 shrink-0 text-primary/55 transition-colors duration-200 group-focus-within/bm:text-primary/85'
							fill='currentColor'
						/>
						<span className='font-label text-[9px] text-primary/50 uppercase tracking-[0.13em] transition-colors duration-200 group-focus-within/bm:text-primary/80'>
							{t('search.bookmarkLabel')}
						</span>
					</div>
					{/* Input */}
					<input
						aria-label={t('search.bookmarkAriaLabel')}
						className='h-11 flex-1 bg-transparent px-3.5 text-foreground text-sm outline-none placeholder:text-muted-foreground/35'
						onChange={handleChangeBookmarkInput}
						placeholder={t('search.bookmarkPlaceholder')}
						ref={inputRef}
						value={inputValue}
					/>
					{/* Clear button — appears when there's text */}
					{inputValue && (
						<button
							aria-label={t('search.clearAriaLabel')}
							className='mr-3 flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground/35 transition-colors duration-150 hover:text-foreground/60'
							onClick={handleClear}
							type='button'
						>
							<X aria-hidden='true' className='h-3 w-3' />
						</button>
					)}
				</div>
				<form
					className='group/gl flex flex-1 items-center overflow-hidden rounded-xl border border-border/50 bg-card/70 shadow-sm backdrop-blur-sm transition-all duration-200 focus-within:border-blue-400/40 focus-within:ring-2 focus-within:ring-blue-400/10'
					onSubmit={handleGoogleSearch}
				>
					{/* Label badge — clickable link to google.com */}
					<a
						aria-label={t('search.googleAriaLabel')}
						className='flex shrink-0 items-center gap-1.5 border-border/40 border-r px-3.5 py-3 transition-all duration-200 hover:bg-blue-500/5 group-focus-within/gl:border-blue-400/25'
						href='https://www.google.com'
						title={t('search.googleAriaLabel')}
					>
						<GoogleIcon />
						<span className='font-label text-[9px] text-blue-400/50 uppercase tracking-[0.13em] transition-colors duration-200 group-focus-within/gl:text-blue-400/85'>
							Google
						</span>
					</a>
					{/* Input */}
					<input
						aria-label={t('search.googleInputAriaLabel')}
						className='h-11 flex-1 bg-transparent px-3.5 text-foreground text-sm outline-none placeholder:text-muted-foreground/35'
						onChange={(e) => setGoogleQuery(e.target.value)}
						onFocus={(e) => e.target.select()}
						placeholder={t('search.googlePlaceholder')}
						value={googleQuery}
					/>
					{/* Submit button */}
					<button
						className='mr-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground/25 transition-all duration-200 hover:bg-blue-500/12 hover:text-blue-400 group-focus-within/gl:bg-blue-500/8 group-focus-within/gl:text-blue-400/70'
						title={t('search.submitTitle')}
						type='submit'
					>
						<ArrowRight aria-hidden='true' className='h-3.5 w-3.5' />
					</button>
				</form>
			</div>
		</header>
	);
};
