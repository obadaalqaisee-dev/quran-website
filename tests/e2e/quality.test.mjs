// Responsive layout, accessibility (axe-core, WCAG 2 A/AA), PWA/offline, and static security/SEO checks.

import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { after, before, describe, test } from 'node:test';

import { REPO, chromium, collectErrors, mockUpstream, startPagesServer } from './helpers.mjs';

const require = createRequire(import.meta.url);
const AXE = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const SHOTS = process.env.SCREENSHOT_DIR || '';

let browser;
let site;
before(async () => {
  browser = await chromium.launch();
  site = await startPagesServer();
  if (SHOTS) mkdirSync(SHOTS, { recursive: true });
});
after(async () => {
  await browser?.close();
  await site?.close();
});

async function open(options = {}) {
  // bypassCSP only matters for injecting axe-core (an inline script, which the site's CSP rightly blocks).
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 }, bypassCSP: true, ...options });
  await mockUpstream(context);
  const page = await context.newPage();
  const errors = collectErrors(page);
  await page.goto(site.url);
  await page.waitForSelector('#surahGrid .surah-card');
  await page.waitForSelector('.prayer-card');
  return { context, page, errors };
}

// ------------------------------------------------------------------ responsive
const VIEWPORTS = [[320, 640], [360, 740], [390, 844], [768, 1024], [1024, 768], [1366, 900], [1920, 1080]];

describe('responsive layout', () => {
  for (const [width, height] of VIEWPORTS) {
    test(`${width}×${height}: no horizontal scrolling (Arabic and English), dialogs fit`, async () => {
      const { context, page, errors } = await open({ viewport: { width, height } });
      const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert.ok((await overflow()) <= 0, `ar overflow ${await overflow()}px`);
      if (SHOTS) await page.screenshot({ path: join(SHOTS, `home-${width}.png`), fullPage: width <= 390 });
      await page.click('#surahGrid [data-action="read"][data-surah="2"]');
      await page.waitForSelector('#ayah-10');
      await page.click('#ayah-4');
      assert.ok((await overflow()) <= 0, 'reading view overflow');
      if (SHOTS) await page.locator('#readingSection').screenshot({ path: join(SHOTS, `reading-${width}.png`) });
      await page.selectOption('#langSelect', 'en');
      assert.ok((await overflow()) <= 0, `en overflow ${await overflow()}px`);
      await page.click('[data-open="adhkarModal"]');
      const box = await page.locator('#adhkarModal').boundingBox();
      assert.ok(box.width <= width && box.height <= height, 'dialog fits the viewport');
      if (SHOTS) await page.screenshot({ path: join(SHOTS, `adhkar-${width}.png`) });
      assert.deepEqual(errors, []);
      await context.close();
    });
  }

  test('touch targets: interactive controls are at least 40×40 px on a phone', async () => {
    const { context, page } = await open({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const small = await page.evaluate(() => [...document.querySelectorAll('button, select, input[type=checkbox], .nav-links a')]
      .filter((el) => el.offsetParent && !el.closest('dialog') && !el.closest('.wird-item'))
      .map((el) => { const r = el.getBoundingClientRect(); return { el: el.id || el.className || el.textContent.trim().slice(0, 20), w: r.width, h: r.height }; })
      .filter((r) => r.w < 40 || r.h < 40));
    assert.deepEqual(small, []);
    await context.close();
  });
});

// ------------------------------------------------------------------ accessibility
async function axe(page, include) {
  await page.addScriptTag({ content: AXE });
  return page.evaluate(async (sel) => {
    const res = await window.axe.run(sel ? { include: [sel] } : document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } });
    return res.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.slice(0, 5).map((n) => n.target.join(' ')) }));
  }, include);
}

describe('accessibility (axe-core, WCAG 2.1 A/AA)', () => {
  for (const scheme of ['light', 'dark']) {
    test(`home page, ${scheme} theme: no violations`, async () => {
      const { context, page } = await open({ colorScheme: scheme });
      await page.click('#surahGrid [data-action="read"][data-surah="1"]');
      await page.waitForSelector('#ayah-6');
      await page.click('#ayah-1');
      await page.waitForFunction(() => !/جاري/.test(document.getElementById('tafsirText').textContent));
      assert.deepEqual(await axe(page), []);
      await context.close();
    });
  }

  for (const id of ['sideMenu', 'adhkarModal', 'learnPrayerModal', 'profileModal', 'voiceTestModal', 'ayahSearchModal', 'contactModal', 'rosaryModal']) {
    test(`dialog #${id}: no violations, focus moves inside`, async () => {
      const { context, page } = await open();
      await page.evaluate((d) => document.querySelector(`[data-open="${d}"]`).click(), id);
      assert.ok(await page.evaluate((d) => document.getElementById(d).contains(document.activeElement), id), 'focus inside dialog');
      assert.deepEqual(await axe(page, `#${id}`), []);
      await context.close();
    });
  }

  test('keyboard only: skip link, open a surah, play an ayah, close a dialog', async () => {
    const { context, page } = await open();
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.className), 'skip-link');
    await page.focus('#surahGrid [data-action="read"][data-surah="1"]');
    await page.keyboard.press('Enter');
    await page.waitForSelector('#ayah-0');
    await page.focus('#ayah-3');
    await page.keyboard.press(' ');
    await page.waitForFunction(() => document.getElementById('ayah-3').classList.contains('active-ayah'));
    await page.focus('.nav-links [data-open="rosaryModal"]');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(() => document.activeElement.dataset.open), 'rosaryModal', 'focus returns to the opener');
    await context.close();
  });
});

