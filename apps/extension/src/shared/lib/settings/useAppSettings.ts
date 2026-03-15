import { type AppSettings, DEFAULT_APP_SETTINGS } from '@repo/types';
import { useCallback, useEffect, useState } from 'react';

// Web app의 Zustand persist 키와 동일하게 사용
const SETTINGS_KEY = 'setting';

interface ZustandPersistedState {
	state: Partial<AppSettings>;
	version: number;
}

function isChromeStorageAvailable(): boolean {
	return typeof chrome !== 'undefined' && !!chrome.storage?.local;
}

async function readPersistedSettings(): Promise<Partial<AppSettings>> {
	const result = await chrome.storage.local.get(SETTINGS_KEY);
	const raw = result[SETTINGS_KEY] as string | undefined;
	if (!raw) return {};
	try {
		const parsed = JSON.parse(raw) as ZustandPersistedState;
		return parsed.state ?? {};
	} catch {
		return {};
	}
}

async function writePersistedSettings(patch: Partial<AppSettings>): Promise<void> {
	const result = await chrome.storage.local.get(SETTINGS_KEY);
	const raw = result[SETTINGS_KEY] as string | undefined;
	let existing: ZustandPersistedState = { state: {}, version: 0 };
	if (raw) {
		try {
			existing = JSON.parse(raw) as ZustandPersistedState;
		} catch {
			// keep default
		}
	}
	const next: ZustandPersistedState = {
		...existing,
		state: { ...existing.state, ...patch },
	};
	await chrome.storage.local.set({ [SETTINGS_KEY]: JSON.stringify(next) });
}

export function useAppSettings() {
	const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
	const [isLoaded, setIsLoaded] = useState(false);

	useEffect(() => {
		if (!isChromeStorageAvailable()) {
			setIsLoaded(true);
			return;
		}
		readPersistedSettings().then((stored) => {
			setSettings({ ...DEFAULT_APP_SETTINGS, ...stored });
			setIsLoaded(true);
		});
	}, []);

	const updateSettings = useCallback(async (patch: Partial<AppSettings>) => {
		setSettings((prev) => {
			const next = { ...prev, ...patch };
			if (isChromeStorageAvailable()) {
				writePersistedSettings(patch);
			}
			return next;
		});
	}, []);

	return { settings, isLoaded, updateSettings };
}
