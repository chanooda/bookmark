import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSortableReorder } from '@/shared/lib/dnd/useSortableReorder';

// ---- @dnd-kit/sortable mock ----
vi.mock('@dnd-kit/sortable', () => ({
	arrayMove: <T>(arr: T[], from: number, to: number): T[] => {
		const result = [...arr];
		const [item] = result.splice(from, 1);
		if (item !== undefined) result.splice(to, 0, item);
		return result;
	},
}));

interface Item {
	id: string | null;
	order: number;
}

function makeItems(ids: string[]): Item[] {
	return ids.map((id, i) => ({ id, order: i }));
}

function makeDragEndEvent(activeId: string, overId: string) {
	return {
		active: { id: activeId },
		over: { id: overId },
	} as Parameters<ReturnType<typeof useSortableReorder>['handleDragEnd']>[0];
}

describe('useSortableReorder', () => {
	let onReorder: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		onReorder = vi.fn();
	});

	// ──────────────────────────────────────────────
	// Initial state
	// ──────────────────────────────────────────────
	it('초기 items는 serverItems와 동일하다', () => {
		const serverItems = makeItems(['a', 'b', 'c']);
		const { result } = renderHook(() => useSortableReorder(serverItems, onReorder));

		expect(result.current.items).toEqual(serverItems);
	});

	// ──────────────────────────────────────────────
	// handleDragEnd — basic reorder
	// ──────────────────────────────────────────────
	it('드래그로 항목 이동 시 items 순서가 즉시 변경된다', () => {
		const serverItems = makeItems(['a', 'b', 'c']);
		const { result } = renderHook(() => useSortableReorder(serverItems, onReorder));

		act(() => {
			result.current.handleDragEnd(makeDragEndEvent('a', 'c'));
		});

		expect(result.current.items.map((i) => i.id)).toEqual(['b', 'c', 'a']);
	});

	it('순서가 실제로 변경된 항목만 onReorder에 전달한다', () => {
		const serverItems = makeItems(['a', 'b', 'c']);
		const { result } = renderHook(() => useSortableReorder(serverItems, onReorder));

		// Move 'a' (index 0) to position of 'c' (index 2)
		// Result: [b, c, a] — b moves to 0, c moves to 1, a moves to 2
		act(() => {
			result.current.handleDragEnd(makeDragEndEvent('a', 'c'));
		});

		expect(onReorder).toHaveBeenCalledOnce();
		const changed = onReorder.mock.calls[0][0] as { id: string; order: number }[];
		// a was at 0, now at 2 — changed
		// b was at 1, now at 0 — changed
		// c was at 2, now at 1 — changed
		expect(changed).toHaveLength(3);
		expect(changed.find((x) => x.id === 'a')?.order).toBe(2);
		expect(changed.find((x) => x.id === 'b')?.order).toBe(0);
		expect(changed.find((x) => x.id === 'c')?.order).toBe(1);
	});

	it('같은 위치로 드래그 시 onReorder를 호출하지 않는다', () => {
		const serverItems = makeItems(['a', 'b', 'c']);
		const { result } = renderHook(() => useSortableReorder(serverItems, onReorder));

		act(() => {
			result.current.handleDragEnd(makeDragEndEvent('b', 'b'));
		});

		expect(onReorder).not.toHaveBeenCalled();
	});

	it('over가 null이면 onReorder를 호출하지 않는다', () => {
		const serverItems = makeItems(['a', 'b']);
		const { result } = renderHook(() => useSortableReorder(serverItems, onReorder));

		act(() => {
			result.current.handleDragEnd({
				active: { id: 'a' },
				over: null,
			} as Parameters<ReturnType<typeof useSortableReorder>['handleDragEnd']>[0]);
		});

		expect(onReorder).not.toHaveBeenCalled();
	});

	// ──────────────────────────────────────────────
	// null ID guard
	// ──────────────────────────────────────────────
	it('id가 null인 항목은 onReorder 페이로드에 포함되지 않는다', () => {
		const serverItems: Item[] = [
			{ id: 'a', order: 0 },
			{ id: null, order: 1 },
			{ id: 'c', order: 2 },
		];
		const { result } = renderHook(() => useSortableReorder(serverItems, onReorder));

		act(() => {
			result.current.handleDragEnd(makeDragEndEvent('a', 'c'));
		});

		const changed = onReorder.mock.calls[0][0] as { id: string; order: number }[];
		expect(changed.every((x) => x.id !== null)).toBe(true);
	});

	// ──────────────────────────────────────────────
	// Server sync on membership change
	// ──────────────────────────────────────────────
	it('serverItems에 새 항목 추가 시 items가 서버 데이터로 리셋된다', () => {
		let serverItems = makeItems(['a', 'b']);
		const { result, rerender } = renderHook(({ items }) => useSortableReorder(items, onReorder), {
			initialProps: { items: serverItems },
		});

		// Simulate drag to change local order
		act(() => {
			result.current.handleDragEnd(makeDragEndEvent('a', 'b'));
		});
		expect(result.current.items.map((i) => i.id)).toEqual(['b', 'a']);

		// Server adds a new item
		serverItems = makeItems(['a', 'b', 'c']);
		rerender({ items: serverItems });

		expect(result.current.items.map((i) => i.id)).toEqual(['a', 'b', 'c']);
	});

	it('serverItems에서 항목 제거 시 items가 서버 데이터로 리셋된다', () => {
		let serverItems = makeItems(['a', 'b', 'c']);
		const { result, rerender } = renderHook(({ items }) => useSortableReorder(items, onReorder), {
			initialProps: { items: serverItems },
		});

		// Remove an item from server
		serverItems = makeItems(['a', 'c']);
		rerender({ items: serverItems });

		expect(result.current.items.map((i) => i.id)).toEqual(['a', 'c']);
	});

	it('serverItems의 순서만 바뀌고 멤버십이 동일하면 로컬 낙관적 순서가 유지된다', () => {
		const serverItems = makeItems(['a', 'b', 'c']);
		const { result, rerender } = renderHook(({ items }) => useSortableReorder(items, onReorder), {
			initialProps: { items: serverItems },
		});

		// User drags 'a' to end
		act(() => {
			result.current.handleDragEnd(makeDragEndEvent('a', 'c'));
		});
		expect(result.current.items.map((i) => i.id)).toEqual(['b', 'c', 'a']);

		// Server returns same members but in original order (e.g. refetch before DB confirms)
		rerender({ items: makeItems(['a', 'b', 'c']) });

		// Optimistic order should be preserved (membership didn't change)
		expect(result.current.items.map((i) => i.id)).toEqual(['b', 'c', 'a']);
	});

	// ──────────────────────────────────────────────
	// reset
	// ──────────────────────────────────────────────
	it('reset() 호출 시 items가 serverItems로 돌아간다', () => {
		const serverItems = makeItems(['a', 'b', 'c']);
		const { result } = renderHook(() => useSortableReorder(serverItems, onReorder));

		// Drag first
		act(() => {
			result.current.handleDragEnd(makeDragEndEvent('a', 'c'));
		});
		expect(result.current.items.map((i) => i.id)).toEqual(['b', 'c', 'a']);

		// Reset
		act(() => {
			result.current.reset();
		});
		expect(result.current.items.map((i) => i.id)).toEqual(['a', 'b', 'c']);
	});

	it('reset() 후에도 onReorder는 호출되지 않는다', () => {
		const serverItems = makeItems(['a', 'b']);
		const { result } = renderHook(() => useSortableReorder(serverItems, onReorder));

		act(() => {
			result.current.reset();
		});

		expect(onReorder).not.toHaveBeenCalled();
	});
});
