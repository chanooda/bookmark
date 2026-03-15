import type {
	Bookmark,
	BookmarkListQuery,
	CreateBookmarkDto,
	ReorderItemDto,
	UpdateBookmarkDto,
} from '@bookmark/types';
import { apiClient } from './client';

export const bookmarksApi = {
	list: (query?: BookmarkListQuery) =>
		apiClient.get<Bookmark[]>('/bookmarks', { params: query }).then((r) => r.data),

	get: (id: string) => apiClient.get<Bookmark>(`/bookmarks/${id}`).then((r) => r.data),

	create: (dto: CreateBookmarkDto) =>
		apiClient.post<Bookmark>('/bookmarks', dto).then((r) => r.data),

	update: (id: string, dto: UpdateBookmarkDto) =>
		apiClient.patch<Bookmark>(`/bookmarks/${id}`, dto).then((r) => r.data),

	remove: (id: string) => apiClient.delete(`/bookmarks/${id}`).then((r) => r.data),

	reorder: (items: ReorderItemDto[]) =>
		apiClient.patch('/bookmarks/reorder', { items }).then((r) => r.data),
};
