# Folders, Auto Title, Favicon Preview — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add hierarchical folders (Chrome-style), auto title fetch from URL, and favicon preview in bookmark forms.

**Architecture:** Flat `Folder` list with `parentId` (adjacency list) stored in DB/chrome.storage; tree built on client. Auto title via `GET /metadata?url=` (public NestJS endpoint, no auth). Favicon preview uses Google S2 API instantly from URL input (no fetch needed).

**Tech Stack:** drizzle-orm (SQLite), NestJS, React + TanStack Query, ChromeStorageAdapter, FSD architecture

---

## Task 1: Types — Folder, Bookmark, StorageAdapter

**Files:**
- Modify: `packages/types/src/index.ts`

**Step 1: Add Folder types and update existing types**

Replace the contents of `packages/types/src/index.ts`:

```ts
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
}

export interface UpdateBookmarkDto {
	url?: string;
	title?: string;
	description?: string;
	tagIds?: string[];
	folderId?: string | null;
}

export interface CreateFolderDto {
	name: string;
	parentId?: string;
}

export interface UpdateFolderDto {
	name?: string;
	parentId?: string | null;
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

// Storage
export interface StorageAdapter {
	getBookmarks(query?: BookmarkListQuery): Promise<Bookmark[]>;
	createBookmark(dto: CreateBookmarkDto): Promise<Bookmark>;
	updateBookmark(id: string, dto: UpdateBookmarkDto): Promise<Bookmark>;
	deleteBookmark(id: string): Promise<void>;
	getTags(): Promise<Tag[]>;
	createTag(dto: CreateTagDto): Promise<Tag>;
	updateTag(id: string, dto: UpdateTagDto): Promise<Tag>;
	deleteTag(id: string): Promise<void>;
	getFolders(): Promise<Folder[]>;
	createFolder(dto: CreateFolderDto): Promise<Folder>;
	updateFolder(id: string, dto: UpdateFolderDto): Promise<Folder>;
	deleteFolder(id: string): Promise<void>;
}
```

**Step 2: Run type check**

```bash
cd /path/to/project && pnpm check-type
```

Expected: errors in `api-client`, `api`, `web`, `extension` — these will be fixed in subsequent tasks.

**Step 3: Commit**

```bash
git add packages/types/src/index.ts
git commit -m "feat(types): add Folder types, folderId to Bookmark, extend StorageAdapter"
```

---

## Task 2: Backend DB Schema — folders table + bookmarks.folderId

**Files:**
- Modify: `apps/api/src/db/schema.ts`

**Step 1: Add folders table and folderId to bookmarks**

```ts
import { relations } from 'drizzle-orm';
import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
	id: text('id').primaryKey(),
	googleId: text('google_id').notNull().unique(),
	email: text('email').notNull(),
	name: text('name').notNull(),
	avatar: text('avatar'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const folders = sqliteTable('folders', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	parentId: text('parent_id').references((): ReturnType<typeof text> => folders.id, {
		onDelete: 'cascade',
	}),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const tags = sqliteTable('tags', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	color: text('color').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const bookmarks = sqliteTable('bookmarks', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	url: text('url').notNull(),
	title: text('title').notNull(),
	description: text('description'),
	favicon: text('favicon'),
	folderId: text('folder_id').references(() => folders.id, { onDelete: 'set null' }),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const bookmarkTags = sqliteTable(
	'bookmark_tags',
	{
		bookmarkId: text('bookmark_id')
			.notNull()
			.references(() => bookmarks.id, { onDelete: 'cascade' }),
		tagId: text('tag_id')
			.notNull()
			.references(() => tags.id, { onDelete: 'cascade' }),
	},
	(t) => [primaryKey({ columns: [t.bookmarkId, t.tagId] })],
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
	bookmarks: many(bookmarks),
	tags: many(tags),
	folders: many(folders),
}));

export const foldersRelations = relations(folders, ({ one, many }) => ({
	user: one(users, { fields: [folders.userId], references: [users.id] }),
	parent: one(folders, { fields: [folders.parentId], references: [folders.id], relationName: 'children' }),
	children: many(folders, { relationName: 'children' }),
	bookmarks: many(bookmarks),
}));

export const bookmarksRelations = relations(bookmarks, ({ one, many }) => ({
	user: one(users, { fields: [bookmarks.userId], references: [users.id] }),
	folder: one(folders, { fields: [bookmarks.folderId], references: [folders.id] }),
	bookmarkTags: many(bookmarkTags),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
	user: one(users, { fields: [tags.userId], references: [users.id] }),
	bookmarkTags: many(bookmarkTags),
}));

export const bookmarkTagsRelations = relations(bookmarkTags, ({ one }) => ({
	bookmark: one(bookmarks, { fields: [bookmarkTags.bookmarkId], references: [bookmarks.id] }),
	tag: one(tags, { fields: [bookmarkTags.tagId], references: [tags.id] }),
}));
```

**Step 2: Generate migration**

```bash
cd apps/api && pnpm drizzle-kit generate
```

Expected: new file in `apps/api/drizzle/` with SQL to create `folders` table and add `folder_id` column to `bookmarks`.

**Step 3: Apply migration**

```bash
cd apps/api && pnpm drizzle-kit migrate
```

Expected: migration applied successfully.

**Step 4: Commit**

```bash
git add apps/api/src/db/schema.ts apps/api/drizzle/
git commit -m "feat(api): add folders table and folderId to bookmarks schema"
```

---

## Task 3: Backend — FoldersModule CRUD

**Files:**
- Create: `apps/api/src/folders/folders.service.ts`
- Create: `apps/api/src/folders/folders.controller.ts`
- Create: `apps/api/src/folders/folders.module.ts`
- Modify: `apps/api/src/app.module.ts`

**Step 1: Create `folders.service.ts`**

