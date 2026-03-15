/**
 * Chrome Web Store 스크린샷 + 프로모션 타일 자동 캡처 (다국어)
 *
 * 실행: node scripts/capture-screenshots.mjs
 * 결과:
 *   screenshots/{lang}/01-glass-view.png       (1280×800) × 4 언어
 *   screenshots/{lang}/02-list-sidebar.png     (1280×800) × 4 언어
 *   screenshots/{lang}/03-grid-view.png        (1280×800) × 4 언어
 *   screenshots/{lang}/04-add-dialog.png       (1280×800) × 4 언어
 *   screenshots/{lang}/05-tag-filter.png       (1280×800) × 4 언어
 *   screenshots/{lang}/promo-tile.png          (1400×560) × 4 언어
 */

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SCREENSHOTS_DIR = resolve(__dirname, '../screenshots');

// ─── 언어별 데이터 ────────────────────────────────────────────────────────────

const now = new Date().toISOString();

const BOOKMARKS_BASE = (tags, folders) => [
	{ id: 'b1',  userId: 'local', url: 'https://github.com',            title: 'GitHub',        description: 'Where the world builds software',   favicon: 'https://www.google.com/s2/favicons?domain=github.com&sz=64',            folderId: 'f1', order: 0, createdAt: now, updatedAt: now, tags: [tags[0]] },
	{ id: 'b2',  userId: 'local', url: 'https://developer.mozilla.org', title: 'MDN Web Docs',  description: 'Web technology reference',            favicon: 'https://www.google.com/s2/favicons?domain=developer.mozilla.org&sz=64', folderId: 'f1', order: 1, createdAt: now, updatedAt: now, tags: [tags[1]] },
	{ id: 'b3',  userId: 'local', url: 'https://vercel.com',            title: 'Vercel',        description: 'Frontend cloud platform',             favicon: 'https://www.google.com/s2/favicons?domain=vercel.com&sz=64',            folderId: 'f1', order: 2, createdAt: now, updatedAt: now, tags: [] },
	{ id: 'b4',  userId: 'local', url: 'https://stackoverflow.com',     title: 'Stack Overflow',description: 'Developer Q&A community',             favicon: 'https://www.google.com/s2/favicons?domain=stackoverflow.com&sz=64',     folderId: 'f1', order: 3, createdAt: now, updatedAt: now, tags: [tags[1]] },
	{ id: 'b5',  userId: 'local', url: 'https://figma.com',             title: 'Figma',         description: 'Collaborative UI design tool',        favicon: 'https://www.google.com/s2/favicons?domain=figma.com&sz=64',             folderId: 'f2', order: 0, createdAt: now, updatedAt: now, tags: [tags[0]] },
	{ id: 'b6',  userId: 'local', url: 'https://dribbble.com',          title: 'Dribbble',      description: 'Designer portfolio community',        favicon: 'https://www.google.com/s2/favicons?domain=dribbble.com&sz=64',          folderId: 'f2', order: 1, createdAt: now, updatedAt: now, tags: [] },
	{ id: 'b7',  userId: 'local', url: 'https://news.ycombinator.com',  title: 'Hacker News',   description: 'Tech news & discussion',              favicon: 'https://www.google.com/s2/favicons?domain=news.ycombinator.com&sz=64',   folderId: 'f3', order: 0, createdAt: now, updatedAt: now, tags: [tags[2]] },
	{ id: 'b8',  userId: 'local', url: 'https://producthunt.com',       title: 'Product Hunt',  description: 'Discover new products & services',    favicon: 'https://www.google.com/s2/favicons?domain=producthunt.com&sz=64',       folderId: 'f3', order: 1, createdAt: now, updatedAt: now, tags: [tags[2]] },
	{ id: 'b9',  userId: 'local', url: 'https://youtube.com',           title: 'YouTube',       description: null,                                  favicon: 'https://www.google.com/s2/favicons?domain=youtube.com&sz=64',           folderId: null, order: 0, createdAt: now, updatedAt: now, tags: [tags[0]] },
	{ id: 'b10', userId: 'local', url: 'https://linear.app',            title: 'Linear',        description: 'Issue tracking & project management', favicon: 'https://www.google.com/s2/favicons?domain=linear.app&sz=64',            folderId: null, order: 1, createdAt: now, updatedAt: now, tags: [] },
	{ id: 'b11', userId: 'local', url: 'https://notion.so',             title: 'Notion',        description: 'Notes & workspace',                   favicon: 'https://www.google.com/s2/favicons?domain=notion.so&sz=64',             folderId: null, order: 2, createdAt: now, updatedAt: now, tags: [tags[0]] },
];

