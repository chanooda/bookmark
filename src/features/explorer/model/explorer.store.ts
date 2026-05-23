import { create } from 'zustand';

interface ExplorerState {
	currentId: string;
	init: (rootId: string) => void;
	navigate: (id: string) => void;
	rootId: string;
}

export const useExplorerStore = create<ExplorerState>((set) => ({
	rootId: '',
	currentId: '',
	init: (rootId) => set({ rootId, currentId: rootId }),
	navigate: (id) => set({ currentId: id }),
}));
