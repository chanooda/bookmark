import type { Bookmark, Folder } from '@repo/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChromeSyncGuard } from '@/shared/lib/chrome-sync/ChromeSyncGuard';
import { ChromeSyncService } from '@/shared/lib/chrome-sync/ChromeSyncService';

// ---- Stateful Chrome storage + bookmarks mock ----
let storage: Record<string, unknown> = {};
const mockStorageGet = vi.fn();
const mockStorageSet = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockMove = vi.fn();
const mockRemove = vi.fn();
const mockRemoveTree = vi.fn();

vi.stubGlobal('chrome', {
	storage: { local: { get: mockStorageGet, set: mockStorageSet } },
	bookmarks: {
		create: mockCreate,
		update: mockUpdate,
		move: mockMove,
		remove: mockRemove,
		removeTree: mockRemoveTree,
	},
});

// ---- Fixture factories ----
function makeFolder(overrides: Partial<Folder> = {}): Folder {
	return {
		id: 'f1',
		userId: 'u1',
		name: 'My Folder',
		parentId: null,
		order: 0,
		createdAt: new Date(),
		...overrides,
	};
}

function makeBookmark(overrides: Partial<Bookmark> = {}): Bookmark {
	return {
		id: 'b1',
		userId: 'u1',
		url: 'https://example.com',
		title: 'Example',
		description: null,
		favicon: null,
		folderId: null,
		order: 0,
		createdAt: new Date(),
		updatedAt: new Date(),
		tags: [],
		...overrides,
	};
}

// ---- Setup ----
let service: ChromeSyncService;

beforeEach(() => {
	storage = {};
	vi.resetAllMocks();
	ChromeSyncGuard.pendingCreates.clear();
	ChromeSyncGuard.pendingRemoves.clear();
	ChromeSyncGuard.pendingUpdates.clear();

	// Stateful storage implementations
	mockStorageGet.mockImplementation(async (key: string) => ({ [key]: storage[key] }));
	mockStorageSet.mockImplementation(async (obj: Record<string, unknown>) => {
		Object.assign(storage, obj);
	});

	// Default bookmark API implementations
	mockCreate.mockResolvedValue({ id: 'chrome-id-1' });
	mockUpdate.mockResolvedValue(undefined);
	mockMove.mockResolvedValue(undefined);
	mockRemove.mockResolvedValue(undefined);
	mockRemoveTree.mockResolvedValue(undefined);

	service = new ChromeSyncService();
});