```ts
import { randomUUID } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import type { CreateFolderDto, UpdateFolderDto } from '@repo/types';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '../db';
import { bookmarks, folders } from '../db/schema';

@Injectable()
export class FoldersService {
	findAll(userId: string) {
		return db.select().from(folders).where(eq(folders.userId, userId));
	}

	async create(userId: string, dto: CreateFolderDto) {
		const [folder] = await db
			.insert(folders)
			.values({
				id: randomUUID(),
				userId,
				name: dto.name,
				parentId: dto.parentId ?? null,
				createdAt: new Date(),
			})
			.returning();
		return folder;
	}

	async update(userId: string, id: string, dto: UpdateFolderDto) {
		const [folder] = await db
			.update(folders)
			.set({
				...(dto.name && { name: dto.name }),
				...(dto.parentId !== undefined && { parentId: dto.parentId ?? null }),
			})
			.where(and(eq(folders.id, id), eq(folders.userId, userId)))
			.returning();

		if (!folder) throw new NotFoundException('Folder not found');
		return folder;
	}

	async remove(userId: string, id: string) {
		// Collect all descendant IDs (including self) via BFS
		const allFolderIds = await this.collectSubtreeIds(userId, id);

		// Set bookmarks in these folders to unorganized (folderId = null)
		if (allFolderIds.length > 0) {
			await db
				.update(bookmarks)
				.set({ folderId: null })
				.where(and(eq(bookmarks.userId, userId), inArray(bookmarks.folderId, allFolderIds)));
		}

		// Delete root folder — cascade deletes children via parentId FK
		const [deleted] = await db
			.delete(folders)
			.where(and(eq(folders.id, id), eq(folders.userId, userId)))
			.returning();

		if (!deleted) throw new NotFoundException('Folder not found');
	}

	private async collectSubtreeIds(userId: string, rootId: string): Promise<string[]> {
		const allFolders = await db.select().from(folders).where(eq(folders.userId, userId));
		const ids: string[] = [];
		const queue = [rootId];
		while (queue.length > 0) {
			const current = queue.shift();
			if (!current) continue;
			ids.push(current);
			const children = allFolders.filter((f) => f.parentId === current);
			queue.push(...children.map((f) => f.id));
		}
		return ids;
	}
}
```

**Step 2: Create `folders.controller.ts`**

```ts
import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	Req,
	UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { CreateFolderDto, UpdateFolderDto } from '@repo/types';
import type { Request } from 'express';
import { FoldersService } from './folders.service';

@Controller('folders')
@UseGuards(AuthGuard('jwt'))
export class FoldersController {
	constructor(private foldersService: FoldersService) {}

	@Get()
	findAll(@Req() req: Request) {
		const user = req.user as { id: string };
		return this.foldersService.findAll(user.id);
	}

	@Post()
	create(@Req() req: Request, @Body() dto: CreateFolderDto) {
		const user = req.user as { id: string };
		return this.foldersService.create(user.id, dto);
	}

	@Patch(':id')
	update(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateFolderDto) {
		const user = req.user as { id: string };
		return this.foldersService.update(user.id, id, dto);
	}

	@Delete(':id')
	remove(@Req() req: Request, @Param('id') id: string) {
		const user = req.user as { id: string };
		return this.foldersService.remove(user.id, id);
	}
}
```

**Step 3: Create `folders.module.ts`**

```ts
import { Module } from '@nestjs/common';
import { FoldersController } from './folders.controller';
import { FoldersService } from './folders.service';

@Module({
	controllers: [FoldersController],
	providers: [FoldersService],
})
export class FoldersModule {}
```

**Step 4: Register in `app.module.ts`**

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { BookmarksModule } from './bookmarks/bookmarks.module';
import { FoldersModule } from './folders/folders.module';
import { TagsModule } from './tags/tags.module';

@Module({
	imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule, BookmarksModule, FoldersModule, TagsModule],
})
export class AppModule {}
```

**Step 5: Update `bookmarks.service.ts` to support folderId**

In `apps/api/src/bookmarks/bookmarks.service.ts`:

- In `findAll`: add `folderId` filter after existing conditions:
```ts
if (query.folderId === 'unorganized') {
	conditions.push(isNull(bookmarks.folderId));
} else if (query.folderId) {
	conditions.push(eq(bookmarks.folderId, query.folderId));
}
```
Add `isNull` to the drizzle-orm import.

- In `create`: add `folderId: dto.folderId ?? null` to the insert values.

- In `update`: add `...(dto.folderId !== undefined && { folderId: dto.folderId })` to the set object.

**Step 6: Run type check and lint**

```bash
pnpm check && pnpm check-type
```

Expected: all pass (or only pre-existing warnings).

**Step 7: Commit**

```bash
git add apps/api/src/folders/ apps/api/src/app.module.ts apps/api/src/bookmarks/bookmarks.service.ts
git commit -m "feat(api): add FoldersModule CRUD and folderId filter on bookmarks"
```

---

## Task 4: Backend — Metadata Endpoint (public, no auth)

**Files:**
- Create: `apps/api/src/metadata/metadata.controller.ts`
- Create: `apps/api/src/metadata/metadata.module.ts`
- Modify: `apps/api/src/app.module.ts`

**Step 1: Create `metadata.controller.ts`**

```ts
import { Controller, Get, Query } from '@nestjs/common';

