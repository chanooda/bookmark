import type { CreateTagDto } from '@bookmark/types';
import { useMutation } from '@tanstack/react-query';
import { useStorageAdapter } from '@/shared/lib/storage';

export function useCreateTag() {
	const adapter = useStorageAdapter();
	return useMutation({
		mutationFn: (dto: CreateTagDto) => adapter.createTag(dto),
	});
}
