import { Button } from '@bookmark/ui/components/button';
import { useTranslation } from 'react-i18next';
import { useBookmarkDialogStore } from '@/features/bookmark';
import { useSettingStore } from '@/features/settings';
import { useTheme } from '@/shared/lib/theme';
import { ViewModeToggle } from './ViewModeToggle';

export function Header() {
	const { t } = useTranslation();
	const { viewMode, setViewMode, setSettingsOpen } = useSettingStore();
	const { setCreateOpen } = useBookmarkDialogStore();
	const { resolvedTheme, setTheme } = useTheme();

	function toggleTheme() {
		setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
	}

	return (
		<header className='sticky top-0 z-10 border-b border-border/40 bg-background/90 backdrop-blur-md'>
			<div className='mx-auto flex max-w-[1400px] items-center gap-4 px-6 py-2.5'>
				{/* Logo */}
				<div className='flex items-center gap-2'>
					<div className='flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-inset ring-primary/25'>
						<svg
							aria-hidden='true'
							className='h-3.5 w-3.5 text-primary'
							fill='currentColor'
							viewBox='0 0 24 24'
						>
							<path d='M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z' />
						</svg>
					</div>
					<span className='font-brand text-[1.15rem] font-semibold leading-none tracking-tight text-foreground/90'>
						mark.
					</span>
				</div>

				<div className='flex-1' />

				{/* Actions */}
				<div className='flex items-center gap-1'>
					<ViewModeToggle onViewModeChange={setViewMode} viewMode={viewMode} />

					<Button
						className='rounded-lg size-9 shrink-0 text-muted-foreground hover:text-foreground'
						onClick={toggleTheme}
						size='sm'
						title={resolvedTheme === 'dark' ? t('theme.switchToLight') : t('theme.switchToDark')}
						variant='ghost'
					>
						{resolvedTheme === 'dark' ? (
							<svg
								aria-hidden='true'
								className='size-4'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'
							>
								<path
									d='M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364-.707.707M6.343 17.657l-.707.707m12.728 0-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z'
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
								/>
							</svg>
						) : (
							<svg
								aria-hidden='true'
								className='size-4'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'
							>
								<path
									d='M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z'
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
								/>
							</svg>
						)}
					</Button>

					<Button
						className='size-9 rounded-lg p-0 text-muted-foreground hover:text-foreground'
						onClick={() => setSettingsOpen(true)}
						size='sm'
						title={t('header.settings')}
						variant='ghost'
					>
						<svg
							aria-hidden='true'
							className='h-4 w-4'
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'
						>
							<path
								d='M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2}
							/>
							<path
								d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2}
							/>
						</svg>
					</Button>

					{/* TODO: 추후 버전에서 클라우드 동기화 기능 오픈 예정 */}
					{/* <div className='mx-1.5 h-4 w-px bg-border/50' />
					{mode === 'local' ? (
						<Button
							className='h-10 rounded-lg border-border/50 text-xs'
							onClick={() => setLoginOpen(true)}
							size='sm'
							variant='outline'
						>
							동기화
						</Button>
					) : (
						<Button
							className='h-10 rounded-lg text-xs text-muted-foreground'
							onClick={logout}
							size='sm'
							variant='ghost'
						>
							로그아웃
						</Button>
					)} */}

					<Button
						className='h-10 rounded-lg text-xs font-medium'
						onClick={() => setCreateOpen(true)}
						size='sm'
					>
						<svg
							aria-hidden='true'
							className='mr-1 h-3 w-3'
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'
						>
							<path
								d='M12 4v16m8-8H4'
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2.5}
							/>
						</svg>
						{t('header.addBookmark')}
					</Button>
				</div>
			</div>
		</header>
	);
}