// ============================================================
// syncCreateBookmark
// ============================================================
describe('syncCreateBookmark', () => {
	it('folder 없는 북마크를 Bookmarks Bar(parentId: "1")에 생성한다', async () => {
		const bookmark = makeBookmark({ id: 'b1', title: 'Test', url: 'https://test.com' });
		await service.syncCreateBookmark(bookmark, []);

		expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
			parentId: '1',
			title: 'Test',
			url: 'https://test.com',
		}));
		expect(storage.syncMap).toMatchObject({ bookmarks: { b1: 'chrome-id-1' } });
	});

	it('folder가 이미 syncMap에 있으면 해당 chrome ID를 parentId로 사용한다', async () => {
		storage.syncMap = { folders: { f1: 'chrome-f1' }, bookmarks: {} };
		const bookmark = makeBookmark({ folderId: 'f1' });
		await service.syncCreateBookmark(bookmark, [makeFolder({ id: 'f1' })]);

		expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ parentId: 'chrome-f1' }));
	});

	it('folder가 syncMap에 없으면 폴더를 먼저 생성한 후 북마크를 생성한다', async () => {
		mockCreate
			.mockResolvedValueOnce({ id: 'chrome-folder-1' })
			.mockResolvedValueOnce({ id: 'chrome-bm-1' });

		const folder = makeFolder({ id: 'f1', name: 'New Folder', parentId: null });
		const bookmark = makeBookmark({ id: 'b1', folderId: 'f1' });

		await service.syncCreateBookmark(bookmark, [folder]);

		expect(mockCreate).toHaveBeenCalledTimes(2);
		expect(mockCreate).toHaveBeenNthCalledWith(1, expect.objectContaining({ parentId: '1', title: 'New Folder' }));
		expect(mockCreate).toHaveBeenNthCalledWith(
			2,
			expect.objectContaining({ parentId: 'chrome-folder-1' }),
		);
	});

	it('중첩 폴더가 syncMap에 없으면 부모 폴더부터 재귀적으로 생성한다', async () => {
		mockCreate
			.mockResolvedValueOnce({ id: 'chrome-parent-1' })
			.mockResolvedValueOnce({ id: 'chrome-child-1' })
			.mockResolvedValueOnce({ id: 'chrome-bm-1' });

		const parent = makeFolder({ id: 'fp', name: 'Parent', parentId: null });
		const child = makeFolder({ id: 'fc', name: 'Child', parentId: 'fp' });
		const bookmark = makeBookmark({ folderId: 'fc' });

		await service.syncCreateBookmark(bookmark, [parent, child]);

		expect(mockCreate).toHaveBeenCalledTimes(3);
		expect(mockCreate).toHaveBeenNthCalledWith(1, expect.objectContaining({ parentId: '1', title: 'Parent' }));
		expect(mockCreate).toHaveBeenNthCalledWith(2, expect.objectContaining({
			parentId: 'chrome-parent-1',
			title: 'Child',
		}));
		expect(mockCreate).toHaveBeenNthCalledWith(
			3,
			expect.objectContaining({ parentId: 'chrome-child-1' }),
		);
	});

	it('create 호출 중 ChromeSyncGuard.pendingCreates에 "title|||url" 키가 포함된다', async () => {
		let capturedKeys = new Set<string>();
		mockCreate.mockImplementation(async () => {
			capturedKeys = new Set(ChromeSyncGuard.pendingCreates);
			return { id: 'chrome-id-1' };
		});

		const bookmark = makeBookmark({ title: 'Guard Test', url: 'https://guard.com' });
		await service.syncCreateBookmark(bookmark, []);

		expect(capturedKeys.has('Guard Test|||https://guard.com')).toBe(true);
	});

	it('create 완료 후 ChromeSyncGuard.pendingCreates가 비워진다', async () => {
		const bookmark = makeBookmark({ title: 'Test', url: 'https://test.com' });
		await service.syncCreateBookmark(bookmark, []);
		expect(ChromeSyncGuard.pendingCreates.size).toBe(0);
	});
});

// ============================================================
// syncUpdateBookmark
// ============================================================
describe('syncUpdateBookmark', () => {
	it('chrome id가 있으면 update와 move를 호출한다', async () => {
		storage.syncMap = { folders: {}, bookmarks: { b1: 'chrome-b1' } };
		const bookmark = makeBookmark({
			id: 'b1',
			title: 'Updated',
			url: 'https://new.com',
			folderId: null,
		});

		await service.syncUpdateBookmark(bookmark, []);

		expect(mockUpdate).toHaveBeenCalledWith('chrome-b1', {
			title: 'Updated',
			url: 'https://new.com',
		});
		expect(mockMove).toHaveBeenCalledWith('chrome-b1', expect.objectContaining({ parentId: '1' }));
	});

	it('folder가 있는 북마크 업데이트 시 올바른 parentId로 move한다', async () => {
		storage.syncMap = {
			folders: { f1: 'chrome-f1' },
			bookmarks: { b1: 'chrome-b1' },
		};
		const bookmark = makeBookmark({ id: 'b1', folderId: 'f1' });

		await service.syncUpdateBookmark(bookmark, [makeFolder({ id: 'f1' })]);

		expect(mockMove).toHaveBeenCalledWith('chrome-b1', expect.objectContaining({ parentId: 'chrome-f1' }));
	});

	it('chrome id가 없으면 syncCreateBookmark를 호출한다(폴백)', async () => {
		const bookmark = makeBookmark({ id: 'b1', folderId: null });
		await service.syncUpdateBookmark(bookmark, []);

		expect(mockCreate).toHaveBeenCalledOnce();
		expect(mockUpdate).not.toHaveBeenCalled();
	});

	it('chrome node가 삭제된 경우(update 실패) syncCreateBookmark로 폴백한다', async () => {
		storage.syncMap = { folders: {}, bookmarks: { b1: 'chrome-b1' } };
		mockUpdate.mockRejectedValue(new Error('Node not found'));

		const bookmark = makeBookmark({ id: 'b1', folderId: null });
		await service.syncUpdateBookmark(bookmark, []);

		expect(mockCreate).toHaveBeenCalledOnce();
	});

	it('update 호출 중 ChromeSyncGuard.pendingUpdates에 chrome id가 포함된다', async () => {
		storage.syncMap = { folders: {}, bookmarks: { b1: 'chrome-b1' } };
		let capturedIds = new Set<string>();
		mockUpdate.mockImplementation(async () => {
			capturedIds = new Set(ChromeSyncGuard.pendingUpdates);
			return undefined;
		});

		await service.syncUpdateBookmark(makeBookmark({ id: 'b1', folderId: null }), []);

		expect(capturedIds.has('chrome-b1')).toBe(true);
	});

	it('update 완료 후 ChromeSyncGuard.pendingUpdates가 비워진다', async () => {
		storage.syncMap = { folders: {}, bookmarks: { b1: 'chrome-b1' } };
		await service.syncUpdateBookmark(makeBookmark({ id: 'b1', folderId: null }), []);
		expect(ChromeSyncGuard.pendingUpdates.size).toBe(0);
	});

	it('update 실패(폴백) 후에도 ChromeSyncGuard.pendingUpdates가 비워진다', async () => {
		storage.syncMap = { folders: {}, bookmarks: { b1: 'chrome-b1' } };
		mockUpdate.mockRejectedValue(new Error('Node not found'));

		await service.syncUpdateBookmark(makeBookmark({ id: 'b1', folderId: null }), []);
		expect(ChromeSyncGuard.pendingUpdates.size).toBe(0);
	});
});

