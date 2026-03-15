import { randomUUID } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import type {
	BookmarkListQuery,
	CreateBookmarkDto,
	ReorderItemDto,
	UpdateBookmarkDto,
} from '@repo/types';
import { and, eq, isNull, like, max } from 'drizzle-orm';
import { db } from '../db';
import { bookmarks, bookmarkTags } from '../db/schema';

function extractFavicon(url: string): string | null {
	try {
		const { hostname } = new URL(url);
		return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
	} catch {
		return null;
	}
}

@Injectable()
export class BookmarksService {
	async findAll(userId: string, query: BookmarkListQuery) {
		const conditions = [eq(bookmarks.userId, userId)];

		if (query.search) {
			conditions.push(like(bookmarks.title, `%${query.search}%`));
		}

		if (query.folderId === 'unorganized') {
			conditions.push(isNull(bookmarks.folderId));
		} else if (query.folderId) {
			conditions.push(eq(bookmarks.folderId, query.folderId));
		}

		const rows = await db.query.bookmarks.findMany({
			where: and(...conditions),
			with: {
				bookmarkTags: {
					with: { tag: true },
				},
			},
			orderBy: (b, { asc }) => asc(b.order),
		});

		const result = rows.map((b) => ({
			...b,
			tags: b.bookmarkTags.map((bt) => bt.tag),
			bookmarkTags: undefined,
		}));

		if (query.tagId) {
			return result.filter((b) => b.tags.some((t) => t.id === query.tagId));
		}

		return result;
	}

	async findOne(userId: string, id: string) {
		const row = await db.query.bookmarks.findFirst({
			where: and(eq(bookmarks.id, id), eq(bookmarks.userId, userId)),
			with: { bookmarkTags: { with: { tag: true } } },
		});

		if (!row) throw new NotFoundException('Bookmark not found');

		return { ...row, tags: row.bookmarkTags.map((bt) => bt.tag), bookmarkTags: undefined };
	}

	async create(userId: string, dto: CreateBookmarkDto) {
		const id = randomUUID();
		const now = new Date();

		let order = dto.order;
		if (order === undefined) {
			const [row] = await db
				.select({ max: max(bookmarks.order) })
				.from(bookmarks)
				.where(
					and(
						eq(bookmarks.userId, userId),
						dto.folderId ? eq(bookmarks.folderId, dto.folderId) : isNull(bookmarks.folderId),
					),
				);
			order = (row?.max ?? -1) + 1;
		}

		await db.insert(bookmarks).values({
			id,
			userId,
			url: dto.url,
			title: dto.title,
			description: dto.description ?? null,
			favicon: extractFavicon(dto.url),
			folderId: dto.folderId ?? null,
			order,
			createdAt: now,
			updatedAt: now,
		});

		if (dto.tagIds?.length) {
			await db.insert(bookmarkTags).values(dto.tagIds.map((tagId) => ({ bookmarkId: id, tagId })));
		}

		return this.findOne(userId, id);
	}

	async update(userId: string, id: string, dto: UpdateBookmarkDto) {
		await this.findOne(userId, id);

		await db
			.update(bookmarks)
			.set({
				...(dto.url && { url: dto.url }),
				...(dto.title && { title: dto.title }),
				...(dto.description !== undefined && { description: dto.description }),
				...(dto.folderId !== undefined && { folderId: dto.folderId }),
				...(dto.order !== undefined && { order: dto.order }),
				updatedAt: new Date(),
			})
			.where(and(eq(bookmarks.id, id), eq(bookmarks.userId, userId)));

		if (dto.tagIds !== undefined) {
			await db.delete(bookmarkTags).where(eq(bookmarkTags.bookmarkId, id));
			if (dto.tagIds.length) {
				await db
					.insert(bookmarkTags)
					.values(dto.tagIds.map((tagId) => ({ bookmarkId: id, tagId })));
			}
		}

		return this.findOne(userId, id);
	}

	async remove(userId: string, id: string) {
		await this.findOne(userId, id);
		await db.delete(bookmarks).where(and(eq(bookmarks.id, id), eq(bookmarks.userId, userId)));
	}

	async reorder(userId: string, items: ReorderItemDto[]) {
		await db.transaction(async (tx) => {
			for (const item of items) {
				await tx
					.update(bookmarks)
					.set({ order: item.order })
					.where(and(eq(bookmarks.id, item.id), eq(bookmarks.userId, userId)));
			}
		});
	}
}
