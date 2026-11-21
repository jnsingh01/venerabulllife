// Venerabull Life — the verification of one release package, served alone. This copy runs on a hosted runner for one
// release candidate (acceptance/pin.json), through acceptance/run.sh.
//
//   PW_MODULE=<path to playwright-core/index.mjs> node tools/verify-release.mjs --rev REV --base HOST_BASE --out DIR
//   PW_MODULE=... node tools/verify-release.mjs --live https://venerabulllife.com --rev REV --base HOST_BASE --out DIR
//
// Two modes. The candidate mode (the default) serves the scanned package on this runner; it is proof of the package,
// never of the live site. The live mode (--live, run only from its own branch after publication) fetches the
// published site at the pinned origin and holds it to the candidate's files in site/ here: every file's bytes, every
// retired address, and the same page, menu and no-scripts checks and captures; redirects are never followed.
//
// One run, no waiting and no retry, after `python3 -I tools/release.py build --rev REV` has written and scanned the
// package. Playwright and its headless shell are installed by the workflow before this runs; nothing here downloads.
//
// It serves ONLY release/venerabulllife.com-<rev7>/, as a static host does: a path that names a file gets that file
// with status 200; any other path, at any depth, gets 404.html with status 404. Fresh headless Chromium contexts
// (Playwright's non-persistent launch: an empty profile per context, deleted on close); every request to another
// origin is aborted and recorded. Then:
//   - every remaining page (home, the four directions, the not-found page at a nested address) at 1440x900 and
//     390x844: its status, its title, no link that leaves the site or goes to a retired address (the term scan is made
//     privately on the same pinned tree, and is not in this copy), the header's four directions and
//     the footer's one Life column, every picture loaded, no page wider than its window; a viewport capture and a
//     full-page capture, each after fonts, pictures and transitions settle; on a phone, the menu sheet opened (Home
//     and the four directions, nothing else), captured, and closed with Escape, focus back on its button
//   - with scripts turned off: home, a direction and the not-found page at both widths
//   - every address this release retires (each path of the published host commit HOST_BASE, less the host's own
//     CNAME and .nojekyll, that is not in site/ at REV; their count and digest must be the pinned ones), and the
//     query forms of the old shop and product addresses: status 404 and the not-found page
//   - every packaged file fetched by its path, and the root address: status 200 and the package's own bytes
// The report (DIR/report.json) uses the fields `tools/release.py manifest --verify` reads; nothing from an earlier
// report is reused. Exit: 0 everything held; 1 a check failed; 2 refused (no package, a failed or missing scan, no
// retired list, the browser missing, the hard cap).
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const PW = process.env.PW_MODULE || '';
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HARD_CAP_MS = 6 * 60 * 1000;
const RETIRED_LINK = /(^|\/)(shop|product|help)\.html|(^|\/)products\//;

const argv = process.argv.slice(2);
const arg = (k) => { const i = argv.indexOf(k); return i >= 0 ? (argv[i + 1] || '') : ''; };
// --live ORIGIN: the live mode (acceptance/run.sh OUT live, selected only by its own branch): the published site at the
// pinned origin instead of the package served here; nothing is published by it
const LIVE = arg('--live');
const git = (...a) => execFileSync('git', ['-C', REPO, ...a], { encoding: 'utf8' }).trim();
const clock = () => new Date().toLocaleString('sv-SE', { timeZone: 'America/New_York' }) + ' ET';

const report = { runner: 'tools/verify-release.mjs (hosted-runner copy)', started: clock(), widths: [1440, 390], pages: {}, interactions: [], console: [],
  expectedMissing: [], exceptions: [], failed: [], external: [], responses: {}, files: {}, nojs: {}, shots: [], retired: 0 };
// The one address the browser opens on purpose that names no file: the not-found page at a nested address. Its document
// answers 404 by design, and Chromium logs that as exactly MISSING_DOC with the document as its source. Only that
// message, from that source, is expected; every other console error or warning is a fault. The message carries the
// response's reason phrase: "404 (Not Found)" from the local server (HTTP/1.1), "404 ()" from the live host, which
// sends none (HTTP/2). Those two forms, and nothing else, are the expected message.
const MISSING_PATH = '/no/such/page.html';
const MISSING_DOC = /^Failed to load resource: the server responded with a status of 404 \((?:Not Found)?\)$/;
let OUT = '';
const save = () => { if (OUT) { fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2)); } };
class Refuse extends Error {}
const check = (what, ok, detail) => { report.interactions.push({ what, ok: !!ok, ...(detail === undefined ? {} : { detail }) }); console.log(`${ok ? 'PASS' : 'FAIL'} ${what}${ok || detail === undefined ? '' : ' — ' + JSON.stringify(detail).slice(0, 300)}`); };

