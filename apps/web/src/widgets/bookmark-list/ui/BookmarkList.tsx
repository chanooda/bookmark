import { closestCenter, DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import {
	rectSortingStrategy,
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Bookmark } from '@repo/types';
import { cn } from '@repo/ui/lib/utils';
import { useCallback } from 'react';
import { toast } from 'sonner';
import type { ViewMode } from '@/entities/bookmark';
import { useBookmarks, useReorderBookmarks } from '@/entities/bookmark';
import { useBookmarkFilterStore } from '@/features/bookmark';
import { useSettingStore } from '@/features/settings';
import { useChromeSyncService } from '@/shared/lib/chrome-sync';
import { useSortableReorder } from '@/shared/lib/dnd/useSortableReorder';
import { BookmarkGridCard, BookmarkListCard } from './BookmarkCard';
import { GlassFolderView } from './GlassFolderView';

function BookmarkListSkeleton({ viewMode }: { viewMode: ViewMode }) {
	return (
		<div
			className={
				viewMode === 'grid'
					? 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'
					: 'flex flex-col gap-1'
			}
		>
			{Array.from({ length: viewMode === 'grid' ? 9 : 8 }).map((_, i) => {
				const cls =
					viewMode === 'grid'
						? 'h-28 animate-pulse rounded-xl bg-card'
						: 'h-10 animate-pulse rounded-lg bg-card';
				// biome-ignore lint/suspicious/noArrayIndexKey: skeleton list
				return <div className={cls} key={i} />;
			})}
		</div>
	);
}

function BookmarkListError({ error }: { error: unknown }) {
	return (
		<div className='flex h-48 flex-col items-center justify-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5'>
			<svg
				aria-hidden='true'
				className='h-6 w-6 text-destructive/60'
				fill='none'
				stroke='currentColor'
				viewBox='0 0 24 24'
			>
				<path
					d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
					strokeLinecap='round'
					strokeLinejoin='round'
					strokeWidth={2}
				/>
			</svg>
			<p className='text-sm text-destructive/80'>북마크를 불러오는 중 오류가 발생했습니다</p>
			<p className='text-xs text-muted-foreground'>
				{error instanceof Error ? error.message : '알 수 없는 오류'}
			</p>
		</div>
	);
}

function BookmarkListEmpty() {
	return (
		<div className='flex h-52 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/40'>
			<div className='flex h-10 w-10 items-center justify-center rounded-full bg-muted/50'>
				<svg
					aria-hidden='true'
					className='h-5 w-5 text-muted-foreground/40'
					fill='currentColor'
					viewBox='0 0 24 24'
				>
					<path d='M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z' />
				</svg>
			</div>
			<p className='text-sm text-muted-foreground/50'>북마크가 없습니다</p>
		</div>
	);
}

// ── Sortable wrapper ──────────────────────────────────────────────────────────

interface SortableBookmarkProps {
	bookmark: Bookmark;
	viewMode: 'grid' | 'list';
}

function SortableBookmark({ bookmark, viewMode }: SortableBookmarkProps) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: bookmark.id,
	});

	const CardComponent = viewMode === 'list' ? BookmarkListCard : BookmarkGridCard;

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
			<CardComponent bookmark={bookmark} />
		</div>
	);
}

// ─────────────────────────────────────────────────────────────────────────────

export function BookmarkList() {
	const { selectedTagId, selectedFolderId, search } = useBookmarkFilterStore();
	const { viewMode, syncMode } = useSettingStore();
	const { mutate: reorderBookmarks } = useReorderBookmarks();
	const chromeSyncService = useChromeSyncService(syncMode);

	const {
		data: bookmarks = [],
		isLoading,
		isError,
		error,
	} = useBookmarks({
		tagId: selectedTagId,
		search: search || undefined,
		folderId: selectedFolderId,
	});

	const handleReorder = useCallback(
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

	const { items: sortableBookmarks, handleDragEnd } = useSortableReorder(bookmarks, handleReorder);

	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

	if (viewMode === 'glass') {
		return <GlassFolderView />;
	}

	if (isError) return <BookmarkListError error={error} />;
	if (isLoading) return <BookmarkListSkeleton viewMode={viewMode} />;
	if (sortableBookmarks.length === 0) return <BookmarkListEmpty />;

	const strategy = viewMode === 'list' ? verticalListSortingStrategy : rectSortingStrategy;

	return (
		<DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd} sensors={sensors}>
			<SortableContext items={sortableBookmarks.map((b) => b.id)} strategy={strategy}>
				<div
					className={cn({
						'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3': viewMode === 'grid',
						'flex flex-col gap-0.5': viewMode === 'list',
					})}
				>
					{sortableBookmarks.map((bookmark) => (
						<SortableBookmark bookmark={bookmark} key={bookmark.id} viewMode={viewMode} />
					))}
				</div>
			</SortableContext>
		</DndContext>
	);
}
