/**
 * Chrome Web Store 스크린샷 자동 캡처 (web 앱 기준)
 *
 * 실행: node scripts/capture-screenshots.mjs
 * 결과: screenshots/ 폴더에 1280×800 PNG 5장 생성
 */

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT_DIR = resolve(__dirname, '../screenshots');
mkdirSync(OUT_DIR, { recursive: true });

// ─── 샘플 데이터 ──────────────────────────────────────────────────────────────

const now = new Date().toISOString();

const TAGS = [
	{ id: 't1', userId: 'local', name: '즐겨찾기', color: '#6366f1', createdAt: now },
	{ id: 't2', userId: 'local', name: '레퍼런스', color: '#10b981', createdAt: now },
	{ id: 't3', userId: 'local', name: '읽을거리', color: '#f59e0b', createdAt: now },
];

const FOLDERS = [
	{ id: 'f1', userId: 'local', name: '개발', parentId: null, order: 0, createdAt: now },
	{ id: 'f2', userId: 'local', name: '디자인', parentId: null, order: 1, createdAt: now },
	{ id: 'f3', userId: 'local', name: '뉴스 & 커뮤니티', parentId: null, order: 2, createdAt: now },
];

const BOOKMARKS = [
	{ id: 'b1', userId: 'local', url: 'https://github.com', title: 'GitHub', description: 'Where the world builds software', favicon: 'https://www.google.com/s2/favicons?domain=github.com&sz=64', folderId: 'f1', order: 0, createdAt: now, updatedAt: now, tags: [TAGS[0]] },
	{ id: 'b2', userId: 'local', url: 'https://developer.mozilla.org', title: 'MDN Web Docs', description: 'Web 기술 공식 문서', favicon: 'https://www.google.com/s2/favicons?domain=developer.mozilla.org&sz=64', folderId: 'f1', order: 1, createdAt: now, updatedAt: now, tags: [TAGS[1]] },
	{ id: 'b3', userId: 'local', url: 'https://vercel.com', title: 'Vercel', description: '프론트엔드 배포 플랫폼', favicon: 'https://www.google.com/s2/favicons?domain=vercel.com&sz=64', folderId: 'f1', order: 2, createdAt: now, updatedAt: now, tags: [] },
	{ id: 'b4', userId: 'local', url: 'https://stackoverflow.com', title: 'Stack Overflow', description: '개발자 Q&A 커뮤니티', favicon: 'https://www.google.com/s2/favicons?domain=stackoverflow.com&sz=64', folderId: 'f1', order: 3, createdAt: now, updatedAt: now, tags: [TAGS[1]] },
	{ id: 'b5', userId: 'local', url: 'https://figma.com', title: 'Figma', description: 'UI/UX 디자인 협업 툴', favicon: 'https://www.google.com/s2/favicons?domain=figma.com&sz=64', folderId: 'f2', order: 0, createdAt: now, updatedAt: now, tags: [TAGS[0]] },
	{ id: 'b6', userId: 'local', url: 'https://dribbble.com', title: 'Dribbble', description: '디자이너 포트폴리오 커뮤니티', favicon: 'https://www.google.com/s2/favicons?domain=dribbble.com&sz=64', folderId: 'f2', order: 1, createdAt: now, updatedAt: now, tags: [] },
	{ id: 'b7', userId: 'local', url: 'https://news.ycombinator.com', title: 'Hacker News', description: '테크 뉴스 & 토론', favicon: 'https://www.google.com/s2/favicons?domain=news.ycombinator.com&sz=64', folderId: 'f3', order: 0, createdAt: now, updatedAt: now, tags: [TAGS[2]] },
	{ id: 'b8', userId: 'local', url: 'https://producthunt.com', title: 'Product Hunt', description: '새로운 제품 & 서비스 발견', favicon: 'https://www.google.com/s2/favicons?domain=producthunt.com&sz=64', folderId: 'f3', order: 1, createdAt: now, updatedAt: now, tags: [TAGS[2]] },
	{ id: 'b9', userId: 'local', url: 'https://youtube.com', title: 'YouTube', description: null, favicon: 'https://www.google.com/s2/favicons?domain=youtube.com&sz=64', folderId: null, order: 0, createdAt: now, updatedAt: now, tags: [TAGS[0]] },
	{ id: 'b10', userId: 'local', url: 'https://linear.app', title: 'Linear', description: '이슈 트래킹 & 프로젝트 관리', favicon: 'https://www.google.com/s2/favicons?domain=linear.app&sz=64', folderId: null, order: 1, createdAt: now, updatedAt: now, tags: [] },
	{ id: 'b11', userId: 'local', url: 'https://notion.so', title: 'Notion', description: '노트 & 워크스페이스', favicon: 'https://www.google.com/s2/favicons?domain=notion.so&sz=64', folderId: null, order: 2, createdAt: now, updatedAt: now, tags: [TAGS[0]] },
];

// ─── chrome.storage mock ───────────────────────────────────────────────────────

