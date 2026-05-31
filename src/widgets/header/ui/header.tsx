import { Bookmark, Plus } from 'lucide-react';
import { Button } from '@/shared/shadcn/components/ui/button';

export const Header = () => {
	return (
		<div className='w-full bg-background px-6 py-4'>
			<div className='flex w-full justify-between'>
				<div className='flex items-center gap-2'>
					<div className='flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/25 ring-inset'>
						<Bookmark aria-hidden='true' className='h-3.5 w-3.5 text-primary' fill='currentColor' />
					</div>
					<span className='font-brand font-semibold text-[1.15rem] text-foreground/90 leading-none tracking-tight'>
						mark.
					</span>
				</div>

				<Button className='h-10 rounded-lg font-medium text-xs' size='sm'>
					<Plus aria-hidden='true' className='mr-1 h-3 w-3' /> 북마크 추가
				</Button>
			</div>
		</div>
	);
};
