"""Venerabull Life: build, scan and fingerprint the public release package for venerabulllife.com.

Run it with an isolated interpreter (-I), from anywhere:

  python3 -I tools/release.py preflight [--rev REV | --tree] [--keep DIR]  # the full scan on a temporary copy;
                                                                          # writes nothing to release/
  python3 -I tools/release.py build     [--rev REV]           # package + scan; exit 1 if the scan fails
  python3 -I tools/release.py scan      [--rev REV]           # re-scan an existing package
  python3 -I tools/release.py manifest  [--rev REV] [--verify <browse-report.json>]

The package is ONLY site/, taken from one committed revision (git blobs, never the working tree): every file under
site/ at that revision, at its path inside site/, written to release/venerabulllife.com-<shorthash>/. Nothing from
docs/, tools/ or anywhere else in the repository is copied. `preflight --tree` reads the working tree's site/ instead,
for a check before a commit; with --keep DIR (outside release/) it leaves the copy there so it can be served alone.

The scan fails on: a file that is not from site/ or whose bytes differ from the revision; a local path, temp folder,
file:// URL or loopback address; any email address or mailto:; a docs/ or tools/ path; a JPEG carrying Exif, XMP,
IPTC, any APP segment but JFIF and its colour profile, or a comment, and a PNG carrying text, time or Exif chunks; any
request to another origin; any link that leaves the site at all; a local reference that does not resolve inside the
package; and a page without its title, description, language, viewport or single h1 (the 404 page also asks not to be
indexed, and only it uses root-relative paths). The term scans (private notes, and terms the site must not carry) are
not in this copy: they are made privately on the same pinned tree.

After `build`, `manifest` writes release/venerabulllife.com-<rev>.MANIFEST.txt, with the report of
tools/verify-release.mjs (`manifest --verify <outdir>/report.json`). This copy runs on a hosted runner for one release
candidate (acceptance/pin.json); acceptance/run.sh runs it.
"""
import hashlib
import html
import html.parser
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RELEASE = os.path.join(REPO, 'release')
DOMAIN = 'venerabulllife.com'
TYPES = {'.html', '.css', '.js', '.jpg', '.png'}
TEXT_EXT = {'.html', '.css', '.js'}


# ---------------------------------------------------------------- sources: a committed revision, or the working tree

class Source:
    def __init__(self, rev=None):
        self.rev = rev       # None means the working tree

    def files(self):
        """Every file under site/, as a path inside site/."""
        if self.rev is None:
            root = os.path.join(REPO, 'site')
            out = []
            for d, _, ns in os.walk(root):
                out += [os.path.relpath(os.path.join(d, n), root).replace(os.sep, '/') for n in ns]
            return sorted(out)
        names = git('ls-tree', '-r', '--name-only', self.rev, '--', 'site/').split('\n')
        return sorted(n[len('site/'):] for n in names if n.startswith('site/'))

    def read(self, path):
        if self.rev is None:
            with open(os.path.join(REPO, 'site', path), 'rb') as fh:
                return fh.read()
        return git('show', f'{self.rev}:site/{path}', binary=True)

    def label(self):
        return self.rev or 'working tree'


def git(*args, binary=False):
    out = subprocess.run(['git', '-C', REPO, *args], check=True, capture_output=True)
    return out.stdout if binary else out.stdout.decode('utf-8')


# ---------------------------------------------------------------- references

