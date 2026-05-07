import { DialogContent } from '@/shared/shadcn/components/ui/dialog';

type FolderExplorerProps = {};

export const FolderExplorer = ({}: FolderExplorerProps) => {
	return (
		<DialogContent className='h-[82dvh] w-full overflow-hidden rounded-4xl shadow-2xl ring-1 ring-border/50 backdrop-blur-2xl sm:max-w-2/3'>
			<div className='flex w-52 shrink-0 flex-col border-border/40 border-r bg-muted/20'>
				<div className='border-border/40 border-b px-4 py-3'>
					<span className='font-semibold text-[10px] text-muted-foreground/50 uppercase tracking-widest'>
						폴더
					</span>
				</div>
				{/* <div className='flex-1 overflow-y-auto p-2'>
					{folderTree.map((node) => (
						<ExplorerTreeNode
							ancestorIds={ancestorIds}
							currentFolderId={currentFolderId}
							key={node.id}
							node={node}
							onNavigate={setCurrentFolderId}
						/>
					))}
				</div> */}
			</div>
		</DialogContent>
	);
};
