import { useQuery } from '@tanstack/react-query';
import { VisuallyHidden } from 'radix-ui';
import { useLayoutEffect } from 'react';
import { queries } from '@/shared/api';
import {
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/shared/shadcn/components/ui/dialog';
import { useExplorerStore } from '../model/explorer.store';
import { ExplorerContent } from './explorer-content';
import { ExplorerLeftSideBar } from './explorer-sidebar';

interface ExplorerProps {
	id: string;
}

export const Explorer = ({ id }: ExplorerProps) => {
	const init = useExplorerStore((s) => s.init);

	const { data: bookmark } = useQuery({
		...queries.bookmarks.detail(id),
	});

	useLayoutEffect(() => {
		init(id);
	}, [id, init]);

	const sidebarOpen = useExplorerStore((s) => s.sidebarOpen);
	const closeSidebar = useExplorerStore((s) => s.closeSidebar);

	return (
		<DialogContent
			className='w-full overflow-hidden rounded-4xl bg-background/95 p-0 shadow-2xl ring-1 ring-border/50 backdrop-blur-2xl sm:max-w-[90dvw]'
			showCloseButton={false}
		>
			<VisuallyHidden.Root>
				<DialogHeader>
					<DialogTitle>folder - {bookmark?.title}</DialogTitle>
					<DialogDescription>folder - {bookmark?.title}</DialogDescription>
				</DialogHeader>
			</VisuallyHidden.Root>
			<div className='relative flex h-[82dvh] w-full overflow-hidden'>
				{/* Mobile backdrop */}
				<button
					aria-label='사이드바 닫기'
					className={`absolute inset-0 z-10 bg-black/50 transition-opacity md:hidden ${
						sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
					}`}
					onClick={closeSidebar}
					onKeyDown={(e) => e.key === 'Enter' && closeSidebar()}
					tabIndex={sidebarOpen ? 0 : -1}
					type='button'
				/>
				{/* Sidebar: overlay on mobile, static on desktop */}
				<div
					className={`absolute inset-y-0 left-0 z-20 w-52 transition-transform duration-200 md:relative md:z-auto md:translate-x-0 md:transition-none ${
						sidebarOpen ? 'translate-x-0' : '-translate-x-full'
					}`}
				>
					<ExplorerLeftSideBar />
				</div>
				<ExplorerContent />
			</div>
		</DialogContent>
	);
};
