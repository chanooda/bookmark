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