// ------------------------------------------------------------------ PWA / offline
describe('progressive web app', () => {
  test('manifest icons have the declared sizes', async () => {
    const manifest = JSON.parse(readFileSync(join(REPO, 'manifest.json'), 'utf8'));
    for (const icon of manifest.icons) {
      const png = readFileSync(join(REPO, icon.src));
      const w = png.readUInt32BE(16);
      const h = png.readUInt32BE(20);
      assert.equal(`${w}x${h}`, icon.sizes, icon.src);
    }
  });

  test('service worker installs; the site and a previously read surah work offline', async () => {
    const { context, page } = await open();
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    await page.click('#surahGrid [data-action="read"][data-surah="1"]');
    await page.waitForSelector('#ayah-6');
    await context.setOffline(true);
    await page.reload();
    await page.waitForSelector('#surahGrid .surah-card');
    assert.equal(await page.locator('#surahGrid .surah-card').count(), 114);
    await page.click('#surahGrid [data-action="read"][data-surah="1"]');
    await page.waitForFunction(() => document.querySelectorAll('#readingText .ayah-span').length === 7);
    await context.close();
  });
});

// ------------------------------------------------------------------ static security & SEO
describe('static security and SEO checks', () => {
  const html = readFileSync(join(REPO, 'index.html'), 'utf8');

  test('no inline scripts, inline event handlers or style attributes (strict CSP is possible)', () => {
    const csp = /http-equiv="Content-Security-Policy" content="([^"]+)"/.exec(html)[1];
    const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
    let inline = 0;
    for (const [, attrs, body] of scripts) {
      if (/type="application\/ld\+json"/.test(attrs)) continue;
      if (/\bsrc="/.test(attrs)) { assert.equal(body.trim(), ''); continue; }
      // The single inline script (theme initialiser) must be allowed by its exact hash, not 'unsafe-inline'.
      inline += 1;
      const hash = `sha256-${createHash('sha256').update(body).digest('base64')}`;
      assert.ok(csp.includes(`'${hash}'`), `inline script hash ${hash} missing from the CSP`);
    }
    assert.equal(inline, 1);
    assert.doesNotMatch(csp, /unsafe-inline|unsafe-eval/);
    assert.doesNotMatch(html, /\son[a-z]+="/i, 'inline event handler');
    assert.doesNotMatch(html, /\sstyle="/i, 'inline style attribute');
    assert.doesNotMatch(html, /javascript:/i);
  });

  test('every JS module is preloaded and precached by the service worker', () => {
    const walk = (dir) => readdirSync(join(REPO, dir), { withFileTypes: true })
      .flatMap((e) => (e.isDirectory() ? walk(`${dir}/${e.name}`) : [`${dir}/${e.name}`]));
    const modules = walk('assets/js').filter((f) => f.endsWith('.js') && !f.endsWith('analytics.js')).sort();
    const preloaded = [...html.matchAll(/<link rel="modulepreload" href="([^"]+)">/g)].map((m) => m[1]).sort();
    assert.deepEqual(preloaded, modules);
    const sw = readFileSync(join(REPO, 'sw.js'), 'utf8');
    for (const f of [...modules, 'assets/js/analytics.js', 'assets/css/main.css', 'index.html']) assert.ok(sw.includes(`'${f}'`), `sw.js precaches ${f}`);
  });

  test('external links opened in a new tab use rel="noopener noreferrer"', () => {
    for (const [tag] of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) assert.match(tag, /rel="noopener noreferrer"/, tag);
  });

  test('the CSP meta tag equals the backend policy (minus frame-ancestors, which <meta> cannot carry)', () => {
    const meta = /http-equiv="Content-Security-Policy" content="([^"]+)"/.exec(html)[1];
    const backendCsp = execFileSync('python3', ['-c', 'import sys; sys.path.insert(0, "backend"); from app.core.security import build_csp; print(build_csp())'], { cwd: REPO, env: { ...process.env, PYTHONPATH: join(REPO, 'backend') } }).toString().trim();
    const fromBackend = backendCsp.split('; ').filter((d) => !d.startsWith('frame-ancestors')).join('; ');
    assert.equal(meta, fromBackend);
  });

  test('remote data is never written with innerHTML', () => {
    const js = execFileSync('grep', ['-rn', 'innerHTML', join(REPO, 'assets/js')]).toString().trim().split('\n');
    // Allowed: the trusted static i18n strings (i18n.js) and the generic helper's documented "html" prop (dom.js).
    for (const line of js) assert.match(line, /assets\/js\/core\/(i18n|dom)\.js/, line);
    const htmlProp = spawnSync('grep', ['-rn', 'html:', join(REPO, 'assets/js/features')], { encoding: 'utf8' });
    assert.equal(htmlProp.stdout, '', 'feature modules never use the html: property of h()');
  });

  test('SEO essentials', async () => {
    assert.match(html, /<html lang="ar" dir="rtl">/);
    assert.match(html, /<link rel="canonical" href="https:\/\/obadaalqaisee-dev\.github\.io\/quran-website\/">/);
    assert.match(html, /<meta name="description" content="[^"]{50,}">/);
    for (const p of ['og:title', 'og:description', 'og:image', 'og:url']) assert.match(html, new RegExp(`property="${p}"`));
    assert.match(html, /name="twitter:card"/);
    const ld = JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html)[1]);
    assert.equal(ld['@type'], 'WebSite');
    assert.equal((html.match(/<h1\b/g) || []).length, 1);
    assert.match(readFileSync(join(REPO, 'robots.txt'), 'utf8'), /Sitemap: https:\/\/obadaalqaisee-dev\.github\.io\/quran-website\/sitemap\.xml/);
    assert.match(readFileSync(join(REPO, 'sitemap.xml'), 'utf8'), /<loc>https:\/\/obadaalqaisee-dev\.github\.io\/quran-website\/<\/loc>/);
  });
});
