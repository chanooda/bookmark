import type { Folder } from '@repo/types';
import { useQuery } from '@tanstack/react-query';
import { useStorageAdapter } from '@/shared/lib/storage';

export const folderKeys = {
	all: ['folders'] as const,
};

export function useFolders() {
	const adapter = useStorageAdapter();
	return useQuery<Folder[]>({
		queryKey: folderKeys.all,
		queryFn: () => adapter.getFolders(),
	});
}
