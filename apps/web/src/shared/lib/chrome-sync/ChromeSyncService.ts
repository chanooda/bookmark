import type { Bookmark, Folder } from '@repo/types';
import { ChromeSyncGuard } from './ChromeSyncGuard';
import { readSyncMap, updateSyncMap, writeSyncMap } from './syncMap';

// Chrome's Bookmarks Bar node ID
const BOOKMARKS_BAR_ID = '1';

export class ChromeSyncService {
	// In-flight promise cache to prevent duplicate folder creation under concurrent calls
	private readonly _pendingFolders = new Map<string, Promise<string>>();

	// Ensures the app folder exists in Chrome's bookmark tree.
	// Recursively ensures ancestor folders are synced first.
	// Returns the Chrome node ID for the folder.
	private async ensureFolderSynced(appFolderId: string, allFolders: Folder[]): Promise<string> {
		// Deduplicate concurrent calls for the same folder
		const pending = this._pendingFolders.get(appFolderId);
		if (pending) return pending;

		const promise = this._doEnsureFolder(appFolderId, allFolders).finally(() => {
			this._pendingFolders.delete(appFolderId);
		});
		this._pendingFolders.set(appFolderId, promise);
		return promise;
	}

	private async _doEnsureFolder(appFolderId: string, allFolders: Folder[]): Promise<string> {
		const map = await readSyncMap();
		if (map.folders[appFolderId]) {
			return map.folders[appFolderId] as string;
		}

		const appFolder = allFolders.find((f) => f.id === appFolderId);
		if (!appFolder) throw new Error(`Folder not found in app: ${appFolderId}`);

		const parentChromeId = await this.getChromeFolderParent(appFolder, allFolders);

		const key = `folder|||${appFolder.name}`;
		ChromeSyncGuard.pendingCreates.add(key);
		const chromeNode = await chrome.bookmarks
			.create({ parentId: parentChromeId, title: appFolder.name, index: appFolder.order })
			.finally(() => ChromeSyncGuard.pendingCreates.delete(key));

		await updateSyncMap({ folders: { [appFolderId]: chromeNode.id } });
		return chromeNode.id;
	}

	private async getChromeFolderParent(appFolder: Folder, allFolders: Folder[]): Promise<string> {
		if (appFolder.parentId === null) {
			return BOOKMARKS_BAR_ID;
		}
		return this.ensureFolderSynced(appFolder.parentId, allFolders);
	}

	async syncCreateBookmark(appBookmark: Bookmark, allFolders: Folder[]): Promise<void> {
		let parentId = BOOKMARKS_BAR_ID;
		if (appBookmark.folderId) {
			parentId = await this.ensureFolderSynced(appBookmark.folderId, allFolders);
		}

		const key = `${appBookmark.title}|||${appBookmark.url}`;
		ChromeSyncGuard.pendingCreates.add(key);
		const chromeNode = await chrome.bookmarks
			.create({
				parentId,
				title: appBookmark.title,
				url: appBookmark.url,
				index: appBookmark.order,
			})
			.finally(() => ChromeSyncGuard.pendingCreates.delete(key));

		await updateSyncMap({ bookmarks: { [appBookmark.id]: chromeNode.id } });
	}

	async syncUpdateBookmark(appBookmark: Bookmark, allFolders: Folder[]): Promise<void> {
		const map = await readSyncMap();
		const chromeId = map.bookmarks[appBookmark.id];

		if (!chromeId) {
			// Bookmark was never synced — create it now
			await this.syncCreateBookmark(appBookmark, allFolders);
			return;
		}

		let targetParentId = BOOKMARKS_BAR_ID;
		if (appBookmark.folderId) {
			targetParentId = await this.ensureFolderSynced(appBookmark.folderId, allFolders);
		}

		ChromeSyncGuard.pendingUpdates.add(chromeId);
		try {
			// update and move are separate Chrome API calls; best-effort: both wrapped together
			await chrome.bookmarks.update(chromeId, {
				title: appBookmark.title,
				url: appBookmark.url,
			});
			await chrome.bookmarks.move(chromeId, { parentId: targetParentId, index: appBookmark.order });
		} catch {
			// Chrome node may have been manually deleted — fall back to create
			await this.syncCreateBookmark(appBookmark, allFolders);
		} finally {
			ChromeSyncGuard.pendingUpdates.delete(chromeId);
		}
	}