@Controller('metadata')
export class MetadataController {
	@Get()
	async getMetadata(@Query('url') url: string) {
		if (!url) return { title: null, favicon: null };

		let hostname: string;
		try {
			hostname = new URL(url).hostname;
		} catch {
			return { title: null, favicon: null };
		}

		const favicon = `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;

		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 5000);
			const res = await fetch(url, {
				signal: controller.signal,
				headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BookmarkApp/1.0)' },
			});
			clearTimeout(timeoutId);

			const html = await res.text();
			const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
			const title = match ? match[1].trim() : null;

			return { title, favicon };
		} catch {
			return { title: null, favicon };
		}
	}
}
```

**Step 2: Create `metadata.module.ts`**

```ts
import { Module } from '@nestjs/common';
import { MetadataController } from './metadata.controller';

@Module({
	controllers: [MetadataController],
})
export class MetadataModule {}
```

**Step 3: Register in `app.module.ts`**

Add `MetadataModule` to the imports array (alongside FoldersModule).

**Step 4: Run type check and lint**

```bash
pnpm check && pnpm check-type
```

**Step 5: Commit**

```bash
git add apps/api/src/metadata/ apps/api/src/app.module.ts
git commit -m "feat(api): add public metadata endpoint for URL title/favicon fetch"
```

---

## Task 5: api-client — folders.ts + ApiAdapter + ChromeStorageAdapter

**Files:**
- Create: `packages/api-client/src/folders.ts`
- Modify: `packages/api-client/src/api-adapter.ts`
- Modify: `packages/api-client/src/chrome-storage-adapter.ts`
- Modify: `packages/api-client/src/index.ts`

**Step 1: Create `packages/api-client/src/folders.ts`**

```ts
import type { CreateFolderDto, Folder, UpdateFolderDto } from '@repo/types';
import { apiClient } from './client';

export const foldersApi = {
	list: () => apiClient.get<Folder[]>('/folders').then((r) => r.data),

	create: (dto: CreateFolderDto) => apiClient.post<Folder>('/folders', dto).then((r) => r.data),

	update: (id: string, dto: UpdateFolderDto) =>
		apiClient.patch<Folder>(`/folders/${id}`, dto).then((r) => r.data),

	remove: (id: string) => apiClient.delete(`/folders/${id}`).then((r) => r.data),
};
```

**Step 2: Update `api-adapter.ts`** — add folder methods:

```ts
import type {
	Bookmark,
	BookmarkListQuery,
	CreateBookmarkDto,
	CreateFolderDto,
	CreateTagDto,
	Folder,
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
}
```

**Step 3: Update `chrome-storage-adapter.ts`** — add folder CRUD and folderId support:

Full replacement of `chrome-storage-adapter.ts`:

```ts
import type {
	Bookmark,
	BookmarkListQuery,
	CreateBookmarkDto,
	CreateFolderDto,
	CreateTagDto,
	Folder,
	StorageAdapter,
	Tag,
	UpdateBookmarkDto,
	UpdateFolderDto,
	UpdateTagDto,
} from '@repo/types';

interface LocalStore {
	bookmarks?: Bookmark[];
	tags?: Tag[];
	folders?: Folder[];
}

function extractFavicon(url: string): string | null {
	try {
		const { hostname } = new URL(url);
		return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
	} catch {
		return null;
	}
}

function assertChromeStorage(): void {
	console.log(chrome.storage);
	if (typeof chrome === 'undefined' || !chrome.storage?.local) {
		throw new Error(
			'Chrome Storage API를 사용할 수 없습니다. Chrome 확장 프로그램 페이지에서 실행해 주세요.',
		);
	}
}

async function readStore(): Promise<LocalStore> {
	assertChromeStorage();
	const result = await chrome.storage.local.get(['bookmarks', 'tags', 'folders']);
	return result as LocalStore;
}

async function writeStore(data: Partial<LocalStore>): Promise<void> {
	assertChromeStorage();
	await chrome.storage.local.set(data);
}

export class ChromeStorageAdapter implements StorageAdapter {
	async getBookmarks(query?: BookmarkListQuery): Promise<Bookmark[]> {
		const { bookmarks = [] } = await readStore();
		let result = bookmarks;

		if (query?.search) {
			const q = query.search.toLowerCase();
			result = result.filter(
				(b) => b.title.toLowerCase().includes(q) || b.url.toLowerCase().includes(q),
			);
		}

		if (query?.tagId) {
			result = result.filter((b) => b.tags.some((t) => t.id === query.tagId));
		}

		if (query?.folderId === 'unorganized') {
			result = result.filter((b) => b.folderId === null);
		} else if (query?.folderId) {
			result = result.filter((b) => b.folderId === query.folderId);
		}

		return result;
	}

	async createBookmark(dto: CreateBookmarkDto): Promise<Bookmark> {
		const { bookmarks = [], tags = [] } = await readStore();
		const now = new Date();
		const bookmark: Bookmark = {
			id: crypto.randomUUID(),
			userId: 'local',
			url: dto.url,
			title: dto.title,
			description: dto.description ?? null,
			favicon: extractFavicon(dto.url),
			folderId: dto.folderId ?? null,
			createdAt: now,
			updatedAt: now,
			tags: dto.tagIds ? tags.filter((t) => dto.tagIds?.includes(t.id)) : [],
		};
		await writeStore({ bookmarks: [bookmark, ...bookmarks] });
		return bookmark;
	}

	async updateBookmark(id: string, dto: UpdateBookmarkDto): Promise<Bookmark> {
		const { bookmarks = [], tags = [] } = await readStore();
		const index = bookmarks.findIndex((b) => b.id === id);
		if (index === -1) throw new Error(`Bookmark not found: ${id}`);

		const existing = bookmarks[index] as Bookmark;
		const updated: Bookmark = {
			...existing,
			...(dto.url && { url: dto.url }),
			...(dto.title && { title: dto.title }),
			description: dto.description ?? existing.description,
			folderId: dto.folderId !== undefined ? (dto.folderId ?? null) : existing.folderId,
			tags:
				dto.tagIds !== undefined ? tags.filter((t) => dto.tagIds?.includes(t.id)) : existing.tags,
			updatedAt: new Date(),
		};
		bookmarks[index] = updated;
		await writeStore({ bookmarks });
		return updated;
	}

	async deleteBookmark(id: string): Promise<void> {
		const { bookmarks = [] } = await readStore();
		await writeStore({ bookmarks: bookmarks.filter((b) => b.id !== id) });
	}

	async getTags(): Promise<Tag[]> {
		const { tags = [] } = await readStore();
		return tags;
	}

	async createTag(dto: CreateTagDto): Promise<Tag> {
		const { tags = [] } = await readStore();
		const tag: Tag = {
			id: crypto.randomUUID(),
			userId: 'local',
			name: dto.name,
			color: dto.color,
			createdAt: new Date(),
		};
		await writeStore({ tags: [...tags, tag] });
		return tag;
	}

	async updateTag(id: string, dto: UpdateTagDto): Promise<Tag> {
		const { tags = [] } = await readStore();
		const index = tags.findIndex((t) => t.id === id);
		if (index === -1) throw new Error(`Tag not found: ${id}`);

		const existing = tags[index] as Tag;
		const updated: Tag = {
			...existing,
			...(dto.name && { name: dto.name }),
			...(dto.color && { color: dto.color }),
		};
		tags[index] = updated;
		await writeStore({ tags });
		return updated;
	}

	async deleteTag(id: string): Promise<void> {
		const { tags = [] } = await readStore();
		await writeStore({ tags: tags.filter((t) => t.id !== id) });
	}

	async getFolders(): Promise<Folder[]> {
		const { folders = [] } = await readStore();
		return folders;
	}

	async createFolder(dto: CreateFolderDto): Promise<Folder> {
		const { folders = [] } = await readStore();
		const folder: Folder = {
			id: crypto.randomUUID(),
			userId: 'local',
			name: dto.name,
			parentId: dto.parentId ?? null,
			createdAt: new Date(),
		};
		await writeStore({ folders: [...folders, folder] });
		return folder;
	}

	async updateFolder(id: string, dto: UpdateFolderDto): Promise<Folder> {
		const { folders = [] } = await readStore();
		const index = folders.findIndex((f) => f.id === id);
		if (index === -1) throw new Error(`Folder not found: ${id}`);

		const existing = folders[index] as Folder;
		const updated: Folder = {
			...existing,
			...(dto.name && { name: dto.name }),
			...(dto.parentId !== undefined && { parentId: dto.parentId ?? null }),
		};
		folders[index] = updated;
		await writeStore({ folders });
		return updated;
	}

	async deleteFolder(id: string): Promise<void> {
		const { folders = [], bookmarks = [] } = await readStore();

		// Collect all descendant IDs (BFS)
		const allIds = new Set<string>();
		const queue = [id];
		while (queue.length > 0) {
			const current = queue.shift();
			if (!current) continue;
			allIds.add(current);
			folders.filter((f) => f.parentId === current).forEach((f) => queue.push(f.id));
		}

		// Remove folders and unorganize their bookmarks
		const updatedFolders = folders.filter((f) => !allIds.has(f.id));
		const updatedBookmarks = bookmarks.map((b) =>
			b.folderId && allIds.has(b.folderId) ? { ...b, folderId: null } : b,
		);

		await writeStore({ folders: updatedFolders, bookmarks: updatedBookmarks });
	}
}
```

**Step 4: Update `index.ts`** — export foldersApi:

```ts
export { ApiAdapter } from './api-adapter';
export { bookmarksApi } from './bookmarks';
export { ChromeStorageAdapter } from './chrome-storage-adapter';
export { apiClient, setAuthToken } from './client';
export { foldersApi } from './folders';
export { tagsApi } from './tags';
```

**Step 5: Run type check**

```bash
pnpm check && pnpm check-type
```

Expected: passes (web/extension may still have errors for missing hook usage — that's ok for now).

**Step 6: Commit**

```bash
git add packages/api-client/src/
git commit -m "feat(api-client): add folder CRUD to ChromeStorageAdapter and ApiAdapter"
```

---

## Task 6: Web — useFolders hook and folder utilities

**Files:**
- Create: `apps/web/src/entities/folder/model/useFolders.ts`
- Create: `apps/web/src/entities/folder/model/folderTree.ts`
- Create: `apps/web/src/features/folder-manage/model/useCreateFolder.ts`
- Create: `apps/web/src/features/folder-manage/model/useEditFolder.ts`
- Create: `apps/web/src/features/folder-manage/model/useDeleteFolder.ts`

**Step 1: Create `useFolders.ts`**

```ts
import type { Folder } from '@repo/types';
import { useQuery } from '@tanstack/react-query';
import { useStorageAdapter } from '@/shared/lib/storage';

export const folderKeys = {
	all: ['folders'] as const,
};

export function useFolders() {
	const adapter = useStorageAdapter();
	return useQuery<Folder[]>({
		queryKey: folderKeys.all,
		queryFn: () => adapter.getFolders(),
	});
}
```

**Step 2: Create `folderTree.ts`** — utility to build tree from flat list

```ts
import type { Folder } from '@repo/types';

export interface FolderNode extends Folder {
	children: FolderNode[];
	depth: number;
}

export function buildFolderTree(folders: Folder[], parentId: string | null = null, depth = 0): FolderNode[] {
	return folders
		.filter((f) => f.parentId === parentId)
		.map((f) => ({
			...f,
			depth,
			children: buildFolderTree(folders, f.id, depth + 1),
		}));
}

/** Flatten tree to ordered list with depth for rendering in a <select> */
export function flattenFolderTree(nodes: FolderNode[]): FolderNode[] {
	return nodes.flatMap((node) => [node, ...flattenFolderTree(node.children)]);
}
```

**Step 3: Create `useCreateFolder.ts`**

```ts
import type { CreateFolderDto } from '@repo/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useStorageAdapter } from '@/shared/lib/storage';
import { folderKeys } from '@/entities/folder/model/useFolders';

export function useCreateFolder() {
	const adapter = useStorageAdapter();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (dto: CreateFolderDto) => adapter.createFolder(dto),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: folderKeys.all }),
	});
}
```

**Step 4: Create `useEditFolder.ts`**

```ts
import type { UpdateFolderDto } from '@repo/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useStorageAdapter } from '@/shared/lib/storage';
import { folderKeys } from '@/entities/folder/model/useFolders';

export function useEditFolder() {
	const adapter = useStorageAdapter();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, dto }: { id: string; dto: UpdateFolderDto }) =>
			adapter.updateFolder(id, dto),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: folderKeys.all }),
	});
}
```

**Step 5: Create `useDeleteFolder.ts`**

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useStorageAdapter } from '@/shared/lib/storage';
import { bookmarkKeys } from '@/entities/bookmark/model/useBookmarks';
import { folderKeys } from '@/entities/folder/model/useFolders';

export function useDeleteFolder() {
	const adapter = useStorageAdapter();
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => adapter.deleteFolder(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: folderKeys.all });
			queryClient.invalidateQueries({ queryKey: bookmarkKeys.all });
		},
	});
}
```

**Step 6: Run type check**

```bash
pnpm check && pnpm check-type
```

**Step 7: Commit**

```bash
git add apps/web/src/entities/folder/ apps/web/src/features/folder-manage/
git commit -m "feat(web): add useFolders hook, folderTree utils, folder mutation hooks"
```

---

## Task 7: Web — FolderTree in Sidebar

**Files:**
- Create: `apps/web/src/widgets/tag-sidebar/ui/FolderTree.tsx`
- Modify: `apps/web/src/widgets/tag-sidebar/ui/TagSidebar.tsx`
- Modify: `apps/web/src/pages/home/ui/HomePage.tsx`

**Step 1: Create `FolderTree.tsx`**

This component renders the hierarchical folder tree with expand/collapse, add subfolder, rename, and delete.

```tsx
import type { Folder } from '@repo/types';
import { cn } from '@repo/ui/lib/utils';
import { useState } from 'react';
import { buildFolderTree, type FolderNode } from '@/entities/folder/model/folderTree';
import { useCreateFolder } from '@/features/folder-manage/model/useCreateFolder';
import { useDeleteFolder } from '@/features/folder-manage/model/useDeleteFolder';
import { useEditFolder } from '@/features/folder-manage/model/useEditFolder';

