import type {
	Bookmark,
	CreateBookmarkDto,
	CreateFolderDto,
	Folder,
	StorageAdapter,
} from '@repo/types';
import { type QueryClient, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { bookmarkKeys } from '@/entities/bookmark';
import { folderKeys } from '@/entities/folder';
import { useSettingStore } from '@/features/settings';
import { useStorageAdapter } from '@/shared/lib/storage';
import { ChromeSyncGuard } from './ChromeSyncGuard';
import { ChromeSyncService } from './ChromeSyncService';
import { readSyncMap, updateSyncMap, writeSyncMap } from './syncMap';

/**
 * Returns the app-side ID (key) whose synced Chrome ID (value) matches `chromeId`.
 */
function findAppId(chromeId: string, map: Record<string, string>): string | undefined {
	return Object.entries(map).find(([, v]) => v === chromeId)?.[0];
}

/**
 * Full diff sync: compares the Chrome bookmark bar against the syncMap and
 * reconciles adds and deletes into app storage.
 * Runs once on mount (or when syncMode is first enabled).
 */
async function runInitialSync(adapter: StorageAdapter, queryClient: QueryClient): Promise<void> {
	const subTree = await chrome.bookmarks.getSubTree('1');
	const barNode = subTree[0];
	if (!barNode?.children) return;

	// Build flat maps of all nodes inside the bookmark bar
	const chromeBookmarks = new Map<string, chrome.bookmarks.BookmarkTreeNode>();
	const chromeFolders = new Map<string, chrome.bookmarks.BookmarkTreeNode>();

	function traverse(nodes: chrome.bookmarks.BookmarkTreeNode[]): void {
		for (const node of nodes) {
			if (node.url) {
				chromeBookmarks.set(node.id, node);
			} else {
				chromeFolders.set(node.id, node);
			}
			if (node.children) traverse(node.children);
		}
	}
	traverse(barNode.children);

	const rawMap = await readSyncMap();
	const syncMap = {
		bookmarks: { ...rawMap.bookmarks },
		folders: { ...rawMap.folders },
	};

	let bookmarksChanged = false;
	let foldersChanged = false;

	// 1. Remove app bookmarks whose Chrome counterpart is gone
	for (const [appId, chromeId] of Object.entries(syncMap.bookmarks)) {
		if (!chromeBookmarks.has(chromeId)) {
			try {
				await adapter.deleteBookmark(appId);
			} catch {
				// already deleted — ignore
			}
			delete syncMap.bookmarks[appId];
			bookmarksChanged = true;
		}
	}

	// 2. Remove app folders whose Chrome counterpart is gone
	for (const [appId, chromeId] of Object.entries(syncMap.folders)) {
		if (!chromeFolders.has(chromeId)) {
			try {
				await adapter.deleteFolder(appId);
			} catch {
				// already deleted — ignore
			}
			delete syncMap.folders[appId];
			foldersChanged = true;
		}
	}

	// 3. Create new Chrome folders not yet in app (recursive for correct tree order)
	async function ensureFolder(chromeId: string): Promise<string | undefined> {
		const existingAppId = findAppId(chromeId, syncMap.folders);
		if (existingAppId) return existingAppId;

		const node = chromeFolders.get(chromeId);
		if (!node) return undefined;

		let appParentId: string | undefined;
		if (node.parentId && node.parentId !== '1') {
			appParentId = await ensureFolder(node.parentId);
		}

		const dto: CreateFolderDto = {
			name: node.title,
			parentId: appParentId,
			order: node.index ?? 0,
		};
		const folder = await adapter.createFolder(dto);
		syncMap.folders[folder.id] = chromeId;
		foldersChanged = true;
		return folder.id;
	}

	for (const chromeId of chromeFolders.keys()) {
		if (!findAppId(chromeId, syncMap.folders)) {
			await ensureFolder(chromeId);
		}
	}

	// 4. Create new Chrome bookmarks not yet in app
	for (const [chromeId, node] of chromeBookmarks) {
		if (!findAppId(chromeId, syncMap.bookmarks) && node.url) {
			const appParentId =
				node.parentId && node.parentId !== '1'
					? findAppId(node.parentId, syncMap.folders)
					: undefined;

			try {
				const dto: CreateBookmarkDto = {
					url: node.url,
					title: node.title,
					folderId: appParentId,
					order: node.index ?? 0,
				};
				const bookmark = await adapter.createBookmark(dto);
				syncMap.bookmarks[bookmark.id] = chromeId;
				bookmarksChanged = true;
			} catch {
				// ignore individual failures — continue with other bookmarks
			}
		}
	}

	// 5. Update order of already-synced items to match Chrome's current index (Chrome wins)
	for (const [appId, chromeId] of Object.entries(syncMap.folders)) {
		const node = chromeFolders.get(chromeId);
		if (node?.index !== undefined) {
			try {
				await adapter.updateFolder(appId, { order: node.index });
				foldersChanged = true;
			} catch {
				// ignore — folder may have been deleted
			}
		}
	}
	for (const [appId, chromeId] of Object.entries(syncMap.bookmarks)) {
		const node = chromeBookmarks.get(chromeId);
		if (node?.index !== undefined) {
			try {
				await adapter.updateBookmark(appId, { order: node.index });
				bookmarksChanged = true;
			} catch {
				// ignore — bookmark may have been deleted
			}
		}
	}

	await writeSyncMap(syncMap);

	if (foldersChanged) queryClient.invalidateQueries({ queryKey: folderKeys.all });
	if (bookmarksChanged || foldersChanged) {
		queryClient.invalidateQueries({ queryKey: bookmarkKeys.all });
	}
}

/**
 * Builds a URL → Chrome node ID map from all bookmarks under the bookmark bar.
 * Used to detect pre-existing Chrome bookmarks and avoid duplicates.
 */
function buildChromeUrlMap(
	nodes: chrome.bookmarks.BookmarkTreeNode[],
	map: Map<string, string>,
): void {
	for (const node of nodes) {
		if (node.url) {
			map.set(node.url, node.id);
		}
		if (node.children) {
			buildChromeUrlMap(node.children, map);
		}
	}
}

/**
 * Builds a set of all Chrome node IDs (both bookmarks and folders) under the given nodes.
 * Used to detect stale syncMap entries whose Chrome counterparts no longer exist.
 */
function buildChromeIdSet(nodes: chrome.bookmarks.BookmarkTreeNode[], set: Set<string>): void {
	for (const node of nodes) {
		set.add(node.id);
		if (node.children) {
			buildChromeIdSet(node.children, set);
		}
	}
}

/**
 * Pushes all app bookmarks/folders not yet in Chrome into Chrome's bookmark bar.
 * If a Chrome bookmark with the same URL already exists, links it in the syncMap
 * instead of creating a duplicate.
 * Runs as part of initial sync for 'web-to-chrome' and 'bidirectional' modes.
 */
async function runWebToChromeSyncInitial(adapter: StorageAdapter): Promise<void> {
	const [allFolders, allBookmarks, syncMap] = await Promise.all([
		adapter.getFolders(),
		adapter.getBookmarks(),
		readSyncMap(),
	]);

	// Build URL → Chrome ID map and Chrome ID set to detect pre-existing / stale entries
	const chromeUrlMap = new Map<string, string>();
	const chromeIdSet = new Set<string>();
	const subTree = await chrome.bookmarks.getSubTree('1');
	if (subTree[0]?.children) {
		buildChromeUrlMap(subTree[0].children, chromeUrlMap);
		buildChromeIdSet(subTree[0].children, chromeIdSet);
	}

	// Remove stale syncMap entries whose Chrome counterparts no longer exist.
	// Without this, runWebToChromeSyncInitial would skip folders/bookmarks that
	// appear in syncMap but were deleted from Chrome.
	const cleanedFolders = { ...syncMap.folders };
	const cleanedBookmarks = { ...syncMap.bookmarks };
	let hasStale = false;
	for (const [appId, chromeId] of Object.entries(syncMap.folders)) {
		if (!chromeIdSet.has(chromeId)) {
			delete cleanedFolders[appId];
			hasStale = true;
		}
	}
	for (const [appId, chromeId] of Object.entries(syncMap.bookmarks)) {
		if (!chromeIdSet.has(chromeId)) {
			delete cleanedBookmarks[appId];
			hasStale = true;
		}
	}
	if (hasStale) {
		await writeSyncMap({ folders: cleanedFolders, bookmarks: cleanedBookmarks });
	}

	const service = new ChromeSyncService();

	// Deep merge: create missing items, update existing ones (name/title/url/folder)
	for (const folder of allFolders) {
		try {
			if (cleanedFolders[folder.id]) {
				await service.syncUpdateFolder(folder.id, folder.name);
			} else {
				await service.syncCreateFolder(folder, allFolders);
			}
		} catch {
			// individual failures — continue
		}
	}

	for (const bookmark of allBookmarks) {
		try {
			if (cleanedBookmarks[bookmark.id]) {
				await service.syncUpdateBookmark(bookmark, allFolders);
			} else {
				const existingChromeId = chromeUrlMap.get(bookmark.url);
				if (existingChromeId) {
					// Link to the existing Chrome bookmark instead of creating a duplicate
					await updateSyncMap({ bookmarks: { [bookmark.id]: existingChromeId } });
				} else {
					await service.syncCreateBookmark(bookmark, allFolders);
				}
			}
		} catch {
			// individual failures — continue
		}
	}

	await syncOrderInChrome(allFolders, allBookmarks);
}

/**
 * Reorders synced items within each Chrome folder to match the app's order field.
 * Processes items from first to last desired position, moving each to its target index.
 */
async function syncOrderInChrome(allFolders: Folder[], allBookmarks: Bookmark[]): Promise<void> {
	const syncMap = await readSyncMap();

	// Group synced items by Chrome parent ID, tagged with order for sorting
	const groups = new Map<string, Array<{ chromeId: string; order: number }>>();

	const addToGroup = (parentChromeId: string, chromeId: string, order: number) => {
		const group = groups.get(parentChromeId) ?? [];
		group.push({ chromeId, order });
		groups.set(parentChromeId, group);
	};

	for (const folder of allFolders) {
		const chromeId = syncMap.folders[folder.id];
		if (!chromeId) continue;
		const parentChromeId = folder.parentId ? (syncMap.folders[folder.parentId] ?? '1') : '1';
		addToGroup(parentChromeId, chromeId, folder.order);
	}

	for (const bookmark of allBookmarks) {
		const chromeId = syncMap.bookmarks[bookmark.id];
		if (!chromeId) continue;
		const parentChromeId = bookmark.folderId ? (syncMap.folders[bookmark.folderId] ?? '1') : '1';
		addToGroup(parentChromeId, chromeId, bookmark.order);
	}

	// Move each item to its desired index (processing 0→N keeps previous positions stable)
	for (const [parentChromeId, items] of groups) {
		items.sort((a, b) => a.order - b.order);
		for (let i = 0; i < items.length; i++) {
			try {
				await chrome.bookmarks.move(items[i].chromeId, { parentId: parentChromeId, index: i });
			} catch {
				// item may no longer exist — continue
			}
		}
	}
}

/**
 * Manages Chrome bookmark sync lifecycle based on the current syncMode setting.
 *
 * - 'chrome-to-web': initial diff sync + real-time Chrome event listeners
 * - 'web-to-chrome': initial push of all app bookmarks into Chrome
 * - 'bidirectional': chrome-to-web first, then web-to-chrome, then real-time listeners
 * - 'off': no-op
 *
 * Returns `{ isSyncing }` — true while initial sync is in progress.
 */
export function useChromeBrowserSync(): { isSyncing: boolean } {
	const { syncMode } = useSettingStore();
	const adapter = useStorageAdapter();
	const queryClient = useQueryClient();

	const isChromeSide = syncMode === 'chrome-to-web' || syncMode === 'bidirectional';
	const isWebSide = syncMode === 'web-to-chrome' || syncMode === 'bidirectional';
	const isActive =
		(isChromeSide || isWebSide) && typeof chrome !== 'undefined' && !!chrome?.bookmarks;

	// Initialize to true when sync will run, avoiding a flash of unsynchronized content
	const [isSyncing, setIsSyncing] = useState(isActive);

	useEffect(() => {
		const chromeSide = syncMode === 'chrome-to-web' || syncMode === 'bidirectional';
		const webSide = syncMode === 'web-to-chrome' || syncMode === 'bidirectional';
		const active = (chromeSide || webSide) && typeof chrome !== 'undefined' && !!chrome.bookmarks;

		if (!active) {
			setIsSyncing(false);
			return;
		}

		// Run initial syncs sequentially: chrome→web first, then web→chrome
		setIsSyncing(true);
		const initialSync = chromeSide
			? runInitialSync(adapter, queryClient).then(() => {
					if (webSide) return runWebToChromeSyncInitial(adapter);
				})
			: runWebToChromeSyncInitial(adapter);

		initialSync
			.catch(() => toast.error('Chrome 북마크 동기화에 실패했습니다.'))
			.finally(() => setIsSyncing(false));

		const handleCreated = async (
			id: string,
			node: chrome.bookmarks.BookmarkTreeNode,
		): Promise<void> => {
			if (node.url) {
				// ── Bookmark ──
				const key = `${node.title}|||${node.url}`;
				if (ChromeSyncGuard.pendingCreates.has(key)) return;

				// Check syncMap immediately, then after 150ms to catch cross-page race
				let syncMap = await readSyncMap();
				if (findAppId(id, syncMap.bookmarks)) return;

				await new Promise<void>((resolve) => setTimeout(resolve, 150));
				syncMap = await readSyncMap();
				if (findAppId(id, syncMap.bookmarks)) return;

				const appParentId = node.parentId ? findAppId(node.parentId, syncMap.folders) : undefined;

				try {
					const dto: CreateBookmarkDto = {
						url: node.url,
						title: node.title,
						folderId: appParentId,
						order: node.index ?? 0,
					};
					const bookmark = await adapter.createBookmark(dto);
					await updateSyncMap({ bookmarks: { [bookmark.id]: id } });
					queryClient.invalidateQueries({ queryKey: bookmarkKeys.all });
				} catch {
					toast.error('Chrome 북마크 가져오기에 실패했습니다.');
				}
			} else {
				// ── Folder ──
				const key = `folder|||${node.title}`;
				if (ChromeSyncGuard.pendingCreates.has(key)) return;

				let syncMap = await readSyncMap();
				if (findAppId(id, syncMap.folders)) return;

				await new Promise<void>((resolve) => setTimeout(resolve, 150));
				syncMap = await readSyncMap();
				if (findAppId(id, syncMap.folders)) return;

				const appParentId = node.parentId ? findAppId(node.parentId, syncMap.folders) : undefined;

				try {
					const dto: CreateFolderDto = {
						name: node.title,
						parentId: appParentId,
						order: node.index ?? 0,
					};
					const folder = await adapter.createFolder(dto);
					await updateSyncMap({ folders: { [folder.id]: id } });
					queryClient.invalidateQueries({ queryKey: folderKeys.all });
				} catch {
					toast.error('Chrome 폴더 가져오기에 실패했습니다.');
				}
			}
		};

		const handleRemoved = async (id: string): Promise<void> => {
			if (ChromeSyncGuard.pendingRemoves.has(id)) return;

			const syncMap = await readSyncMap();
			const appBookmarkId = findAppId(id, syncMap.bookmarks);
			const appFolderId = findAppId(id, syncMap.folders);

			if (appBookmarkId) {
				try {
					await adapter.deleteBookmark(appBookmarkId);
				} catch {
					// ignore — may already be deleted
				}
				const updatedBookmarks = { ...syncMap.bookmarks };
				delete updatedBookmarks[appBookmarkId];
				await writeSyncMap({ folders: syncMap.folders, bookmarks: updatedBookmarks });
				queryClient.invalidateQueries({ queryKey: bookmarkKeys.all });
			} else if (appFolderId) {
				try {
					await adapter.deleteFolder(appFolderId);
				} catch {
					// ignore — may already be deleted
				}
				const updatedFolders = { ...syncMap.folders };
				delete updatedFolders[appFolderId];
				await writeSyncMap({ folders: updatedFolders, bookmarks: syncMap.bookmarks });
				queryClient.invalidateQueries({ queryKey: folderKeys.all });
				queryClient.invalidateQueries({ queryKey: bookmarkKeys.all });
			}
			// Chrome ID not in syncMap → user's own Chrome bookmark, ignore
		};

		const handleChanged = async (
			id: string,
			changeInfo: { title: string; url?: string },
		): Promise<void> => {
			if (ChromeSyncGuard.pendingUpdates.has(id)) return;

			const syncMap = await readSyncMap();
			const appBookmarkId = findAppId(id, syncMap.bookmarks);

			if (appBookmarkId) {
				try {
					await adapter.updateBookmark(appBookmarkId, {
						title: changeInfo.title,
						...(changeInfo.url !== undefined ? { url: changeInfo.url } : {}),
					});
					queryClient.invalidateQueries({ queryKey: bookmarkKeys.all });
				} catch {
					toast.error('Chrome 북마크 수정 반영에 실패했습니다.');
				}
				return;
			}

			// Also handle folder title changes from Chrome
			const appFolderId = findAppId(id, syncMap.folders);
			if (appFolderId) {
				try {
					await adapter.updateFolder(appFolderId, { name: changeInfo.title });
					queryClient.invalidateQueries({ queryKey: folderKeys.all });
				} catch {
					toast.error('Chrome 폴더 수정 반영에 실패했습니다.');
				}
			}
		};

		// Real-time Chrome→App listeners are only needed for chrome-side modes
		if (!chromeSide) return;

		chrome.bookmarks.onCreated.addListener(handleCreated);
		chrome.bookmarks.onRemoved.addListener(handleRemoved);
		chrome.bookmarks.onChanged.addListener(handleChanged);

		return () => {
			chrome.bookmarks.onCreated.removeListener(handleCreated);
			chrome.bookmarks.onRemoved.removeListener(handleRemoved);
			chrome.bookmarks.onChanged.removeListener(handleChanged);
		};
	}, [syncMode, adapter, queryClient]);

	return { isSyncing };
}
