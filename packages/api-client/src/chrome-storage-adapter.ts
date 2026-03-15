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
} from '@bookmark/types';

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
		// Normalize legacy bookmarks that predate the order field (undefined → array index)
		const normalized = bookmarks.map((b, i) => ({ ...b, order: b.order ?? i }));
		let result = [...normalized].sort((a, b) => a.order - b.order);

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
		const order =
			dto.order ??
			Math.max(
				-1,
				...bookmarks.filter((b) => b.folderId === (dto.folderId ?? null)).map((b) => b.order ?? -1),
			) + 1;
		const bookmark: Bookmark = {
			id: crypto.randomUUID(),
			userId: 'local',
			url: dto.url,
			title: dto.title,
			description: dto.description ?? null,
			favicon: extractFavicon(dto.url),
			folderId: dto.folderId ?? null,
			order,
			createdAt: now,
			updatedAt: now,
			tags: dto.tagIds ? tags.filter((t) => dto.tagIds?.includes(t.id)) : [],
		};
		await writeStore({ bookmarks: [...bookmarks, bookmark] });
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
			description: dto.description !== undefined ? dto.description : existing.description,
			folderId: dto.folderId !== undefined ? (dto.folderId ?? null) : existing.folderId,
			order: dto.order !== undefined ? dto.order : existing.order,
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

	async reorderBookmarks(items: ReorderItemDto[]): Promise<void> {
		const { bookmarks = [] } = await readStore();
		const orderMap = new Map(items.map((i) => [i.id, i.order]));
		const updated = bookmarks.map((b) =>
			orderMap.has(b.id) ? { ...b, order: orderMap.get(b.id) as number } : b,
		);
		await writeStore({ bookmarks: updated });
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
		// Normalize legacy folders that predate the order field (undefined → array index)
		const normalized = folders.map((f, i) => ({ ...f, order: f.order ?? i }));
		return [...normalized].sort((a, b) => a.order - b.order);
	}

	async createFolder(dto: CreateFolderDto): Promise<Folder> {
		const { folders = [] } = await readStore();
		const order =
			dto.order ??
			Math.max(
				-1,
				...folders.filter((f) => f.parentId === (dto.parentId ?? null)).map((f) => f.order ?? -1),
			) + 1;
		const folder: Folder = {
			id: crypto.randomUUID(),
			userId: 'local',
			name: dto.name,
			parentId: dto.parentId ?? null,
			order,
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
			...(dto.order !== undefined && { order: dto.order }),
		};
		folders[index] = updated;
		await writeStore({ folders });
		return updated;
	}

	async reorderFolders(items: ReorderItemDto[]): Promise<void> {
		const { folders = [] } = await readStore();
		const orderMap = new Map(items.map((i) => [i.id, i.order]));
		const updated = folders.map((f) =>
			orderMap.has(f.id) ? { ...f, order: orderMap.get(f.id) as number } : f,
		);
		await writeStore({ folders: updated });
	}

	async deleteFolder(id: string): Promise<void> {
		const { folders = [], bookmarks = [] } = await readStore();

		const allIds = new Set<string>();
		const queue = [id];
		while (queue.length > 0) {
			const current = queue.shift();
			if (!current) continue;
			allIds.add(current);
			for (const f of folders.filter((f) => f.parentId === current)) {
				queue.push(f.id);
			}
		}

		const updatedFolders = folders.filter((f) => !allIds.has(f.id));
		const updatedBookmarks = bookmarks.filter((b) => !b.folderId || !allIds.has(b.folderId));

		await writeStore({ folders: updatedFolders, bookmarks: updatedBookmarks });
	}
}
