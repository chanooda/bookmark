import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChromeSyncGuard } from '@/shared/lib/chrome-sync/ChromeSyncGuard';

// ---- Module mocks ----
vi.mock('@/features/settings', () => ({
	useSettingStore: vi.fn(),
}));

vi.mock('@/shared/lib/storage', () => ({
	useStorageAdapter: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
	useQueryClient: vi.fn(),
}));

vi.mock('sonner', () => ({
	toast: { error: vi.fn() },
}));

import type { SyncMode } from '@bookmark/types';
import { useQueryClient } from '@tanstack/react-query';
import { useSettingStore } from '@/features/settings';
import { useChromeBrowserSync } from '@/shared/lib/chrome-sync/useChromeBrowserSync';
import { useStorageAdapter } from '@/shared/lib/storage';

// ---- Chrome event listener mocks (each event has its own fn) ----
const mockOnCreatedAdd = vi.fn();
const mockOnCreatedRemove = vi.fn();
const mockOnRemovedAdd = vi.fn();
const mockOnRemovedRemove = vi.fn();
const mockOnChangedAdd = vi.fn();
const mockOnChangedRemove = vi.fn();
const mockGetSubTree = vi.fn();
const mockStorageGet = vi.fn();
const mockStorageSet = vi.fn();

function setupChromeMock() {
	vi.stubGlobal('chrome', {
		bookmarks: {
			getSubTree: mockGetSubTree,
			onCreated: { addListener: mockOnCreatedAdd, removeListener: mockOnCreatedRemove },
			onRemoved: { addListener: mockOnRemovedAdd, removeListener: mockOnRemovedRemove },
			onChanged: { addListener: mockOnChangedAdd, removeListener: mockOnChangedRemove },
		},
		storage: { local: { get: mockStorageGet, set: mockStorageSet } },
	});
}

const mockAdapter = {
	getBookmarks: vi.fn(),
	createBookmark: vi.fn(),
	updateBookmark: vi.fn(),
	deleteBookmark: vi.fn(),
	getFolders: vi.fn(),
	createFolder: vi.fn(),
	updateFolder: vi.fn(),
	deleteFolder: vi.fn(),
	getTags: vi.fn(),
};

const mockQueryClient = {
	invalidateQueries: vi.fn(),
};

function setupHookDeps(syncMode: SyncMode) {
	vi.mocked(useSettingStore).mockReturnValue({ syncMode } as ReturnType<typeof useSettingStore>);
	vi.mocked(useStorageAdapter).mockReturnValue(mockAdapter as ReturnType<typeof useStorageAdapter>);
	vi.mocked(useQueryClient).mockReturnValue(mockQueryClient as ReturnType<typeof useQueryClient>);
}

beforeEach(() => {
	vi.clearAllMocks();
	ChromeSyncGuard.pendingCreates.clear();
	ChromeSyncGuard.pendingUpdates.clear();
	ChromeSyncGuard.pendingRemoves.clear();

	mockGetSubTree.mockResolvedValue([{ id: '1', title: 'Bookmarks bar', children: [] }]);
	mockStorageGet.mockResolvedValue({});
	mockStorageSet.mockResolvedValue(undefined);
	mockAdapter.getFolders.mockResolvedValue([]);
	mockAdapter.getBookmarks.mockResolvedValue([]);
});

