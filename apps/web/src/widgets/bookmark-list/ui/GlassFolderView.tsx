import { closestCenter, DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { rectSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Bookmark, Folder } from '@repo/types';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
	bookmarkKeys,
	useBookmarks,
	useDeleteBookmark,
	useReorderBookmarks,
} from '@/entities/bookmark';
import { useFolders, useReorderFolders } from '@/entities/folder';
import { useBookmarkDialogStore, useBookmarkFilterStore } from '@/features/bookmark';
import { useDeleteFolder, useEditFolder } from '@/features/folder-manage';
import { useSettingStore } from '@/features/settings';
import { useChromeSyncService } from '@/shared/lib/chrome-sync';
import { useSortableReorder } from '@/shared/lib/dnd/useSortableReorder';
import { FileExplorerModal } from './FileExplorerModal';
import { GlassBookmarkCard } from './GlassBookmarkCard';
import { GlassFilterBar } from './GlassFilterBar';
import { type FolderGroup, GlassFolderCard } from './GlassFolderCard';

// ── Sortable wrapper for a single grid card ───────────────────────────────────

interface SortableCardProps {
	id: string;
	children: React.ReactNode;
}

function SortableCard({ id, children }: SortableCardProps) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id,
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
			{children}
		</div>
	);
}

// ─────────────────────────────────────────────────────────────────────────────