interface FolderTreeProps {
	folders: Folder[];
	selectedFolderId?: string | 'unorganized';
	onSelect: (folderId: string | 'unorganized' | undefined) => void;
}

interface FolderNodeRowProps {
	node: FolderNode;
	selectedFolderId?: string | 'unorganized';
	onSelect: (folderId: string | 'unorganized' | undefined) => void;
	onAddChild: (parentId: string) => void;
	onStartEdit: (folder: Folder) => void;
	onDelete: (id: string) => void;
}

function FolderNodeRow({
	node,
	selectedFolderId,
	onSelect,
	onAddChild,
	onStartEdit,
	onDelete,
}: FolderNodeRowProps) {
	const [expanded, setExpanded] = useState(true);
	const hasChildren = node.children.length > 0;

	return (
		<div>
			<div className='group flex items-center'>
				<button
					className='mr-0.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground w-4 h-4 flex items-center justify-center'
					onClick={() => setExpanded((v) => !v)}
					type='button'
					style={{ visibility: hasChildren ? 'visible' : 'hidden' }}
					aria-label={expanded ? '접기' : '펼치기'}
				>
					<svg className={cn('h-2.5 w-2.5 transition-transform', expanded ? 'rotate-90' : '')} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
						<path d='M9 5l7 7-7 7' strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} />
					</svg>
				</button>
				<button
					className={cn(
						'flex flex-1 items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors min-w-0',
						selectedFolderId === node.id
							? 'bg-accent font-medium text-accent-foreground'
							: 'text-muted-foreground hover:bg-accent/50',
					)}
					onClick={() => onSelect(node.id)}
					type='button'
				>
					<svg className='h-3.5 w-3.5 shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
						<path d='M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z' strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} />
					</svg>
					<span className='truncate'>{node.name}</span>
				</button>
				<div className='flex shrink-0 gap-0.5 opacity-0 group-hover:opacity-100 pr-1'>
					<button
						className='rounded p-0.5 text-muted-foreground hover:text-foreground'
						onClick={() => onAddChild(node.id)}
						title='하위 폴더 추가'
						type='button'
					>
						<svg className='h-3 w-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
							<path d='M12 4v16m8-8H4' strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} />
						</svg>
					</button>
					<button
						className='rounded p-0.5 text-muted-foreground hover:text-foreground'
						onClick={() => onStartEdit(node)}
						title='이름 변경'
						type='button'
					>
						<svg className='h-3 w-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
							<path d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} />
						</svg>
					</button>
					<button
						className='rounded p-0.5 text-muted-foreground hover:text-destructive'
						onClick={() => onDelete(node.id)}
						title='삭제'
						type='button'
					>
						<svg className='h-3 w-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
							<path d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} />
						</svg>
					</button>
				</div>
			</div>
			{expanded && node.children.length > 0 && (
				<div className='ml-4'>
					{node.children.map((child) => (
						<FolderNodeRow
							key={child.id}
							node={child}
							onAddChild={onAddChild}
							onDelete={onDelete}
							onSelect={onSelect}
							onStartEdit={onStartEdit}
							selectedFolderId={selectedFolderId}
						/>
					))}
				</div>
			)}
		</div>
	);
}

