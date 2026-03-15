import { useMutation } from '@tanstack/react-query';
import { useStorageAdapter } from '@/shared/lib/storage';

export function useDeleteBookmark() {
	const adapter = useStorageAdapter();
	return useMutation({
		mutationFn: (id: string) => adapter.deleteBookmark(id),
	});
}
