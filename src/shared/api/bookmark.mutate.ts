import { mutationOptions } from '@tanstack/react-query';
import { assertChromeBookmarks } from '../libs/chrome';
import type {
	BookmarkCreateReq,
	BookmarkDeleteReq,
	BookmarkMoveReq,
	BookmarkUpdateReq,
	FolderCreateReq,
	FolderDeleteReq,
	FolderUpdateReq,
} from './bookmark.types';

export const move = () =>
	mutationOptions({
		mutationFn: async (req: BookmarkMoveReq) => {
			try {
				assertChromeBookmarks();
				chrome.bookmarks.move(req.id, { index: req.index, parentId: req.parentId });
			} catch (e) {
				console.error(e);
			}
		},
	});

export const createFolder = () =>
	mutationOptions({
		mutationFn: async (req: FolderCreateReq) => {
			assertChromeBookmarks();
			return chrome.bookmarks.create({ parentId: req.parentId, title: req.title });
		},
	});

export const updateFolder = () =>
	mutationOptions({
		mutationFn: async (req: FolderUpdateReq) => {
			assertChromeBookmarks();
			return chrome.bookmarks.update(req.id, { title: req.title });
		},
	});

export const deleteFolder = () =>
	mutationOptions({
		mutationFn: async (req: FolderDeleteReq) => {
			assertChromeBookmarks();
			return chrome.bookmarks.removeTree(req.id);
		},
	});

export const createBookmark = () =>
	mutationOptions({
		mutationFn: async (req: BookmarkCreateReq) => {
			assertChromeBookmarks();
			return chrome.bookmarks.create({ parentId: req.parentId, title: req.title, url: req.url });
		},
	});

export const updateBookmark = () =>
	mutationOptions({
		mutationFn: async (req: BookmarkUpdateReq) => {
			assertChromeBookmarks();
			return chrome.bookmarks.update(req.id, { title: req.title, url: req.url });
		},
	});

export const deleteBookmark = () =>
	mutationOptions({
		mutationFn: async (req: BookmarkDeleteReq) => {
			assertChromeBookmarks();
			return chrome.bookmarks.remove(req.id);
		},
	});

export const bookmarkMutations = {
	move,
	createFolder,
	updateFolder,
	deleteFolder,
	createBookmark,
	updateBookmark,
	deleteBookmark,
};
