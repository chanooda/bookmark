import type { ReorderItemDto } from '@repo/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
		onError: () => {
			toast.error('북마크 순서 변경에 실패했습니다.');
		},
	});
}
