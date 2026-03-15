import { create } from 'zustand';

interface BookmarkFilterState {
	// Used by sidebar / list / grid views (single selection)
	selectedTagId: string | undefined;
	selectedFolderId: string | 'unorganized' | undefined;
	// Used by glass view (multi selection)
	selectedFolderIds: string[];
	search: string;
	setSelectedTagId: (id: string | undefined) => void;
	setSelectedFolderId: (id: string | 'unorganized' | undefined) => void;
	toggleSelectedFolderId: (id: string) => void;
	clearSelectedFolderIds: () => void;
	setSearch: (search: string) => void;
}

export const useBookmarkFilterStore = create<BookmarkFilterState>((set) => ({
	selectedTagId: undefined,
	selectedFolderId: 'unorganized',
	selectedFolderIds: [],
	search: '',
	setSelectedTagId: (id) => set({ selectedTagId: id }),
	setSelectedFolderId: (id) => set({ selectedFolderId: id }),
	toggleSelectedFolderId: (id) =>
		set((state) => ({
			selectedFolderIds: state.selectedFolderIds.includes(id)
				? state.selectedFolderIds.filter((f) => f !== id)
				: [...state.selectedFolderIds, id],
		})),
	clearSelectedFolderIds: () => set({ selectedFolderIds: [] }),
	setSearch: (search) => set({ search }),
}));