// ============================================================
// 리스너 등록 모드 격리
// ============================================================
describe('리스너 등록 모드 격리', () => {
	it('chrome-to-web 모드: 세 Chrome 이벤트 리스너가 모두 등록된다', async () => {
		setupChromeMock();
		setupHookDeps('chrome-to-web');

		renderHook(() => useChromeBrowserSync());

		await waitFor(() => {
			expect(mockOnCreatedAdd).toHaveBeenCalledTimes(1);
			expect(mockOnRemovedAdd).toHaveBeenCalledTimes(1);
			expect(mockOnChangedAdd).toHaveBeenCalledTimes(1);
		});
	});

	it('bidirectional 모드: 세 Chrome 이벤트 리스너가 모두 등록된다', async () => {
		setupChromeMock();
		setupHookDeps('bidirectional');

		renderHook(() => useChromeBrowserSync());

		await waitFor(() => {
			expect(mockOnCreatedAdd).toHaveBeenCalledTimes(1);
			expect(mockOnRemovedAdd).toHaveBeenCalledTimes(1);
			expect(mockOnChangedAdd).toHaveBeenCalledTimes(1);
		});
	});

	it('web-to-chrome 모드: Chrome 이벤트 리스너가 등록되지 않는다', async () => {
		setupChromeMock();
		setupHookDeps('web-to-chrome');

		renderHook(() => useChromeBrowserSync());

		await waitFor(() => expect(mockStorageGet).toHaveBeenCalled());

		expect(mockOnCreatedAdd).not.toHaveBeenCalled();
		expect(mockOnRemovedAdd).not.toHaveBeenCalled();
		expect(mockOnChangedAdd).not.toHaveBeenCalled();
	});

	it('off 모드: 리스너 등록도 초기 동기화도 실행되지 않는다', () => {
		vi.unstubAllGlobals();
		setupHookDeps('off');

		renderHook(() => useChromeBrowserSync());

		expect(mockOnCreatedAdd).not.toHaveBeenCalled();
		expect(mockGetSubTree).not.toHaveBeenCalled();
	});

	it('chrome API가 없으면 리스너가 등록되지 않는다', () => {
		vi.unstubAllGlobals();
		setupHookDeps('chrome-to-web');

		renderHook(() => useChromeBrowserSync());

		expect(mockOnCreatedAdd).not.toHaveBeenCalled();
	});

	it('언마운트 시 등록된 리스너가 모두 제거된다', async () => {
		setupChromeMock();
		setupHookDeps('chrome-to-web');

		const { unmount } = renderHook(() => useChromeBrowserSync());

		await waitFor(() => expect(mockOnCreatedAdd).toHaveBeenCalledTimes(1));

		unmount();

		expect(mockOnCreatedRemove).toHaveBeenCalledTimes(1);
		expect(mockOnRemovedRemove).toHaveBeenCalledTimes(1);
		expect(mockOnChangedRemove).toHaveBeenCalledTimes(1);
	});
});