export function FolderTree({ folders, selectedFolderId, onSelect }: FolderTreeProps) {
	const tree = buildFolderTree(folders);
	const { mutate: createFolder } = useCreateFolder();
	const { mutate: editFolder } = useEditFolder();
	const { mutate: deleteFolder } = useDeleteFolder();

	const [addingParentId, setAddingParentId] = useState<string | null | 'root'>('root'); // 'root' = top-level
	const [showAddForm, setShowAddForm] = useState(false);
	const [addName, setAddName] = useState('');
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editName, setEditName] = useState('');

	function handleAdd(e: React.FormEvent) {
		e.preventDefault();
		if (!addName.trim()) return;
		createFolder(
			{
				name: addName.trim(),
				parentId: addingParentId === 'root' ? undefined : (addingParentId ?? undefined),
			},
			{
				onSuccess: () => {
					setShowAddForm(false);
					setAddName('');
				},
			},
		);
	}

	function handleStartEdit(folder: Folder) {
		setEditingId(folder.id);
		setEditName(folder.name);
		setShowAddForm(false);
	}

	function handleEdit(e: React.FormEvent) {
		e.preventDefault();
		if (!editingId || !editName.trim()) return;
		editFolder(
			{ id: editingId, dto: { name: editName.trim() } },
			{ onSuccess: () => setEditingId(null) },
		);
	}

	function handleDelete(id: string) {
		if (!confirm('폴더를 삭제하면 하위 폴더도 모두 삭제됩니다. 계속할까요?')) return;
		deleteFolder(id);
		if (selectedFolderId === id) onSelect(undefined);
	}

	return (
		<div className='flex flex-col gap-0.5'>
			{tree.map((node) =>
				editingId === node.id ? (
					<form key={node.id} className='flex gap-1 px-2 py-1' onSubmit={handleEdit}>
						<input
							autoFocus
							className='flex-1 rounded border border-border bg-background px-2 py-0.5 text-xs outline-none focus:ring-1 focus:ring-ring'
							onChange={(e) => setEditName(e.target.value)}
							value={editName}
						/>
						<button className='rounded bg-primary px-2 py-0.5 text-xs text-primary-foreground' type='submit'>
							저장
						</button>
						<button
							className='rounded px-2 py-0.5 text-xs text-muted-foreground hover:bg-accent/50'
							onClick={() => setEditingId(null)}
							type='button'
						>
							취소
						</button>
					</form>
				) : (
					<FolderNodeRow
						key={node.id}
						node={node}
						onAddChild={(parentId) => {
							setAddingParentId(parentId);
							setShowAddForm(true);
							setEditingId(null);
						}}
						onDelete={handleDelete}
						onSelect={onSelect}
						onStartEdit={handleStartEdit}
						selectedFolderId={selectedFolderId}
					/>
				),
			)}

			{showAddForm && (
				<form className='flex gap-1 px-2 py-1 ml-4' onSubmit={handleAdd}>
					<input
						autoFocus
						className='flex-1 rounded border border-border bg-background px-2 py-0.5 text-xs outline-none focus:ring-1 focus:ring-ring'
						onChange={(e) => setAddName(e.target.value)}
						placeholder='폴더 이름'
						value={addName}
					/>
					<button className='rounded bg-primary px-2 py-0.5 text-xs text-primary-foreground' type='submit'>
						추가
					</button>
					<button
						className='rounded px-2 py-0.5 text-xs text-muted-foreground hover:bg-accent/50'
						onClick={() => setShowAddForm(false)}
						type='button'
					>
						취소
					</button>
				</form>
			)}

			<button
				className='flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent/50 transition-colors mt-0.5'
				onClick={() => {
					setAddingParentId('root');
					setShowAddForm(true);
					setEditingId(null);
				}}
				type='button'
			>
				<svg className='h-3 w-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
					<path d='M12 4v16m8-8H4' strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} />
				</svg>
				폴더 추가
			</button>
		</div>
	);
}
```

**Step 2: Modify `TagSidebar.tsx`** — add props and folder section at top

Add props to `TagSidebarProps`:

```ts
interface TagSidebarProps {
	selectedTagId?: string;
	onSelect: (tagId: string | undefined) => void;
	selectedFolderId?: string | 'unorganized';
	onFolderSelect: (folderId: string | 'unorganized' | undefined) => void;
}
```

Inside the component, add `useFolders` and render the folder section before the tag section:

```tsx
import { useFolders } from '@/entities/folder/model/useFolders';
import { FolderTree } from './FolderTree';

