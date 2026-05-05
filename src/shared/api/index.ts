import { mergeQueryKeys } from '@lukemorales/query-key-factory';
import { bookmarks } from './bookmark.query';

export const queries = mergeQueryKeys(bookmarks);
