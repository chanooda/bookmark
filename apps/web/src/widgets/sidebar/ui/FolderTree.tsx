import type { Folder } from '@repo/types';
import { cn } from '@repo/ui/lib/utils';
import { createContext, useContext, useState } from 'react';
import { toast } from 'sonner';
import { buildFolderTree, type FolderNode, useFolders } from '@/entities/folder';
import { useBookmarkFilterStore } from '@/features/bookmark';
import { useDeleteFolder, useEditFolder, useFolderDialogStore } from '@/features/folder-manage';
import { useSettingStore } from '@/features/settings';
import { useChromeSyncService } from '@/shared/lib/chrome-sync';

// ─── Editing context ──────────────────────────────────────────────────────────

interface FolderEditingContextValue {
	editingNodeId: string | null;
	editingNodeName: string;
	onNameChange: (name: string) => void;
	onSubmit: () => void;
	onCancel: () => void;
}

const FolderEditingContext = createContext<FolderEditingContextValue | null>(null);

function useFolderEditing() {
	const ctx = useContext(FolderEditingContext);
	if (!ctx) throw new Error('useFolderEditing must be used within FolderTree');
	return ctx;
}

// ─── FolderNodeRow ────────────────────────────────────────────────────────────

interface FolderNodeRowProps {
	node: FolderNode;
	onAddChild: (parentId: string) => void;
	onStartEdit: (folder: Folder) => void;
	onDelete: (id: string) => void;
}

function FolderNodeRow({ node, onAddChild, onStartEdit, onDelete }: FolderNodeRowProps) {
	const { selectedFolderId, setSelectedFolderId, setSelectedTagId } = useBookmarkFilterStore();
	const { editingNodeId, editingNodeName, onNameChange, onSubmit, onCancel } = useFolderEditing();
	const [expanded, setExpanded] = useState(true);
	const hasChildren = node.children.length > 0;
	const isEditing = editingNodeId === node.id;

	return (
		<div>
			{isEditing ? (
				<div className='flex items-center gap-1 px-1 py-0.5'>
					<svg
						aria-hidden='true'
						className='h-3.5 w-3.5 shrink-0 text-muted-foreground'
						fill='none'
						stroke='currentColor'
						viewBox='0 0 24 24'
					>
						<path
							d='M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z'
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth={2}
						/>
					</svg>
					<input
						className='min-w-0 flex-1 rounded border border-primary/50 bg-background px-1.5 py-0.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/60'
						onChange={(e) => onNameChange(e.target.value)}
						onFocus={(e) => e.target.select()}
						onKeyDown={(e) => {
							if (e.key === 'Enter') {
								e.preventDefault();
								onSubmit();
							}
							if (e.key === 'Escape') {
								e.preventDefault();
								onCancel();
							}
						}}
						value={editingNodeName}
					/>
					<button
						className='shrink-0 rounded p-0.5 text-primary hover:bg-primary/10'
						onMouseDown={(e) => {
							e.preventDefault();
							onSubmit();
						}}
						title='저장 (Enter)'
						type='button'
					>
						<svg
							aria-hidden='true'
							className='h-3 w-3'
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'
						>
							<path
								d='M5 13l4 4L19 7'
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2.5}
							/>
						</svg>
					</button>
					<button
						className='shrink-0 rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground'
						onMouseDown={(e) => {
							e.preventDefault();
							onCancel();
						}}
						title='취소 (Esc)'
						type='button'
					>
						<svg
							aria-hidden='true'
							className='h-3 w-3'
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'
						>
							<path
								d='M6 18L18 6M6 6l12 12'
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2}
							/>
						</svg>
					</button>
				</div>
			) : (
				<div className='group flex items-center'>
					<button
						aria-label={expanded ? '접기' : '펼치기'}
						className='mr-0.5 flex h-4 w-4 shrink-0 items-center justify-center text-muted-foreground opacity-0 hover:text-foreground group-hover:opacity-100'
						onClick={() => setExpanded((v) => !v)}
						style={{ visibility: hasChildren ? 'visible' : 'hidden' }}
						type='button'
					>
						<svg
							aria-hidden='true'
							className={cn('h-2.5 w-2.5 transition-transform', expanded ? 'rotate-90' : '')}
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'
						>
							<path d='M9 5l7 7-7 7' strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} />
						</svg>
					</button>
					<button
						className={cn(
							'flex min-w-0 flex-1 items-center gap-1.5 rounded-lg px-2 py-2 text-sm transition-all',
							selectedFolderId === node.id
								? 'bg-primary/10 font-medium text-primary'
								: 'text-muted-foreground hover:bg-accent hover:text-foreground',
						)}
						onClick={() => {
							setSelectedFolderId(node.id);
							setSelectedTagId(undefined);
						}}
						type='button'
					>
						<svg
							aria-hidden='true'
							className='h-3.5 w-3.5 shrink-0'
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'
						>
							<path
								d='M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z'
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2}
							/>
						</svg>
						<span className='truncate'>{node.name}</span>
					</button>
					<div className='flex shrink-0 gap-0.5 pr-1 opacity-0 group-hover:opacity-100'>
						<button
							className='rounded-md p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground'
							onClick={() => onAddChild(node.id)}
							title='하위 폴더 추가'
							type='button'
						>
							<svg
								aria-hidden='true'
								className='h-3 w-3'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'
							>
								<path
									d='M12 4v16m8-8H4'
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
								/>
							</svg>
						</button>
						<button
							className='rounded-md p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground'
							onClick={() => onStartEdit(node)}
							title='이름 변경'
							type='button'
						>
							<svg
								aria-hidden='true'
								className='h-3 w-3'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'
							>
								<path
									d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
								/>
							</svg>
						</button>
						<button
							className='rounded-md p-0.5 text-muted-foreground hover:text-destructive'
							onClick={() => onDelete(node.id)}
							title='삭제'
							type='button'
						>
							<svg
								aria-hidden='true'
								className='h-3 w-3'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'
							>
								<path
									d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
								/>
							</svg>
						</button>
					</div>
				</div>
			)}
			{expanded && node.children.length > 0 && (
				<div className='ml-4'>
					{node.children.map((child) => (
						<FolderNodeRow
							key={child.id}
							node={child}
							onAddChild={onAddChild}
							onDelete={onDelete}
							onStartEdit={onStartEdit}
						/>
					))}
				</div>
			)}
		</div>
	);
}

