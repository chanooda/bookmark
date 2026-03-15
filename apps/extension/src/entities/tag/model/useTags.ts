import { useQuery } from '@tanstack/react-query';
import { useStorageAdapter } from '@/shared/lib/storage';

export const tagKeys = {
	all: ['tags'] as const,
};

export function useTags() {
	const adapter = useStorageAdapter();
	return useQuery({
		queryKey: tagKeys.all,
		queryFn: () => adapter.getTags(),
	});
}