const LANGUAGES = {
	ko: {
		addBookmarkBtn: '북마크 추가',
		firstTagName:   '즐겨찾기',
		promoTagline:   '새 탭을 북마크 허브로',
		promoSub:       '태그 · 폴더 정리 · 크롬 동기화',
		promoFeatures:  ['📌 새 탭 허브', '🏷️ 태그 & 폴더', '🔄 크롬 동기화', '🎨 3가지 뷰'],
		tags: [
			{ id: 't1', userId: 'local', name: '즐겨찾기', color: '#6366f1', createdAt: now },
			{ id: 't2', userId: 'local', name: '레퍼런스', color: '#10b981', createdAt: now },
			{ id: 't3', userId: 'local', name: '읽을거리', color: '#f59e0b', createdAt: now },
		],
		folders: [
			{ id: 'f1', userId: 'local', name: '개발',           parentId: null, order: 0, createdAt: now },
			{ id: 'f2', userId: 'local', name: '디자인',          parentId: null, order: 1, createdAt: now },
			{ id: 'f3', userId: 'local', name: '뉴스 & 커뮤니티', parentId: null, order: 2, createdAt: now },
		],
	},
	en: {
		addBookmarkBtn: 'Add Bookmark',
		firstTagName:   'Favorites',
		promoTagline:   'Turn every new tab into your bookmark hub',
		promoSub:       'Tags · Folders · Chrome Sync',
		promoFeatures:  ['📌 New Tab Hub', '🏷️ Tags & Folders', '🔄 Chrome Sync', '🎨 3 View Modes'],
		tags: [
			{ id: 't1', userId: 'local', name: 'Favorites',    color: '#6366f1', createdAt: now },
			{ id: 't2', userId: 'local', name: 'Reference',    color: '#10b981', createdAt: now },
			{ id: 't3', userId: 'local', name: 'Reading List', color: '#f59e0b', createdAt: now },
		],
		folders: [
			{ id: 'f1', userId: 'local', name: 'Development',     parentId: null, order: 0, createdAt: now },
			{ id: 'f2', userId: 'local', name: 'Design',           parentId: null, order: 1, createdAt: now },
			{ id: 'f3', userId: 'local', name: 'News & Community', parentId: null, order: 2, createdAt: now },
		],
	},
	zh: {
		addBookmarkBtn: '添加书签',
		firstTagName:   '收藏',
		promoTagline:   '将每个新标签页变为书签中心',
		promoSub:       '标签 · 文件夹 · Chrome 同步',
		promoFeatures:  ['📌 新标签页中心', '🏷️ 标签 & 文件夹', '🔄 Chrome 同步', '🎨 三种视图'],
		tags: [
			{ id: 't1', userId: 'local', name: '收藏',    color: '#6366f1', createdAt: now },
			{ id: 't2', userId: 'local', name: '参考资料', color: '#10b981', createdAt: now },
			{ id: 't3', userId: 'local', name: '待读',    color: '#f59e0b', createdAt: now },
		],
		folders: [
			{ id: 'f1', userId: 'local', name: '开发',       parentId: null, order: 0, createdAt: now },
			{ id: 'f2', userId: 'local', name: '设计',       parentId: null, order: 1, createdAt: now },
			{ id: 'f3', userId: 'local', name: '新闻 & 社区', parentId: null, order: 2, createdAt: now },
		],
	},
	ja: {
		addBookmarkBtn: 'ブックマークを追加',
		firstTagName:   'お気に入り',
		promoTagline:   '新しいタブをブックマークハブに',
		promoSub:       'タグ · フォルダ整理 · Chrome 同期',
		promoFeatures:  ['📌 新タブハブ', '🏷️ タグ & フォルダ', '🔄 Chrome 同期', '🎨 3種のビュー'],
		tags: [
			{ id: 't1', userId: 'local', name: 'お気に入り',    color: '#6366f1', createdAt: now },
			{ id: 't2', userId: 'local', name: 'リファレンス', color: '#10b981', createdAt: now },
			{ id: 't3', userId: 'local', name: '読み物',       color: '#f59e0b', createdAt: now },
		],
		folders: [
			{ id: 'f1', userId: 'local', name: '開発',                parentId: null, order: 0, createdAt: now },
			{ id: 'f2', userId: 'local', name: 'デザイン',             parentId: null, order: 1, createdAt: now },
			{ id: 'f3', userId: 'local', name: 'ニュース & コミュニティ', parentId: null, order: 2, createdAt: now },
		],
	},
};

