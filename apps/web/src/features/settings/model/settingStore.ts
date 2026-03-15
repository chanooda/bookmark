import { DEFAULT_APP_SETTINGS, type SyncMode } from '@repo/types';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { ViewMode } from '@/entities/bookmark';

interface SettingState {
	viewMode: ViewMode;
	syncMode: SyncMode;
	settingsOpen: boolean;
	setViewMode: (mode: ViewMode) => void;
	setSyncMode: (mode: SyncMode) => void;
	setSettingsOpen: (open: boolean) => void;
}

const chromeLocalStorage = {
	getItem: async (name: string): Promise<string | null> => {
		if (typeof chrome === 'undefined' || !chrome.storage?.local) {
			return localStorage.getItem(name);
		}
		const result = await chrome.storage.local.get(name);
		return (result[name] as string) ?? null;
	},
	setItem: async (name: string, value: string): Promise<void> => {
		if (typeof chrome === 'undefined' || !chrome.storage?.local) {
			localStorage.setItem(name, value);
			return;
		}
		await chrome.storage.local.set({ [name]: value });
	},
	removeItem: async (name: string): Promise<void> => {
		if (typeof chrome === 'undefined' || !chrome.storage?.local) {
			localStorage.removeItem(name);
			return;
		}
		await chrome.storage.local.remove(name);
	},
};

export const useSettingStore = create<SettingState>()(
	persist(
		(set) => ({
			viewMode: 'glass',
			syncMode: DEFAULT_APP_SETTINGS.syncMode,
			settingsOpen: false,
			setViewMode: (mode) => set({ viewMode: mode }),
			setSyncMode: (mode) => set({ syncMode: mode }),
			setSettingsOpen: (open) => set({ settingsOpen: open }),
		}),
		{
			name: 'setting',
			version: 1,
			storage: createJSONStorage(() => chromeLocalStorage),
			partialize: (state) => ({
				viewMode: state.viewMode,
				syncMode: state.syncMode,
			}),
			migrate: (persistedState: unknown, fromVersion: number) => {
				if (fromVersion === 0) {
					const old = persistedState as { viewMode?: ViewMode; realtimeSync?: boolean };
					return {
						viewMode: old.viewMode ?? 'glass',
						syncMode: old.realtimeSync ? ('bidirectional' as SyncMode) : ('off' as SyncMode),
					};
				}
				return persistedState as { viewMode: ViewMode; syncMode: SyncMode };
			},
		},
	),
);