// Inside TagSidebar:
const { data: folders = [] } = useFolders();
```

Before the existing `<aside>` content (before the tags section), add:

```tsx
{/* Folder navigation */}
<div className='flex flex-col gap-0.5 mb-4'>
  <div className='flex items-center justify-between px-2 pb-1'>
    <p className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>폴더</p>
  </div>
  <button
    className={cn(
      'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
      !selectedFolderId && !selectedTagId
        ? 'bg-accent font-medium text-accent-foreground'
        : 'text-muted-foreground hover:bg-accent/50',
    )}
    onClick={() => { onFolderSelect(undefined); onSelect(undefined); }}
    type='button'
  >
    전체
  </button>
  <button
    className={cn(
      'flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors',
      selectedFolderId === 'unorganized'
        ? 'bg-accent font-medium text-accent-foreground'
        : 'text-muted-foreground hover:bg-accent/50',
    )}
    onClick={() => { onFolderSelect('unorganized'); onSelect(undefined); }}
    type='button'
  >
    <svg className='h-3.5 w-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
      <path d='M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z' strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} />
    </svg>
    미분류
  </button>
  <FolderTree
    folders={folders}
    onSelect={(id) => { onFolderSelect(id); onSelect(undefined); }}
    selectedFolderId={selectedFolderId}
  />
</div>
```

Also update the existing "전체" button logic — remove the standalone 전체 button from the tags section (it's now in the folder section above) and change the tag `onSelect` to also clear folder:

```tsx
// Tag click should clear folder selection
onClick={() => { onSelect(tag.id); onFolderSelect(undefined); }}
```

**Step 3: Modify `HomePage.tsx`** — add selectedFolderId state and wire it up

```tsx
const [selectedFolderId, setSelectedFolderId] = useState<string | 'unorganized' | undefined>();

// Pass to TagSidebar:
<TagSidebar
  onFolderSelect={setSelectedFolderId}
  onSelect={setSelectedTagId}
  selectedFolderId={selectedFolderId}
  selectedTagId={selectedTagId}
/>

// Pass to BookmarkList query:
<BookmarkList
  onEdit={setEditTarget}
  query={{ tagId: selectedTagId, search: search || undefined, folderId: selectedFolderId }}
  viewMode={viewMode}
/>

// Pass to create dialog:
<BookmarkCreateDialog
  defaultFolderId={selectedFolderId !== 'unorganized' ? selectedFolderId : undefined}
  onOpenChange={setCreateOpen}
  open={createOpen}
/>
```

**Step 4: Run lint and type check**

```bash
pnpm check && pnpm check-type
```

**Step 5: Commit**

```bash
git add apps/web/src/widgets/tag-sidebar/ apps/web/src/pages/home/ui/HomePage.tsx
git commit -m "feat(web): add folder tree sidebar with CRUD, wire folderId to bookmark list"
```

---

## Task 8: Web — URL Favicon Preview + Auto Title + Folder Selector in Dialogs

**Files:**
- Create: `apps/web/src/shared/api/metadata.ts`
- Create: `apps/web/src/shared/ui/FolderSelect.tsx`
- Modify: `apps/web/src/features/bookmark-create/ui/BookmarkCreateDialog.tsx`
- Modify: `apps/web/src/features/bookmark-edit/ui/BookmarkEditDialog.tsx`

**Step 1: Create `apps/web/src/shared/api/metadata.ts`**

```ts
import type { UrlMetadata } from '@repo/types';
import { apiClient } from '@/shared/api';

export async function fetchUrlMetadata(url: string): Promise<UrlMetadata> {
	try {
		const res = await apiClient.get<UrlMetadata>('/metadata', { params: { url } });
		return res.data;
	} catch {
		return { title: null, favicon: null };
	}
}
```

Note: check what `@/shared/api` exports. If `apiClient` isn't exported from there, import from `@repo/api-client` directly.

**Step 2: Create `apps/web/src/shared/ui/FolderSelect.tsx`**

```tsx
import type { Folder } from '@repo/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/select';
import { buildFolderTree, flattenFolderTree } from '@/entities/folder/model/folderTree';