// ============================================================
// syncDeleteBookmark
// ============================================================
describe('syncDeleteBookmark', () => {
	it('chrome id가 있으면 remove를 호출하고 syncMap에서 해당 키를 제거한다', async () => {
		storage.syncMap = { folders: {}, bookmarks: { b1: 'chrome-b1', b2: 'chrome-b2' } };
		await service.syncDeleteBookmark('b1');

		expect(mockRemove).toHaveBeenCalledWith('chrome-b1');
		expect(storage.syncMap).toEqual({ folders: {}, bookmarks: { b2: 'chrome-b2' } });
	});

	it('syncMap에 chrome id가 없으면 remove를 호출하지 않는다', async () => {
		await service.syncDeleteBookmark('b99');
		expect(mockRemove).not.toHaveBeenCalled();
	});

	it('chrome.bookmarks.remove가 실패해도 syncMap에서 키를 제거한다', async () => {
		storage.syncMap = { folders: {}, bookmarks: { b1: 'chrome-b1' } };
		mockRemove.mockRejectedValue(new Error('Node not found'));

		await service.syncDeleteBookmark('b1');

		expect(storage.syncMap).toEqual({ folders: {}, bookmarks: {} });
	});

	it('remove 호출 중 ChromeSyncGuard.pendingRemoves에 chrome id가 포함된다', async () => {
		storage.syncMap = { folders: {}, bookmarks: { b1: 'chrome-b1' } };
		let capturedIds = new Set<string>();
		mockRemove.mockImplementation(async () => {
			capturedIds = new Set(ChromeSyncGuard.pendingRemoves);
			return undefined;
		});

		await service.syncDeleteBookmark('b1');

		expect(capturedIds.has('chrome-b1')).toBe(true);
	});

	it('remove 완료 후 ChromeSyncGuard.pendingRemoves가 비워진다', async () => {
		storage.syncMap = { folders: {}, bookmarks: { b1: 'chrome-b1' } };
		await service.syncDeleteBookmark('b1');
		expect(ChromeSyncGuard.pendingRemoves.size).toBe(0);
	});
});

