import { cn } from '@bookmark/ui/lib/utils';
import { LoginDialog } from '@/features/auth';
import { BookmarkCreateDialog, BookmarkEditDialog } from '@/features/bookmark';
import { FolderCreateDialog, FolderEditDialog } from '@/features/folder-manage';
import { SettingsDialog, useSettingStore } from '@/features/settings';
import { TagCreateDialog, TagEditDialog } from '@/features/tag-manage';
import { useChromeBrowserSync } from '@/shared/lib/chrome-sync';
import { BookmarkList } from '@/widgets/bookmark-list';
import { Header } from '@/widgets/header';
import { SearchHub } from '@/widgets/search-hub';
import { Sidebar } from '@/widgets/sidebar';

function SyncingScreen() {
	return (
		<div className='flex min-h-screen items-center justify-center bg-background'>
			<div className='flex flex-col items-center gap-5'>
				<div className='relative flex h-14 w-14 items-center justify-center'>
					<div className='absolute inset-0 animate-ping rounded-full border border-primary/20' />
					<div className='flex h-14 w-14 items-center justify-center rounded-full border border-primary/25 bg-primary/10'>
						<svg
							aria-hidden='true'
							className='h-5 w-5 animate-spin text-primary'
							fill='none'
							viewBox='0 0 24 24'
							xmlns='http://www.w3.org/2000/svg'
						>
							<circle
								className='opacity-25'
								cx='12'
								cy='12'
								r='10'
								stroke='currentColor'
								strokeWidth='4'
							/>
							<path
								className='opacity-75'
								d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
								fill='currentColor'
							/>
						</svg>
					</div>
				</div>
				<div className='flex flex-col items-center gap-1'>
					<p className='text-sm font-medium text-foreground/90'>동기화 중</p>
					<p className='text-xs text-muted-foreground/60'>Chrome 북마크를 동기화하는 중입니다...</p>
				</div>
			</div>
		</div>
	);
}

export function HomePage() {
	const { isSyncing } = useChromeBrowserSync();
	const { viewMode } = useSettingStore();
	const isGlass = viewMode === 'glass';

	if (isSyncing) return <SyncingScreen />;

	return (
		<div className='relative flex h-dvh min-h-screen flex-col overflow-hidden bg-background'>
			{/* Glass mode mesh gradient background */}
			{isGlass && (
				<div aria-hidden='true' className='pointer-events-none absolute inset-0 z-0'>
					<div
						className='absolute inset-0'
						style={{
							background:
								'radial-gradient(ellipse at 18% 28%, rgba(230,100,40,0.55) 0%, transparent 52%), radial-gradient(ellipse at 82% 12%, rgba(100,80,230,0.48) 0%, transparent 50%), radial-gradient(ellipse at 52% 88%, rgba(30,110,210,0.50) 0%, transparent 55%), radial-gradient(ellipse at 88% 68%, rgba(220,40,80,0.42) 0%, transparent 48%), radial-gradient(ellipse at 40% 55%, rgba(60,180,160,0.28) 0%, transparent 45%)',
						}}
					/>
					<div className='absolute inset-0 backdrop-blur-[120px]' />
				</div>
			)}

			<div className='relative z-10 flex h-dvh min-h-screen flex-col'>
				<Header />

				<div
					className={cn(
						'mx-auto flex w-full flex-1 flex-col overflow-hidden',
						isGlass ? '' : 'max-w-[1400px] px-6',
					)}
				>
					{/* Dual search */}
					<div className={cn(isGlass && 'px-6')}>
						<SearchHub />
					</div>

					{/* Sidebar + bookmark list */}
					<div className='flex flex-1 gap-7 overflow-hidden'>
						{!isGlass && <Sidebar />}
						<main className={cn('min-w-0 h-full flex-1 overflow-y-auto', isGlass ? '' : 'py-4')}>
							<BookmarkList />
						</main>
					</div>
				</div>
			</div>

			<BookmarkCreateDialog />
			<BookmarkEditDialog />
			<FolderCreateDialog />
			<FolderEditDialog />
			<TagCreateDialog />
			<TagEditDialog />
			<LoginDialog />
			<SettingsDialog />
		</div>
	);
}
