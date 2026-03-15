import type { Tag } from '@bookmark/types';
import { create } from 'zustand';

interface TagDialogState {
	createOpen: boolean;
	editTarget: Tag | null;
	setCreateOpen: (open: boolean) => void;
	setEditTarget: (tag: Tag | null) => void;
}

export const useTagDialogStore = create<TagDialogState>((set) => ({
	createOpen: false,
	editTarget: null,
	setCreateOpen: (open) => set({ createOpen: open }),
	setEditTarget: (tag) => set({ editTarget: tag }),
}));
