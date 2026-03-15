import type { BookmarkListQuery } from '@bookmark/types';
import { useQuery } from '@tanstack/react-query';
import { useStorageAdapter } from '@/shared/lib/storage';

export const bookmarkKeys = {
	all: ['bookmarks'] as const,
	list: (query: BookmarkListQuery) => [...bookmarkKeys.all, query] as const,
};

export function useBookmarks(query: BookmarkListQuery = {}) {
	const adapter = useStorageAdapter();
	return useQuery({
		queryKey: bookmarkKeys.list(query),
		queryFn: () => adapter.getBookmarks(query),
	});
}