	async syncDeleteBookmark(appBookmarkId: string): Promise<void> {
		const map = await readSyncMap();
		const chromeId = map.bookmarks[appBookmarkId];
		if (!chromeId) return;

		ChromeSyncGuard.pendingRemoves.add(chromeId);
		try {
			await chrome.bookmarks.remove(chromeId);
		} catch {
			// Chrome node may have been manually deleted — ignore
		} finally {
			ChromeSyncGuard.pendingRemoves.delete(chromeId);
		}

		// Use writeSyncMap directly to replace bookmarks entirely (not merge),
		// ensuring the deleted key is actually removed from storage
		const updatedBookmarks = { ...map.bookmarks };
		delete updatedBookmarks[appBookmarkId];
		await writeSyncMap({ folders: map.folders, bookmarks: updatedBookmarks });
	}

	async syncCreateFolder(appFolder: Folder, allFolders: Folder[]): Promise<void> {
		await this.ensureFolderSynced(appFolder.id, allFolders);
	}

	async syncUpdateFolder(appFolderId: string, name: string): Promise<void> {
		const map = await readSyncMap();
		const chromeId = map.folders[appFolderId];
		if (!chromeId) return;

		ChromeSyncGuard.pendingUpdates.add(chromeId);
		try {
			await chrome.bookmarks.update(chromeId, { title: name });
		} catch {
			// Chrome node may have been manually deleted — ignore
		} finally {
			ChromeSyncGuard.pendingUpdates.delete(chromeId);
		}
	}

	/**
	 * Moves Chrome bookmark/folder nodes to match new order values.
	 * Items must be sorted by order (ascending) before calling this method.
	 */
	async syncReorderBookmarks(items: { id: string; order: number }[]): Promise<void> {
		const map = await readSyncMap();
		const sorted = [...items].sort((a, b) => a.order - b.order);
		for (const item of sorted) {
			const chromeId = map.bookmarks[item.id];
			if (!chromeId) continue;
			ChromeSyncGuard.pendingUpdates.add(chromeId);
			try {
				await chrome.bookmarks.move(chromeId, { index: item.order });
			} catch {
				// Chrome node may have been manually deleted — ignore
			} finally {
				ChromeSyncGuard.pendingUpdates.delete(chromeId);
			}
		}
	}

	async syncReorderFolders(items: { id: string; order: number }[]): Promise<void> {
		const map = await readSyncMap();
		const sorted = [...items].sort((a, b) => a.order - b.order);
		for (const item of sorted) {
			const chromeId = map.folders[item.id];
			if (!chromeId) continue;
			ChromeSyncGuard.pendingUpdates.add(chromeId);
			try {
				await chrome.bookmarks.move(chromeId, { index: item.order });
			} catch {
				// Chrome node may have been manually deleted — ignore
			} finally {
				ChromeSyncGuard.pendingUpdates.delete(chromeId);
			}
		}
	}

	async syncDeleteFolder(appFolderId: string): Promise<void> {
		const map = await readSyncMap();
		const chromeId = map.folders[appFolderId];
		if (!chromeId) return;

		ChromeSyncGuard.pendingRemoves.add(chromeId);
		try {
			await chrome.bookmarks.removeTree(chromeId);
		} catch {
			// Chrome node may have been manually deleted — ignore
		} finally {
			ChromeSyncGuard.pendingRemoves.delete(chromeId);
		}

		// Use writeSyncMap directly to replace folders entirely (not merge),
		// ensuring the deleted key is actually removed from storage
		const updatedFolders = { ...map.folders };
		delete updatedFolders[appFolderId];
		await writeSyncMap({ folders: updatedFolders, bookmarks: map.bookmarks });
	}
}
