import type { CreateTagDto } from '@repo/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tagKeys } from '@/entities/tag/model/useTags';
import { useStorageAdapter } from '@/shared/lib/storage';

export function useCreateTag() {
	const adapter = useStorageAdapter();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (dto: CreateTagDto) => adapter.createTag(dto),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: tagKeys.all });
		},
	});
}
