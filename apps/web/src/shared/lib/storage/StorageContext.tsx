import { ApiAdapter, ChromeStorageAdapter, setAuthToken } from '@repo/api-client';
import type { StorageAdapter } from '@repo/types';
import { createContext, type ReactNode, useContext, useMemo, useState } from 'react';

interface StorageContextValue {
	adapter: StorageAdapter;
	mode: 'local' | 'api';
	switchToApi: () => void;
	logout: () => void;
}

const StorageContext = createContext<StorageContextValue | null>(null);

export function StorageProvider({ children }: { children: ReactNode }) {
	const [mode, setMode] = useState<'local' | 'api'>(() =>
		localStorage.getItem('auth_token') ? 'api' : 'local',
	);

	const adapter = useMemo(
		() => (mode === 'api' ? new ApiAdapter() : new ChromeStorageAdapter()),
		[mode],
	);

	function switchToApi() {
		setMode('api');
	}

	function logout() {
		localStorage.removeItem('auth_token');
		setAuthToken(null);
		setMode('local');
	}

	return <StorageContext value={{ adapter, mode, switchToApi, logout }}>{children}</StorageContext>;
}

export function useStorageAdapter(): StorageAdapter {
	const ctx = useContext(StorageContext);
	if (!ctx) throw new Error('useStorageAdapter must be used within StorageProvider');
	return ctx.adapter;
}

export function useStorageContext(): StorageContextValue {
	const ctx = useContext(StorageContext);
	if (!ctx) throw new Error('useStorageContext must be used within StorageProvider');
	return ctx;
}
