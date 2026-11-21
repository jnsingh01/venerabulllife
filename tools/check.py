"""Venerabull Life - static checks for site/. Reads files; runs no page, server or browser.

    python3 -I tools/check.py

This copy runs on a hosted runner for one release candidate (acceptance/pin.json). What it checks:

0. the generator agrees with the markup (node tools/generate.js --check), and both scripts parse
1. the site is exactly its six pages (the not-found page counted), its four assets and the site's own pictures: no
   shop, product, buying help, old product address, catalogue or product photo is served
2. (not in this copy) the term scan of site/, text and file names: it is made privately on the same pinned tree
3. every HTML page parses with balanced tags, no duplicate ids, exactly one h1, a title naming Venerabull Life and a
   description; no form; no inline script
4. every local href/src/srcset resolves to a file, and every #fragment to an id on its page; nothing loads from
   another host, and no link leaves the site
5. every page carries the frame: the header's four directions and the menu, the footer's Life links, and the two
   scripts (render.js, then life.js); 404.html alone uses root-relative paths (it is served at any depth)
6. the directions are shown, never offered: each carries its status, and nothing on a page offers a price or a booking
7. every <img> has its file's true width and height, and its srcset names files that exist
"""
import html, html.parser, os, re, subprocess, sys, urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.normpath(os.path.join(HERE, '..', 'site'))
PAGES = ['index.html', 'spa.html', 'rest.html', 'experiences.html', 'longevity.html', '404.html']
ASSETS = ['assets/life.css', 'assets/life.js', 'assets/render.js', 'assets/venerabull-mark.png']
PICS = ['life-hero', 'dim-mind', 'dim-body', 'dim-heart', 'dim-soul', 'spa-hero', 'spa-detail', 'rest-hero', 'rest-detail',
        'exp-hero', 'exp-detail', 'lon-hero', 'lon-detail']
DIRECTIONS = [('spa.html', 'Spa', 'Not yet open'), ('rest.html', 'Rest', 'Not yet available'),
              ('experiences.html', 'Experiences', 'Not yet available'), ('longevity.html', 'Longevity', 'Not yet available')]
VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'}
notes, fails = [], []

def ok(name, cond, detail=''):
    (notes if cond else fails).append(name + ('' if cond else '  [' + str(detail)[:240] + ']'))