interface FolderSelectProps {
	folders: Folder[];
	value: string | undefined;
	onChange: (folderId: string | undefined) => void;
}

export function FolderSelect({ folders, value, onChange }: FolderSelectProps) {
	const tree = buildFolderTree(folders);
	const flat = flattenFolderTree(tree);

	return (
		<Select onValueChange={(v) => onChange(v === '__none__' ? undefined : v)} value={value ?? '__none__'}>
			<SelectTrigger className='h-9 text-sm'>
				<SelectValue placeholder='폴더 선택 (선택)' />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value='__none__'>폴더 없음</SelectItem>
				{flat.map((folder) => (
					<SelectItem key={folder.id} value={folder.id}>
						{'\u00A0'.repeat(folder.depth * 2)}
						{folder.name}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
```

**Step 3: Rewrite `BookmarkCreateDialog.tsx`** to add favicon preview, auto title, and folder select

Key changes:
- Use `useState` for `url` and `title` (controlled inputs instead of uncontrolled FormData)
- Favicon preview: `useMemo` computed from url via Google S2
- Auto title: `useEffect` with 500ms debounce on url change, calls `fetchUrlMetadata`, sets title if empty
- Folder select: `FolderSelect` component
- Accept optional `defaultFolderId` prop

```tsx
import type { CreateBookmarkDto } from '@repo/types';
import { Button } from '@repo/ui/components/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui/components/dialog';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { bookmarkKeys } from '@/entities/bookmark/model/useBookmarks';
import { useFolders } from '@/entities/folder/model/useFolders';
import { useTags } from '@/entities/tag/model/useTags';
import { fetchUrlMetadata } from '@/shared/api/metadata';
import { useStorageAdapter } from '@/shared/lib/storage';
import { FolderSelect } from '@/shared/ui/FolderSelect';

interface BookmarkCreateDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	defaultFolderId?: string;
}

export function BookmarkCreateDialog({ open, onOpenChange, defaultFolderId }: BookmarkCreateDialogProps) {
	const adapter = useStorageAdapter();
	const queryClient = useQueryClient();
	const { data: tags = [] } = useTags();
	const { data: folders = [] } = useFolders();
	const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
	const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>(defaultFolderId);
	const [url, setUrl] = useState('');
	const [title, setTitle] = useState('');
	const titleManuallyEdited = useRef(false);

	// Favicon preview from URL
	const faviconUrl = useMemo(() => {
		try {
			const { hostname } = new URL(url);
			return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
		} catch {
			return null;
		}
	}, [url]);

	// Auto title: debounce 500ms
	useEffect(() => {
		if (!url || titleManuallyEdited.current) return;
		const timer = setTimeout(async () => {
			const meta = await fetchUrlMetadata(url);
			if (meta.title && !titleManuallyEdited.current) {
				setTitle(meta.title);
			}
		}, 500);
		return () => clearTimeout(timer);
	}, [url]);

	// Reset when dialog opens
	useEffect(() => {
		if (open) {
			setUrl('');
			setTitle('');
			setSelectedTagIds([]);
			setSelectedFolderId(defaultFolderId);
			titleManuallyEdited.current = false;
		}
	}, [open, defaultFolderId]);

	const { mutate, isPending } = useMutation({
		mutationFn: (dto: CreateBookmarkDto) => adapter.createBookmark(dto),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: bookmarkKeys.all });
			onOpenChange(false);
		},
	});

	function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const form = e.currentTarget;
		const data = new FormData(form);
		mutate({
			url,
			title,
			description: (data.get('description') as string) || undefined,
			tagIds: selectedTagIds,
			folderId: selectedFolderId,
		});
	}

	function toggleTag(id: string) {
		setSelectedTagIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
	}

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className='sm:max-w-md'>
				<DialogHeader>
					<DialogTitle>북마크 추가</DialogTitle>
				</DialogHeader>
				<form className='flex flex-col gap-4' onSubmit={handleSubmit}>
					<div className='flex flex-col gap-1.5'>
						<Label htmlFor='url'>URL *</Label>
						<div className='flex items-center gap-2'>
							{faviconUrl && (
								<img alt='' className='h-5 w-5 shrink-0 rounded' src={faviconUrl} />
							)}
							<Input
								className='flex-1'
								id='url'
								onChange={(e) => { setUrl(e.target.value); titleManuallyEdited.current = false; }}
								placeholder='https://example.com'
								required
								type='url'
								value={url}
							/>
						</div>
					</div>
					<div className='flex flex-col gap-1.5'>
						<Label htmlFor='title'>제목 *</Label>
						<Input
							id='title'
							onChange={(e) => { setTitle(e.target.value); titleManuallyEdited.current = true; }}
							placeholder='제목'
							required
							value={title}
						/>
					</div>
					<div className='flex flex-col gap-1.5'>
						<Label htmlFor='description'>설명</Label>
						<Input id='description' name='description' placeholder='설명 (선택)' />
					</div>
					<div className='flex flex-col gap-1.5'>
						<Label>폴더</Label>
						<FolderSelect
							folders={folders}
							onChange={setSelectedFolderId}
							value={selectedFolderId}
						/>
					</div>
					{tags.length > 0 && (
						<div className='flex flex-col gap-1.5'>
							<Label>태그</Label>
							<div className='flex flex-wrap gap-1.5'>
								{tags.map((tag) => (
									<button
										className='rounded-full px-3 py-0.5 text-xs border transition-colors'
										key={tag.id}
										onClick={() => toggleTag(tag.id)}
										style={
											selectedTagIds.includes(tag.id)
												? { backgroundColor: tag.color, color: '#fff', borderColor: tag.color }
												: { backgroundColor: `${tag.color}15`, color: tag.color, borderColor: tag.color }
										}
										type='button'
									>
										{tag.name}
									</button>
								))}
							</div>
						</div>
					)}
					<div className='flex justify-end gap-2 pt-2'>
						<Button onClick={() => onOpenChange(false)} type='button' variant='outline'>
							취소
						</Button>
						<Button disabled={isPending} type='submit'>
							{isPending ? '추가 중...' : '추가'}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
```

**Step 4: Update `BookmarkEditDialog.tsx`** — same pattern for favicon preview, auto title, and folder select

Key changes mirror `BookmarkCreateDialog` but with `bookmark` prop as initial values:
- `url` and `title` initialized from `bookmark.url` / `bookmark.title`
- `selectedFolderId` initialized from `bookmark.folderId ?? undefined`
- Auto title only fires if url is changed from its original value
- Add `FolderSelect` and pass `folderId` in the `UpdateBookmarkDto`

Update the `handleSubmit` to include `folderId: selectedFolderId ?? null`.

**Step 5: Run lint and type check**

```bash
pnpm check && pnpm check-type
```

**Step 6: Commit**

```bash
git add apps/web/src/shared/ apps/web/src/features/bookmark-create/ apps/web/src/features/bookmark-edit/
git commit -m "feat(web): add favicon preview, auto title, folder select to bookmark dialogs"
```

---

## Task 9: Extension — Favicon Preview + Auto Title + Folder Select in PopupPage

**Files:**
- Modify: `apps/extension/src/pages/popup/ui/PopupPage.tsx`
- Create: `apps/extension/src/entities/folder/model/useFolders.ts`
- Create: `apps/extension/src/shared/api/metadata.ts`

**Step 1: Create `apps/extension/src/entities/folder/model/useFolders.ts`**

Same as web's `useFolders.ts` — copy verbatim.

**Step 2: Create `apps/extension/src/shared/api/metadata.ts`**

```ts
import type { UrlMetadata } from '@repo/types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export async function fetchUrlMetadata(url: string): Promise<UrlMetadata> {
	try {
		const res = await fetch(`${API_URL}/metadata?url=${encodeURIComponent(url)}`);
		if (!res.ok) return { title: null, favicon: null };
		return res.json() as Promise<UrlMetadata>;
	} catch {
		return { title: null, favicon: null };
	}
}
```

**Step 3: Modify `PopupPage.tsx`**

Changes:
- Add `useFolders` hook
- Track `urlValue` state (controlled URL input)
- Compute favicon from `urlValue` via Google S2
- Auto title: debounce on `urlValue` change, only if title not manually edited
- Add folder state + `TagSelector`-style folder select (use a simple `<select>` or shadcn `Select`)
- Pass `folderId` to `createBookmark` and `updateBookmark`

Key additions to the form:

```tsx
// At top of component (after existing state):
const { data: folders = [] } = useFolders();
const [urlValue, setUrlValue] = useState(existingBookmark?.url ?? currentTab.url);
const [titleValue, setTitleValue] = useState(existingBookmark?.title ?? currentTab.title);
const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>(
  existingBookmark?.folderId ?? undefined
);
const titleManuallyEdited = useRef(false);

