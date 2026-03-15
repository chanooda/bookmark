/**
 * Chrome Web Store 스크린샷 자동 캡처 스크립트
 *
 * 사전 준비:
 *   pnpm add -D playwright -w
 *   pnpm --filter @repo/extension build (또는 pnpm build:ext)
 *
 * 실행:
 *   node scripts/capture-screenshots.mjs
 *
 * 결과:
 *   screenshots/ 폴더에 1280×800 PNG 5장 생성
 */

import { chromium } from 'playwright';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EXT_DIST = resolve(__dirname, '../apps/extension/dist');
const OUT_DIR = resolve(__dirname, '../screenshots');

if (!existsSync(EXT_DIST)) {
	console.error('❌ apps/extension/dist 가 없습니다. 먼저 빌드하세요:');
	console.error('   pnpm --filter @repo/extension build');
	process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });

// Chrome에 extension을 로드하고 새 탭(newtab)을 열어 스크린샷 촬영
const browser = await chromium.launchPersistentContext('', {
	headless: false, // 확장 프로그램은 headless 모드 미지원
	args: [
		`--disable-extensions-except=${EXT_DIST}`,
		`--load-extension=${EXT_DIST}`,
	],
	viewport: { width: 1280, height: 800 },
});

const page = await browser.newPage();

// 새 탭 = newtab override
await page.goto('chrome://newtab');
// chrome://newtab 은 바로 리다이렉트 되므로 extension URL로 직접 접근
const targets = browser.pages();
// extension newtab 페이지가 열릴 때까지 대기
await page.waitForTimeout(2000);

async function shot(filename, setupFn) {
	if (setupFn) await setupFn(page);
	await page.waitForTimeout(500);
	await page.screenshot({ path: resolve(OUT_DIR, filename), fullPage: false });
	console.log(`✓ ${filename}`);
}

// 1. Glass 뷰 — 새 탭 전체
await shot('01-glass-view.png', async (p) => {
	// Glass 뷰로 전환: localStorage에 설정 주입 후 새로고침
	await p.evaluate(() => {
		const stored = JSON.parse(localStorage.getItem('setting-store') || '{}');
		localStorage.setItem(
			'setting-store',
			JSON.stringify({ ...stored, state: { ...(stored.state || {}), viewMode: 'glass' } }),
		);
	});
	await p.reload();
	await p.waitForTimeout(1500);
});

// 2. 리스트 뷰 — 사이드바 보이는 상태
await shot('02-list-sidebar.png', async (p) => {
	await p.evaluate(() => {
		const stored = JSON.parse(localStorage.getItem('setting-store') || '{}');
		localStorage.setItem(
			'setting-store',
			JSON.stringify({ ...stored, state: { ...(stored.state || {}), viewMode: 'list' } }),
		);
	});
	await p.reload();
	await p.waitForTimeout(1500);
});

// 3. 북마크 추가 다이얼로그
await shot('03-add-dialog.png', async (p) => {
	// 북마크 추가 버튼 클릭
	const addBtn = p.getByRole('button', { name: '북마크 추가' });
	if (await addBtn.isVisible()) await addBtn.click();
	await p.waitForTimeout(400);
});

// 4. 그리드 뷰
await shot('04-grid-view.png', async (p) => {
	// 다이얼로그 닫기
	await p.keyboard.press('Escape');
	await p.evaluate(() => {
		const stored = JSON.parse(localStorage.getItem('setting-store') || '{}');
		localStorage.setItem(
			'setting-store',
			JSON.stringify({ ...stored, state: { ...(stored.state || {}), viewMode: 'grid' } }),
		);
	});
	await p.reload();
	await p.waitForTimeout(1500);
});

// 5. 팝업 UI (popup.html)
const popupPage = await browser.newPage();
// extension ID 찾기
const extUrl = page.url(); // chrome-extension://<id>/newtab/index.html
const extId = extUrl.match(/chrome-extension:\/\/([a-z]+)\//)?.[1];
if (extId) {
	await popupPage.goto(`chrome-extension://${extId}/popup.html`);
	await popupPage.setViewportSize({ width: 400, height: 600 });
	await popupPage.waitForTimeout(1000);
	await popupPage.screenshot({ path: resolve(OUT_DIR, '05-popup.png'), fullPage: false });
	console.log('✓ 05-popup.png');
} else {
	console.warn('⚠ extension ID를 찾을 수 없어 팝업 스크린샷을 건너뜁니다.');
}

await browser.close();
console.log(`\n📁 스크린샷 저장 위치: ${OUT_DIR}`);
