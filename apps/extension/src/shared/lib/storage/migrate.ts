import { type ApiAdapter, ChromeStorageAdapter } from '@repo/api-client';

export async function migrateLocalToApi(apiAdapter: ApiAdapter): Promise<void> {
	const localAdapter = new ChromeStorageAdapter();
	const [bookmarks, tags] = await Promise.all([
		localAdapter.getBookmarks(),
		localAdapter.getTags(),
	]);

	if (!bookmarks.length && !tags.length) return;

	// Migrate tags in parallel, build local→server ID map
	const migratedTags = await Promise.all(
		tags.map(async (tag) => {
			const created = await apiAdapter.createTag({ name: tag.name, color: tag.color });
			return { localId: tag.id, serverId: created.id };
		}),
	);
	const tagMap = new Map(migratedTags.map(({ localId, serverId }) => [localId, serverId]));

	// Migrate bookmarks in parallel with remapped tagIds
	await Promise.all(
		bookmarks.map((bookmark) => {
			const tagIds = bookmark.tags.map((t) => tagMap.get(t.id)).filter((id): id is string => !!id);
			return apiAdapter.createBookmark({
				url: bookmark.url,
				title: bookmark.title,
				description: bookmark.description ?? undefined,
				tagIds,
			});
		}),
	);

	// Clear local data
	await chrome.storage.local.remove(['bookmarks', 'tags']);
}
