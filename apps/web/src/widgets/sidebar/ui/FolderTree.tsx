import type { Folder } from '@bookmark/types';
import { cn } from '@bookmark/ui/lib/utils';
import { Check, ChevronRight, Folder as FolderIcon, Pencil, Plus, Trash2, X } from 'lucide-react';
import { createContext, useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
	const { t } = useTranslation();
	const hasChildren = node.children.length > 0;
	const isEditing = editingNodeId === node.id;

	return (
		<div>
			{isEditing ? (
				<div className='flex items-center gap-1 px-1 py-0.5'>
					<FolderIcon aria-hidden='true' className='h-3.5 w-3.5 shrink-0 text-muted-foreground' />
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
						title={t('folder.saveEnter')}
						type='button'
					>
						<Check aria-hidden='true' className='h-3 w-3' strokeWidth={2.5} />
					</button>
					<button
						className='shrink-0 rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground'
						onMouseDown={(e) => {
							e.preventDefault();
							onCancel();
						}}
						title={t('folder.cancelEsc')}
						type='button'
					>
						<X aria-hidden='true' className='h-3 w-3' />
					</button>
				</div>
			) : (
				<div className='group flex items-center'>
					<button
						aria-label={expanded ? t('folder.collapse') : t('folder.expand')}
						className='mr-0.5 flex h-4 w-4 shrink-0 items-center justify-center text-muted-foreground opacity-0 hover:text-foreground group-hover:opacity-100'
						onClick={() => setExpanded((v) => !v)}
						style={{ visibility: hasChildren ? 'visible' : 'hidden' }}
						type='button'
					>
						<ChevronRight
							aria-hidden='true'
							className={cn('h-2.5 w-2.5 transition-transform', expanded ? 'rotate-90' : '')}
						/>
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
						<FolderIcon aria-hidden='true' className='h-3.5 w-3.5 shrink-0' />
						<span className='truncate'>{node.name}</span>
					</button>
					<div className='flex shrink-0 gap-0.5 pr-1 opacity-0 group-hover:opacity-100'>
						<button
							className='rounded-md p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground'
							onClick={() => onAddChild(node.id)}
							title={t('folder.addChild')}
							type='button'
						>
							<Plus aria-hidden='true' className='h-3 w-3' />
						</button>
						<button
							className='rounded-md p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground'
							onClick={() => onStartEdit(node)}
							title={t('folder.rename_action')}
							type='button'
						>
							<Pencil aria-hidden='true' className='h-3 w-3' />
						</button>
						<button
							className='rounded-md p-0.5 text-muted-foreground hover:text-destructive'
							onClick={() => onDelete(node.id)}
							title={t('folder.delete')}
							type='button'
						>
							<Trash2 aria-hidden='true' className='h-3 w-3' />
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
	const { t } = useTranslation();
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
		if (!window.confirm(t('folder.deleteConfirm'))) return;
		deleteFolder(id, {
			onSuccess: () => {
				if (chromeSyncService) {
					chromeSyncService.syncDeleteFolder(id).catch(() => toast.error(t('folder.syncError')));
				}
				if (selectedFolderId === id) {
					setSelectedFolderId(undefined);
					setSelectedTagId(undefined);
				}
			},
			onError: () => toast.error(t('folder.deleteError')),
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
							.catch(() => toast.error(t('folder.syncError')));
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
