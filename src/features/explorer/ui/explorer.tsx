import { useQuery } from '@tanstack/react-query';
import { VisuallyHidden } from 'radix-ui';
import { useEffect } from 'react';
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

	useEffect(() => {
		init(id);
	}, [id, init]);

	return (
		<DialogContent
			className='w-full overflow-hidden rounded-4xl bg-background/95 p-0 shadow-2xl ring-1 ring-border/50 backdrop-blur-2xl sm:max-w-3/4'
			showCloseButton={false}
		>
			<VisuallyHidden.Root>
				<DialogHeader>
					<DialogTitle>folder - {bookmark?.title}</DialogTitle>
					<DialogDescription>folder - {bookmark?.title}</DialogDescription>
				</DialogHeader>
			</VisuallyHidden.Root>
			<div className='flex h-[82dvh] w-full'>
				<ExplorerLeftSideBar />
				<ExplorerContent />
			</div>
		</DialogContent>
	);
};
