import { Bookmark, Moon, Plus, Sun } from 'lucide-react';
import { overlay } from 'overlay-kit';
import { BOOKMARK_ROOT_ID } from '@/shared/config';
import { useTheme } from '@/shared/libs/theme';
import { Button } from '@/shared/shadcn/components/ui/button';
import { ItemFormDialog } from '@/shared/ui/item-form-dialog';

export const Header = () => {
	const { theme, setTheme } = useTheme();

	const handleClickAddBookmarkBtn = () => {
		overlay.open(({ isOpen, close, unmount }) => (
			<ItemFormDialog
				close={close}
				defaultTab='bookmark'
				isOpen={isOpen}
				parentId={String(BOOKMARK_ROOT_ID)}
				unmount={unmount}
			/>
		));
	};

	const isDark =
		theme === 'dark' ||
		(theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

	const toggleTheme = () => {
		setTheme(isDark ? 'light' : 'dark');
	};

	return (
		<div className='w-full bg-background px-6 py-4'>
			<div className='flex w-full justify-between'>
				<div className='flex items-center gap-2'>
					<div className='flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/25 ring-inset'>
						<Bookmark
							aria-hidden='true'
							className='h-3.5 w-3.5 text-primary'
							fill='currentColor'
							onClick={handleClickAddBookmarkBtn}
						/>
					</div>
					<span className='font-brand font-semibold text-[1.15rem] text-foreground/90 leading-none tracking-tight'>
						mark.
					</span>
				</div>

				<div className='flex items-center gap-2'>
					<Button
						aria-label='테마 변경'
						onClick={toggleTheme}
						size='icon'
						type='button'
						variant='ghost'
					>
						{isDark ? (
							<Sun aria-hidden='true' className='h-4 w-4' />
						) : (
							<Moon aria-hidden='true' className='h-4 w-4' />
						)}
					</Button>
					<Button
						className='h-10 rounded-lg font-medium text-xs'
						onClick={handleClickAddBookmarkBtn}
						size='sm'
						type='button'
					>
						<Plus aria-hidden='true' className='mr-1 h-3 w-3' /> 북마크 추가
					</Button>
				</div>
			</div>
		</div>
	);
};
