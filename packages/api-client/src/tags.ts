import type { CreateTagDto, Tag, UpdateTagDto } from '@bookmark/types';
import { apiClient } from './client';

export const tagsApi = {
	list: () => apiClient.get<Tag[]>('/tags').then((r) => r.data),

	create: (dto: CreateTagDto) => apiClient.post<Tag>('/tags', dto).then((r) => r.data),

	update: (id: string, dto: UpdateTagDto) =>
		apiClient.patch<Tag>(`/tags/${id}`, dto).then((r) => r.data),

	remove: (id: string) => apiClient.delete(`/tags/${id}`).then((r) => r.data),
};