const VIEW = {
  1440: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
  390: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1' },
};
const PAGES = [['home', '/'], ['spa', '/spa.html'], ['rest', '/rest.html'], ['experiences', '/experiences.html'],
  ['longevity', '/longevity.html'], ['notfound', MISSING_PATH]];
const DIRS = ['Spa', 'Rest', 'Experiences', 'Longevity'];
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.jpg': 'image/jpeg', '.png': 'image/png' };

// ── the static host: the package folder alone ────────────────────────────────
function serve(pkg) {
  const nf = fs.readFileSync(path.join(pkg, '404.html'));
  const server = http.createServer((req, res) => {
    let p;
    try { p = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch (e) { p = '/'; }
    if (p.endsWith('/')) { p += 'index.html'; }
    const file = path.normalize(path.join(pkg, p));
    const inside = file.startsWith(pkg + path.sep);
    const hit = inside && fs.existsSync(file) && fs.statSync(file).isFile();
    const status = hit ? 200 : 404;
    report.responses[String(status)] = (report.responses[String(status)] || 0) + 1;
    res.writeHead(status, { 'Content-Type': hit ? (TYPES[path.extname(file)] || 'application/octet-stream') : TYPES['.html'], 'Cache-Control': 'no-store' });
    res.end(hit ? fs.readFileSync(file) : nf);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

// ── before every capture: fonts, pictures and transitions settle (bounded; never throws) ──
async function settle(page, full) {
  if (full) {
    await page.evaluate(async () => {
      const y0 = scrollY, wait = (ms) => new Promise((r) => setTimeout(r, ms));
      for (let y = 0, i = 0; y < document.documentElement.scrollHeight && i < 30; y += innerHeight * 0.9, i++) { scrollTo(0, y); await wait(100); }
      scrollTo(0, y0); await wait(100);
    }).catch(() => {});
  }
  const settled = await page.waitForFunction((all) => {
    if (document.fonts && document.fonts.status !== 'loaded') { return false; }
    const vh = innerHeight;
    const imgs = [...document.images].filter((i) => { const r = i.getBoundingClientRect(); return all || (r.bottom > 0 && r.top < vh); });
    if (imgs.some((i) => !i.complete)) { return false; }
    return !document.getAnimations().some((a) => a.playState === 'running' && a.effect && a.effect.getComputedTiming && Number.isFinite(a.effect.getComputedTiming().endTime));
  }, !!full, { timeout: full ? 9000 : 6000, polling: 100 }).then(() => true).catch(() => false);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))).catch(() => {});
  return settled;
}
// Every capture is recorded with whether it settled; a caller makes a check of it, so a capture taken mid-change fails.
async function shot(page, name, full) {
  const settled = await settle(page, full);
  const file = name + (full ? '-full' : '') + '.png';
  await page.screenshot({ path: path.join(OUT, file), fullPage: !!full });
  const s = { file, settled, full: !!full, url: page.url(), at: clock() };
  report.shots.push(s);
  return s;
}

// With scripts turned off the page runs no timer or animation-frame callback, so an in-page wait on one never ends
// (and page.evaluate has no timeout). For those pages the scrolling and the settle polling are driven from here: each
// page read is synchronous, each is bounded, and a read that does not answer fails the walk instead of the run.
const nodeWait = (ms) => new Promise((r) => setTimeout(r, ms));
async function bounded(promise, ms, what) {
  let t;
  const late = new Promise((_, reject) => { t = setTimeout(() => reject(new Error(`${what}: no answer in ${ms} ms`)), ms); });
  try { return await Promise.race([promise, late]); } finally { clearTimeout(t); }
}
async function scrollNoJs(page) {
  const [height, vh] = await bounded(page.evaluate(() => [document.documentElement.scrollHeight, innerHeight]), 5000, 'page height');
  for (let y = 0, i = 0; y < height && i < 30; y += vh * 0.9, i++) { await bounded(page.evaluate((v) => scrollTo(0, v), y), 5000, 'scroll'); await nodeWait(100); }
  await bounded(page.evaluate(() => scrollTo(0, 0)), 5000, 'scroll'); await nodeWait(100);
}
// a synchronous test polled from here every 100 ms until it holds or ms pass
async function untilNoJs(page, test, ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (await bounded(page.evaluate(test), 5000, 'poll').catch(() => false)) { return true; }
    await nodeWait(100);
  }
  return false;
}
const PICTURES_DONE = () => [...document.images].every((i) => i.complete);
// the settle test of settle(page, true): fonts, every picture, no running finite animation
const SETTLED_FULL = () => (!document.fonts || document.fonts.status === 'loaded') && [...document.images].every((i) => i.complete) &&
  !document.getAnimations().some((a) => a.playState === 'running' && a.effect && a.effect.getComputedTiming && Number.isFinite(a.effect.getComputedTiming().endTime));
