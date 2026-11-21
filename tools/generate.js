#!/usr/bin/env node
/* Venerabull Life — writes the static pages from the shared markup.

   site/assets/render.js is the only place shared markup lives. This reads it
   in a sandbox and writes:

     site/404.html             the page a static host serves for any unknown
                               address, at any depth: root-relative paths only
     the hand-written pages    only the regions between <!--gen:NAME--> and
                               <!--/gen:NAME--> markers:
       every page              top (skip link, header) and foot
       index.html              the four directions
       spa, rest, experiences, the other three directions
       longevity

   Deterministic: no dates, no randomness, so running it twice writes the same
   bytes. After any change to the markup, run it again:

     node tools/generate.js          write the pages
     node tools/generate.js --check  write nothing; exit 1 if any page differs
                                     from what the markup says it should be

   This copy verifies one release candidate on a hosted runner (acceptance/pin.json). */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SITE = path.join(__dirname, '..', 'site');
const CHECK = process.argv.includes('--check');
const read = (f) => fs.readFileSync(path.join(SITE, f), 'utf8');

const ctx = { window: {} };
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(read('assets/render.js'), ctx, { filename: 'assets/render.js' });
const R = ctx.window.LIFE_RENDER;
if (!R) { console.error('GENERATE  could not read the markup'); process.exit(2); }
const e = R.esc;
/* the served pages name no private folder (docs/, tools/): the release scan and tools/check.py hold them to it */
const STAMP = '<!-- Generated from assets/render.js. Edit the markup, then run the generator again. -->';

/* ── the frame every page shares ───────────────────────────────────────── */
function head(root, title, desc, extra) {
  return '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
    '<title>' + e(title) + '</title>\n' +
    '<meta name="description" content="' + e(desc) + '">\n' + (extra || '') +
    '<meta name="theme-color" content="#FBF9F4">\n' +
    '<link rel="icon" href="' + root + 'assets/venerabull-mark.png">\n' +
    '<link rel="stylesheet" href="' + root + 'assets/life.css">\n</head>\n';
}
function top(root, cur) {
  return '\n<a class="skip" href="#main">Skip to the content</a>\n<div class="progress" id="progress" aria-hidden="true"></div>\n' +
    R.header(root, cur);
}
function scripts(root) {
  return '<script src="' + root + 'assets/render.js"></script>\n<script src="' + root + 'assets/life.js"></script>\n';
}

/* The not-found page a static host serves for any unknown address, at any
   depth (/a/b/c.html as much as /x.html), so it alone uses root-relative paths:
   the stylesheet, scripts, pictures and links all start at the site's top. */
function notFoundPage() {
  const root = '/';
  return head(root, 'Page not found — Venerabull Life', 'There is no page at this address.',
      '<meta name="robots" content="noindex">\n') +
    '<body data-page="notfound" data-root="/">\n' + STAMP + top(root, '') + '\n<main id="main" tabindex="-1">\n' +
    '  <div class="wrap">\n' +
    '    <section class="page-h lost" aria-labelledby="lost-h">\n      <p class="eyebrow">Page not found</p>\n' +
    '      <h1 id="lost-h">Nothing is at this address.</h1>\n' +
    '      <p class="lede">The link may be mistyped, or the page may have moved.</p>\n' +
    '      <p class="lost-a"><a class="btn btn-1" href="/index.html">Venerabull Life home</a></p>\n' +
    '    </section>\n' +
    '  </div>\n</main>\n\n' +
    R.footer(root, '') + '\n' + scripts(root) + '</body>\n</html>\n';
}

