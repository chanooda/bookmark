import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bookmarkKeys } from '@/entities/bookmark';
import { folderKeys } from '@/entities/folder';
import { useStorageAdapter } from '@/shared/lib/storage';

export function useDeleteFolder() {
	const adapter = useStorageAdapter();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => adapter.deleteFolder(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: folderKeys.all });
			queryClient.invalidateQueries({ queryKey: bookmarkKeys.all });
		},
	});
}