// ============================================================
// Guard 피드백 루프 방지
// ============================================================
describe('Guard 피드백 루프 방지', () => {
	it('handleCreated: pendingCreates에 "title|||url" 키가 있으면 adapter.createBookmark를 호출하지 않는다', async () => {
		setupChromeMock();
		setupHookDeps('chrome-to-web');

		let capturedHandler:
			| ((id: string, node: chrome.bookmarks.BookmarkTreeNode) => Promise<void>)
			| null = null;
		mockOnCreatedAdd.mockImplementation((fn: typeof capturedHandler) => {
			capturedHandler = fn;
		});

		renderHook(() => useChromeBrowserSync());

		await waitFor(() => expect(capturedHandler).not.toBeNull());

		// Guard에 키 등록 (ChromeSyncService가 web→chrome 작업 중인 상황 시뮬레이션)
		const guardKey = 'Test Bookmark|||https://test.com';
		ChromeSyncGuard.pendingCreates.add(guardKey);

		await capturedHandler?.('chrome-node-1', {
			id: 'chrome-node-1',
			title: 'Test Bookmark',
			url: 'https://test.com',
			parentId: '1',
		});

		expect(mockAdapter.createBookmark).not.toHaveBeenCalled();

		ChromeSyncGuard.pendingCreates.delete(guardKey);
	});

	it('handleCreated: pendingCreates에 "folder|||name" 키가 있으면 adapter.createFolder를 호출하지 않는다', async () => {
		setupChromeMock();
		setupHookDeps('chrome-to-web');

		let capturedHandler:
			| ((id: string, node: chrome.bookmarks.BookmarkTreeNode) => Promise<void>)
			| null = null;
		mockOnCreatedAdd.mockImplementation((fn: typeof capturedHandler) => {
			capturedHandler = fn;
		});

		renderHook(() => useChromeBrowserSync());

		await waitFor(() => expect(capturedHandler).not.toBeNull());

		const guardKey = 'folder|||My Folder';
		ChromeSyncGuard.pendingCreates.add(guardKey);

		// 폴더 생성 이벤트 (url 없음)
		await capturedHandler?.('chrome-folder-1', {
			id: 'chrome-folder-1',
			title: 'My Folder',
			parentId: '1',
		});

		expect(mockAdapter.createFolder).not.toHaveBeenCalled();

		ChromeSyncGuard.pendingCreates.delete(guardKey);
	});

	it('handleRemoved: pendingRemoves에 chrome ID가 있으면 adapter.deleteBookmark를 호출하지 않는다', async () => {
		setupChromeMock();
		setupHookDeps('chrome-to-web');

		let capturedHandler: ((id: string) => Promise<void>) | null = null;
		mockOnRemovedAdd.mockImplementation((fn: typeof capturedHandler) => {
			capturedHandler = fn;
		});

		// 초기 동기화는 빈 syncMap(삭제 트리거 없음), 핸들러 호출 시에는 실제 syncMap 반환
		mockStorageGet
			.mockResolvedValueOnce({}) // runInitialSync의 readSyncMap()
			.mockResolvedValue({ syncMap: { bookmarks: { 'app-bm-1': 'chrome-node-1' }, folders: {} } });

		renderHook(() => useChromeBrowserSync());

		await waitFor(() => expect(capturedHandler).not.toBeNull());

		ChromeSyncGuard.pendingRemoves.add('chrome-node-1');

		await capturedHandler?.('chrome-node-1');

		expect(mockAdapter.deleteBookmark).not.toHaveBeenCalled();

		ChromeSyncGuard.pendingRemoves.delete('chrome-node-1');
	});

	it('handleChanged: pendingUpdates에 chrome ID가 있으면 adapter.updateBookmark를 호출하지 않는다', async () => {
		setupChromeMock();
		setupHookDeps('chrome-to-web');

		let capturedHandler:
			| ((id: string, changeInfo: { title: string; url?: string }) => Promise<void>)
			| null = null;
		mockOnChangedAdd.mockImplementation((fn: typeof capturedHandler) => {
			capturedHandler = fn;
		});

		mockStorageGet.mockResolvedValue({
			syncMap: { bookmarks: { 'app-bm-1': 'chrome-node-1' }, folders: {} },
		});

		renderHook(() => useChromeBrowserSync());

		await waitFor(() => expect(capturedHandler).not.toBeNull());

		ChromeSyncGuard.pendingUpdates.add('chrome-node-1');

		await capturedHandler?.('chrome-node-1', {
			title: 'Updated Title',
			url: 'https://updated.com',
		});

		expect(mockAdapter.updateBookmark).not.toHaveBeenCalled();

		ChromeSyncGuard.pendingUpdates.delete('chrome-node-1');
	});
});

// ============================================================
// isSyncing 상태
// ============================================================
describe('isSyncing 상태', () => {
	it('off 모드에서는 isSyncing이 false이다', () => {
		vi.unstubAllGlobals();
		setupHookDeps('off');

		const { result } = renderHook(() => useChromeBrowserSync());

		expect(result.current.isSyncing).toBe(false);
	});

	it('chrome-to-web 모드에서 초기 동기화 완료 후 isSyncing이 false가 된다', async () => {
		setupChromeMock();
		setupHookDeps('chrome-to-web');

		const { result } = renderHook(() => useChromeBrowserSync());

		await waitFor(() => {
			expect(result.current.isSyncing).toBe(false);
		});
	});
});