async function shotNoJs(page, name) {
  await scrollNoJs(page);
  const settled = await untilNoJs(page, SETTLED_FULL, 9000);
  await nodeWait(100);
  const file = name + '-full.png';
  await page.screenshot({ path: path.join(OUT, file), fullPage: true });
  const s = { file, settled, full: true, url: page.url(), at: clock() };
  report.shots.push(s);
  return s;
}

async function context(browser, width, scripts, site) {
  const ctx = await browser.newContext({ ...VIEW[width], javaScriptEnabled: scripts, locale: 'en-US', timezoneId: 'America/New_York',
    colorScheme: 'light', serviceWorkers: 'block', acceptDownloads: false });
  ctx.setDefaultTimeout(20000); ctx.setDefaultNavigationTimeout(30000);
  await ctx.route('**/*', (route) => {
    const u = route.request().url();
    if (u.startsWith(site + '/') || u === site || u.startsWith('data:')) { return route.continue(); }
    report.external.push(u.slice(0, 200)); return route.abort();
  });
  const page = await ctx.newPage();
  const tag = `${width}${scripts ? '' : ' no scripts'}`;
  page.on('console', (m) => {
    const type = m.type();
    if (type !== 'error' && type !== 'warning') { return; }
    const source = ((m.location && m.location()) || {}).url || '';
    const rec = { at: tag, url: page.url(), type, text: m.text().slice(0, 300), source };
    // exactly the deliberate missing document's own 404, from that document: expected, recorded apart, never dropped
    if (type === 'error' && MISSING_DOC.test(m.text()) && source === site + MISSING_PATH) { report.expectedMissing.push(rec); return; }
    report.console.push(rec);
  });
  page.on('pageerror', (e) => report.exceptions.push({ at: tag, url: page.url(), text: String(e.message).slice(0, 300) }));
  page.on('requestfailed', (r) => { if (r.url().startsWith(site)) { report.failed.push({ at: tag, url: r.url(), error: (r.failure() || {}).errorText }); } });
  if (LIVE) {
    page.on('response', (r) => { if (r.url().startsWith(site + '/') || r.url() === site) { const k = String(r.status()); report.responses[k] = (report.responses[k] || 0) + 1; } });
  }
  return { ctx, page };
}

// what a page shows, read from the DOM the scripts leave
const read = (page) => page.evaluate(([retired]) => {
  const rl = new RegExp(retired);
  const links = [...document.querySelectorAll('a[href]')];
  const imgs = [...document.images];
  const hero = document.querySelector('.hero, .dhero');
  const hr = hero ? hero.getBoundingClientRect() : null;
  return {
    title: document.title,
    outside: links.filter((a) => new URL(a.href, location.href).origin !== location.origin).map((a) => a.getAttribute('href')),
    retired: links.map((a) => a.getAttribute('href')).filter((h) => rl.test(h)),
    nav: [...document.querySelectorAll('#nav a.nav-a')].map((a) => a.textContent.trim()),
    navHere: [...document.querySelectorAll('#nav a[aria-current="page"]')].map((a) => a.textContent.trim()),
    footCols: [...document.querySelectorAll('#foot-nav > div > h2')].map((h) => h.textContent.trim()),
    h1: document.querySelectorAll('h1').length,
    imgsOff: imgs.filter((i) => !i.complete || !i.naturalWidth).map((i) => i.getAttribute('src')),
    over: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
    enhanced: document.documentElement.classList.contains('enhanced'),
    firstScreen: hr ? { heroBottom: Math.round(hr.bottom), windowHeight: innerHeight, gap: Math.round(innerHeight - hr.bottom) } : null,
  };
}, [RETIRED_LINK.source]);

