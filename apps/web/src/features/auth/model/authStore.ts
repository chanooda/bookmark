import { create } from 'zustand';

interface AuthState {
	loginOpen: boolean;
	setLoginOpen: (open: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
	loginOpen: false,
	setLoginOpen: (open) => set({ loginOpen: open }),
}));
