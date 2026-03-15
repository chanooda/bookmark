const SYNC_MAP_KEY = 'syncMap';

export interface SyncMap {
	folders: Record<string, string>;
	bookmarks: Record<string, string>;
}

const EMPTY_MAP: SyncMap = { folders: {}, bookmarks: {} };

export async function readSyncMap(): Promise<SyncMap> {
	const result = await chrome.storage.local.get(SYNC_MAP_KEY);
	const stored = result[SYNC_MAP_KEY] as SyncMap | undefined;
	return stored ?? { ...EMPTY_MAP };
}

export async function writeSyncMap(map: SyncMap): Promise<void> {
	await chrome.storage.local.set({ [SYNC_MAP_KEY]: map });
}

export async function updateSyncMap(patch: Partial<SyncMap>): Promise<void> {
	const current = await readSyncMap();
	await writeSyncMap({
		folders: { ...current.folders, ...(patch.folders ?? {}) },
		bookmarks: { ...current.bookmarks, ...(patch.bookmarks ?? {}) },
	});
}
