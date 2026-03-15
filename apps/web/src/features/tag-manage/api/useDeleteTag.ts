import { useMutation } from '@tanstack/react-query';
import { useStorageAdapter } from '@/shared/lib/storage';

export function useDeleteTag() {
	const adapter = useStorageAdapter();
	return useMutation({
		mutationFn: (id: string) => adapter.deleteTag(id),
	});
}
