import type { ReorderItemDto } from '@repo/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useStorageAdapter } from '@/shared/lib/storage';
import { bookmarkKeys } from './useBookmarks';

export function useReorderBookmarks() {
	const adapter = useStorageAdapter();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (items: ReorderItemDto[]) => adapter.reorderBookmarks(items),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: bookmarkKeys.all });
		},
	});
}
