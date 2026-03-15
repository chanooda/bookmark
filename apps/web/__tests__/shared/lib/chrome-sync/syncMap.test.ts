import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readSyncMap, updateSyncMap, writeSyncMap } from '@/shared/lib/chrome-sync/syncMap';

// ---- Stateful Chrome storage mock ----
let storage: Record<string, unknown> = {};
const mockStorageGet = vi.fn();
const mockStorageSet = vi.fn();

vi.stubGlobal('chrome', {
	storage: {
		local: {
			get: mockStorageGet,
			set: mockStorageSet,
		},
	},
});

beforeEach(() => {
	storage = {};
	vi.resetAllMocks();
	mockStorageGet.mockImplementation(async (key: string) => ({ [key]: storage[key] }));
	mockStorageSet.mockImplementation(async (obj: Record<string, unknown>) => {
		Object.assign(storage, obj);
	});
});

// ============================================================
describe('readSyncMap', () => {
	it('저장된 값이 없으면 빈 맵을 반환한다', async () => {
		const result = await readSyncMap();
		expect(result).toEqual({ folders: {}, bookmarks: {} });
	});

	it('저장된 syncMap을 그대로 반환한다', async () => {
		const stored = { folders: { f1: 'c1' }, bookmarks: { b1: 'cb1' } };
		storage.syncMap = stored;
		const result = await readSyncMap();
		expect(result).toEqual(stored);
	});

	it('"syncMap" 키로 chrome.storage.local.get을 호출한다', async () => {
		await readSyncMap();
		expect(mockStorageGet).toHaveBeenCalledWith('syncMap');
	});
});

// ============================================================
describe('writeSyncMap', () => {
	it('"syncMap" 키로 chrome.storage.local.set을 호출한다', async () => {
		const map = { folders: { f1: 'c1' }, bookmarks: {} };
		await writeSyncMap(map);
		expect(mockStorageSet).toHaveBeenCalledWith({ syncMap: map });
	});

	it('스토리지에 맵이 실제로 저장된다', async () => {
		const map = { folders: { f1: 'c1' }, bookmarks: { b1: 'cb1' } };
		await writeSyncMap(map);
		expect(storage.syncMap).toEqual(map);
	});
});

// ============================================================
describe('updateSyncMap', () => {
	it('빈 스토리지에 folders 패치를 저장한다', async () => {
		await updateSyncMap({ folders: { f1: 'c1' } });
		expect(storage.syncMap).toEqual({ folders: { f1: 'c1' }, bookmarks: {} });
	});

	it('빈 스토리지에 bookmarks 패치를 저장한다', async () => {
		await updateSyncMap({ bookmarks: { b1: 'cb1' } });
		expect(storage.syncMap).toEqual({ folders: {}, bookmarks: { b1: 'cb1' } });
	});

	it('기존 folders에 새 항목을 병합한다', async () => {
		storage.syncMap = { folders: { f1: 'c1' }, bookmarks: {} };
		await updateSyncMap({ folders: { f2: 'c2' } });
		expect(storage.syncMap).toEqual({ folders: { f1: 'c1', f2: 'c2' }, bookmarks: {} });
	});

	it('기존 bookmarks에 새 항목을 병합한다', async () => {
		storage.syncMap = { folders: {}, bookmarks: { b1: 'cb1' } };
		await updateSyncMap({ bookmarks: { b2: 'cb2' } });
		expect(storage.syncMap).toEqual({ folders: {}, bookmarks: { b1: 'cb1', b2: 'cb2' } });
	});

	it('folders와 bookmarks를 동시에 병합한다', async () => {
		storage.syncMap = { folders: { f1: 'c1' }, bookmarks: { b1: 'cb1' } };
		await updateSyncMap({ folders: { f2: 'c2' }, bookmarks: { b2: 'cb2' } });
		expect(storage.syncMap).toEqual({
			folders: { f1: 'c1', f2: 'c2' },
			bookmarks: { b1: 'cb1', b2: 'cb2' },
		});
	});
});