async function walkPage(browser, site, name, url, width) {
  const { ctx, page } = await context(browser, width, true, site);
  const at = `${name} @${width}`;
  const entry = { over: 0, wide: false, tabs: [] };
  try {
    const r = await page.goto(site + url, { waitUntil: 'load' });
    const want = name === 'notfound' ? 404 : 200;
    check(`${at}: status ${want}`, r && r.status() === want, r && r.status());
    await page.evaluate(async () => { for (let y = 0, i = 0; y < document.documentElement.scrollHeight && i < 30; y += innerHeight * 0.9, i++) { scrollTo(0, y); await new Promise((s) => setTimeout(s, 100)); } scrollTo(0, 0); });
    await page.waitForFunction(() => [...document.images].every((i) => i.complete), null, { timeout: 15000 }).catch(() => {});
    const s = await read(page);
    entry.over = s.over; entry.wide = s.over > 0; entry.firstScreen = s.firstScreen;
    check(`${at}: title names Venerabull Life; one h1`, /Venerabull Life/.test(s.title) && s.h1 === 1, { title: s.title, h1: s.h1 });
    check(`${at}: no link leaves the site or goes to a retired address`, !s.outside.length && !s.retired.length, { outside: s.outside, retired: s.retired });
    check(`${at}: the header's four directions, and only them`, JSON.stringify(s.nav) === JSON.stringify(DIRS) &&
      JSON.stringify(s.navHere) === JSON.stringify(DIRS.filter((d) => d.toLowerCase() === name)), { nav: s.nav, here: s.navHere });
    check(`${at}: the footer's one column, Life`, JSON.stringify(s.footCols) === '["Life"]', s.footCols);
    check(`${at}: every picture loaded`, !s.imgsOff.length, s.imgsOff);
    check(`${at}: no page wider than its window`, s.over === 0, s.over);
    check(`${at}: the script ran (enhanced)`, s.enhanced, s.enhanced);
    const v = await shot(page, `${name}-${width}`, false), f = await shot(page, `${name}-${width}`, true);
    entry.shot = v.file; entry.shotSettled = v.settled; entry.full = f.file; entry.fullSettled = f.settled;
    check(`${at}: the viewport and full-page captures settled (fonts, pictures, transitions)`, v.settled && f.settled, { viewport: v.settled, full: f.settled });
    if (width === 390) {
      await page.evaluate(() => scrollTo(0, 0));
      await page.click('#menu-b');
      await page.waitForSelector('#menu-s.is-open', { timeout: 5000 });
      const m = await page.evaluate(() => ({ hrefs: [...document.querySelectorAll('#menu-s a')].map((a) => a.getAttribute('href')),
        text: document.getElementById('menu-s').textContent, focus: document.activeElement && document.activeElement.id }));
      const root = name === 'notfound' ? '/' : '';
      const wantHrefs = ['index.html', 'spa.html', 'rest.html', 'experiences.html', 'longevity.html'].map((h) => root + h);
      check(`${at}: the menu sheet holds Home and the four directions, nothing else; focus on its close button`,
        JSON.stringify(m.hrefs) === JSON.stringify(wantHrefs) && m.focus === 'menu-x', m);
      const ms = await shot(page, `${name}-${width}-menu`, false);
      entry.menu = ms.file; entry.menuSettled = ms.settled;
      check(`${at}: the menu sheet's capture settled`, ms.settled, ms.settled);
      await page.keyboard.press('Escape');
      const closed = await page.waitForFunction(() => document.getElementById('menu-s').hidden && document.activeElement && document.activeElement.id === 'menu-b',
        null, { timeout: 3000 }).then(() => true).catch(() => false);
      check(`${at}: Escape closes the menu sheet, focus back on its button`, closed);
    }
  } catch (e) {
    check(`${at}: walk ended early`, false, String(e && e.message || e).split('\n')[0].slice(0, 300));
  } finally {
    (report.pages[name] = report.pages[name] || {})[width] = entry;
    await ctx.close();
  }
}