// ============================================================
// syncCreateFolder
// ============================================================
describe('syncCreateFolder', () => {
	it('syncMap에 없는 폴더를 Chrome에 생성하고 syncMap에 기록한다', async () => {
		const folder = makeFolder({ id: 'f1', name: 'New Folder', parentId: null });
		await service.syncCreateFolder(folder, [folder]);

		expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ parentId: '1', title: 'New Folder' }));
		expect(storage.syncMap).toMatchObject({ folders: { f1: 'chrome-id-1' } });
	});

	it('syncMap에 이미 있는 폴더는 재생성하지 않는다', async () => {
		storage.syncMap = { folders: { f1: 'chrome-f1' }, bookmarks: {} };
		const folder = makeFolder({ id: 'f1' });
		await service.syncCreateFolder(folder, [folder]);

		expect(mockCreate).not.toHaveBeenCalled();
	});

	it('폴더 create 중 ChromeSyncGuard.pendingCreates에 "folder|||name" 키가 포함된다', async () => {
		let capturedKeys = new Set<string>();
		mockCreate.mockImplementation(async () => {
			capturedKeys = new Set(ChromeSyncGuard.pendingCreates);
			return { id: 'chrome-id-1' };
		});

		const folder = makeFolder({ id: 'f1', name: 'Guard Folder' });
		await service.syncCreateFolder(folder, [folder]);

		expect(capturedKeys.has('folder|||Guard Folder')).toBe(true);
	});

	it('폴더 create 완료 후 ChromeSyncGuard.pendingCreates가 비워진다', async () => {
		const folder = makeFolder({ id: 'f1', name: 'Test Folder' });
		await service.syncCreateFolder(folder, [folder]);
		expect(ChromeSyncGuard.pendingCreates.size).toBe(0);
	});

	it('부모 폴더가 없는 경우 Bookmarks Bar(parentId: "1") 아래에 생성한다', async () => {
		const folder = makeFolder({ id: 'f1', parentId: null });
		await service.syncCreateFolder(folder, [folder]);

		expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ parentId: '1' }));
	});

	it('부모 폴더가 있는 경우 부모의 chrome ID를 parentId로 사용한다', async () => {
		storage.syncMap = { folders: { fp: 'chrome-parent' }, bookmarks: {} };
		const child = makeFolder({ id: 'fc', name: 'Child', parentId: 'fp' });
		const parent = makeFolder({ id: 'fp', name: 'Parent' });

		await service.syncCreateFolder(child, [parent, child]);

		expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ parentId: 'chrome-parent', title: 'Child' }));
	});
});

// ============================================================
// syncDeleteFolder
// ============================================================
describe('syncDeleteFolder', () => {
	it('chrome id가 있으면 removeTree를 호출하고 syncMap에서 해당 키를 제거한다', async () => {
		storage.syncMap = { folders: { f1: 'chrome-f1', f2: 'chrome-f2' }, bookmarks: {} };
		await service.syncDeleteFolder('f1');

		expect(mockRemoveTree).toHaveBeenCalledWith('chrome-f1');
		expect(storage.syncMap).toEqual({ folders: { f2: 'chrome-f2' }, bookmarks: {} });
	});

	it('syncMap에 chrome id가 없으면 removeTree를 호출하지 않는다', async () => {
		await service.syncDeleteFolder('f99');
		expect(mockRemoveTree).not.toHaveBeenCalled();
	});

	it('chrome.bookmarks.removeTree가 실패해도 syncMap에서 키를 제거한다', async () => {
		storage.syncMap = { folders: { f1: 'chrome-f1' }, bookmarks: {} };
		mockRemoveTree.mockRejectedValue(new Error('Node not found'));

		await service.syncDeleteFolder('f1');

		expect(storage.syncMap).toEqual({ folders: {}, bookmarks: {} });
	});

	it('removeTree 완료 후 ChromeSyncGuard.pendingRemoves가 비워진다', async () => {
		storage.syncMap = { folders: { f1: 'chrome-f1' }, bookmarks: {} };
		await service.syncDeleteFolder('f1');
		expect(ChromeSyncGuard.pendingRemoves.size).toBe(0);
	});

	it('removeTree 실패 후에도 ChromeSyncGuard.pendingRemoves가 비워진다', async () => {
		storage.syncMap = { folders: { f1: 'chrome-f1' }, bookmarks: {} };
		mockRemoveTree.mockRejectedValue(new Error('Node not found'));

		await service.syncDeleteFolder('f1');
		expect(ChromeSyncGuard.pendingRemoves.size).toBe(0);
	});
});