// ─── chrome.storage mock ──────────────────────────────────────────────────────

function makeChromeInitScript(viewMode, lang) {
	const { tags, folders } = LANGUAGES[lang];
	const bookmarks = BOOKMARKS_BASE(tags, folders);

	const store = {
		bookmarks,
		tags,
		folders,
		syncMap: { bookmarks: {}, folders: {} },
		setting: JSON.stringify({ state: { viewMode, syncMode: 'off' }, version: 1 }),
	};

	return `
    (function() {
      // i18n 언어 설정 (i18next-browser-languagedetector가 localStorage를 읽음)
      localStorage.setItem('i18n_language', '${lang}');

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

// ─── 프로모션 타일 HTML (1400×560) ────────────────────────────────────────────

function makePromoHTML(lang) {
	const { promoTagline, promoSub, promoFeatures } = LANGUAGES[lang];

	const featuresHTML = promoFeatures
		.map(
			(f) => `
      <div style="
        display:flex;align-items:center;gap:8px;
        background:rgba(255,255,255,0.07);
        border:1px solid rgba(255,255,255,0.12);
        border-radius:999px;
        padding:10px 20px;
        font-size:14px;
        color:rgba(255,255,255,0.85);
        white-space:nowrap;
      ">${f}</div>`,
		)
		.join('');

	const decoCards = [68, 76, 60, 72]
		.map(
			(w) => `
    <div style="
      width:280px;
      background:rgba(255,255,255,0.05);
      border:1px solid rgba(255,255,255,0.1);
      border-radius:12px;
      padding:14px 18px;
      display:flex;align-items:center;gap:12px;
    ">
      <div style="width:28px;height:28px;background:rgba(255,255,255,0.1);border-radius:6px;flex-shrink:0;"></div>
      <div style="display:flex;flex-direction:column;gap:6px;flex:1;">
        <div style="height:9px;border-radius:4px;background:rgba(255,255,255,0.25);width:${w}%;"></div>
        <div style="height:7px;border-radius:4px;background:rgba(255,255,255,0.12);width:65%;"></div>
      </div>
    </div>`,
		)
		.join('');

	return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    width:1400px; height:560px; overflow:hidden;
    background:#09090b;
    font-family:-apple-system,"Helvetica Neue","Noto Sans CJK KR","Noto Sans CJK SC","Noto Sans CJK JP",sans-serif;
    position:relative;
  }
</style>
</head>
<body>
  <!-- 배경 글로우 -->
  <div style="position:absolute;top:50%;left:18%;width:420px;height:420px;transform:translate(-50%,-50%);background:radial-gradient(circle,rgba(99,102,241,0.28) 0%,transparent 70%);filter:blur(60px);pointer-events:none;"></div>
  <div style="position:absolute;top:50%;right:5%;width:360px;height:360px;transform:translate(50%,-50%);background:radial-gradient(circle,rgba(16,185,129,0.18) 0%,transparent 70%);filter:blur(60px);pointer-events:none;"></div>

  <!-- 메인 컨텐츠 -->
  <div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;height:100%;padding:0 100px;gap:28px;">

    <!-- 로고 -->
    <div style="display:flex;align-items:center;gap:14px;">
      <div style="width:52px;height:52px;background:rgba(99,102,241,0.15);border:1px solid rgba(99,102,241,0.3);border-radius:14px;display:flex;align-items:center;justify-content:center;">
        <svg width="26" height="26" fill="rgba(99,102,241,0.9)" viewBox="0 0 24 24">
          <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
        </svg>
      </div>
      <span style="font-size:36px;font-weight:700;letter-spacing:-0.02em;color:#fff;">mark.</span>
    </div>

    <!-- 태그라인 -->
    <div style="font-size:38px;font-weight:700;letter-spacing:-0.02em;line-height:1.2;color:#fff;max-width:780px;">${promoTagline}</div>

    <!-- 서브 -->
    <div style="font-size:18px;color:rgba(255,255,255,0.45);letter-spacing:0.01em;">${promoSub}</div>

    <!-- 기능 pills -->
    <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:4px;">${featuresHTML}</div>
  </div>

  <!-- 오른쪽 장식 카드 -->
  <div style="position:absolute;right:80px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:12px;opacity:0.35;">
    ${decoCards}
  </div>