/* ── the hand-written pages: which page each is, and its written regions ── */
function others(cur) {
  return R.DIRECTIONS.filter((d) => d.id !== cur).map((d) =>
    '<a class="dlink" href="' + d.href + '">' +
      '<span class="dlink-m">' + R.pic(d.img, '', { sizes: '(min-width: 900px) 420px, 100vw', alt: '', pos: d.pos }) + '<span class="cap">Illustration</span></span>' +
      '<span class="dlink-b"><span class="dlink-t">' + e(d.name) + '</span>' + R.status(d.status) +
      '<span class="dlink-l">' + e(d.line) + '</span><span class="dlink-go">See the direction ' + R.ICON.arrow + '</span></span></a>').join('');
}
/* the home page's four directions: the first and the last wide, the two between beside each other */
function going() {
  return R.DIRECTIONS.map((d, i) =>
    '<a class="going-p going-' + d.id + '" href="' + d.href + '">' +
      '<span class="going-m">' + R.pic(d.img, '', { sizes: i === 0 || i === 3 ? '(min-width: 1400px) 1320px, 94vw' : '(min-width: 1400px) 652px, (min-width: 760px) 47vw, 94vw', alt: '', pos: d.pos }) + '</span>' +
      '<span class="going-c"><span class="going-t">' + e(d.name) + '</span>' + R.status(d.status) +
      '<span class="going-l">' + e(d.line) + '</span><span class="going-go">See the direction ' + R.ICON.arrow + '</span></span>' +
      '<span class="cap">Illustration</span></a>').join('');
}
const COMMON = { top: (cur) => top('', cur), foot: (cur) => '\n' + R.footer('', cur) };
const PAGES = {
  'index.html': { cur: 'home', regions: { 'home-going': () => going() } },
  'spa.html': { cur: 'spa', regions: { 'dir-others': () => others('spa') } },
  'rest.html': { cur: 'rest', regions: { 'dir-others': () => others('rest') } },
  'experiences.html': { cur: 'experiences', regions: { 'dir-others': () => others('experiences') } },
  'longevity.html': { cur: 'longevity', regions: { 'dir-others': () => others('longevity') } }
};
function fill(file, src) {
  const page = PAGES[file];
  let out = src;
  const all = Object.assign({}, COMMON, page.regions);
  for (const [name, fn] of Object.entries(all)) {
    const a = '<!--gen:' + name + '-->', b = '<!--/gen:' + name + '-->';
    const i = out.indexOf(a), j = out.indexOf(b);
    if (i < 0 || j < i || out.indexOf(a, i + 1) >= 0) { throw new Error(file + ': region "' + name + '" is missing or repeated'); }
    out = out.slice(0, i + a.length) + fn(page.cur) + out.slice(j);
  }
  const stray = (out.match(/<!--gen:([\w-]+)-->/g) || []).filter((m) => !(m.slice(8, -3) in all));
  if (stray.length) { throw new Error(file + ': unknown region ' + stray.join(', ')); }
  return out;
}

/* ── write, or check ───────────────────────────────────────────────────── */
const want = new Map();
want.set('404.html', notFoundPage());
for (const f of Object.keys(PAGES)) { want.set(f, fill(f, read(f))); }

/* every .html page in site/ is one this writes or fills: a page left over from the shop is drift */
const stray = fs.readdirSync(SITE).filter((f) => f.endsWith('.html') && !want.has(f));
const leftover = fs.existsSync(path.join(SITE, 'products')) ? ['products/'] : [];

let drift = 0;
for (const [f, html] of want) {
  const file = path.join(SITE, f);
  const now = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  if (now === html) { continue; }
  drift++;
  if (CHECK) { console.log('  differs: site/' + f); continue; }
  fs.writeFileSync(file, html);
  console.log('  wrote:   site/' + f);
}
for (const f of stray.concat(leftover)) { drift++; console.log('  not a page of the site: site/' + f + (CHECK ? '' : ' (left in place; remove it by hand)')); }
console.log(CHECK
  ? (drift ? 'GENERATE  ' + drift + ' page(s) differ from the markup: run node tools/generate.js' : 'GENERATE  every page matches the markup (' + want.size + ' pages)')
  : 'GENERATE  ' + want.size + ' pages, ' + drift + ' changed');
process.exitCode = CHECK && drift ? 1 : 0;
