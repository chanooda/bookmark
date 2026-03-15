import { describe, expect, it } from 'vitest';
import { bookmarkKeys } from '@/entities/bookmark/api/useBookmarks';

describe('bookmarkKeys', () => {
	it('all key is stable', () => {
		expect(bookmarkKeys.all).toEqual(['bookmarks']);
	});

	it('list key includes query', () => {
		const key = bookmarkKeys.list({ search: 'hello', tagId: '123' });
		expect(key[0]).toBe('bookmarks');
		expect(key[1]).toEqual({ search: 'hello', tagId: '123' });
	});

	it('list key with empty query', () => {
		const key = bookmarkKeys.list({});
		expect(key).toEqual(['bookmarks', {}]);
	});
});