// ─── FolderTree ───────────────────────────────────────────────────────────────

export function FolderTree() {
	const { data: folders = [] } = useFolders();
	const { selectedFolderId, setSelectedFolderId, setSelectedTagId } = useBookmarkFilterStore();
	const tree = buildFolderTree(folders);
	const { syncMode } = useSettingStore();
	const chromeSyncService = useChromeSyncService(syncMode);
	const { mutate: deleteFolder } = useDeleteFolder();
	const { mutate: editFolder } = useEditFolder();
	const { setCreateOpen } = useFolderDialogStore();

	const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
	const [editingNodeName, setEditingNodeName] = useState('');

	function handleDelete(id: string) {
		deleteFolder(id, {
			onSuccess: () => {
				if (chromeSyncService) {
					chromeSyncService
						.syncDeleteFolder(id)
						.catch(() => toast.error('Chrome 폴더 동기화에 실패했습니다.'));
				}
				if (selectedFolderId === id) {
					setSelectedFolderId(undefined);
					setSelectedTagId(undefined);
				}
			},
		});
	}

	function handleStartInlineEdit(folder: Folder) {
		setEditingNodeId(folder.id);
		setEditingNodeName(folder.name);
	}

	function handleInlineEditSubmit() {
		if (!editingNodeId || !editingNodeName.trim()) {
			setEditingNodeId(null);
			return;
		}
		const id = editingNodeId;
		const name = editingNodeName.trim();
		editFolder(
			{ id, dto: { name } },
			{
				onSuccess: () => {
					setEditingNodeId(null);
					if (chromeSyncService) {
						chromeSyncService
							.syncUpdateFolder(id, name)
							.catch(() => toast.error('Chrome 폴더 동기화에 실패했습니다.'));
					}
				},
			},
		);
	}

	function handleInlineEditCancel() {
		setEditingNodeId(null);
		setEditingNodeName('');
	}

	return (
		<FolderEditingContext.Provider
			value={{
				editingNodeId,
				editingNodeName,
				onNameChange: setEditingNodeName,
				onSubmit: handleInlineEditSubmit,
				onCancel: handleInlineEditCancel,
			}}
		>
			<div className='flex flex-col gap-0.5'>
				{tree.map((node) => (
					<FolderNodeRow
						key={node.id}
						node={node}
						onAddChild={(parentId) => setCreateOpen(true, parentId)}
						onDelete={handleDelete}
						onStartEdit={handleStartInlineEdit}
					/>
				))}
			</div>
		</FolderEditingContext.Provider>
	);
}
