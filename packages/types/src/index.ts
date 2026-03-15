// User
export interface User {
	id: string;
	googleId: string;
	email: string;
	name: string;
	avatar: string | null;
	createdAt: Date;
}

// Tag
export interface Tag {
	id: string;
	userId: string;
	name: string;
	color: string; // hex color (e.g. "#3B82F6")
	createdAt: Date;
}

// Folder
export interface Folder {
	id: string;
	userId: string;
	name: string;
	parentId: string | null; // null = top-level folder
	order: number;
	createdAt: Date;
}

// Bookmark
export interface Bookmark {
	id: string;
	userId: string;
	url: string;
	title: string;
	description: string | null;
	favicon: string | null;
	folderId: string | null; // null = unorganized
	order: number;
	createdAt: Date;
	updatedAt: Date;
	tags: Tag[];
}

// BookmarkTag (join table)
export interface BookmarkTag {
	bookmarkId: string;
	tagId: string;
}

// DTOs
export interface CreateBookmarkDto {
	url: string;
	title: string;
	description?: string;
	tagIds?: string[];
	folderId?: string;
	order?: number;
}

export interface UpdateBookmarkDto {
	url?: string;
	title?: string;
	description?: string | null;
	tagIds?: string[];
	folderId?: string | null;
	order?: number;
}

export interface CreateFolderDto {
	name: string;
	parentId?: string;
	order?: number;
}

export interface UpdateFolderDto {
	name?: string;
	parentId?: string | null;
	order?: number;
}

export interface CreateTagDto {
	name: string;
	color: string;
}

export interface UpdateTagDto {
	name?: string;
	color?: string;
}

export interface BookmarkListQuery {
	tagId?: string;
	search?: string;
	folderId?: string | 'unorganized'; // 'unorganized' = folderId is null
}

// Metadata
export interface UrlMetadata {
	title: string | null;
	favicon: string | null;
}

// Auth
export interface AuthTokens {
	accessToken: string;
}

// Settings
export type SyncMode = 'off' | 'chrome-to-web' | 'web-to-chrome' | 'bidirectional';

export interface AppSettings {
	syncMode: SyncMode;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
	syncMode: 'off',
};

export interface ReorderItemDto {
	id: string;
	order: number;
}

// Storage
export interface StorageAdapter {
	getBookmarks(query?: BookmarkListQuery): Promise<Bookmark[]>;
	createBookmark(dto: CreateBookmarkDto): Promise<Bookmark>;
	updateBookmark(id: string, dto: UpdateBookmarkDto): Promise<Bookmark>;
	deleteBookmark(id: string): Promise<void>;
	reorderBookmarks(items: ReorderItemDto[]): Promise<void>;
	getTags(): Promise<Tag[]>;
	createTag(dto: CreateTagDto): Promise<Tag>;
	updateTag(id: string, dto: UpdateTagDto): Promise<Tag>;
	deleteTag(id: string): Promise<void>;
	getFolders(): Promise<Folder[]>;
	createFolder(dto: CreateFolderDto): Promise<Folder>;
	updateFolder(id: string, dto: UpdateFolderDto): Promise<Folder>;
	deleteFolder(id: string): Promise<void>;
	reorderFolders(items: ReorderItemDto[]): Promise<void>;
}
