import { closestCenter, DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import {
	rectSortingStrategy,
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Bookmark, Folder } from '@repo/types';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { useBookmarks, useReorderBookmarks } from '@/entities/bookmark';
import { buildFolderTree, type FolderNode, useFolders, useReorderFolders } from '@/entities/folder';
import { useBookmarkDialogStore } from '@/features/bookmark';
import { useDeleteFolder, useFolderDialogStore } from '@/features/folder-manage';
import { useSettingStore } from '@/features/settings';
import { useChromeSyncService } from '@/shared/lib/chrome-sync';
import { useSortableReorder } from '@/shared/lib/dnd/useSortableReorder';
import { stripProtocol } from '@/shared/lib/url';
import { FaviconImg } from '@/shared/ui';

// ─── Modal bookmark card ───────────────────────────────────────────────────────

interface ModalBookmarkCardProps {
	bookmark: Bookmark;
	onEdit: (bm: Bookmark) => void;
	onDelete: (bm: Bookmark) => void;
}

function ModalBookmarkCard({ bookmark, onEdit, onDelete }: ModalBookmarkCardProps) {
	const fallbackLetter = (bookmark.title || bookmark.url).charAt(0).toUpperCase();

	return (
		<a
			className='group/card relative flex items-start gap-3 overflow-hidden rounded-xl px-4 py-3.5 transition-all duration-200 hover:bg-foreground/[0.04]'
			href={bookmark.url}
			rel='noopener noreferrer'
			target='_blank'
		>
			{/* Favicon */}
			{bookmark.favicon ? (
				<FaviconImg
					globeClassName='size-6 text-muted-foreground/50'
					imgClassName='size-6 rounded-[8px] object-cover'
					src={bookmark.favicon}
				/>
			) : (
				<span className='text-base font-bold text-white'>{fallbackLetter}</span>
			)}

			{/* Content */}
			<div className='min-w-0 flex-1 pr-14'>
				<p className='line-clamp-2 text-sm font-semibold leading-snug text-foreground/90 transition-colors group-hover/card:text-foreground'>
					{bookmark.title || stripProtocol(bookmark.url)}
				</p>
				<p className='mt-0.5 truncate font-mono text-[10px] tracking-tight text-muted-foreground/50'>
					{stripProtocol(bookmark.url)}
				</p>
				{bookmark.description && (
					<p className='mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground/70'>
						{bookmark.description}
					</p>
				)}
				{bookmark.tags.length > 0 && (
					<div className='mt-1.5 flex flex-wrap gap-1'>
						{bookmark.tags.map((tag) => (
							<span
								className='rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide'
								key={tag.id}
								style={{
									backgroundColor: `${tag.color}20`,
									color: tag.color,
									border: `1px solid ${tag.color}40`,
								}}
							>
								{tag.name}
							</span>
						))}
					</div>
				)}
			</div>

			{/* Action buttons */}
			<div className='absolute top-2.5 right-2 z-10 flex items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover/card:opacity-100'>
				<button
					className='flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/50 transition-all duration-150 hover:bg-accent hover:text-foreground'
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						onEdit(bookmark);
					}}
					title='수정'
					type='button'
				>
					<svg
						aria-hidden='true'
						className='h-3.5 w-3.5'
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
					className='flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/50 transition-all duration-150 hover:bg-destructive/15 hover:text-destructive'
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						onDelete(bookmark);
					}}
					title='삭제'
					type='button'
				>
					<svg
						aria-hidden='true'
						className='h-3.5 w-3.5'
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
		</a>
	);
}

// ─── Folder tree node (left sidebar) ─────────────────────────────────────────

interface FolderTreeNodeProps {
	node: FolderNode;
	currentFolderId: string;
	onNavigate: (id: string) => void;
	ancestorIds: string[];
}

