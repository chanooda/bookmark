import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useCallback, useState } from 'react';

/**
 * Generic hook that wires @dnd-kit drag-end logic to a reorder callback.
 *
 * - Manages optimistic local state (items reorder immediately on drag)
 * - Calls `onReorder` with new { id, order } pairs only for changed items
 * - Syncs local state back to server data when `serverItems` changes
 * - Accepts `id: string | null`; items with null IDs are skipped during reorder
 */
export function useSortableReorder<T extends { id: string | null }>(
	serverItems: T[],
	onReorder: (items: { id: string; order: number }[]) => void,
) {
	const [items, setItems] = useState<T[]>(serverItems);

	// Keep local state in sync when server data changes (e.g. after invalidation)
	const syncedItems = serverItems.length > 0 ? items : serverItems;

	// Rebuild local state from server when IDs change (item added/deleted)
	const serverIds = serverItems.map((i) => i.id ?? '').join(',');
	const localIds = items.map((i) => i.id ?? '').join(',');
	const displayItems = serverIds !== localIds ? serverItems : syncedItems;

	const handleDragEnd = useCallback(
		(event: DragEndEvent) => {
			const { active, over } = event;
			if (!over || active.id === over.id) return;

			const oldIndex = displayItems.findIndex((i) => i.id === active.id);
			const newIndex = displayItems.findIndex((i) => i.id === over.id);
			if (oldIndex === -1 || newIndex === -1) return;

			const reordered = arrayMove(displayItems, oldIndex, newIndex);
			setItems(reordered);

			// Only send items whose order value actually changed, skip null IDs
			const changed: { id: string; order: number }[] = [];
			for (let i = 0; i < reordered.length; i++) {
				const item = reordered[i];
				if (!item?.id) continue;
				const originalIndex = displayItems.findIndex((x) => x.id === item.id);
				if (originalIndex !== i) {
					changed.push({ id: item.id, order: i });
				}
			}

			if (changed.length > 0) {
				onReorder(changed);
			}
		},
		[displayItems, onReorder],
	);

	return { items: displayItems, handleDragEnd, setItems };
}
