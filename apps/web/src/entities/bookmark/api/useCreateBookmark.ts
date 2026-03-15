import type { CreateBookmarkDto } from '@repo/types';
import { useMutation } from '@tanstack/react-query';
import { useStorageAdapter } from '@/shared/lib/storage';

export function useCreateBookmark() {
	const adapter = useStorageAdapter();
	return useMutation({
		mutationFn: (dto: CreateBookmarkDto) => adapter.createBookmark(dto),
	});
}
