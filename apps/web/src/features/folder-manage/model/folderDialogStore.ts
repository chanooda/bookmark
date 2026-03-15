import type { Folder } from '@bookmark/types';
import { create } from 'zustand';

interface FolderDialogState {
	createOpen: boolean;
	createParentId: string | null | 'root';
	editTarget: Folder | null;
	setCreateOpen: (open: boolean, parentId?: string | null | 'root') => void;
	setEditTarget: (folder: Folder | null) => void;
}

export const useFolderDialogStore = create<FolderDialogState>((set) => ({
	createOpen: false,
	createParentId: 'root',
	editTarget: null,
	setCreateOpen: (open, parentId = 'root') => set({ createOpen: open, createParentId: parentId }),
	setEditTarget: (folder) => set({ editTarget: folder }),
}));