class Refs(html.parser.HTMLParser):
    """Every URL-bearing attribute in a page, with its tag and rel; its h1s, title, metas and comments."""
    URL_ATTRS = {'src', 'href', 'srcset', 'poster', 'data', 'action', 'formaction', 'background', 'manifest',
                 'ping', 'xlink:href', 'longdesc', 'cite', 'imagesrcset'}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.items, self.styles, self.tags, self.ids, self.comments = [], [], [], set(), []
        self.inline_scripts = 0
        self._in = None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        self.tags.append((tag, a))
        if a.get('id'):
            self.ids.add(a['id'])
        rel = (a.get('rel') or '').lower()
        for k, v in attrs:
            if v is None:
                continue
            if k in self.URL_ATTRS:
                if k.endswith('srcset'):
                    for part in v.split(','):
                        if part.strip():
                            self.items.append((tag, k, part.strip().split()[0], rel))
                else:
                    self.items.append((tag, k, v.strip(), rel))
            if k == 'style':
                self.styles.append(v)
            if tag == 'meta' and k == 'content' and (a.get('http-equiv') or '').lower() == 'refresh':
                self.items.append((tag, 'refresh', v, rel))
        if tag in ('style', 'script'):
            self._in = tag
            if tag == 'script' and not a.get('src'):
                self.inline_scripts += 1

    def handle_endtag(self, tag):
        if tag == self._in:
            self._in = None

    def handle_data(self, data):
        if self._in == 'style':
            self.styles.append(data)

    def handle_comment(self, data):
        self.comments.append(data.strip())


CSS_URL = re.compile(r'url\(\s*([\'"]?)(.*?)\1\s*\)', re.I)
CSS_IMPORT = re.compile(r'@import\s+(?:url\()?\s*[\'"]?([^\'")\s;]+)', re.I)
JS_ASSET = re.compile(r'[\'"`]([^\'"`\s+]+\.(?:png|jpe?g|gif|webp|avif|svg|ico|css|js|mjs|json|html|woff2?|ttf|otf|mp4|webm))(?:[?#][^\'"`\s]*)?[\'"`]', re.I)


def classify(value):
    v = value.strip()
    if v.startswith('#'):
        return 'fragment'
    if re.match(r'^[a-z][a-z0-9+.-]*:', v, re.I) or v.startswith('//'):
        return 'data' if v.lower().startswith('data:') else 'external'
    return 'local'


def resolve(base_dir, value):
    """A local reference as a path inside the package, or None if it leaves the package root."""
    v = value.split('#', 1)[0].split('?', 1)[0]
    if v in ('', '/'):
        return 'index.html' if v == '/' else None
    p = v.lstrip('/') if v.startswith('/') else os.path.normpath(os.path.join(base_dir, v))
    p = p.replace('\\', '/')
    if p.startswith('../') or p == '..' or os.path.isabs(p):
        return None
    return p + 'index.html' if p.endswith('/') else p


# ---------------------------------------------------------------- metadata in images

def jpeg_metadata(b):
    """Every segment before the scan that is metadata: any APPn but APP0 JFIF and APP2 ICC_PROFILE, and comments."""
    if b[:2] != b'\xff\xd8':
        return ['not a JPEG']
    out, i = [], 2
    while i + 4 <= len(b):
        if b[i] != 0xFF:
            return out + ['broken segment chain']
        m = b[i + 1]
        if m == 0xDA:
            return out
        n = int.from_bytes(b[i + 2:i + 4], 'big')
        seg = b[i + 4:i + 2 + n]
        if m == 0xFE:
            out.append('comment')
        elif 0xE0 <= m <= 0xEF:
            ok = (m == 0xE0 and seg[:5] == b'JFIF\x00') or (m == 0xE2 and seg[:12] == b'ICC_PROFILE\x00')
            if not ok:
                ident = seg[:12].split(b'\x00')[0].decode('latin1', 'replace')
                out.append(f'APP{m - 0xE0} {ident or "segment"} ({n} bytes)')
        i += 2 + n
    return out + ['no scan found']


def png_chunks(b):
    if b[:8] != b'\x89PNG\r\n\x1a\n':
        return None
    i, out = 8, []
    while i + 8 <= len(b):
        n = int.from_bytes(b[i:i + 4], 'big')
        out.append(b[i + 4:i + 8].decode('latin1'))
        i += 12 + n
    return out


# ---------------------------------------------------------------- the scan

