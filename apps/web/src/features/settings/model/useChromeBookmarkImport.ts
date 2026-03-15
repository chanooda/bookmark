import type { StorageAdapter } from '@repo/types';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { bookmarkKeys } from '@/entities/bookmark';
import { folderKeys } from '@/entities/folder';
import { useStorageAdapter } from '@/shared/lib/storage';

interface ImportProgress {
	total: number;
	current: number;
	status: 'idle' | 'importing' | 'done' | 'error';
	error?: string;
}

function countBookmarkNodes(nodes: chrome.bookmarks.BookmarkTreeNode[]): number {
	let count = 0;
	for (const node of nodes) {
		if (node.url) {
			count++;
		} else if (node.children) {
			count += countBookmarkNodes(node.children);
		}
	}
	return count;
}

function hasPendingImports(
	nodes: chrome.bookmarks.BookmarkTreeNode[],
	existingUrls: Set<string>,
): boolean {
	for (const node of nodes) {
		if (node.url && !existingUrls.has(node.url)) return true;
		if (node.children && hasPendingImports(node.children, existingUrls)) return true;
	}
	return false;
}

async function traverseAndImport(
	nodes: chrome.bookmarks.BookmarkTreeNode[],
	parentFolderId: string | undefined,
	adapter: StorageAdapter,
	existingUrls: Set<string>,
	onProgress: () => void,
): Promise<void> {
	for (const node of nodes) {
		if (node.url) {
			if (!existingUrls.has(node.url)) {
				await adapter.createBookmark({
					url: node.url,
					title: node.title || node.url,
					folderId: parentFolderId,
					order: node.index,
				});
				existingUrls.add(node.url);
			}
			onProgress();
		} else if (node.children) {
			// id "0" is the virtual root node; id "1" is the Bookmarks Bar — both map to 전체 (folderId null)
			if (node.id === '0' || node.id === '1') {
				await traverseAndImport(node.children, undefined, adapter, existingUrls, onProgress);
			} else if (hasPendingImports(node.children, existingUrls)) {
				// Only create a folder if it has at least one new bookmark to import
				const folder = await adapter.createFolder({
					name: node.title,
					parentId: parentFolderId,
					order: node.index,
				});
				await traverseAndImport(node.children, folder.id, adapter, existingUrls, onProgress);
			}
		}
	}
}

export function useChromeBookmarkImport() {
	const adapter = useStorageAdapter();
	const queryClient = useQueryClient();
	const [progress, setProgress] = useState<ImportProgress>({
		total: 0,
		current: 0,
		status: 'idle',
	});

	const isChromeBookmarksAvailable = typeof chrome !== 'undefined' && !!chrome.bookmarks;

	const importChromeBookmarks = useCallback(async () => {
		if (typeof chrome === 'undefined' || !chrome.bookmarks) {
			setProgress((prev) => ({
				...prev,
				status: 'error',
				error: 'Chrome 북마크 API를 사용할 수 없습니다.',
			}));
			return;
		}

		try {
			const tree = await chrome.bookmarks.getTree();
			const total = countBookmarkNodes(tree);

			setProgress({ total, current: 0, status: 'importing' });

			const existingBookmarks = await adapter.getBookmarks();
			const existingUrls = new Set(existingBookmarks.map((b) => b.url));

			let current = 0;
			await traverseAndImport(tree, undefined, adapter, existingUrls, () => {
				current++;
				setProgress((prev) => ({ ...prev, current }));
			});

			await queryClient.invalidateQueries({ queryKey: bookmarkKeys.all });
			await queryClient.invalidateQueries({ queryKey: folderKeys.all });

			setProgress((prev) => ({ ...prev, status: 'done' }));
		} catch (err) {
			setProgress((prev) => ({
				...prev,
				status: 'error',
				error: err instanceof Error ? err.message : '가져오기 중 오류가 발생했습니다.',
			}));
		}
	}, [adapter, queryClient]);

	const reset = useCallback(() => {
		setProgress({ total: 0, current: 0, status: 'idle' });
	}, []);

	return { importChromeBookmarks, progress, reset, isChromeBookmarksAvailable };
}
