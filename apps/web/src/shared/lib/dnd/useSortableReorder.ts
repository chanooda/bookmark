import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Generic hook that wires @dnd-kit drag-end logic to a reorder callback.
 *
 * - Manages optimistic local state (items reorder immediately on drag)
 * - Calls `onReorder` with new { id, order } pairs only for changed items
 * - Syncs local state back to server data when `serverItems` IDs change (add/delete)
 * - Accepts `id: string | null`; items with null IDs are skipped during reorder
 */
export function useSortableReorder<T extends { id: string | null }>(
	serverItems: T[],
	onReorder: (items: { id: string; order: number }[]) => void,
) {
	const [items, setItems] = useState<T[]>(serverItems);

	// Track the last server IDs to detect add/delete (membership change)
	const prevServerIds = useRef(serverItems.map((i) => i.id ?? '').join(','));

	// Sync local state from server when membership changes (item added or deleted)
	useEffect(() => {
		const currentServerIds = serverItems.map((i) => i.id ?? '').join(',');
		if (currentServerIds !== prevServerIds.current) {
			prevServerIds.current = currentServerIds;
			setItems(serverItems);
		}
	}, [serverItems]);

	// Always ref the latest items for the drag handler to avoid stale closures
	const itemsRef = useRef(items);
	itemsRef.current = items;

	const handleDragEnd = useCallback(
		(event: DragEndEvent) => {
			const { active, over } = event;
			if (!over || active.id === over.id) return;

			const current = itemsRef.current;
			const oldIndex = current.findIndex((i) => i.id === active.id);
			const newIndex = current.findIndex((i) => i.id === over.id);
			if (oldIndex === -1 || newIndex === -1) return;

			const reordered = arrayMove(current, oldIndex, newIndex);
			setItems(reordered);

			// Only send items whose order value actually changed, skip null IDs
			const changed: { id: string; order: number }[] = [];
			for (let i = 0; i < reordered.length; i++) {
				const item = reordered[i];
				if (!item?.id) continue;
				const originalIndex = current.findIndex((x) => x.id === item.id);
				if (originalIndex !== i) {
					changed.push({ id: item.id, order: i });
				}
			}

			if (changed.length > 0) {
				onReorder(changed);
			}
		},
		[onReorder],
	);

	/** Reset local display state back to server state without triggering onReorder. */
	const reset = useCallback(() => {
		const currentServerIds = serverItems.map((i) => i.id ?? '').join(',');
		prevServerIds.current = currentServerIds;
		setItems(serverItems);
	}, [serverItems]);

	return { items, handleDragEnd, reset };
}