def scan(pkg, files, src):
    checks = []

    def add(cid, desc, hits, extra=None):
        c = {'id': cid, 'check': desc, 'hits': len(hits), 'pass': not hits}
        if hits:
            c['where'] = hits[:60]
        if extra is not None:
            c['detail'] = extra
        checks.append(c)

    raw = {f: open(os.path.join(pkg, f), 'rb').read() for f in files}
    text = {f: raw[f].decode('utf-8') for f in files if os.path.splitext(f)[1].lower() in TEXT_EXT}
    pages = {f: t for f, t in text.items() if f.endswith('.html')}
    parsed = {}
    for f, t in pages.items():
        p = Refs()
        p.feed(t)
        parsed[f] = p

    def grep(rx, where=None, flags=re.I):
        hits = []
        for f, t in (where if where is not None else text).items():
            for m in re.finditer(rx, t, flags):
                hits.append({'file': f, 'line': t.count('\n', 0, m.start()) + 1, 'detail': m.group(0)[:80]})
        return hits

    # 1. Only site/: every file is a file of site/ at the revision, byte for byte; nothing of docs/ or tools/; only
    #    pages, styles, scripts and pictures; no hidden files.
    want = src.files()
    bad = [{'file': f, 'detail': 'not in site/ at ' + src.label()} for f in sorted(set(files) - set(want))]
    bad += [{'file': f, 'detail': 'in site/ but missing from the package'} for f in sorted(set(want) - set(files))]
    add('only-site', f'The package holds exactly the files of site/ at {src.label()}, at their paths inside site/', bad)
    differ = [{'file': f, 'detail': 'bytes differ from ' + src.label()} for f in files if f in want and raw[f] != src.read(f)]
    add('bytes', f'Every file is byte-identical to site/<path> at {src.label()}', differ)
    bad = []
    for f in files:
        parts = f.split('/')
        if parts[0] in ('docs', 'tools', 'release') or any(x.startswith('.') for x in parts):
            bad.append({'file': f, 'detail': 'a private, tool or hidden path'})
        if os.path.splitext(f)[1].lower() not in TYPES:
            bad.append({'file': f, 'detail': 'not a page, style, script or picture'})
    bad += grep(r'(?<![\w-])(?:docs|tools)/[\w./-]*')
    add('no-docs-tools', 'Nothing from docs/ or tools/: no such file, no hidden file, only .html, .css, .js, .jpg and .png, and no served file names a docs/ or tools/ path', bad)

    # 2. Local paths and machine details, in text and (long patterns only) in binary bytes.
    lp = r'/Users/|/private/|file://|scratchpad|/tmp/|/var/folders|/Volumes/|~/|[A-Z]:\\\\|\\Users\\|localhost|127\.0\.0\.1|0\.0\.0\.0'
    lp_bin = rb'/Users/|/private/|file://|scratchpad|/var/folders|/Volumes/|\\Users\\|localhost|127\.0\.0\.1'
    hits = grep(lp)
    hits += [{'file': f, 'detail': 'local path bytes'} for f in files if f not in text and re.search(lp_bin, raw[f], re.I)]
    add('local-paths', 'No local path, temp folder, file:// URL, scratchpad, localhost or loopback address', hits)

    # 3. No email address of any kind, and no mailto:, tel: or sms: link.
    hits = grep(r'[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}') + grep(r'\b(?:mailto|tel|sms):')
    hits += [{'file': f, 'detail': 'email-shaped bytes'} for f in files if f not in text and re.search(rb'[A-Za-z0-9._%+-]{2,}@[A-Za-z0-9-]{2,}\.(?:com|net|org|io|dev)\b', raw[f])]
    add('email', 'No email address (none at all), and no mailto:, tel: or sms: link', hits)

    # 4. Development notes (the private-term scan is made privately on the same pinned tree).
    comments = sorted({c for p in parsed.values() for c in p.comments})
    odd = [{'file': f, 'detail': c[:80]} for f, p in parsed.items() for c in p.comments
           if not re.fullmatch(r'/?gen:[a-z-]+', c) and not c.startswith('Generated from assets/render.js.')]
    add('html-comments', 'HTML comments are only the generator\'s region marks (gen:…) and its one line, "Generated from assets/render.js. …"', odd, extra=comments)
    add('source-maps', 'No source map or sourceURL', grep(r'sourceMappingURL|sourceURL=') + [{'file': f} for f in files if f.endswith('.map')])

    # 5. Pictures carry no metadata.
    bad = []
    for f in files:
        e = os.path.splitext(f)[1].lower()
        if e == '.jpg':
            bad += [{'file': f, 'detail': x} for x in jpeg_metadata(raw[f])]
        elif e == '.png':
            ch = png_chunks(raw[f])
            extra = [c for c in (ch or []) if c in ('tEXt', 'zTXt', 'iTXt', 'tIME', 'eXIf', 'dSIG')]
            if ch is None or extra:
                bad.append({'file': f, 'detail': f'chunks {extra or "unreadable"}'})
    add('image-metadata', 'No JPEG carries Exif, XMP, IPTC, any other APP segment but JFIF and the colour profile, or a comment; no PNG carries text, time or Exif chunks', bad)

    # 6. No request to another origin, and no link that leaves the site.
    allowed = set()
    ext, links_out = [], {}
    for f, p in parsed.items():
        for tag, attr, value, rel in p.items:
            if classify(value) != 'external':
                continue
            if tag == 'a' and attr == 'href':
                links_out[value] = links_out.get(value, 0) + 1
                if value not in allowed:
                    ext.append({'file': f, 'detail': f'link leaves the site for {value}'})
            else:
                ext.append({'file': f, 'detail': f'<{tag} {attr}="{value}"> loads from another origin'})
        for s in p.styles:
            ext += [{'file': f, 'detail': f'style url({u})'} for _, u in CSS_URL.findall(s) if classify(u) == 'external']
    for f, t in text.items():
        for m in re.finditer(r'(?:[a-z][a-z0-9+.-]*:)?//[A-Za-z0-9.-]+[^\s\'"`<>)]*', t, re.I):
            u = m.group(0)
            if u.lower().startswith(('http://', 'https://', '//', 'ws://', 'wss://', 'ftp://')) and u not in allowed:
                ext.append({'file': f, 'line': t.count('\n', 0, m.start()) + 1, 'detail': f'outside address {u[:80]}'})
        if not f.endswith('.html'):
            ext += [dict(h, file=f) for h in grep(r'\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|importScripts|Worker|SharedWorker)\s*\(|\bimport\s*\(|serviceWorker|@import|@font-face|\bnew\s+Worker\b', {f: t})]
    ext += grep(r'<(?:iframe|object|embed|base|video|audio)\b', pages)
    ext += grep(r'\b(?:gtag|googletagmanager|google-analytics|plausible|umami|fathom|mixpanel|hotjar|segment\.io|clarity\.ms|fbq|matomo|localStorage|sessionStorage|indexedDB|document\.cookie)\b')
    add('external', 'No request to another origin (no outside src, srcset, stylesheet, icon, CSS url(), font, frame, media, fetch, socket, beacon, worker, import, analytics or storage), and no link that leaves the site',
        ext, extra={'links_out': links_out})

    # 7. Every local reference resolves inside the package.
    broken, seen = [], set()
    for f, p in parsed.items():
        base = os.path.dirname(f)
        for tag, attr, value, rel in p.items:
            k = classify(value)
            if k == 'fragment':
                if value[1:] and value[1:] not in p.ids:
                    broken.append({'file': f, 'detail': f'in-page link to a missing id: {value}'})
                continue
            if k != 'local':
                continue
            t = resolve(base, value)
            if t is None or t not in raw:
                broken.append({'file': f, 'detail': f'<{tag} {attr}="{value}"> does not resolve in the package'})
            else:
                seen.add(t)
                if '#' in value and t in parsed:
                    frag = value.split('#', 1)[1]
                    if frag and frag not in parsed[t].ids:
                        broken.append({'file': f, 'detail': f'link to a missing id on {t}: {value}'})
    for f, t in text.items():
        if f.endswith('.css'):
            for _, u in CSS_URL.findall(t):
                if classify(u) == 'local':
                    r = resolve(os.path.dirname(f), u)
                    (seen.add(r) if r in raw else broken.append({'file': f, 'detail': f'url({u}) does not resolve'}))
        if f.endswith('.js'):
            for u in JS_ASSET.findall(t):
                if classify(u) == 'local':
                    r = resolve('', u)
                    if r in raw:
                        seen.add(r)
    add('references', 'Every local href, src, srcset and CSS url() resolves to a file in the package (and every in-page or cross-page #id exists)', broken)
    unreferenced = sorted(f for f in files if f not in seen and f not in pages)
    checks.append({'id': 'unreferenced', 'check': 'Packaged files no page, stylesheet or script names literally: listed for review, not a gate',
                   'hits': len(unreferenced), 'pass': None, 'where': unreferenced})

    # 8. Each page fits its domain.
    fit, summary = [], {}
    for f, t in pages.items():
        p = parsed[f]
        title = re.findall(r'<title>(.*?)</title>', t, re.S)
        desc = re.findall(r'<meta name="description" content="([^"]*)">', t)
        robots = re.findall(r'<meta name="robots" content="([^"]*)">', t)
        if len(title) != 1 or 'Venerabull Life' not in title[0]:
            fit.append({'file': f, 'detail': f'title {title}'})
        if len(desc) != 1 or not desc[0].strip():
            fit.append({'file': f, 'detail': 'description missing'})
        if '<html lang="en">' not in t:
            fit.append({'file': f, 'detail': 'lang missing'})
        if '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">' not in t:
            fit.append({'file': f, 'detail': 'viewport missing'})
        if len(re.findall(r'<h1\b', t)) != 1:
            fit.append({'file': f, 'detail': 'not exactly one h1'})
        if (f == '404.html') != (robots == ['noindex']):
            fit.append({'file': f, 'detail': f'robots {robots}'})
        if re.search(r'<link rel="canonical"', t) and f == '404.html':
            fit.append({'file': f, 'detail': 'the 404 page has a canonical address'})
        if p.inline_scripts:
            fit.append({'file': f, 'detail': 'inline script'})
        for tag, attr, value, rel in p.items:
            if classify(value) == 'local' and value.startswith('/') and f != '404.html':
                fit.append({'file': f, 'detail': f'root-relative path outside the 404 page: {value}'})
            if f == '404.html' and classify(value) == 'local' and not value.startswith('/') and tag in ('link', 'script', 'img', 'a', 'form'):
                fit.append({'file': f, 'detail': f'relative path on the 404 page (breaks at depth): {value}'})
        summary[f] = {'title': title[0] if title else None, 'robots': robots or None}
    add('domain-fit', 'Each page: its title (naming Venerabull Life), description, language, viewport and one h1; only the 404 page asks not to be indexed and uses root-relative paths, so it works at any depth; no inline script', fit, extra=summary)

    gates = [c for c in checks if c['pass'] is not None]
    return {'source': src.label(), 'package': os.path.relpath(pkg, REPO) if pkg.startswith(REPO) else '(temporary copy)',
            'files': files, 'pass': all(c['pass'] for c in gates), 'gates': len(gates),
            'gates_passed': sum(1 for c in gates if c['pass']), 'checks': checks}