function FolderTreeNode({ node, currentFolderId, onNavigate, ancestorIds }: FolderTreeNodeProps) {
	const isActive = node.id === currentFolderId;
	const isAncestor = ancestorIds.includes(node.id);
	const hasChildren = node.children.length > 0;
	const [expanded, setExpanded] = useState(isAncestor || isActive);

	useEffect(() => {
		if (isAncestor || isActive) setExpanded(true);
	}, [isAncestor, isActive]);

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
					onClick={() => hasChildren && setExpanded((v) => !v)}
					type='button'
				>
					{hasChildren && (
						<svg
							aria-hidden='true'
							className={`h-3 w-3 transition-transform duration-150 ${expanded ? 'rotate-90' : ''}`}
							fill='currentColor'
							viewBox='0 0 24 24'
						>
							<path d='M9 18l6-6-6-6' strokeLinecap='round' strokeLinejoin='round' />
						</svg>
					)}
				</button>
				<button
					className='flex min-w-0 flex-1 items-center gap-1.5 truncate py-1.5 pr-2 text-left text-xs font-medium'
					onClick={() => onNavigate(node.id)}
					type='button'
				>
					<svg
						aria-hidden='true'
						className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-foreground' : 'text-muted-foreground/60'}`}
						fill='none'
						stroke='currentColor'
						viewBox='0 0 24 24'
					>
						<path
							d='M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z'
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth={1.8}
						/>
					</svg>
					<span className='truncate'>{node.name}</span>
				</button>
			</div>

			{expanded && hasChildren && (
				<div className='ml-3 border-l border-border/30 pl-1.5'>
					{node.children.map((child) => (
						<FolderTreeNode
							ancestorIds={ancestorIds}
							currentFolderId={currentFolderId}
							key={child.id}
							node={child}
							onNavigate={onNavigate}
						/>
					))}
				</div>
			)}
		</div>
	);
}

// ─── Explorer folder item (right panel) ──────────────────────────────────────

interface ExplorerFolderItemProps {
	folder: Folder;
	onNavigate: () => void;
	onEdit: () => void;
	onDelete: () => void;
}

function ExplorerFolderItem({ folder, onNavigate, onEdit, onDelete }: ExplorerFolderItemProps) {
	return (
		<div className='group relative'>
			<button
				className='flex w-full flex-col items-center gap-1.5 rounded-xl p-3 text-center transition-colors duration-150 hover:bg-accent'
				onClick={onNavigate}
				type='button'
			>
				<svg
					aria-hidden='true'
					className='h-10 w-10 text-blue-400/80'
					fill='currentColor'
					viewBox='0 0 24 24'
				>
					<path d='M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z' />
				</svg>
				<span className='line-clamp-2 text-xs font-medium text-foreground/80'>{folder.name}</span>
			</button>

			{/* Hover actions */}
			<div className='absolute top-1 right-1 flex items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100'>
				<button
					className='flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/50 hover:bg-background hover:text-foreground'
					onClick={(e) => {
						e.stopPropagation();
						onEdit();
					}}
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
					className='flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/50 hover:bg-destructive/15 hover:text-destructive'
					onClick={(e) => {
						e.stopPropagation();
						onDelete();
					}}
					title='폴더 삭제'
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
	);
}

// ─── Sortable wrappers ────────────────────────────────────────────────────────

function SortableFolderItem({ folder, onNavigate, onEdit, onDelete }: ExplorerFolderItemProps) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: folder.id,
	});

	return (
		<div
			ref={setNodeRef}
			style={{
				transform: CSS.Transform.toString(transform),
				transition,
				opacity: isDragging ? 0.5 : 1,
				cursor: isDragging ? 'grabbing' : 'grab',
			}}
			{...attributes}
			{...listeners}
		>
			<ExplorerFolderItem
				folder={folder}
				onDelete={onDelete}
				onEdit={onEdit}
				onNavigate={onNavigate}
			/>
		</div>
	);
}

function SortableBookmarkCard({ bookmark, onEdit, onDelete }: ModalBookmarkCardProps) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: bookmark.id,
	});

	return (
		<div
			ref={setNodeRef}
			style={{
				transform: CSS.Transform.toString(transform),
				transition,
				opacity: isDragging ? 0.5 : 1,
				cursor: isDragging ? 'grabbing' : 'grab',
			}}
			{...attributes}
			{...listeners}
		>
			<ModalBookmarkCard bookmark={bookmark} onDelete={onDelete} onEdit={onEdit} />
		</div>
	);
}

// ─── File explorer modal ──────────────────────────────────────────────────────

