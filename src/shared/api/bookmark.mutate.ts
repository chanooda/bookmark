import { mutationOptions } from '@tanstack/react-query';
import { assertChromeBookmarks } from '../libs/chrome';
import type { BookmarkMoveReq } from './bookmark.types';

export const move = () =>
	mutationOptions({
		mutationFn: async (req: BookmarkMoveReq) => {
			try {
				assertChromeBookmarks();
				chrome.bookmarks.move(req.id, {
					index: req.index,
					parentId: req.parentId,
				});
			} catch (e) {
				console.error(e);
			}
		},
	});
export const bookmarkMutations = {
	move,
};
