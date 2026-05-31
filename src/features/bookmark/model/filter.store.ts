import { create } from 'zustand';

interface FilterStore {
	search?: string;
	setSearch: (q: string) => void;
}

export const useFilterStore = create<FilterStore>((set) => ({
	search: '',
	setSearch: (search) => {
		set({
			search,
		});
	},
}));
