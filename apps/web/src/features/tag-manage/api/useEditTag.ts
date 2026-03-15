import type { UpdateTagDto } from '@bookmark/types';
import { useMutation } from '@tanstack/react-query';
import { useStorageAdapter } from '@/shared/lib/storage';

export function useEditTag() {
	const adapter = useStorageAdapter();
	return useMutation({
		mutationFn: ({ id, dto }: { id: string; dto: UpdateTagDto }) => adapter.updateTag(id, dto),
	});
}