// ============================================================
// 동시 폴더 생성 deduplication
// ============================================================
describe('동시 폴더 생성 deduplication', () => {
	it('같은 폴더에 대한 동시 syncCreateFolder 호출 시 chrome.bookmarks.create를 한 번만 호출한다', async () => {
		const folder = makeFolder({ id: 'f1', name: 'Dedup Folder' });

		await Promise.all([
			service.syncCreateFolder(folder, [folder]),
			service.syncCreateFolder(folder, [folder]),
		]);

		expect(mockCreate).toHaveBeenCalledOnce();
	});

	it('같은 folder를 가진 북마크 동시 생성 시 폴더는 한 번만 생성한다', async () => {
		mockCreate
			.mockResolvedValueOnce({ id: 'chrome-folder-1' }) // folder create (once)
			.mockResolvedValueOnce({ id: 'chrome-bm-1' }) // bookmark 1
			.mockResolvedValueOnce({ id: 'chrome-bm-2' }); // bookmark 2

		const folder = makeFolder({ id: 'f1', name: 'Shared Folder' });
		const bm1 = makeBookmark({ id: 'b1', title: 'BM1', url: 'https://bm1.com', folderId: 'f1' });
		const bm2 = makeBookmark({ id: 'b2', title: 'BM2', url: 'https://bm2.com', folderId: 'f1' });

		await Promise.all([
			service.syncCreateBookmark(bm1, [folder]),
			service.syncCreateBookmark(bm2, [folder]),
		]);

		// folder create once + 2 bookmark creates = 3 total
		expect(mockCreate).toHaveBeenCalledTimes(3);
		// First call must be the folder
		expect(mockCreate).toHaveBeenNthCalledWith(1, expect.objectContaining({ parentId: '1', title: 'Shared Folder' }));
	});
});

// ============================================================
// syncReorderBookmarks
// ============================================================
describe('syncReorderBookmarks', () => {
	it('syncMap에 있는 항목을 오름차순 order로 chrome.bookmarks.move 호출한다', async () => {
		storage.syncMap = {
			folders: {},
			bookmarks: { b1: 'chrome-b1', b2: 'chrome-b2', b3: 'chrome-b3' },
		};

		await service.syncReorderBookmarks([
			{ id: 'b3', order: 2 },
			{ id: 'b1', order: 0 },
			{ id: 'b2', order: 1 },
		]);

		// Should be called 3 times total, in ascending order (b1=0, b2=1, b3=2)
		expect(mockMove).toHaveBeenCalledTimes(3);
		expect(mockMove).toHaveBeenNthCalledWith(1, 'chrome-b1', { index: 0 });
		expect(mockMove).toHaveBeenNthCalledWith(2, 'chrome-b2', { index: 1 });
		expect(mockMove).toHaveBeenNthCalledWith(3, 'chrome-b3', { index: 2 });
	});

	it('syncMap에 없는 항목은 건너뛴다', async () => {
		storage.syncMap = { folders: {}, bookmarks: { b1: 'chrome-b1' } };

		await service.syncReorderBookmarks([
			{ id: 'b1', order: 0 },
			{ id: 'b_unknown', order: 1 },
		]);

		expect(mockMove).toHaveBeenCalledOnce();
		expect(mockMove).toHaveBeenCalledWith('chrome-b1', { index: 0 });
	});

	it('빈 배열 입력 시 move를 호출하지 않는다', async () => {
		await service.syncReorderBookmarks([]);
		expect(mockMove).not.toHaveBeenCalled();
	});

	it('move 호출 중 ChromeSyncGuard.pendingUpdates에 chrome id가 포함된다', async () => {
		storage.syncMap = { folders: {}, bookmarks: { b1: 'chrome-b1' } };
		let capturedIds = new Set<string>();
		mockMove.mockImplementation(async () => {
			capturedIds = new Set(ChromeSyncGuard.pendingUpdates);
			return undefined;
		});

		await service.syncReorderBookmarks([{ id: 'b1', order: 0 }]);

		expect(capturedIds.has('chrome-b1')).toBe(true);
	});

	it('move 완료 후 ChromeSyncGuard.pendingUpdates가 비워진다', async () => {
		storage.syncMap = { folders: {}, bookmarks: { b1: 'chrome-b1' } };
		await service.syncReorderBookmarks([{ id: 'b1', order: 0 }]);
		expect(ChromeSyncGuard.pendingUpdates.size).toBe(0);
	});

	it('move 실패 후에도 ChromeSyncGuard.pendingUpdates가 비워진다', async () => {
		storage.syncMap = { folders: {}, bookmarks: { b1: 'chrome-b1' } };
		mockMove.mockRejectedValue(new Error('Node not found'));

		await service.syncReorderBookmarks([{ id: 'b1', order: 0 }]);

		expect(ChromeSyncGuard.pendingUpdates.size).toBe(0);
	});
});

