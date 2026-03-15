# Chrome Web Store 배포 준비 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 크롬 웹 스토어 제출에 필요한 아이콘, manifest 완성, metadata API 비활성화, zip 패키징 스크립트를 추가한다.

**Architecture:** 아이콘은 헤더 로고 SVG 패스를 재사용해 one-time 스크립트로 PNG를 생성하고 커밋한다. extension 모드 감지는 `import.meta.env.MODE`를 사용한다. zip 패키징은 루트에 Node.js 스크립트로 추가한다.

**Tech Stack:** sharp (PNG 변환), archiver (zip), Vite `import.meta.env.MODE`

---

### Task 1: 아이콘 생성 스크립트 작성 및 실행

**Files:**
- Create: `scripts/generate-icons.mjs`
- Create: `apps/extension/public/icons/icon16.png` (생성됨)
- Create: `apps/extension/public/icons/icon48.png` (생성됨)
- Create: `apps/extension/public/icons/icon128.png` (생성됨)

**Step 1: sharp devDependency 추가**

```bash
pnpm add -D sharp -w
```

**Step 2: 아이콘 생성 스크립트 작성**

`scripts/generate-icons.mjs`:
```js
import { mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, '../apps/extension/public/icons');
mkdirSync(outDir, { recursive: true });

// 헤더 로고와 동일한 북마크 SVG 패스
function makeSvg(size) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
  <rect width="24" height="24" rx="5" fill="#6366f1"/>
  <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" fill="white"/>
</svg>`
  );
}

for (const size of [16, 48, 128]) {
  await sharp(makeSvg(size))
    .resize(size, size)
    .png()
    .toFile(resolve(outDir, `icon${size}.png`));
  console.log(`✓ icon${size}.png`);
}
```

**Step 3: 스크립트 실행**

```bash
node scripts/generate-icons.mjs
```

Expected: `apps/extension/public/icons/` 에 `icon16.png`, `icon48.png`, `icon128.png` 생성

**Step 4: 커밋**

```bash
git add scripts/generate-icons.mjs apps/extension/public/icons/ package.json pnpm-lock.yaml
git commit -m "feat: add extension icon assets (16/48/128px)"
```

---

### Task 2: manifest.json 완성

**Files:**
- Modify: `apps/extension/public/manifest.json`

**Step 1: manifest.json 수정**

```json
{
  "manifest_version": 3,
  "name": "mark.",
  "short_name": "mark.",
  "version": "0.0.1",
  "description": "Easily add and manage bookmarks with Chrome sync",
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "action": {
    "default_popup": "popup.html",
    "default_title": "mark.",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png"
    }
  },
  "chrome_url_overrides": {
    "newtab": "newtab/index.html"
  },
  "permissions": ["storage", "tabs", "activeTab", "bookmarks"]
}
```

변경 사항:
- `icons` 필드 추가 (웹스토어 필수)
- `action.default_icon` 추가 (툴바 아이콘)
- `host_permissions` 제거 (API 서버 없음)
- `identity` permission 제거 (사용 안 함)
- `name` / `description` 정리

**Step 2: 커밋**

```bash
git add apps/extension/public/manifest.json
git commit -m "feat: complete manifest.json for Chrome Web Store"
```

---

### Task 3: extension 모드에서 fetchUrlMetadata 비활성화

**Files:**
- Modify: `apps/web/src/shared/api/metadata.ts`

**Step 1: 코드 수정**

```ts
import { apiClient } from '@repo/api-client';
import type { UrlMetadata } from '@repo/types';

export async function fetchUrlMetadata(url: string): Promise<UrlMetadata> {
  // extension 빌드에서는 API 서버 없음 → 즉시 빈 값 반환
  if (import.meta.env.MODE === 'extension') return { title: null, favicon: null };

  try {
    const res = await apiClient.get<UrlMetadata>('/metadata', { params: { url } });
    return res.data;
  } catch {
    return { title: null, favicon: null };
  }
}
```

**Step 2: 타입 체크**

```bash
pnpm --filter @repo/web check-types
```

Expected: 에러 없음

**Step 3: 커밋**

```bash
git add apps/web/src/shared/api/metadata.ts
git commit -m "feat: disable metadata API fetch in extension mode"
```

---

### Task 4: build:zip 스크립트 추가

**Files:**
- Create: `scripts/zip-extension.mjs`
- Modify: `package.json` (루트)
- Modify: `.gitignore` (루트)

**Step 1: archiver 추가**

```bash
pnpm add -D archiver @types/archiver -w
```

**Step 2: zip 스크립트 작성**

`scripts/zip-extension.mjs`:
```js
import archiver from 'archiver';
import { createWriteStream, existsSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, '../apps/extension/dist');
const outZip = resolve(__dirname, '../extension.zip');

if (!existsSync(distDir)) {
  console.error('apps/extension/dist 가 없습니다. 먼저 빌드하세요.');
  process.exit(1);
}

if (existsSync(outZip)) rmSync(outZip);

const output = createWriteStream(outZip);
const archive = archiver('zip', { zlib: { level: 9 } });

archive.pipe(output);
archive.directory(distDir, false);

await archive.finalize();
console.log(`✓ extension.zip 생성 완료 (${archive.pointer()} bytes)`);
```

**Step 3: 루트 package.json scripts에 추가**

```json
"build:ext": "turbo run build --filter=@repo/extension && node scripts/zip-extension.mjs"
```

**Step 4: .gitignore에 zip 추가**

루트 `.gitignore` 끝에 추가:
```
extension.zip
```

**Step 5: 전체 빌드 & zip 테스트**

```bash
pnpm build:ext
```

Expected:
1. `@repo/web` build:ext 실행
2. `@repo/extension` build 실행 (newtab 복사 포함)
3. `extension.zip` 생성

**Step 6: zip 검증**

```bash
pnpm check && pnpm check-types && pnpm --filter @repo/web test
```

**Step 7: 커밋**

```bash
git add scripts/zip-extension.mjs package.json .gitignore pnpm-lock.yaml
git commit -m "feat: add build:ext zip packaging script for Chrome Web Store"
```

---

## 최종 확인 체크리스트

- [ ] `apps/extension/public/icons/` 에 PNG 3종 존재
- [ ] `manifest.json`에 `icons`, `action.default_icon` 있고 `host_permissions` 없음
- [ ] extension 빌드 시 URL 입력해도 metadata API 호출 안 함
- [ ] `pnpm build:ext` 실행 시 `extension.zip` 생성됨
- [ ] zip 압축 해제 후 Chrome 개발자 모드에서 로드 정상 확인
