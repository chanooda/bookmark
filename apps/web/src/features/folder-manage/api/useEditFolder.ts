import type { UpdateFolderDto } from '@bookmark/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { folderKeys } from '@/entities/folder';
import { useStorageAdapter } from '@/shared/lib/storage';

export function useEditFolder() {
	const adapter = useStorageAdapter();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, dto }: { id: string; dto: UpdateFolderDto }) =>
			adapter.updateFolder(id, dto),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: folderKeys.all }),
	});
}
