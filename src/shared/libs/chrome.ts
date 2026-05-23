export const extractFavicon = (url?: string): string | null => {
	try {
		if (url) {
			const { hostname } = new URL(url);
			return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
		}
		return null;
	} catch {
		return null;
	}
};

export const assertChromeStorage = (): void => {
	if (typeof chrome === 'undefined' || !chrome.storage?.local) {
		throw new Error(
			'Chrome Storage API를 사용할 수 없습니다. Chrome 확장 프로그램 페이지에서 실행해 주세요.',
		);
	}
};
export const assertChromeBookmarks = (): void => {
	if (typeof chrome === 'undefined' || !chrome.bookmarks) {
		throw new Error(
			'Chrome Bookmarks API를 사용할 수 없습니다. Chrome 확장 프로그램 페이지에서 실행해 주세요.',
		);
	}
};

export const getChromeBookmarks = async () => {
	const bookmarks = await chrome.bookmarks.getTree();
	return bookmarks;
};

export const getChromeBookmark = async (id: string) => {
	const bookmarks = await chrome.bookmarks.get(id);
	return bookmarks;
};

export const readStore = async () => {
	assertChromeStorage();
	const result = await chrome.storage.local.get(['bookmarks', 'tags', 'folders']);
	return result;
};

export const writeStore = async (data: object) => {
	assertChromeStorage();
	await chrome.storage.local.set(data);
};
