import { create } from 'zustand';

interface ExplorerState {
	currentId: string;
	init: (rootId: string) => void;
	navigate: (id: string) => void;
	rootId: string;
	sidebarOpen: boolean;
	toggleSidebar: () => void;
	closeSidebar: () => void;
}

export const useExplorerStore = create<ExplorerState>((set) => ({
	rootId: '',
	currentId: '',
	sidebarOpen: false,
	init: (rootId) => set({ rootId, currentId: rootId, sidebarOpen: false }),
	navigate: (id) => set({ currentId: id }),
	toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
	closeSidebar: () => set({ sidebarOpen: false }),
}));