async function walkNoJs(browser, site, name, url, width) {
  const { ctx, page } = await context(browser, width, false, site);
  const tag = `nojs-${name}@${width}`;
  try {
    await page.goto(site + url, { waitUntil: 'load' });
    // scrolled and settled from here, never by an in-page timer (see scrollNoJs): the pictures load, then the page is read
    await scrollNoJs(page);
    await untilNoJs(page, PICTURES_DONE, 15000);
    const s = await bounded(read(page), 10000, 'read');
    const c = await shotNoJs(page, tag);
    report.nojs[tag] = { enhanced: s.enhanced, hiddenImgs: s.imgsOff.length, over: s.over, shot: c.file, settled: c.settled };
    check(`${tag}: the page as written, every picture, no overflow, its capture settled`,
      !s.enhanced && !s.imgsOff.length && s.over === 0 && c.settled, report.nojs[tag]);
  } catch (e) {
    report.nojs[tag] = { enhanced: true, hiddenImgs: -1, over: -1, error: String(e && e.message || e).slice(0, 200) };
    check(`${tag}: walk ended early`, false, report.nojs[tag].error);
  } finally { await ctx.close(); }
}

const cap = setTimeout(() => { report.error = 'hard cap reached'; report.finished = clock(); save(); console.error('HARD CAP'); process.exit(2); }, LIVE ? 10 * 60 * 1000 : HARD_CAP_MS);
let code = 0, browser, server;
try {
  const REV = arg('--rev'), BASE = arg('--base');
  OUT = path.resolve(arg('--out') || '');
  if (!REV || !BASE || !arg('--out')) { throw new Refuse('usage: node tools/verify-release.mjs [--live ORIGIN] --rev REV --base BASE --out DIR'); }
  const pin = JSON.parse(fs.readFileSync(path.join(REPO, 'acceptance', 'pin.json'), 'utf8'));
  const full = git('rev-parse', '--verify', REV + '^{commit}'), short = full.slice(0, 7);
  let PKG;
  if (LIVE) {
    // the live mode: the candidate's own files are site/ here (its tree is checked below), and the site is the published one
    if (LIVE !== pin.live.origin) { throw new Refuse(`--live ${LIVE} is not the pinned origin ${pin.live.origin}`); }
    if (git('status', '--porcelain', '--', 'site')) { throw new Refuse('site/ has uncommitted changes'); }
    PKG = fs.realpathSync(path.join(REPO, 'site'));
  } else {
    PKG = fs.realpathSync(path.join(REPO, 'release', `venerabulllife.com-${short}`));
    const scanFile = path.join(REPO, 'release', `venerabulllife.com-${short}.SCAN.json`);
    if (!fs.existsSync(scanFile) || JSON.parse(fs.readFileSync(scanFile, 'utf8')).pass !== true) { throw new Refuse('the package\'s scan is missing or failed: run release.py build first'); }
  }
  fs.mkdirSync(OUT, { recursive: true });
  Object.assign(report, { mode: LIVE ? 'live' : 'candidate', rev: full, base: git('rev-parse', '--verify', BASE + '^{commit}'), root: PKG });
  const files = [];
  (function walk(d) { for (const n of fs.readdirSync(d)) { const p = path.join(d, n); if (fs.statSync(p).isDirectory()) { walk(p); } else { files.push(path.relative(PKG, p).split(path.sep).join('/')); } } })(PKG);
  // the retired paths, from the published host commit: its paths, less the host's own files, that site/ at REV lacks;
  // their count and digest must be the pinned ones, so the list is exact without being written here
  if (report.base !== pin.host_base) { throw new Refuse(`--base ${report.base} is not the pinned host commit ${pin.host_base}`); }
  const names = (...a) => execFileSync('git', ['-C', REPO, 'ls-tree', '-r', '-z', '--name-only', ...a], { encoding: 'utf8' }).split('\0').filter(Boolean);
  const keep = new Set(pin.host_keep), now = new Set(names(full, '--', 'site/').map((f) => f.replace(/^site\//, '')));
  const retired = names(pin.host_base).filter((f) => !keep.has(f) && !now.has(f)).sort();
  const digest = crypto.createHash('sha256').update(retired.map((f) => f + '\n').join(''), 'utf8').digest('hex');
  Object.assign(report, { siteTree: git('rev-parse', full + ':site'), retiredFiles: retired.length, retiredDigest: digest });
  if (report.siteTree !== pin.site_tree) { throw new Refuse(`site/ at ${full} is tree ${report.siteTree}, not the pinned ${pin.site_tree}`); }
  if (retired.length !== pin.retired.count || digest !== pin.retired.sha256) {
    throw new Refuse(`the retired paths (${retired.length}, ${digest}) are not the pinned ones (${pin.retired.count}, ${pin.retired.sha256})`);
  }
  if (LIVE) { report.site = LIVE; } else { server = await serve(PKG); report.site = `http://127.0.0.1:${server.address().port}`; }
  const site = report.site;
  // a redirect is never followed: an address must answer by itself; live responses are counted here and in each page
  const GET = async (u) => { const r = await fetch(u, { redirect: 'manual' }); if (LIVE) { report.responses[String(r.status)] = (report.responses[String(r.status)] || 0) + 1; } return r; };

  // every packaged file, by its path, and the root address: the package's own bytes
  let okFiles = 0;
  for (const f of files.concat([''])) {
    const res = await GET(`${site}/${f.split('/').map(encodeURIComponent).join('/')}`);
    const body = Buffer.from(await res.arrayBuffer());
    const own = fs.readFileSync(path.join(PKG, f || 'index.html'));
    if (res.status === 200 && body.equals(own)) { okFiles++; } else {
      report.failed.push({ at: 'files', url: '/' + f, status: res.status, ...(LIVE ? { age: res.headers.get('age'), cache: res.headers.get('x-cache') } : {}) });
    }
  }
  report.files = { ok: okFiles, total: files.length + 1 };
  check(`every packaged file (${files.length}) and the root address answer 200 with the package's own bytes`, okFiles === files.length + 1, report.files);

  // every retired address: the not-found page, status 404
  // a static host ignores the query, so a neutral value tests the same thing as the old addresses' real values
  const addresses = retired.map((f) => '/' + f).concat(['/shop.html?c=x', '/shop.html?q=x', '/product.html?p=x', '/products/']);
  report.retired = addresses.length;
  // the retired paths are named in the log and report by their place in the pinned sorted list, never by path
  for (const [n, a] of addresses.entries()) {
    const res = await GET(site + a.split('/').map((s, i) => (i && !s.includes('?') ? encodeURIComponent(s) : s)).join('/'));
    const text = await res.text();
    const label = n < retired.length ? `retired path #${n + 1} of ${retired.length}` : `retired ${a}`;
    check(`${label}: status 404, the not-found page`, res.status === 404 && text.includes('Nothing is at this address.'), res.status);
  }

  if (!PW || !fs.existsSync(PW)) { throw new Refuse('PW_MODULE does not name an installed playwright-core/index.mjs: ' + PW); }
  const { chromium } = await import(pathToFileURL(PW).href);
  browser = await chromium.launch({ headless: true, timeout: 90000,
    args: ['--disable-background-networking', '--disable-component-update', '--disable-sync', '--no-pings', '--no-first-run', '--no-default-browser-check'] });
  report.browser = browser.version();
  for (const width of [1440, 390]) {
    for (const [name, url] of PAGES) { await walkPage(browser, site, name, url, width); save(); }
    for (const [name, url] of [['home', '/'], ['spa', '/spa.html'], ['notfound', MISSING_PATH]]) { await walkNoJs(browser, site, name, url, width); save(); }
  }
  const clean = !report.console.length && !report.exceptions.length && !report.failed.length && !report.external.length;
  check('no console error or warning (beyond the deliberate missing document\'s own 404), no exception, no failed request, no request to another origin', clean,
    { console: report.console.length, expectedMissing: report.expectedMissing.length, exceptions: report.exceptions.length, failed: report.failed.length, external: report.external.length });
  const unsettled = report.shots.filter((s) => !s.settled).map((s) => s.file);
  check(`every capture (${report.shots.length}) settled`, !unsettled.length, unsettled);
  if (LIVE) {
    check('every response from the live site was 200 or 404 (no redirect, no error)', Object.keys(report.responses).length > 0 &&
      Object.keys(report.responses).every((k) => k === '200' || k === '404'), report.responses);
  }
  code = report.interactions.every((x) => x.ok) ? 0 : 1;
} catch (e) {
  code = 2; report.error = String(e && e.message || e).split('\n')[0]; console.error('REFUSED: ' + report.error);
} finally {
  if (browser) { await browser.close().catch(() => {}); }
  if (server) { server.close(); }
  clearTimeout(cap);
  report.finished = clock();
  save();
  const pass = report.interactions.filter((x) => x.ok).length, fail = report.interactions.length - pass;
  console.log(`VERIFY exit=${code} pass=${pass} fail=${fail} retired=${report.retired} files=${report.files.ok}/${report.files.total} -> ${OUT}`);
  process.exit(code);
}