</body>
</html>`;
}

// ─── vite preview 서버 ────────────────────────────────────────────────────────

async function startPreviewServer() {
	return new Promise((res, rej) => {
		const proc = spawn('pnpm', ['--filter', '@bookmark/web', 'preview', '--port', '4200'], {
			cwd: ROOT,
			stdio: ['ignore', 'pipe', 'pipe'],
		});
		const timer = setTimeout(() => rej(new Error('preview server timeout')), 15000);
		const onData = (d) => {
			if (d.toString().includes('4200')) {
				clearTimeout(timer);
				res({ proc, url: 'http://localhost:4200' });
			}
		};
		proc.stdout.on('data', onData);
		proc.stderr.on('data', onData);
	});
}

// ─── 빌드 ─────────────────────────────────────────────────────────────────────

console.log('📦 web 앱 빌드 중...');
const build = spawn('pnpm', ['--filter', '@bookmark/web', 'build'], { cwd: ROOT, stdio: 'inherit' });
await new Promise((res, rej) => {
	build.on('close', (code) => (code === 0 ? res() : rej(new Error(`build failed: ${code}`))));
});
console.log('✓ 빌드 완료\n');

// ─── preview 서버 시작 ────────────────────────────────────────────────────────

console.log('🚀 preview 서버 시작 중...');
const { proc: serverProc, url: BASE_URL } = await startPreviewServer();
await new Promise((r) => setTimeout(r, 1000));
console.log(`✓ 서버 준비: ${BASE_URL}\n`);

// ─── Playwright ───────────────────────────────────────────────────────────────

const browser = await chromium.launch({ headless: true });

async function loadPage(viewMode, lang) {
	const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
	await ctx.addInitScript(makeChromeInitScript(viewMode, lang));
	const page = await ctx.newPage();
	await page.goto(BASE_URL, { waitUntil: 'networkidle' });
	await page.waitForTimeout(1500);
	return { page, ctx };
}

async function shot(outDir, filename, viewMode, lang, setupFn) {
	const { page, ctx } = await loadPage(viewMode, lang);
	if (setupFn) await setupFn(page);
	await page.screenshot({ path: resolve(outDir, filename) });
	await ctx.close();
	console.log(`  ✓ ${filename}`);
}

async function promoShot(outDir, lang) {
	const ctx = await browser.newContext({ viewport: { width: 1400, height: 560 } });
	const page = await ctx.newPage();
	await page.setContent(makePromoHTML(lang), { waitUntil: 'domcontentloaded' });
	await page.waitForTimeout(300);
	await page.screenshot({ path: resolve(outDir, 'promo-tile.png') });
	await ctx.close();
	console.log('  ✓ promo-tile.png');
}

// ─── 언어별 순차 실행 ─────────────────────────────────────────────────────────

for (const lang of Object.keys(LANGUAGES)) {
	const outDir = resolve(SCREENSHOTS_DIR, lang);
	mkdirSync(outDir, { recursive: true });

	const { addBookmarkBtn, firstTagName } = LANGUAGES[lang];
	console.log(`\n🌐 [${lang.toUpperCase()}] 캡처 시작 → screenshots/${lang}/`);

	// 1. Glass 뷰
	await shot(outDir, '01-glass-view.png', 'glass', lang);

	// 2. 리스트 뷰 (사이드바 포함)
	await shot(outDir, '02-list-sidebar.png', 'list', lang);

	// 3. 그리드 뷰
	await shot(outDir, '03-grid-view.png', 'grid', lang);

	// 4. 북마크 추가 다이얼로그
	await shot(outDir, '04-add-dialog.png', 'list', lang, async (page) => {
		const btn = page.getByRole('button', { name: addBookmarkBtn });
		await btn.waitFor({ timeout: 5000 });
		await btn.click();
		await page.waitForTimeout(600);
	});

	// 5. 태그 필터 활성 (Glass 뷰)
	await shot(outDir, '05-tag-filter.png', 'glass', lang, async (page) => {
		const tag = page.getByText(firstTagName).first();
		if (await tag.isVisible()) {
			await tag.click();
			await page.waitForTimeout(500);
		}
	});

	// 6. 프로모션 타일 (1400×560)
	await promoShot(outDir, lang);
}

await browser.close();
serverProc.kill();

const langs = Object.keys(LANGUAGES);
console.log(`\n✅ 완료 — ${langs.length}개 언어 × 6장 = ${langs.length * 6}장`);
console.log(`   ${langs.map((l) => `screenshots/${l}/`).join('  ')}`);
