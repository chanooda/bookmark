import { useQuery } from '@tanstack/react-query';
import { ChevronRight, FolderIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Bookmark } from '@/entities/bookmark';
import { queries } from '@/shared/api';
import { useExplorerStore } from '../model/explorer.store';

export const ExplorerLeftSideBar = () => {
	const currentId = useExplorerStore((s) => s.currentId);
	const navigate = useExplorerStore((s) => s.navigate);

	const { data } = useQuery({
		...queries.bookmarks.all,
	});

	if (!data) return null;
	const bookmarks = data.tree;

	return (
		<div className='flex h-full w-52 shrink-0 flex-col overflow-auto border-r bg-background'>
			<div className='flex h-12 items-center border-b px-4'>
				<span className='font-semibold text-[10px] text-muted-foreground/50 uppercase tracking-widest'>
					폴더
				</span>
			</div>
			<div className='h-full flex-1 overflow-y-auto p-2'>
				{bookmarks.map((bookmark) => (
					<ExplorerTreeNode
						bookmark={bookmark}
						currentId={currentId}
						key={bookmark.id}
						navigateFolder={navigate}
					/>
				))}
			</div>
		</div>
	);
};

export const ExplorerTreeNode = ({
	bookmark,
	currentId,
	navigateFolder,
}: {
	bookmark: Bookmark;
	currentId: string;
	navigateFolder: (id: string) => void;
}) => {
	const children = bookmark?.children || [];
	const isActive = bookmark.id === currentId;
	const isFolder = children.length > 0;
	const hasFolderChildren = children.some((child) => (child?.children || [])?.length > 0);
	const [expanded, setExpanded] = useState(isActive);

	useEffect(() => {
		if (isActive) setExpanded(true);
	}, [isActive]);

	if (!isFolder) return null;

	return (
		<div>
			<div
				className={`flex items-center gap-0.5 rounded-lg transition-colors duration-100 ${
					isActive
						? 'bg-accent text-foreground'
						: 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
				}`}
			>
				<button
					className='flex h-6 w-5 shrink-0 items-center justify-center'
					onClick={() => hasFolderChildren && setExpanded((v) => !v)}
					type='button'
				>
					{hasFolderChildren && (
						<ChevronRight
							aria-hidden='true'
							className={`h-3 w-3 transition-transform duration-150 ${expanded ? 'rotate-90' : ''}`}
						/>
					)}
				</button>
				<button
					className='flex min-w-0 flex-1 items-center gap-1.5 truncate py-1.5 pr-2 text-left font-medium text-xs'
					onClick={() => navigateFolder(bookmark.id)}
					type='button'
				>
					<FolderIcon
						aria-hidden='true'
						className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-foreground' : 'text-muted-foreground/60'}`}
					/>
					<span className='truncate'>{bookmark.title}</span>
				</button>
			</div>

			{expanded && hasFolderChildren && (
				<div className='ml-3 border-border/30 border-l pl-1.5'>
					{(bookmark?.children || []).map((child) => (
						<ExplorerTreeNode
							bookmark={child}
							currentId={currentId}
							key={child.id}
							navigateFolder={navigateFolder}
						/>
					))}
				</div>
			)}
		</div>
	);
};
