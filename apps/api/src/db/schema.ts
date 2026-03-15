import { relations } from 'drizzle-orm';
import type { SQLiteColumn } from 'drizzle-orm/sqlite-core';
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
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	parentId: text('parent_id').references((): SQLiteColumn<any> => folders.id, {
		onDelete: 'cascade',
	}),
	order: integer('order').notNull().default(0),
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
	order: integer('order').notNull().default(0),
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
	parent: one(folders, {
		fields: [folders.parentId],
		references: [folders.id],
		relationName: 'children',
	}),
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
