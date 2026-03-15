import type { Bookmark } from '@bookmark/types';
import { create } from 'zustand';

interface BookmarkDialogState {
	createOpen: boolean;
	createDefaultFolderId: string | undefined;
	editTarget: Bookmark | null;
	setCreateOpen: (open: boolean, folderId?: string) => void;
	setEditTarget: (bookmark: Bookmark | null) => void;
}

export const useBookmarkDialogStore = create<BookmarkDialogState>((set) => ({
	createOpen: false,
	createDefaultFolderId: undefined,
	editTarget: null,
	setCreateOpen: (open, folderId) =>
		set({ createOpen: open, createDefaultFolderId: open ? folderId : undefined }),
	setEditTarget: (bookmark) => set({ editTarget: bookmark }),
}));