class Page(html.parser.HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack, self.ids, self.err, self.refs, self.imgs, self.scripts = [], [], [], [], [], []
        self.h1, self.forms, self.inline, self.title, self.meta, self._t = 0, 0, 0, '', {}, False
    def handle_starttag(self, t, a):
        d = dict(a)
        if 'id' in d: self.ids.append(d['id'])
        for k in ('href', 'src'):
            if d.get(k): self.refs.append((t, k, d[k]))
        if d.get('srcset'):
            for part in d['srcset'].split(','):
                if part.strip(): self.refs.append((t, 'srcset', part.strip().split()[0]))
        if t == 'form': self.forms += 1
        if t == 'script':
            if d.get('src'): self.scripts.append(d['src'])
            else: self.inline += 1
        if t == 'meta' and d.get('name'): self.meta[d['name']] = d.get('content', '')
        if t == 'title': self._t = True
        if t == 'h1': self.h1 += 1
        if t == 'img': self.imgs.append(d)
        if t not in VOID: self.stack.append(t)
    def handle_startendtag(self, t, a):
        self.handle_starttag(t, a)
        if t not in VOID: self.handle_endtag(t)
    def handle_endtag(self, t):
        if t == 'title': self._t = False
        if t in VOID: return
        if self.stack and self.stack[-1] == t: self.stack.pop()
        else: self.err.append(t)
    def handle_data(self, d):
        if self._t: self.title += d

def jpeg_size(path):
    with open(path, 'rb') as fh:
        b = fh.read()
    i = 2
    while i < len(b):
        if b[i] != 0xFF: i += 1; continue
        m = b[i + 1]
        if m in (0xC0, 0xC1, 0xC2, 0xC3):
            return int.from_bytes(b[i + 7:i + 9], 'big'), int.from_bytes(b[i + 5:i + 7], 'big')
        if m in (0xD8, 0x01) or 0xD0 <= m <= 0xD7: i += 2; continue
        i += 2 + int.from_bytes(b[i + 2:i + 4], 'big')
    return None
def png_size(path):
    with open(path, 'rb') as fh:
        b = fh.read(24)
    return int.from_bytes(b[16:20], 'big'), int.from_bytes(b[20:24], 'big')
def img_size(path):
    return png_size(path) if path.endswith('.png') else jpeg_size(path)

# 0. the generator agrees with the markup, and the scripts parse
r = subprocess.run(['node', os.path.join(HERE, 'generate.js'), '--check'], capture_output=True, text=True)
ok('generate.js --check: every page matches the markup', r.returncode == 0, (r.stdout + r.stderr).strip())
for js in ('assets/render.js', 'assets/life.js'):
    r = subprocess.run(['node', '--check', os.path.join(SITE, js)], capture_output=True, text=True)
    ok('node --check ' + js, r.returncode == 0, r.stderr)

# 1. exactly the site's own files
files = sorted(os.path.relpath(os.path.join(d, n), SITE).replace(os.sep, '/') for d, _, ns in os.walk(SITE) for n in ns)
want = set(PAGES) | set(ASSETS) | {f'assets/img/{p}{s}.jpg' for p in PICS for s in ('', '-800')}
ok('site/ holds exactly its six pages, its four assets and its own pictures', set(files) == want,
   {'extra': sorted(set(files) - want), 'missing': sorted(want - set(files))})

text = {}
for f in files:
    if os.path.splitext(f)[1] in ('.html', '.css', '.js'):
        with open(os.path.join(SITE, f), encoding='utf-8') as fh:
            text[f] = fh.read()

parsed = {}
for f in PAGES:
    p = Page()
    p.feed(text[f])
    parsed[f] = p
    # 3. each page well formed and fitting its domain
    dup = sorted({i for i in p.ids if p.ids.count(i) > 1})
    ok(f + ': balanced tags, no duplicate id, one h1', not p.err and not p.stack and not dup and p.h1 == 1,
       {'unbalanced': p.err[:6], 'open': p.stack[:6], 'dup': dup, 'h1': p.h1})
    ok(f + ': a title naming Venerabull Life, and a description', 'Venerabull Life' in p.title and bool(p.meta.get('description', '').strip()),
       (p.title, p.meta.get('description')))
    ok(f + ': no form and no inline script', p.forms == 0 and p.inline == 0, (p.forms, p.inline))

    # 4. references resolve; nothing leaves the site
    base = os.path.dirname(f)
    bad = []
    for tag, attr, v in p.refs:
        u = urllib.parse.urlsplit(v)
        if u.scheme or u.netloc:
            bad.append(f'{tag} {attr} leaves the site: {v}')
            continue
        if not u.path:
            if u.fragment and u.fragment not in p.ids: bad.append(f'missing #{u.fragment}')
            continue
        target = u.path.lstrip('/') if u.path.startswith('/') else os.path.normpath(os.path.join(base, u.path)).replace(os.sep, '/')
        if target not in files: bad.append(f'{tag} {attr} does not resolve: {v}')
        elif u.fragment and target.endswith('.html') and target in parsed and u.fragment not in parsed[target].ids:
            bad.append(f'missing #{u.fragment} on {target}')
        if f == '404.html' and not u.path.startswith('/'): bad.append(f'relative path on the 404 page: {v}')
        if f != '404.html' and u.path.startswith('/'): bad.append(f'root-relative path outside the 404 page: {v}')
    ok(f + ': every reference resolves; nothing loads from or links to another host', not bad, bad[:8])

    # 5. the frame
    t = text[f]
    root = '/' if f == '404.html' else ''
    frame = [f'<a class="nav-a{" is-here" if f == h else ""}" href="{root}{h}"' for h, _, _ in DIRECTIONS] + \
            ['id="menu-a"', '<footer class="foot" id="foot">', '<nav class="foot-nav" id="foot-nav"']
    missing = [x for x in frame if x not in t]
    ok(f + ': the header\'s four directions, the menu and the footer', not missing, missing)
    ok(f + ': the two scripts, render.js then life.js', p.scripts == [root + 'assets/render.js', root + 'assets/life.js'], p.scripts)

    # 6. shown, never offered
    plain = html.unescape(re.sub(r'<[^>]+>', ' ', re.sub(r'<(script|style)\b.*?</\1>', ' ', t, flags=re.S)))
    ok(f + ': no price and no booking offered', not re.search(r'\$\s?\d|\bbook (now|a|your)\b|\badd to (cart|bag)\b|\bcheckout\b', plain, re.I),
       re.findall(r'.{0,30}(?:\$\s?\d|book now|checkout).{0,30}', plain, re.I)[:4])
    for h, name, st in DIRECTIONS:
        ok(f'{f}: the footer shows {name} as "{st}"', f'href="{root}{h}"' in t and f'<span>{name}</span><small>{st}</small>' in t, name)

    # 7. pictures: true sizes, real srcset files
    for im in p.imgs:
        src = im.get('src', '')
        path = os.path.join(SITE, src.lstrip('/') if src.startswith('/') else os.path.normpath(os.path.join(base, src)))
        size = img_size(path) if os.path.exists(path) else None
        if src.endswith('venerabull-mark.png'):
            # the bull mark is drawn small (30 x 24) from its large master: its proportions are held, not its pixels
            w, h = (int(im.get('width') or 0), int(im.get('height') or 0))
            ok(f'{f}: {src} keeps the mark\'s proportions', size and w and h and abs(w / h - size[0] / size[1]) <= 0.02, (size, w, h))
        else:
            ok(f'{f}: {src} has its true width and height', size and (str(size[0]), str(size[1])) == (im.get('width'), im.get('height')),
               (size, im.get('width'), im.get('height')))

for f, name, st in DIRECTIONS:
    ok(f'{f}: its status "{st}" is on the page', st in text[f], name)

for n in notes: print('ok    ' + n)
for n in fails: print('FAIL  ' + n)
print(f"CHECK  {len(notes)} passed, {len(fails)} failed")
sys.exit(1 if fails else 0)