export function GlassFolderView() {
	const { selectedTagId, selectedFolderIds, search } = useBookmarkFilterStore();
	const { syncMode } = useSettingStore();
	const queryClient = useQueryClient();
	const { setEditTarget } = useBookmarkDialogStore();
	const { mutate: deleteBookmark } = useDeleteBookmark();
	const { mutate: editFolder } = useEditFolder();
	const { mutate: deleteFolder } = useDeleteFolder();
	const { mutate: reorderBookmarks } = useReorderBookmarks();
	const { mutate: reorderFolders } = useReorderFolders();
	const chromeSyncService = useChromeSyncService(syncMode);

	const { data: allBookmarks = [], isLoading } = useBookmarks({
		tagId: selectedTagId,
		search: search || undefined,
	});

	const { data: folders = [] } = useFolders();

	const folderGroups = useMemo((): FolderGroup[] => {
		const map = new Map<string, Bookmark[]>();
		for (const bm of allBookmarks) {
			const key = bm.folderId ?? '__uncategorized__';
			if (!map.has(key)) map.set(key, []);
			map.get(key)?.push(bm);
		}

		const childrenByParent = new Map<string, Folder[]>();
		for (const f of folders) {
			if (f.parentId) {
				const arr = childrenByParent.get(f.parentId) ?? [];
				arr.push(f);
				childrenByParent.set(f.parentId, arr);
			}
		}

		const groups: FolderGroup[] = [];
		// Only top-level folders (parentId === null)
		const topLevelFolders = folders.filter((f) => f.parentId === null);
		for (const folder of topLevelFolders) {
			const subfolders = childrenByParent.get(folder.id) ?? [];
			// Show folder if it has direct bookmarks OR has subfolders
			if (map.has(folder.id) || subfolders.length > 0) {
				groups.push({
					id: folder.id,
					name: folder.name,
					bookmarks: map.get(folder.id) ?? [],
					folder,
					subfolders,
				});
			}
		}

		// Each uncategorized bookmark becomes its own entry so it can be sorted
		// into the correct position relative to folders (using the shared order field).
		for (const bm of map.get('__uncategorized__') ?? []) {
			groups.push({
				id: bm.id,
				name: bm.title,
				bookmarks: [bm],
				folder: null,
				subfolders: [],
			});
		}

		// Sort folders and root-level bookmarks together by their order field
		// so the display matches the Chrome bookmark bar order.
		groups.sort((a, b) => {
			const orderA = a.folder?.order ?? a.bookmarks[0]?.order ?? 0;
			const orderB = b.folder?.order ?? b.bookmarks[0]?.order ?? 0;
			return orderA - orderB;
		});

		return groups;
	}, [allBookmarks, folders]);

	// Filter by selectedFolderIds if needed (empty = show all)
	const filteredGroups = useMemo(() => {
		if (selectedFolderIds.length === 0) return folderGroups;
		return folderGroups.filter((g) => g.folder !== null && selectedFolderIds.includes(g.id ?? ''));
	}, [folderGroups, selectedFolderIds]);

	// ── Drag and drop reorder ────────────────────────────────────────────────
	const handleReorder = useCallback(
		(changed: { id: string; order: number }[]) => {
			// Separate changed items into folders vs uncategorized bookmarks
			const folderItems = changed.filter((item) =>
				folderGroups.some((g) => g.folder?.id === item.id),
			);
			const bookmarkItems = changed.filter((item) =>
				folderGroups.some((g) => g.folder === null && g.bookmarks[0]?.id === item.id),
			);

			if (folderItems.length > 0) {
				reorderFolders(folderItems, {
					onSuccess: () => {
						if (chromeSyncService) {
							chromeSyncService
								.syncReorderFolders(folderItems)
								.catch(() => toast.error('Chrome 폴더 순서 동기화에 실패했습니다.'));
						}
					},
					onError: () => toast.error('폴더 순서 변경에 실패했습니다.'),
				});
			}

			if (bookmarkItems.length > 0) {
				reorderBookmarks(bookmarkItems, {
					onSuccess: () => {
						if (chromeSyncService) {
							chromeSyncService
								.syncReorderBookmarks(bookmarkItems)
								.catch(() => toast.error('Chrome 북마크 순서 동기화에 실패했습니다.'));
						}
					},
					onError: () => toast.error('북마크 순서 변경에 실패했습니다.'),
				});
			}
		},
		[folderGroups, reorderFolders, reorderBookmarks, chromeSyncService],
	);

	const { items: sortableGroups, handleDragEnd } = useSortableReorder(
		filteredGroups,
		handleReorder,
	);

	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

	// ── Modal state ──────────────────────────────────────────────────────────
	const [explorerFolderId, setExplorerFolderId] = useState<string | null>(null);
	const [modalVisible, setModalVisible] = useState(false);
	const closeTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

	useEffect(() => () => clearTimeout(closeTimerRef.current), []);

	const openModal = useCallback((folderId: string) => {
		setExplorerFolderId(folderId);
		requestAnimationFrame(() => requestAnimationFrame(() => setModalVisible(true)));
	}, []);

	const closeModal = useCallback(() => {
		setModalVisible(false);
		closeTimerRef.current = setTimeout(() => setExplorerFolderId(null), 300);
	}, []);

	const handleEdit = useCallback(
		(bm: Bookmark) => {
			setEditTarget(bm);
		},
		[setEditTarget],
	);

	const handleDelete = useCallback(
		(bm: Bookmark) => {
			deleteBookmark(bm.id, {
				onSuccess: () => {
					queryClient.invalidateQueries({ queryKey: bookmarkKeys.all });
					if (chromeSyncService) {
						chromeSyncService
							.syncDeleteBookmark(bm.id)
							.catch(() => toast.error('Chrome 북마크 동기화에 실패했습니다.'));
					}
				},
				onError: () => toast.error('북마크 삭제에 실패했습니다.'),
			});
		},
		[deleteBookmark, queryClient, chromeSyncService],
	);

	const handleRenameFolder = useCallback(
		(id: string, name: string) => {
			editFolder(
				{ id, dto: { name } },
				{
					onSuccess: () => {
						if (chromeSyncService) {
							chromeSyncService
								.syncUpdateFolder(id, name)
								.catch(() => toast.error('Chrome 폴더 동기화에 실패했습니다.'));
						}
					},
					onError: () => toast.error('폴더 이름 변경에 실패했습니다.'),
				},
			);
		},
		[editFolder, chromeSyncService],
	);

	const handleDeleteFolder = useCallback(
		(id: string) => {
			if (!window.confirm('폴더를 삭제하시겠습니까? 하위 폴더와 북마크도 함께 삭제됩니다.')) return;
			deleteFolder(id, {
				onSuccess: () => {
					if (chromeSyncService) {
						chromeSyncService
							.syncDeleteFolder(id)
							.catch(() => toast.error('Chrome 폴더 동기화에 실패했습니다.'));
					}
				},
				onError: () => toast.error('폴더 삭제에 실패했습니다.'),
			});
		},
		[deleteFolder, chromeSyncService],
	);

	if (isLoading) {
		return (
			<>
				<GlassFilterBar />
				<div className='grid grid-cols-2 gap-3 px-6 pb-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'>
					{Array.from({ length: 12 }).map((_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: skeleton
						<div className='flex flex-col items-center gap-1.5' key={i}>
							<div
								className='w-full animate-pulse rounded-[16px]'
								style={{ aspectRatio: '1', background: 'rgba(255,255,255,0.07)' }}
							/>
							<div
								className='h-2.5 w-12 animate-pulse rounded'
								style={{ background: 'rgba(255,255,255,0.08)' }}
							/>
						</div>
					))}
				</div>
			</>
		);
	}

	if (sortableGroups.length === 0) {
		return (
			<>
				<GlassFilterBar />
				<div className='flex h-52 flex-col items-center justify-center gap-3'>
					<p className='text-sm text-white/35'>북마크가 없습니다</p>
				</div>
			</>
		);
	}

	const totalCards = sortableGroups.length;
	let cardIndex = 0;

	return (
		<>
			<GlassFilterBar />
			<DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={sensors}>
				<SortableContext
					items={sortableGroups.map((g) => g.id ?? '')}
					strategy={rectSortingStrategy}
				>
					<div className='grid grid-cols-2 gap-3 px-6 pb-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'>
						{sortableGroups.map((group) => {
							if (group.folder === null) {
								const bm = group.bookmarks[0];
								if (!bm) return null;
								const idx = cardIndex++;
								const delay = idx * 30;
								return (
									<SortableCard id={group.id ?? bm.id} key={bm.id}>
										<GlassBookmarkCard
											animationDelay={delay}
											bookmark={bm}
											onDelete={handleDelete}
											onEdit={handleEdit}
											zIndex={totalCards - idx}
										/>
									</SortableCard>
								);
							}
							const idx = cardIndex++;
							const delay = idx * 30;
							return (
								<SortableCard id={group.id ?? group.folder.id} key={group.id}>
									<GlassFolderCard
										animationDelay={delay}
										group={group}
										onClick={() => group.id && openModal(group.id)}
										onDelete={handleDeleteFolder}
										onRename={handleRenameFolder}
										zIndex={totalCards - idx}
									/>
								</SortableCard>
							);
						})}
					</div>
				</SortableContext>
			</DndContext>

			{explorerFolderId && (
				<FileExplorerModal
					initialFolderId={explorerFolderId}
					onClose={closeModal}
					onDeleteBookmark={handleDelete}
					onEditBookmark={handleEdit}
					visible={modalVisible}
				/>
			)}
		</>
	);
}