// ============================================================
// syncReorderFolders
// ============================================================
describe('syncReorderFolders', () => {
	it('syncMap에 있는 폴더를 오름차순 order로 chrome.bookmarks.move 호출한다', async () => {
		storage.syncMap = {
			folders: { f1: 'chrome-f1', f2: 'chrome-f2' },
			bookmarks: {},
		};

		await service.syncReorderFolders([
			{ id: 'f2', order: 1 },
			{ id: 'f1', order: 0 },
		]);

		expect(mockMove).toHaveBeenCalledTimes(2);
		expect(mockMove).toHaveBeenNthCalledWith(1, 'chrome-f1', { index: 0 });
		expect(mockMove).toHaveBeenNthCalledWith(2, 'chrome-f2', { index: 1 });
	});

	it('syncMap에 없는 폴더는 건너뛴다', async () => {
		storage.syncMap = { folders: { f1: 'chrome-f1' }, bookmarks: {} };

		await service.syncReorderFolders([
			{ id: 'f1', order: 0 },
			{ id: 'f_unknown', order: 1 },
		]);

		expect(mockMove).toHaveBeenCalledOnce();
	});

	it('move 실패 후에도 ChromeSyncGuard.pendingUpdates가 비워진다', async () => {
		storage.syncMap = { folders: { f1: 'chrome-f1' }, bookmarks: {} };
		mockMove.mockRejectedValue(new Error('Node not found'));

		await service.syncReorderFolders([{ id: 'f1', order: 0 }]);

		expect(ChromeSyncGuard.pendingUpdates.size).toBe(0);
	});
});

// ============================================================
// syncUpdateFolder
// ============================================================
describe('syncUpdateFolder', () => {
	it('syncMap에 chrome id가 있으면 update를 호출한다', async () => {
		storage.syncMap = { folders: { f1: 'chrome-f1' }, bookmarks: {} };
		await service.syncUpdateFolder('f1', 'New Name');

		expect(mockUpdate).toHaveBeenCalledWith('chrome-f1', { title: 'New Name' });
	});

	it('syncMap에 chrome id가 없으면 update를 호출하지 않는다', async () => {
		await service.syncUpdateFolder('f_unknown', 'Name');
		expect(mockUpdate).not.toHaveBeenCalled();
	});

	it('update 호출 중 ChromeSyncGuard.pendingUpdates에 chrome id가 포함된다', async () => {
		storage.syncMap = { folders: { f1: 'chrome-f1' }, bookmarks: {} };
		let capturedIds = new Set<string>();
		mockUpdate.mockImplementation(async () => {
			capturedIds = new Set(ChromeSyncGuard.pendingUpdates);
			return undefined;
		});

		await service.syncUpdateFolder('f1', 'Name');

		expect(capturedIds.has('chrome-f1')).toBe(true);
	});

	it('update 완료 후 ChromeSyncGuard.pendingUpdates가 비워진다', async () => {
		storage.syncMap = { folders: { f1: 'chrome-f1' }, bookmarks: {} };
		await service.syncUpdateFolder('f1', 'Name');
		expect(ChromeSyncGuard.pendingUpdates.size).toBe(0);
	});

	it('update 실패 후에도 ChromeSyncGuard.pendingUpdates가 비워진다', async () => {
		storage.syncMap = { folders: { f1: 'chrome-f1' }, bookmarks: {} };
		mockUpdate.mockRejectedValue(new Error('Node not found'));

		await service.syncUpdateFolder('f1', 'Name');

		expect(ChromeSyncGuard.pendingUpdates.size).toBe(0);
	});
});