function makeChromeInitScript(viewMode = 'glass') {
	const store = {
		bookmarks: BOOKMARKS,
		tags: TAGS,
		folders: FOLDERS,
		syncMap: { bookmarks: {}, folders: {} },
		// zustand persist: setting store key
		setting: JSON.stringify({ state: { viewMode, syncMode: 'off' }, version: 1 }),
	};

	return `
    (function() {
      const _s = ${JSON.stringify(store)};
      window.chrome = {
        storage: {
          local: {
            get(keys, cb) {
              const res = {};
              const ks = Array.isArray(keys) ? keys : (keys ? [keys] : Object.keys(_s));
              for (const k of ks) { if (k in _s) res[k] = _s[k]; }
              if (cb) cb(res);
              return Promise.resolve(res);
            },
            set(data, cb) { Object.assign(_s, data); if (cb) cb(); return Promise.resolve(); },
            remove(keys, cb) {
              const ks = Array.isArray(keys) ? keys : [keys];
              for (const k of ks) delete _s[k];
              if (cb) cb(); return Promise.resolve();
            },
          },
        },
        bookmarks: {
          getSubTree: () => Promise.resolve([{ id: '1', title: 'Bookmarks bar', children: [] }]),
          onCreated:  { addListener: () => {}, removeListener: () => {} },
          onRemoved:  { addListener: () => {}, removeListener: () => {} },
          onChanged:  { addListener: () => {}, removeListener: () => {} },
          onMoved:    { addListener: () => {}, removeListener: () => {} },
        },
        tabs: {
          query: (_q, cb) => { if (cb) cb([]); return Promise.resolve([]); },
        },
        runtime: { lastError: null },
      };
    })();
  `;
}

// ─── vite preview 서버 시작 ────────────────────────────────────────────────────

async function startPreviewServer() {
	return new Promise((res, rej) => {
		const proc = spawn('pnpm', ['--filter', '@repo/web', 'preview', '--port', '4200'], {
			cwd: ROOT,
			stdio: ['ignore', 'pipe', 'pipe'],
		});
		const timer = setTimeout(() => rej(new Error('preview server timeout')), 15000);
		proc.stdout.on('data', (d) => {
			if (d.toString().includes('4200')) {
				clearTimeout(timer);
				res({ proc, url: 'http://localhost:4200' });
			}
		});
		proc.stderr.on('data', (d) => {
			if (d.toString().includes('4200')) {
				clearTimeout(timer);
				res({ proc, url: 'http://localhost:4200' });
			}
		});
	});
}

// ─── 빌드 ─────────────────────────────────────────────────────────────────────

console.log('📦 web 앱 빌드 중...');
const build = spawn('pnpm', ['--filter', '@repo/web', 'build'], { cwd: ROOT, stdio: 'inherit' });
await new Promise((res, rej) => {
	build.on('close', (code) => (code === 0 ? res() : rej(new Error(`build failed: ${code}`))));
});
console.log('✓ 빌드 완료\n');

// ─── preview 서버 시작 ─────────────────────────────────────────────────────────

console.log('🚀 preview 서버 시작 중...');
const { proc: serverProc, url: BASE_URL } = await startPreviewServer();
await new Promise((r) => setTimeout(r, 1000));
console.log(`✓ 서버 준비: ${BASE_URL}\n`);

// ─── Playwright 실행 ──────────────────────────────────────────────────────────

const browser = await chromium.launch({ headless: true });

async function loadPage(viewMode) {
	const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
	await ctx.addInitScript(makeChromeInitScript(viewMode));
	const page = await ctx.newPage();
	await page.goto(BASE_URL, { waitUntil: 'networkidle' });
	await page.waitForTimeout(1500);
	return { page, ctx };
}

async function shot(filename, viewMode, setupFn) {
	const { page, ctx } = await loadPage(viewMode);
	if (setupFn) await setupFn(page);
	await page.screenshot({ path: resolve(OUT_DIR, filename) });
	await ctx.close();
	console.log(`✓ ${filename}`);
}

// 1. Glass 뷰 — 전체 북마크
await shot('01-glass-view.png', 'glass');

// 2. 리스트 뷰 — 사이드바 포함
await shot('02-list-sidebar.png', 'list');

// 3. 그리드 뷰
await shot('03-grid-view.png', 'grid');

// 4. 북마크 추가 다이얼로그
await shot('04-add-dialog.png', 'list', async (page) => {
	const btn = page.getByRole('button', { name: '북마크 추가' });
	await btn.waitFor({ timeout: 5000 });
	await btn.click();
	await page.waitForTimeout(600);
});

// 5. Glass 뷰 — 태그 필터 활성
await shot('05-tag-filter.png', 'glass', async (page) => {
	const tag = page.getByText('즐겨찾기').first();
	if (await tag.isVisible()) {
		await tag.click();
		await page.waitForTimeout(500);
	}
});

await browser.close();
serverProc.kill();

console.log(`\n📁 스크린샷 저장 위치: ${OUT_DIR}`);
