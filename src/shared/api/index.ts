import { mergeQueryKeys } from '@lukemorales/query-key-factory';
import { bookmarkMutations } from './bookmark.mutate';
import { bookmarks } from './bookmark.query';

export * from './bookmark.types';

export const queries = mergeQueryKeys(bookmarks);
export const mutations = {
	bookmark: bookmarkMutations,
};