def report(result):
    for c in result['checks']:
        mark = 'PASS' if c['pass'] else ('REVIEW' if c['pass'] is None else 'FAIL')
        print(f"{mark:6} {c['id']:15} hits {c['hits']:<4} {c['check']}")
        if c['pass'] is False:
            for h in c.get('where', [])[:12]:
                print('         ', h)


# ---------------------------------------------------------------- commands

def rev_of(args):
    r = args[args.index('--rev') + 1] if '--rev' in args else 'HEAD'
    full = git('rev-parse', '--verify', f'{r}^{{commit}}').strip()
    return full, full[:7]


def pkg_dir(short):
    return os.path.join(RELEASE, f'{DOMAIN}-{short}')


def sha(b):
    return hashlib.sha256(b).hexdigest()


def copy_out(src, files, dest):
    for f in files:
        dst = os.path.join(dest, f)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        with open(dst, 'wb') as fh:
            fh.write(src.read(f))


def walk(pkg):
    return sorted(os.path.relpath(os.path.join(d, n), pkg).replace(os.sep, '/') for d, _, ns in os.walk(pkg) for n in ns)


def cmd_preflight(args):
    if '--tree' in args:
        src = Source(None)
    else:
        rev, short = rev_of(args)
        src = Source(rev)
    files = src.files()
    keep = os.path.abspath(args[args.index('--keep') + 1]) if '--keep' in args else None
    if keep and (keep == RELEASE or keep.startswith(RELEASE + os.sep)):
        raise SystemExit('--keep must be outside release/')
    if keep and os.path.exists(keep) and os.listdir(keep):
        raise SystemExit(f'--keep folder is not empty: {keep}')
    tmp = keep or tempfile.mkdtemp(prefix='vl-preflight-')
    try:
        copy_out(src, files, tmp)
        result = scan(tmp, walk(tmp), src)
    finally:
        if not keep:
            shutil.rmtree(tmp, ignore_errors=True)
    print(f'source   {src.label()}\nfiles    {len(files)}')
    report(result)
    if keep:
        print(f'copy kept at {keep}')
    print(f"PREFLIGHT {'PASS' if result['pass'] else 'FAIL'}: {result['gates_passed']} of {result['gates']} gates (nothing written to release/)")
    return 0 if result['pass'] else 1


