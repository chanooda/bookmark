import { Button } from '@bookmark/ui/components/button';
import { Bookmark, Moon, Plus, Settings, Sun } from 'lucide-react';
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
						<Bookmark
							aria-hidden='true'
							className='h-3.5 w-3.5 text-primary'
							fill='currentColor'
							strokeWidth={0}
						/>
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
							<Sun aria-hidden='true' className='size-4' />
						) : (
							<Moon aria-hidden='true' className='size-4' />
						)}
					</Button>

					<Button
						className='size-9 rounded-lg p-0 text-muted-foreground hover:text-foreground'
						onClick={() => setSettingsOpen(true)}
						size='sm'
						title={t('header.settings')}
						variant='ghost'
					>
						<Settings aria-hidden='true' className='h-4 w-4' />
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
						<Plus aria-hidden='true' className='mr-1 h-3 w-3' strokeWidth={2.5} />
						{t('header.addBookmark')}
					</Button>
				</div>
			</div>
		</header>
	);
}