export interface FileExplorerModalProps {
	initialFolderId: string;
	visible: boolean;
	onClose: () => void;
	onEditBookmark: (bm: Bookmark) => void;
	onDeleteBookmark: (bm: Bookmark) => void;
}

export function FileExplorerModal({
	initialFolderId,
	visible,
	onClose,
	onEditBookmark,
	onDeleteBookmark,
}: FileExplorerModalProps) {
	const [currentFolderId, setCurrentFolderId] = useState(initialFolderId);
	const { data: allFolders = [] } = useFolders();
	const { data: bookmarks = [] } = useBookmarks({ folderId: currentFolderId });
	const { setCreateOpen: setFolderCreateOpen, setEditTarget: setFolderEditTarget } =
		useFolderDialogStore();
	const { setCreateOpen: setBookmarkCreateOpen } = useBookmarkDialogStore();
	const { mutate: deleteFolder } = useDeleteFolder();
	const { mutate: reorderFolders } = useReorderFolders();
	const { mutate: reorderBookmarks } = useReorderBookmarks();
	const { syncMode } = useSettingStore();
	const chromeSyncService = useChromeSyncService(syncMode);

	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

	const folderTree = useMemo(() => buildFolderTree(allFolders), [allFolders]);

	const subFolders = useMemo(
		() => allFolders.filter((f) => f.parentId === currentFolderId),
		[allFolders, currentFolderId],
	);

	const currentFolder = useMemo(
		() => allFolders.find((f) => f.id === currentFolderId) ?? null,
		[allFolders, currentFolderId],
	);

	const folderById = useMemo(() => new Map(allFolders.map((f) => [f.id, f])), [allFolders]);

	const breadcrumb = useMemo(() => {
		const crumbs: Folder[] = [];
		let id: string | null = currentFolderId;
		while (id) {
			const f = folderById.get(id);
			if (!f) break;
			crumbs.unshift(f);
			id = f.parentId;
		}
		return crumbs;
	}, [currentFolderId, folderById]);

	const ancestorIds = useMemo(() => breadcrumb.map((f) => f.id), [breadcrumb]);

	// Reset navigation when modal re-opens
	useEffect(() => {
		if (visible) setCurrentFolderId(initialFolderId);
	}, [visible, initialFolderId]);

	// Escape → close
	useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if (e.key === 'Escape') onClose();
		}
		document.addEventListener('keydown', onKey);
		return () => document.removeEventListener('keydown', onKey);
	}, [onClose]);

	// ── Drag and drop reorder ───────────────────────────────────────────────
	const handleReorderFolders = useCallback(
		(changed: { id: string; order: number }[]) => {
			reorderFolders(changed, {
				onSuccess: () => {
					if (chromeSyncService) {
						chromeSyncService
							.syncReorderFolders(changed)
							.catch(() => toast.error('Chrome 폴더 순서 동기화에 실패했습니다.'));
					}
				},
				onError: () => toast.error('폴더 순서 변경에 실패했습니다.'),
			});
		},
		[reorderFolders, chromeSyncService],
	);

	const handleReorderBookmarks = useCallback(
		(changed: { id: string; order: number }[]) => {
			reorderBookmarks(changed, {
				onSuccess: () => {
					if (chromeSyncService) {
						chromeSyncService
							.syncReorderBookmarks(changed)
							.catch(() => toast.error('Chrome 북마크 순서 동기화에 실패했습니다.'));
					}
				},
				onError: () => toast.error('북마크 순서 변경에 실패했습니다.'),
			});
		},
		[reorderBookmarks, chromeSyncService],
	);

	const { items: sortableFolders, handleDragEnd: handleFolderDragEnd } = useSortableReorder(
		subFolders,
		handleReorderFolders,
	);

	const { items: sortableBookmarks, handleDragEnd: handleBookmarkDragEnd } = useSortableReorder(
		bookmarks,
		handleReorderBookmarks,
	);

	function handleDeleteFolder(folder: Folder) {
		if (!window.confirm('폴더를 삭제하시겠습니까? 하위 폴더와 북마크도 함께 삭제됩니다.')) return;
		deleteFolder(folder.id, {
			onSuccess: () => {
				if (chromeSyncService) {
					chromeSyncService
						.syncDeleteFolder(folder.id)
						.catch(() => toast.error('Chrome 폴더 동기화에 실패했습니다.'));
				}
				if (folder.id === currentFolderId) {
					if (folder.parentId) setCurrentFolderId(folder.parentId);
					else onClose();
				}
			},
			onError: () => toast.error('폴더 삭제에 실패했습니다.'),
		});
	}

	function handleRenameFolder(folder: Folder) {
		setFolderEditTarget(folder);
	}

	return createPortal(
		<div
			aria-modal='true'
			className='fixed inset-0 z-300 flex items-center justify-center p-4 sm:p-6'
			role='dialog'
		>
			{/* Backdrop */}
			<div
				aria-hidden='true'
				className='absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300'
				onClick={onClose}
				style={{ opacity: visible ? 1 : 0 }}
			/>

			{/* Panel */}
			<div
				className='relative flex w-full overflow-hidden rounded-[28px] bg-background/95 shadow-2xl ring-1 ring-border/50 backdrop-blur-2xl'
				style={{
					maxWidth: '960px',
					height: '82vh',
					opacity: visible ? 1 : 0,
					transform: visible ? 'scale(1) translateY(0px)' : 'scale(0.94) translateY(24px)',
					transition: 'opacity 0.3s ease, transform 0.3s ease',
					pointerEvents: visible ? 'auto' : 'none',
				}}
			>
				{/* Top shine */}
				<div
					aria-hidden='true'
					className='pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-[28px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent'
				/>

				{/* ── Left sidebar ── */}
				<div className='flex w-52 shrink-0 flex-col border-r border-border/40 bg-muted/20'>
					<div className='border-b border-border/40 px-4 py-3'>
						<span className='text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50'>
							폴더
						</span>
					</div>
					<div className='flex-1 overflow-y-auto p-2'>
						{folderTree.map((node) => (
							<FolderTreeNode
								ancestorIds={ancestorIds}
								currentFolderId={currentFolderId}
								key={node.id}
								node={node}
								onNavigate={setCurrentFolderId}
							/>
						))}
					</div>
				</div>

				{/* ── Right panel ── */}
				<div className='flex flex-1 flex-col overflow-hidden'>
					{/* Header */}
					<div className='flex items-center gap-2 border-b border-border/40 px-5 py-3.5'>
						{/* Back button */}
						{currentFolder?.parentId && (
							<button
								className='flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:bg-accent hover:text-foreground'
								onClick={() => currentFolder.parentId && setCurrentFolderId(currentFolder.parentId)}
								title='뒤로'
								type='button'
							>
								<svg
									aria-hidden='true'
									className='h-4 w-4'
									fill='none'
									stroke='currentColor'
									viewBox='0 0 24 24'
								>
									<path
										d='M15 19l-7-7 7-7'
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={2}
									/>
								</svg>
							</button>
						)}

						{/* Breadcrumb */}
						<div className='flex min-w-0 flex-1 items-center gap-1 overflow-hidden'>
							{breadcrumb.map((f, i) => (
								<Fragment key={f.id}>
									{i > 0 && (
										<svg
											aria-hidden='true'
											className='h-3 w-3 shrink-0 text-muted-foreground/30'
											fill='none'
											stroke='currentColor'
											viewBox='0 0 24 24'
										>
											<path
												d='M9 18l6-6-6-6'
												strokeLinecap='round'
												strokeLinejoin='round'
												strokeWidth={2}
											/>
										</svg>
									)}
									<button
										className={`shrink-0 truncate text-sm transition-colors ${
											i === breadcrumb.length - 1
												? 'font-semibold text-foreground'
												: 'text-muted-foreground/60 hover:text-foreground'
										}`}
										onClick={() => setCurrentFolderId(f.id)}
										type='button'
									>
										{f.name}
									</button>
								</Fragment>
							))}
						</div>

						{/* Actions */}
						<div className='flex shrink-0 items-center gap-1'>
							{currentFolder && (
								<button
									className='flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:bg-accent hover:text-foreground'
									onClick={() => handleRenameFolder(currentFolder)}
									title='이름 변경'
									type='button'
								>
									<svg
										aria-hidden='true'
										className='h-3.5 w-3.5'
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
							)}
							{currentFolder && (
								<button
									className='flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:bg-destructive/15 hover:text-destructive'
									onClick={() => handleDeleteFolder(currentFolder)}
									title='폴더 삭제'
									type='button'
								>
									<svg
										aria-hidden='true'
										className='h-3.5 w-3.5'
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
							)}

							<div className='mx-1 h-4 w-px bg-border/50' />

							<button
								className='flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted-foreground/70 transition-colors hover:bg-accent hover:text-foreground'
								onClick={() => setFolderCreateOpen(true, currentFolderId)}
								title='폴더 추가'
								type='button'
							>
								<svg
									aria-hidden='true'
									className='h-3.5 w-3.5'
									fill='none'
									stroke='currentColor'
									viewBox='0 0 24 24'
								>
									<path
										d='M12 4v16m8-8H4'
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={2.5}
									/>
								</svg>
								폴더
							</button>

							<button
								className='flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted-foreground/70 transition-colors hover:bg-accent hover:text-foreground'
								onClick={() => setBookmarkCreateOpen(true, currentFolderId)}
								title='북마크 추가'
								type='button'
							>
								<svg
									aria-hidden='true'
									className='h-3.5 w-3.5'
									fill='none'
									stroke='currentColor'
									viewBox='0 0 24 24'
								>
									<path
										d='M12 4v16m8-8H4'
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={2.5}
									/>
								</svg>
								북마크
							</button>

							<div className='mx-1 h-4 w-px bg-border/50' />

							<button
								className='flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:bg-accent hover:text-foreground'
								onClick={onClose}
								title='닫기'
								type='button'
							>
								<svg
									aria-hidden='true'
									className='h-4 w-4'
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
					</div>

					{/* Content */}
					<div className='flex-1 overflow-y-auto p-5'>
						{/* Sub-folders */}
						{sortableFolders.length > 0 && (
							<div className='mb-6'>
								<p className='mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/45'>
									폴더
								</p>
								<DndContext
									collisionDetection={closestCenter}
									onDragEnd={handleFolderDragEnd}
									sensors={sensors}
								>
									<SortableContext
										items={sortableFolders.map((f) => f.id)}
										strategy={rectSortingStrategy}
									>
										<div className='grid grid-cols-3 gap-1 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6'>
											{sortableFolders.map((folder) => (
												<SortableFolderItem
													folder={folder}
													key={folder.id}
													onDelete={() => handleDeleteFolder(folder)}
													onEdit={() => handleRenameFolder(folder)}
													onNavigate={() => setCurrentFolderId(folder.id)}
												/>
											))}
										</div>
									</SortableContext>
								</DndContext>
							</div>
						)}

						{/* Bookmarks */}
						{sortableBookmarks.length > 0 && (
							<div>
								<p className='mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/45'>
									북마크
								</p>
								<DndContext
									collisionDetection={closestCenter}
									onDragEnd={handleBookmarkDragEnd}
									sensors={sensors}
								>
									<SortableContext
										items={sortableBookmarks.map((b) => b.id)}
										strategy={verticalListSortingStrategy}
									>
										<div className='grid grid-cols-1 gap-0.5 sm:grid-cols-2'>
											{sortableBookmarks.map((bm) => (
												<SortableBookmarkCard
													bookmark={bm}
													key={bm.id}
													onDelete={onDeleteBookmark}
													onEdit={onEditBookmark}
												/>
											))}
										</div>
									</SortableContext>
								</DndContext>
							</div>
						)}

						{/* Empty state */}
						{sortableFolders.length === 0 && sortableBookmarks.length === 0 && (
							<div className='flex h-40 flex-col items-center justify-center gap-3'>
								<svg
									aria-hidden='true'
									className='h-10 w-10 text-muted-foreground/20'
									fill='none'
									stroke='currentColor'
									viewBox='0 0 24 24'
								>
									<path
										d='M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z'
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={1.5}
									/>
								</svg>
								<p className='text-sm text-muted-foreground/40'>비어 있습니다</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>,
		document.body,
	);
}
