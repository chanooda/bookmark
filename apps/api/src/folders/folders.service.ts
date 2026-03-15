import { randomUUID } from 'node:crypto';
import type { CreateFolderDto, ReorderItemDto, UpdateFolderDto } from '@bookmark/types';
import { Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq, inArray, isNull, max } from 'drizzle-orm';
import { db } from '../db';
import { bookmarks, folders } from '../db/schema';

@Injectable()
export class FoldersService {
	findAll(userId: string) {
		return db.select().from(folders).where(eq(folders.userId, userId)).orderBy(asc(folders.order));
	}

	async create(userId: string, dto: CreateFolderDto) {
		let order = dto.order;
		if (order === undefined) {
			const [row] = await db
				.select({ max: max(folders.order) })
				.from(folders)
				.where(
					and(
						eq(folders.userId, userId),
						dto.parentId ? eq(folders.parentId, dto.parentId) : isNull(folders.parentId),
					),
				);
			order = (row?.max ?? -1) + 1;
		}

		const [folder] = await db
			.insert(folders)
			.values({
				id: randomUUID(),
				userId,
				name: dto.name,
				parentId: dto.parentId ?? null,
				order,
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
				...(dto.order !== undefined && { order: dto.order }),
			})
			.where(and(eq(folders.id, id), eq(folders.userId, userId)))
			.returning();

		if (!folder) throw new NotFoundException('Folder not found');
		return folder;
	}

	async remove(userId: string, id: string) {
		const allFolderIds = await this.collectSubtreeIds(userId, id);

		await db.transaction(async (tx) => {
			if (allFolderIds.length > 0) {
				await tx
					.delete(bookmarks)
					.where(and(eq(bookmarks.userId, userId), inArray(bookmarks.folderId, allFolderIds)));
			}

			const [deleted] = await tx
				.delete(folders)
				.where(and(eq(folders.id, id), eq(folders.userId, userId)))
				.returning();

			if (!deleted) throw new NotFoundException('Folder not found');
		});
	}

	async reorder(userId: string, items: ReorderItemDto[]) {
		await db.transaction(async (tx) => {
			for (const item of items) {
				await tx
					.update(folders)
					.set({ order: item.order })
					.where(and(eq(folders.id, item.id), eq(folders.userId, userId)));
			}
		});
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
