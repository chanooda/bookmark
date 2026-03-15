import type { CreateFolderDto } from '@bookmark/types';
import { useMutation } from '@tanstack/react-query';
import { useStorageAdapter } from '@/shared/lib/storage';

export function useCreateFolder() {
	const adapter = useStorageAdapter();
	return useMutation({
		mutationFn: (dto: CreateFolderDto) => adapter.createFolder(dto),
	});
}
