import type { UpdateBookmarkDto } from '@repo/types';
import { useMutation } from '@tanstack/react-query';
import { useStorageAdapter } from '@/shared/lib/storage';

export function useEditBookmark() {
	const adapter = useStorageAdapter();
	return useMutation({
		mutationFn: ({ id, dto }: { id: string; dto: UpdateBookmarkDto }) =>
			adapter.updateBookmark(id, dto),
	});
}
