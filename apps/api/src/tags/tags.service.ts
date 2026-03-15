import { randomUUID } from 'node:crypto';
import type { CreateTagDto, UpdateTagDto } from '@bookmark/types';
import { Injectable, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { db } from '../db';
import { tags } from '../db/schema';

@Injectable()
export class TagsService {
	findAll(userId: string) {
		return db.select().from(tags).where(eq(tags.userId, userId));
	}

	async create(userId: string, dto: CreateTagDto) {
		const [tag] = await db
			.insert(tags)
			.values({ id: randomUUID(), userId, name: dto.name, color: dto.color, createdAt: new Date() })
			.returning();
		return tag;
	}

	async update(userId: string, id: string, dto: UpdateTagDto) {
		const [tag] = await db
			.update(tags)
			.set({ ...(dto.name && { name: dto.name }), ...(dto.color && { color: dto.color }) })
			.where(and(eq(tags.id, id), eq(tags.userId, userId)))
			.returning();

		if (!tag) throw new NotFoundException('Tag not found');
		return tag;
	}

	async remove(userId: string, id: string) {
		const [tag] = await db
			.delete(tags)
			.where(and(eq(tags.id, id), eq(tags.userId, userId)))
			.returning();

		if (!tag) throw new NotFoundException('Tag not found');
	}
}
