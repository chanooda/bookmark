import type { CreateFolderDto, Folder, ReorderItemDto, UpdateFolderDto } from '@repo/types';
import { apiClient } from './client';

export const foldersApi = {
	list: () => apiClient.get<Folder[]>('/folders').then((r) => r.data),

	create: (dto: CreateFolderDto) => apiClient.post<Folder>('/folders', dto).then((r) => r.data),

	update: (id: string, dto: UpdateFolderDto) =>
		apiClient.patch<Folder>(`/folders/${id}`, dto).then((r) => r.data),

	remove: (id: string) => apiClient.delete(`/folders/${id}`).then((r) => r.data),

	reorder: (items: ReorderItemDto[]) =>
		apiClient.patch('/folders/reorder', { items }).then((r) => r.data),
};