def cmd_build(args):
    rev, short = rev_of(args)
    src = Source(rev)
    files = src.files()
    if not files:
        raise SystemExit(f'site/ is empty at {rev}')
    pkg = pkg_dir(short)
    if os.path.exists(pkg):
        shutil.rmtree(pkg)
    copy_out(src, files, pkg)
    print(f'revision {rev}\npackage  {pkg}\nfiles    {len(files)}, {sum(os.path.getsize(os.path.join(pkg, f)) for f in files)} bytes')
    return cmd_scan(args)


def cmd_scan(args):
    rev, short = rev_of(args)
    src = Source(rev)
    pkg = pkg_dir(short)
    if not os.path.isdir(pkg):
        raise SystemExit(f'no package at {pkg}: run build first')
    result = scan(pkg, walk(pkg), src)
    out = os.path.join(RELEASE, f'{DOMAIN}-{short}.SCAN.json')
    with open(out, 'w', encoding='utf-8') as fh:
        json.dump(result, fh, indent=2, ensure_ascii=False)
    report(result)
    print(f"SCAN {'PASS' if result['pass'] else 'FAIL'}: {result['gates_passed']} of {result['gates']} gates; record {out}")
    return 0 if result['pass'] else 1


def cmd_manifest(args):
    rev, short = rev_of(args)
    src = Source(rev)
    pkg = pkg_dir(short)
    sres = json.load(open(os.path.join(RELEASE, f'{DOMAIN}-{short}.SCAN.json'), encoding='utf-8'))
    # --verify names tools/verify-release.mjs's report; in this copy a manifest without one fails
    v = json.load(open(os.path.abspath(args[args.index('--verify') + 1]), encoding='utf-8')) if '--verify' in args else None
    # the binding to the candidate: this revision's site/ tree must be the pinned tree (same tree, same files byte for byte)
    pin = json.load(open(os.path.join(REPO, 'acceptance', 'pin.json'), encoding='utf-8'))
    tree = git('rev-parse', f'{rev}:site').strip()
    bound = tree == pin['site_tree'] and len(src.files()) == pin['site_files']
    when = subprocess.run(['date'], capture_output=True, text=True, check=True).stdout.strip()
    files = walk(pkg)
    if files != sres['files']:
        raise SystemExit('the package changed since its scan: run scan again')
    rows, total = [], 0
    for f in files:
        b = open(os.path.join(pkg, f), 'rb').read()
        if b != src.read(f):
            raise SystemExit(f'{f} differs from site/{f} at {rev}')
        total += len(b)
        rows.append(f'{sha(b)}  {len(b):>8}  {f}')
    # what the browser check found, serving this folder alone (when its report is given)
    vpass = None                     # None: no report given; False: a report given that fails or holds nothing
    if v is None:
        v = {}
    elif not v:
        vpass = False
    served_alone = os.path.realpath(v.get('root', '')) == os.path.realpath(pkg)
    inter = v.get('interactions', [])
    failed_i = [x['what'] for x in inter if not x.get('ok')]
    shots = sum(len(w) for w in v.get('pages', {}).values())
    over = [f'{p}@{w}' for p, ws in v.get('pages', {}).items() for w, e in ws.items() if e.get('over', 0) > 0 or e.get('wide')]
    unringed = sum(1 for ws in v.get('pages', {}).values() for e in ws.values() for t in e.get('tabs', []) if not t.get('ring') or not t.get('onScreen'))
    resp = v.get('responses', {})
    fetched = v.get('files', {})
    if v:
        vpass = bool(served_alone and not v.get('error') and inter and not failed_i and not v.get('console') and not v.get('exceptions')
                     and not v.get('failed') and not v.get('external') and not over and fetched.get('ok') == fetched.get('total') == len(files) + 1
                     and set(resp) <= {'200', '404'} and v.get('nojs') and all(not x.get('enhanced') and not x.get('hiddenImgs') and not x.get('over') for x in v['nojs'].values()))
    L = []
    L.append(f'Venerabull Life: release package for {DOMAIN}')
    L.append('')
    L.append(f'Folder:    release/{DOMAIN}-{short}/')
    L.append(f'Revision:  {rev}')
    L.append(f'Candidate: {pin["candidate"]}, site tree {pin["site_tree"]} ({pin["site_files"]} files; acceptance/pin.json)')
    L.append(f'Site tree: {tree} at this revision: ' + ('the pinned tree, so the candidate\'s files byte for byte' if bound else 'NOT the pinned tree: FAIL'))
    L.append(f'Written:   {when}')
    L.append(f'Hashes:    SHA-256, by {os.path.basename(sys.executable)} -I (tools/release.py manifest)')
    L.append('')
    L.append('Files (SHA-256, bytes, path inside the folder):')
    L += ['  ' + r for r in rows]
    L.append(f'  Total: {len(files)} files, {total} bytes')
    L.append('')
    L.append(f'The folder is site/ at revision {short} and nothing else: every file above is byte-identical to site/<path> at')
    L.append('that revision, and every file of site/ there is above. Nothing from docs/, tools/ or the rest of the repository.')
    L.append('')
    L.append(f"Scan: {'PASS' if sres['pass'] else 'FAIL'}, {sres['gates_passed']} of {sres['gates']} gates (record: release/{DOMAIN}-{short}.SCAN.json)")
    for c in sres['checks']:
        mark = 'PASS' if c['pass'] else ('review' if c['pass'] is None else 'FAIL')
        L.append(f"  {mark:6} {c['check']}" + (f" ({c['hits']}: {', '.join(c.get('where', []))})" if c['pass'] is None and c['hits'] else ''))
    L.append('')
    if vpass is None:
        L.append('Verification of this folder served alone: no report given: FAIL (run tools/verify-release.mjs and pass --verify).')
    else:
        L.append(f"Verification of this folder served alone: {'PASS' if vpass else 'FAIL'} ({v.get('started')} to {v.get('finished')})")
        L.append(f"  Server: {v.get('site')} serving only {os.path.relpath(v.get('root', ''), REPO) if served_alone else v.get('root')}, which answers any")
        L.append(f"  unknown address, at any depth, with 404.html and status 404, as a static host does; headless Chrome; {v.get('runner', 'tools/verify-release.mjs')}")
        L.append(f"  Every page at {', '.join(str(w) for w in v.get('widths', [320, 390, 768, 1024, 1440, 1920]))} wide: {shots} page-and-width captures; pages wider")
        L.append(f"  than their window: {len(over)}; tab stops without a visible ring or off the screen: {unringed}")
        L.append(f"  Interactions: {len(inter) - len(failed_i)} of {len(inter)} passed" + (f"; failed: {'; '.join(failed_i)}" if failed_i else ''))
        L.append(f"  Console errors and warnings: {len(v.get('console', []))}; exceptions: {len(v.get('exceptions', []))}; requests to another origin: {len(v.get('external', []))}")
        L.append(f"  Responses: {sum(resp.values())} in all, by status {json.dumps(resp, sort_keys=True)} (every 404 is a check's deliberate miss: the not-found page at a nested address, a retired address); retired addresses checked: {v.get('retired', 0)}; failed: {len(v.get('failed', []))}")
        L.append(f"  Every packaged file fetched by its path, and the root address /: {fetched.get('ok')} of {fetched.get('total')} answered 200")
        nj = v.get('nojs', {})
        njok = [k for k, x in nj.items() if not x.get('enhanced') and not x.get('hiddenImgs') and not x.get('over')]
        L.append(f"  With scripts turned off: {len(njok)} of {len(nj)} loads showed every picture and no page wider than its window.")
    L.append('')
    L.append('How to deploy (hosting and DNS are yours; nothing in this folder configures them):')
    L.append(f'  1. Upload the CONTENTS of release/{DOMAIN}-{short}/ to the web root of the host that serves {DOMAIN}, exactly as')
    L.append('     they are: the .html pages at the root, and the assets/ folder with its files. Keep the host\'s own CNAME and')
    L.append('     .nojekyll. Remove from the host only what this release retired (acceptance/pin.json pins their count and')
    L.append('     digest); the host\'s tree then equals this folder plus those two.')
    L.append('     There is no build step, no server code, no environment variable and no dependency. Serve over HTTPS.')
    L.append('  2. If the host needs it, set 404.html as the not-found page (GitHub Pages, Cloudflare Pages and Netlify use a')
    L.append('     404.html at the root by themselves). It uses root-relative addresses, so it shows styled at any depth.')
    L.append(f'  3. Then check it live: open https://{DOMAIN}/no/such/page (a nested address that does not exist) and see the')
    L.append('     styled "Nothing is at this address" page, with status 404; open the home page and each direction; and open')
    L.append(f'     https://{DOMAIN}/shop.html, /help.html, /product.html and one address under /products/: each must now be')
    L.append('     that not-found page.')
    L.append('  4. Compare a few file hashes above with what the host serves, if you like.')
    L.append('  No robots.txt is included: without one a site may be crawled in full. Only 404.html asks not to be indexed.')
    L.append('  The site makes no request to another origin, and no link leaves it.')
    L.append('')
    L.append('Left out on purpose (never uploaded): everything outside site/ at that revision, release/ itself and every report.')
    L.append('')
    out = os.path.join(RELEASE, f'{DOMAIN}-{short}.MANIFEST.txt')
    with open(out, 'w', encoding='utf-8') as fh:
        fh.write('\n'.join(L))
    print('\n'.join(L))
    print(out)
    return 0 if (sres['pass'] and vpass is True and bound) else 1


if __name__ == '__main__':
    a = sys.argv[1:]
    cmds = {'preflight': cmd_preflight, 'build': cmd_build, 'scan': cmd_scan, 'manifest': cmd_manifest}
    if not a or a[0] not in cmds:
        print(__doc__)
        sys.exit(2)
    sys.exit(cmds[a[0]](a[1:]))
