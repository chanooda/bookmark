import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Menu, PencilLine, Plus, Trash2, X } from 'lucide-react';
import { overlay } from 'overlay-kit';
import { findById } from '@/entities/bookmark/libs/findBookmarkById';
import { ItemFormDialog } from '@/shared/ui/item-form-dialog';
import { mutations, queries } from '@/shared/api';
import { DialogClose } from '@/shared/shadcn/components/ui/dialog';
import { DeleteConfirmDialog } from '@/shared/ui/delete-confirm-dialog';
import { findPath } from '../lib/find-path';
import { useExplorerStore } from '../model/explorer.store';

export const ExplorerContentHeader = () => {
	const rootId = useExplorerStore((s) => s.rootId);
	const currentId = useExplorerStore((s) => s.currentId);
	const navigate = useExplorerStore((s) => s.navigate);
	const toggleSidebar = useExplorerStore((s) => s.toggleSidebar);

	const queryClient = useQueryClient();
	const { data: bookmarks } = useQuery({ ...queries.bookmarks.all });

	const fullPath = bookmarks ? findPath(bookmarks, currentId) : [];
	const rootIndex = fullPath.findIndex((n) => n.id === rootId);
	const path = rootIndex >= 0 ? fullPath.slice(rootIndex) : fullPath;
	const isRoot = path.length <= 1;

	const currentFolder = bookmarks ? findById(bookmarks, currentId) : null;

	const handleBack = () => {
		const parent = path[path.length - 2];
		if (parent) navigate(parent.id);
	};

	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: queries.bookmarks.all.queryKey });

	const { mutate: deleteFolder } = useMutation({
		...mutations.bookmark.deleteFolder(),
		onSuccess() {
			invalidate();
			handleBack();
		},
	});

	return (
		<div className='flex h-12 w-full shrink-0 items-center justify-between border-b px-3'>
			{/* breadcrumb */}
			<div className='flex min-w-0 items-center gap-0.5'>
				<button
					className='flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden'
					onClick={toggleSidebar}
					type='button'
				>
					<Menu className='h-4 w-4' />
				</button>
				{!isRoot && (
					<button
						className='flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'
						onClick={handleBack}
						type='button'
					>
						<ChevronLeft className='h-4 w-4' />
					</button>
				)}
				{path.map((node, i) => {
					const isLast = i === path.length - 1;
					return (
						<div className='flex min-w-0 items-center' key={node.id}>
							{i > 0 && (
								<ChevronRight className='mx-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/40' />
							)}
							<button
								className={`max-w-[200px] truncate rounded px-1 py-0.5 text-sm transition-colors ${
									isLast
										? 'font-semibold text-foreground'
										: 'text-muted-foreground hover:text-foreground'
								}`}
								disabled={isLast}
								onClick={() => !isLast && navigate(node.id)}
								type='button'
							>
								{node.title}
							</button>
						</div>
					);
				})}
			</div>

			{/* actions */}
			<div className='flex shrink-0 items-center'>
				<button
					className='flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'
					onClick={() =>
						overlay.open(({ isOpen, close, unmount }) => (
							<ItemFormDialog
								close={close}
								folderId={currentId}
								initialTitle={currentFolder?.title ?? ''}
								isOpen={isOpen}
								parentId={currentFolder?.parentId ?? ''}
								unmount={unmount}
							/>
						))
					}
					title='폴더 이름 수정'
					type='button'
				>
					<PencilLine className='h-3.5 w-3.5' />
				</button>
				<button
					className='flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'
					onClick={() =>
						overlay.open(({ isOpen, close, unmount }) => (
							<DeleteConfirmDialog
								close={close}
								description={`"${currentFolder?.title}" 폴더와 모든 항목이 삭제됩니다. 이 작업은 되돌릴 수 없습니다.`}
								isOpen={isOpen}
								onConfirm={() => deleteFolder({ id: currentId })}
								title='폴더 삭제'
								unmount={unmount}
							/>
						))
					}
					title='폴더 삭제'
					type='button'
				>
					<Trash2 className='h-3.5 w-3.5' />
				</button>

				<div className='mx-2 h-4 w-px bg-border' />

				<button
					className='flex h-7 items-center gap-1 rounded-lg px-2 text-muted-foreground text-xs transition-colors hover:bg-accent hover:text-foreground'
					onClick={() =>
						overlay.open(({ isOpen, close, unmount }) => (
							<ItemFormDialog
								close={close}
								defaultTab='folder'
								isOpen={isOpen}
								parentId={currentId}
								unmount={unmount}
							/>
						))
					}
					type='button'
				>
					<Plus className='h-3.5 w-3.5' />
					폴더
				</button>
				<button
					className='flex h-7 items-center gap-1 rounded-lg px-2 text-muted-foreground text-xs transition-colors hover:bg-accent hover:text-foreground'
					onClick={() =>
						overlay.open(({ isOpen, close, unmount }) => (
							<ItemFormDialog
								close={close}
								defaultTab='bookmark'
								isOpen={isOpen}
								parentId={currentId}
								unmount={unmount}
							/>
						))
					}
					type='button'
				>
					<Plus className='h-3.5 w-3.5' />
					북마크
				</button>

				<div className='mx-2 h-4 w-px bg-border' />

				<DialogClose asChild>
					<button
						className='flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'
						type='button'
					>
						<X className='h-4 w-4' />
					</button>
				</DialogClose>
			</div>
		</div>
	);
};
