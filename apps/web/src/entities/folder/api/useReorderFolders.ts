import type { ReorderItemDto } from '@bookmark/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
		onError: () => {
			toast.error('폴더 순서 변경에 실패했습니다.');
		},
	});
}
