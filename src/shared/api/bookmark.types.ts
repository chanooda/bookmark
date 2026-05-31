export type BookmarkMoveReq = chrome.bookmarks.MoveDestination & { id: string };

export type BookmarkNode = chrome.bookmarks.BookmarkTreeNode;

export type FolderCreateReq = { parentId: string; title: string };
export type FolderUpdateReq = { id: string; title: string };
export type FolderDeleteReq = { id: string };

export type BookmarkCreateReq = { parentId: string; title: string; url: string };
export type BookmarkUpdateReq = { id: string; title: string; url: string };
export type BookmarkDeleteReq = { id: string };
