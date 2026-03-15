import type { ReorderItemDto } from '@repo/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useStorageAdapter } from '@/shared/lib/storage';
import { folderKeys } from './useFolders';

export function useReorderFolders() {
	const adapter = useStorageAdapter();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (items: ReorderItemDto[]) => adapter.reorderFolders(items),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: folderKeys.all });
		},
	});
}