// Favicon preview
const faviconPreview = useMemo(() => {
  try {
    const { hostname } = new URL(urlValue);
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
  } catch { return null; }
}, [urlValue]);

// Auto title (only on url change from current tab default, and only if title matches the old title)
useEffect(() => {
  if (!urlValue || titleManuallyEdited.current) return;
  const timer = setTimeout(async () => {
    const meta = await fetchUrlMetadata(urlValue);
    if (meta.title && !titleManuallyEdited.current) {
      setTitleValue(meta.title);
    }
  }, 500);
  return () => clearTimeout(timer);
}, [urlValue]);
```

In `handleSubmit`, use `urlValue`, `titleValue`, `selectedFolderId`.

In the URL input field:
```tsx
<div className='flex items-center gap-1.5'>
  {faviconPreview && <img alt='' className='h-4 w-4 shrink-0 rounded' src={faviconPreview} />}
  <Input
    className='h-8 text-xs flex-1'
    id='url'
    name='url'
    onChange={(e) => { setUrlValue(e.target.value); titleManuallyEdited.current = false; }}
    required
    type='url'
    value={urlValue}
  />
</div>
```

In the title input:
```tsx
<Input
  className='h-8 text-xs'
  id='title'
  name='title'
  onChange={(e) => { setTitleValue(e.target.value); titleManuallyEdited.current = true; }}
  required
  value={titleValue}
/>
```

Add folder select after description (before tags):
```tsx
{folders.length > 0 && (
  <div className='flex flex-col gap-1'>
    <Label className='text-xs'>폴더</Label>
    <select
      className='h-8 rounded-md border border-input bg-background px-2 text-xs'
      onChange={(e) => setSelectedFolderId(e.target.value || undefined)}
      value={selectedFolderId ?? ''}
    >
      <option value=''>폴더 없음</option>
      {flattenFolderTree(buildFolderTree(folders)).map((f) => (
        <option key={f.id} value={f.id}>
          {'　'.repeat(f.depth)}{f.name}
        </option>
      ))}
    </select>
  </div>
)}
```

Import `buildFolderTree`, `flattenFolderTree` from `@/entities/folder/model/folderTree` (copy the util file to extension as well).

**Step 4: Create `apps/extension/src/entities/folder/model/folderTree.ts`**

Copy verbatim from `apps/web/src/entities/folder/model/folderTree.ts`.

**Step 5: Run lint and type check**

```bash
pnpm check && pnpm check-type
```

**Step 6: Commit**

```bash
git add apps/extension/src/
git commit -m "feat(extension): add favicon preview, auto title, folder select to popup"
```

---

## Task 10: Final verification

**Step 1: Run full check**

```bash
pnpm check && pnpm check-type
```

Expected: all pass.

**Step 2: Manual test checklist**

Web app:
- [ ] Folder tree appears in sidebar, can create/rename/delete folders
- [ ] Deleting a folder shows confirm dialog, bookmarks become unorganized
- [ ] Clicking folder filters bookmark list
- [ ] "미분류" shows only bookmarks with no folder
- [ ] Create dialog: entering URL shows favicon preview
- [ ] Create dialog: entering URL auto-fills title after 500ms
- [ ] Create dialog: manually editing title stops auto-fill
- [ ] Create dialog: folder select shows tree with indent
- [ ] Edit dialog: same favicon/title/folder behavior

Extension popup:
- [ ] Favicon preview appears next to URL field
- [ ] Changing URL auto-fetches title
- [ ] Folder select dropdown appears when folders exist

**Step 3: Final commit**

```bash
git commit --allow-empty -m "chore: folders, auto title, favicon preview — feature complete"
```
