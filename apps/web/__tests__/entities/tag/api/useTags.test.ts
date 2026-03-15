import { describe, expect, it } from 'vitest';
import { tagKeys } from '@/entities/tag/api/useTags';

describe('tagKeys', () => {
	it('all key is stable', () => {
		expect(tagKeys.all).toEqual(['tags']);
	});
});
