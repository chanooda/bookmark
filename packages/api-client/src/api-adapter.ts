import type {
	Bookmark,
	BookmarkListQuery,
	CreateBookmarkDto,
	CreateFolderDto,
	CreateTagDto,
	Folder,
	ReorderItemDto,
	StorageAdapter,
	Tag,
	UpdateBookmarkDto,
	UpdateFolderDto,
	UpdateTagDto,
} from '@repo/types';
import { bookmarksApi } from './bookmarks';
import { foldersApi } from './folders';
import { tagsApi } from './tags';

export class ApiAdapter implements StorageAdapter {
	getBookmarks(query?: BookmarkListQuery): Promise<Bookmark[]> {
		return bookmarksApi.list(query);
	}

	createBookmark(dto: CreateBookmarkDto): Promise<Bookmark> {
		return bookmarksApi.create(dto);
	}

	updateBookmark(id: string, dto: UpdateBookmarkDto): Promise<Bookmark> {
		return bookmarksApi.update(id, dto);
	}

	deleteBookmark(id: string): Promise<void> {
		return bookmarksApi.remove(id);
	}

	reorderBookmarks(items: ReorderItemDto[]): Promise<void> {
		return bookmarksApi.reorder(items);
	}

	getTags(): Promise<Tag[]> {
		return tagsApi.list();
	}

	createTag(dto: CreateTagDto): Promise<Tag> {
		return tagsApi.create(dto);
	}

	updateTag(id: string, dto: UpdateTagDto): Promise<Tag> {
		return tagsApi.update(id, dto);
	}

	deleteTag(id: string): Promise<void> {
		return tagsApi.remove(id);
	}

	getFolders(): Promise<Folder[]> {
		return foldersApi.list();
	}

	createFolder(dto: CreateFolderDto): Promise<Folder> {
		return foldersApi.create(dto);
	}

	updateFolder(id: string, dto: UpdateFolderDto): Promise<Folder> {
		return foldersApi.update(id, dto);
	}

	deleteFolder(id: string): Promise<void> {
		return foldersApi.remove(id);
	}

	reorderFolders(items: ReorderItemDto[]): Promise<void> {
		return foldersApi.reorder(items);
	}
}
