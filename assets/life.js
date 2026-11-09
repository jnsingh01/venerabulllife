/* Venerabull Life — the behaviour of every page.

   One file, no framework, no build. The pages arrive complete as HTML (the
   product pages, the shop's cards and the frame of every page are written by
   the site's generator from assets/catalog.js); this enhances them: the Shop
   panel and the phone menu, header search, filters, search and sort on the
   shop (kept in the address, so Back and Forward step through it), the rows'
   arrow buttons, the category pictures on the home page, and on a product
   page the gallery, the full-screen viewer, the folding sections and the
   phone buy bar. Markup it draws
   comes from assets/render.js, the same functions that wrote the HTML.
   Motion is functional only: it confirms a hover, a press or a choice, and it
   shows loading only while something is really loading. Reduced motion turns
   it off (the stylesheet does the rest). */
(function () {
  'use strict';

  var L = window.LIFE || null;
  var doc = document;
  var REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var HOVER = !!(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches);
  var PAGE = doc.body.getAttribute('data-page');

  var R = window.LIFE_RENDER || null;
  var ROOT = doc.body.getAttribute('data-root') || '';
  /* Without the catalogue or the markup there is nothing to enhance with, and
     the page as written (every product, price, date and eBay link) is the whole
     experience: nothing is removed, hidden or animated. */
  if (!L || !R) { return; }

  /* The old shop lived at index.html: its filtered addresses go to the shop. */
  if (PAGE === 'home') {
    var old = new URLSearchParams(location.search);
    if (['c', 'q', 'flavor', 'source', 'label', 'sort'].some(function (k) { return old.has(k); }) || location.hash === '#compare' || location.hash === '#how') {
      location.replace('shop.html' + location.search + location.hash);
      return;
    }
  }

  doc.documentElement.classList.add('enhanced');
  function $(s, el) { return (el || doc).querySelector(s); }
  function $$(s, el) { return Array.prototype.slice.call((el || doc).querySelectorAll(s)); }
  function frame(fn) { return window.requestAnimationFrame ? window.requestAnimationFrame(fn) : setTimeout(fn, 16); }
  function visible(el) { return !!el && el.offsetParent !== null; }
  function focusables(box) {
    return $$('a[href], button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])', box).filter(visible);
  }
  var esc = R.esc;
  var ICON = R.ICON;
  function counts() { return R.counts(L); }
  function catOf(id) { return R.catOf(L, id); }
  var items = R.items;
  var CUR = { home: 'home', shop: 'shop', product: 'product', resolve: 'resolve', help: 'help', spa: 'spa', rest: 'rest', experiences: 'experiences' }[PAGE] || '';

  /* ── the loading bar: on while another page is really loading ─────────── */
  var bar = $('#progress');
  function busy(on) { if (bar) { bar.classList.toggle('is-on', !!on); } }
  doc.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) { return; }
    if (a.target === '_blank' || a.hasAttribute('download')) { return; }
    var u;
    try { u = new URL(a.getAttribute('href'), location.href); } catch (er) { return; }
    if (u.protocol !== location.protocol || u.host !== location.host) { return; }
    if (u.pathname === location.pathname && u.search === location.search) { return; } /* only the hash changes */
    busy(true);
  });
  window.addEventListener('pageshow', function () { busy(false); });

  /* ── the header gains its shadow once the page scrolls (it stays opaque) ── */
  var top = $('#top');
  function onScroll() { if (top) { top.classList.toggle('is-scrolled', (window.scrollY || 0) > 40); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* the pieces of the page a modal sheet makes unreachable while it is open */
  function background() { return [$('.skip'), $('.notice'), $('#top'), $('#main'), $('.foot')].filter(Boolean); }

  /* ── header search: a field on wide screens, a button that opens it on others ── */
  var q = $('#q'), sform = $('#search'), st = $('#search-t');
  /* the pages with a search field of their own: the shop, home and not-found */
  var own = $({ shop: '#sq', home: '#hq', notfound: '#lq' }[PAGE] || '#none');
  function searchOpen(on) {
    if (!top || !st) { return; }
    top.classList.toggle('is-searching', on);
    st.setAttribute('aria-expanded', on ? 'true' : 'false');
    if (on && q) { q.focus(); }
  }
  if (st) {
    st.addEventListener('click', function () {
      /* On a page with its own search field (the shop, home, not-found), that
         field is the search: the button goes to it rather than opening a
         second field under the header. */
      if (own && visible(own)) {
        own.scrollIntoView({ block: 'center', behavior: REDUCED ? 'auto' : 'smooth' });
        own.focus({ preventScroll: true });
        return;
      }
      searchOpen(!top.classList.contains('is-searching'));
    });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && top.classList.contains('is-searching') && sform.contains(doc.activeElement)) { searchOpen(false); st.focus(); }
    });
    doc.addEventListener('click', function (e) {
      if (top.classList.contains('is-searching') && !sform.contains(e.target) && !st.contains(e.target)) { searchOpen(false); }
    });
  }
  /* "/" goes to search from anywhere that isn't already a field */
  doc.addEventListener('keydown', function (e) {
    if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) { return; }
    var t = doc.activeElement && doc.activeElement.tagName;
    if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT' || (doc.activeElement && doc.activeElement.isContentEditable)) { return; }
    var target = own && visible(own) ? own : (visible(q) ? q : null);
    if (!target && visible(st)) { e.preventDefault(); searchOpen(true); return; }
    if (!target) { return; }
    e.preventDefault();
    target.focus();
  });

  /* a field's long placeholder is cut off on the narrowest phones: there it
     says less, and all of it */
  (function () {
    var fs = $$('input[data-ph-short]'), mq = window.matchMedia ? window.matchMedia('(max-width: 399px)') : null;
    if (!fs.length || !mq) { return; }
    fs.forEach(function (f) { f.setAttribute('data-ph-long', f.placeholder); });
    function fit() { fs.forEach(function (f) { f.placeholder = f.getAttribute(mq.matches ? 'data-ph-short' : 'data-ph-long'); }); }
    if (mq.addEventListener) { mq.addEventListener('change', fit); } else if (mq.addListener) { mq.addListener(fit); }
    fit();
  }());

  /* ── photos: a quiet shimmer until each one lands, a plain note if not ─── */
  function watch(ph) {
    var im = $('img', ph);
    if (!im) { return; }
    function ok() { ph.classList.remove('is-pending', 'is-failed'); ph.classList.add('is-loaded'); }
    function bad() { ph.classList.remove('is-pending'); ph.classList.add('is-failed'); }
    im.addEventListener('load', ok);
    im.addEventListener('error', bad);
    if (im.complete) { if (im.naturalWidth) { ok(); } else if (im.getAttribute('src')) { bad(); } }
    else { pend(ph, im); }
  }
  /* A photo still on its way shimmers only once it is in view: a lazy photo
     far down the page or off to the side of a row hasn't been asked for yet,
     so nothing animates for it unseen. */
  function pend(ph, im) {
    if (!('IntersectionObserver' in window)) { mark(); return; }
    var io = new IntersectionObserver(function (es) {
      if (!es.some(function (x) { return x.isIntersecting; })) { return; }
      io.disconnect();
      if (!im.complete) { mark(); }
    });
    io.observe(ph);
    function mark() { ph.classList.add('is-pending'); }
  }
  /* The site's own pictures sit on a tonal ground; if one fails to load, the
     ground shows clean, never a broken-image mark or its alt text. */
  function quiet(im) {
    function f() { im.classList.add('is-failed'); }
    im.addEventListener('error', f);
    if (im.complete && !im.naturalWidth && im.getAttribute('src')) { f(); }
  }

  /* ── the Shop panel on wide screens: a disclosure of links, keyboard first ── */
  var SHOP = null;
  var scrim = null;
  function buildPanel() {
    var a = $('#shop-a');
    if (!a) { return; }
    var li = a.parentNode;
    var b = doc.createElement('button');
    b.type = 'button';
    b.className = 'nav-b' + (a.classList.contains('is-here') ? ' is-here' : '');
    b.id = 'shop-b';
    b.setAttribute('aria-expanded', 'false');
    b.setAttribute('aria-controls', 'shop-p');
    b.innerHTML = 'Shop ' + ICON.chev;
    li.replaceChild(b, a);
    li.insertAdjacentHTML('beforeend', R.shopPanel(L, ROOT));
    var p = $('#shop-p');
    scrim = doc.createElement('div');
    scrim.className = 'mscrim';
    doc.body.appendChild(scrim);
    /* Closed, the panel is inert as well as hidden, from the first frame of its
       fade, so Tab can never land on a link that is on its way out. */
    p.setAttribute('inert', '');
    var timer = 0;
    function isOpen() { return p.classList.contains('is-open'); }
    function links() { return $$('a', p); }
    function open(first) {
      clearTimeout(timer);
      if (!isOpen()) {
        p.removeAttribute('inert');
        p.classList.add('is-open');
        scrim.classList.add('is-open');
        top.classList.add('is-open');
        b.setAttribute('aria-expanded', 'true');
      }
      if (first) { var f = links()[0]; if (f) { f.focus(); } }
    }
    function close(back) {
      clearTimeout(timer);
      if (!isOpen()) { return; }
      p.classList.remove('is-open');
      p.setAttribute('inert', '');
      scrim.classList.remove('is-open');
      top.classList.remove('is-open');
      b.setAttribute('aria-expanded', 'false');
      if (back) { b.focus(); }
    }
    b.addEventListener('click', function () { if (isOpen()) { close(false); } else { open(false); } });
    b.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); open(true); }
    });
    /* hover intent: a pointer resting on Shop opens it; leaving both closes it */
    if (HOVER) {
      li.addEventListener('mouseenter', function () { clearTimeout(timer); timer = setTimeout(function () { open(false); }, 110); });
      li.addEventListener('mouseleave', function () { clearTimeout(timer); timer = setTimeout(function () { close(false); }, 220); });
    }
    /* An ordinary disclosure: Tab moves from the Shop button through the
       panel's links and on to the rest of the header, and the panel closes as
       focus leaves it. Escape closes it and returns to Shop; the arrow keys,
       Home and End move within it. */
    li.addEventListener('keydown', function (e) {
      if (!isOpen()) { return; }
      var all = [b].concat(links()), i = all.indexOf(doc.activeElement);
      if (e.key === 'Escape') { e.preventDefault(); close(true); return; }
      if (e.key === 'Tab' || i <= 0) { return; }
      var ls = links(), k = ls.indexOf(doc.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); ls[(k + 1) % ls.length].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); ls[(k - 1 + ls.length) % ls.length].focus(); }
      else if (e.key === 'Home') { e.preventDefault(); ls[0].focus(); }
      else if (e.key === 'End') { e.preventDefault(); ls[ls.length - 1].focus(); }
    });
    li.addEventListener('focusout', function (e) { if (e.relatedTarget && !li.contains(e.relatedTarget)) { close(false); } });
    scrim.addEventListener('click', function () { close(false); });
    doc.addEventListener('click', function (e) { if (!li.contains(e.target)) { close(false); } });
    window.addEventListener('pagehide', function () { close(false); });
    var wide = window.matchMedia ? window.matchMedia('(min-width: 980px)') : null;
    if (wide) {
      var narrow = function () { if (!wide.matches) { close(false); } };
      if (wide.addEventListener) { wide.addEventListener('change', narrow); } else if (wide.addListener) { wide.addListener(narrow); }
    }
    /* On the shop itself a category is a change of view, not a new page. */
    p.addEventListener('click', function (e) {
      var l = e.target.closest('a[data-cat]');
      if (!l || PAGE !== 'shop' || !SHOP) { return; }
      e.preventDefault();
      close(false);
      SHOP.setCat(l.getAttribute('data-cat'), true);
    });
  }

  /* ── the phone menu: a full-height sheet, a true modal ─────────────────── */
  function buildMenu() {
    var a = $('#menu-a');
    if (!a) { return; }
    var b = doc.createElement('button');
    b.type = 'button';
    b.className = 'icon-b menu-a';
    b.id = 'menu-b';
    b.setAttribute('aria-expanded', 'false');
    b.setAttribute('aria-controls', 'menu-s');
    b.setAttribute('aria-label', 'Menu');
    b.innerHTML = ICON.menu;
    a.parentNode.replaceChild(b, a);
    doc.body.insertAdjacentHTML('beforeend', R.menuSheet(L, ROOT, CUR));
    var s = $('#menu-s'), token = 0;
    function isOpen() { return !s.hidden; }
    function open() {
      token++;
      s.hidden = false;
      background().forEach(function (el) { el.setAttribute('inert', ''); });
      b.setAttribute('aria-expanded', 'true');
      doc.documentElement.style.overflow = 'hidden';
      void s.offsetWidth; /* so the slide starts from its resting place */
      s.classList.add('is-open');
      $('#menu-x').focus();
    }
    function close(back) {
      if (!isOpen()) { return; }
      var t = ++token;
      s.classList.remove('is-open');
      background().forEach(function (el) { el.removeAttribute('inert'); });
      b.setAttribute('aria-expanded', 'false');
      doc.documentElement.style.overflow = '';
      if (REDUCED) { s.hidden = true; } else { setTimeout(function () { if (t === token) { s.hidden = true; } }, 260); }
      if (back) { b.focus(); }
    }
    b.addEventListener('click', open);
    $('#menu-x').addEventListener('click', function () { close(true); });
    s.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); close(true); return; }
      if (e.key !== 'Tab') { return; }
      var f = focusables(s);
      if (!f.length) { return; }
      if (e.shiftKey && doc.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && doc.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    });
    s.addEventListener('click', function (e) {
      var acc = e.target.closest('.macc-b');
      if (acc) {
        var on = acc.getAttribute('aria-expanded') !== 'true';
        acc.setAttribute('aria-expanded', on ? 'true' : 'false');
        doc.getElementById(acc.getAttribute('aria-controls')).hidden = !on;
        return;
      }
      var l = e.target.closest('a[data-cat]');
      if (l && PAGE === 'shop' && SHOP) {
        e.preventDefault();
        close(false);
        SHOP.setCat(l.getAttribute('data-cat'), true);
        return;
      }
      /* a link to a place on this same page: close first, then go */
      var h = e.target.closest('a[href]');
      if (h && h.target !== '_blank') { close(false); }
    });
    var wide = window.matchMedia ? window.matchMedia('(min-width: 980px)') : null;
    if (wide) {
      var widen = function () { if (wide.matches) { close(false); } };
      if (wide.addEventListener) { wide.addEventListener('change', widen); } else if (wide.addListener) { wide.addListener(widen); }
    }
    window.addEventListener('pageshow', function () { close(false); });
  }

  /* ── rows: arrows scroll by a screenful; disabled at either end ────────── */
  function initRows() {
    $$('.row-nav').forEach(function (nav) {
      var btns = $$('.rn', nav);
      var row = btns.length ? doc.getElementById(btns[0].getAttribute('aria-controls')) : null;
      if (!row) { return; }
      function update() {
        var max = row.scrollWidth - row.clientWidth;
        nav.hidden = max <= 2;
        btns[0].disabled = row.scrollLeft <= 2;
        btns[1].disabled = row.scrollLeft >= max - 2;
      }
      btns.forEach(function (b) {
        b.addEventListener('click', function () {
          var dir = +b.getAttribute('data-dir');
          row.scrollBy({ left: dir * Math.max(200, row.clientWidth - 60), behavior: REDUCED ? 'auto' : 'smooth' });
        });
      });
      reveal(row);
      row.addEventListener('scroll', function () { frame(update); }, { passive: true });
      window.addEventListener('resize', function () { frame(update); });
      update();
    });
  }

  /* A card that takes keyboard focus comes fully into view, in a row that
     scrolls sideways as much as under the sticky header. Keyboard focus only:
     a mouse press on a card's Buy on eBay also focuses the link (in Chrome),
     and scrolling then moved the button from under the pointer before the
     button came up, so the click landed on the card and never reached the
     listing. :focus-visible tells the two apart; where it is unknown, the last
     input does (a press, or a key). */
  var pressed = false;
  doc.addEventListener('pointerdown', function () { pressed = true; }, true);
  doc.addEventListener('keydown', function () { pressed = false; }, true);
  function byKeyboard(el) {
    try { return el.matches(':focus-visible'); } catch (x) { return !pressed; }
  }
  function reveal(box) {
    if (!box) { return; }
    box.addEventListener('focusin', function (e) {
      var c = e.target.closest ? e.target.closest('.card, .stile') : null;
      if (c && box.contains(c) && byKeyboard(e.target)) { c.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: REDUCED ? 'auto' : 'smooth' }); }
    });
  }

  /* ── home: each category shows its picture while it is pointed at or focused ── */
  function initCatlist() {
    var box = $('#catlist');
    if (!box) { return; }
    var links = $$('.catlist-a', box), imgs = $$('.catlist-stage img', box);
    function show(i) {
      links.forEach(function (l, k) { l.classList.toggle('is-on', k === i); });
      imgs.forEach(function (im, k) { im.classList.toggle('is-on', k === i); });
    }
    links.forEach(function (l, i) {
      l.addEventListener('mouseenter', function () { show(i); });
      l.addEventListener('focus', function () { show(i); });
    });
    show(0);
  }

  /* ── cards: drawn by the shared markup, then watched as their photos land ── */
  function settle(box) {
    var cards = $$('.card', box);
    cards.forEach(function (c) { watch($('.ph', c)); });
    if (REDUCED) { return; }
    cards.forEach(function (c, i) {
      c.classList.add('is-entering');
      setTimeout(function () { frame(function () { c.classList.remove('is-entering'); }); }, Math.min(i, 5) * 28);
    });
  }

  /* ── the shop ─────────────────────────────────────────────────────────── */
  var SORTS = [
    { id: 'featured', name: 'Featured' },
    { id: 'price-asc', name: 'Price: low to high' },
    { id: 'price-desc', name: 'Price: high to low' },
    { id: 'pps', name: 'Price per serving: lowest' },
    { id: 'protein', name: 'Protein per serving: most' },
    { id: 'date', name: 'Date on the bag: latest' }
  ];

  function initShop() {
    var all = L.products;
    var S = { c: '', q: '', f: { flavor: [], source: [], label: [] }, sort: 'featured' };
    /* the search, shared with the static checks (render.js): whole words
       first, and a free-from search that goes only by what a package itself
       prints that it is free of */
    var IX = R.searchIndex(L), Q = R.parseQuery('', IX);
    function query() { if (Q.q !== S.q) { Q = R.parseQuery(S.q, IX); } return Q; }
    function hay(s) { return ' ' + R.words(s).join(' ') + ' '; }
    /* what else the site holds, so a search can say what kind each match is */
    var OTHER = L.categories.map(function (c) {
      var k = counts()[c.id] || 0;
      return { kind: 'Category', name: c.name, cat: c.id, st: k ? items(k) + ' here' : R.NOT_HERE, hay: hay(c.name + ' ' + c.blurb) };
    }).concat(R.DIRECTIONS.map(function (d) {
      return { kind: 'Direction', name: d.name, href: ROOT + d.href, st: d.status, hay: hay(d.name + ' ' + d.line + ' ' + d.keys) };
    })).concat([{ kind: 'Help', name: R.HELP.name, href: ROOT + R.HELP.href, st: '', hay: hay(R.HELP.name + ' ' + R.HELP.line + ' ' + R.HELP.keys) }]);
    /* the shop's own field and the header's search the same thing */
    var fields = [$('#sq'), q].filter(Boolean);
    function setField(v, except) { fields.forEach(function (f) { if (f !== except) { f.value = v; } }); }

    /* The view lives in the address: a filtered view can be shared, reloaded,
       and Back and Forward step through the changes. Typing a search replaces
       its own entry as it goes, so one search is one step back. */
    function parse() {
      var u = new URLSearchParams(location.search);
      S.c = catOf(u.get('c')) ? u.get('c') : '';
      S.q = (u.get('q') || '').slice(0, 80);
      L.facets.forEach(function (g) {
        var v = u.get(g.id);
        S.f[g.id] = v ? v.split(',').filter(Boolean) : [];
      });
      S.sort = SORTS.some(function (s) { return s.id === u.get('sort'); }) ? u.get('sort') : 'featured';
      return u;
    }
    function address() {
      var p = new URLSearchParams();
      if (S.c) { p.set('c', S.c); }
      if (S.q) { p.set('q', S.q); }
      L.facets.forEach(function (g) { if (S.f[g.id].length) { p.set(g.id, S.f[g.id].join(',')); } });
      if (S.sort !== 'featured') { p.set('sort', S.sort); }
      var s = p.toString();
      return location.pathname + (s ? '?' + s : '') + location.hash;
    }
    function save(kind) {
      var url = address();
      if (url === location.pathname + location.search + location.hash) { return; }
      try {
        if (kind === 'q' && history.state && history.state.life === 'q') { history.replaceState({ life: 'q' }, '', url); }
        else { history.pushState({ life: kind }, '', url); }
      } catch (e) { /* file: in some browsers */ }
    }
    var u = parse();
    setField(S.q);

    function matches(p, skip) {
      if (S.c && p.category !== S.c) { return false; }
      if (S.q && !R.searchHit(IX, query(), p.id)) { return false; }
      /* within a group marked `every` (what the label says) a product must carry
         every value chosen; within the others (flavors, sources) any of them */
      for (var k = 0; k < L.facets.length; k++) {
        var g = L.facets[k].id;
        if (g === skip || !S.f[g].length) { continue; }
        var has = function (v) { return p.facet[g].indexOf(v) >= 0; };
        if (L.facets[k].every ? !S.f[g].every(has) : !S.f[g].some(has)) { return false; }
      }
      return true;
    }
    /* the categories, directions and help that a search also matches */
    function otherHits() {
      var qq = query();
      if (!qq.tokens.length || qq.free.length) { return []; }
      return OTHER.filter(function (o) {
        return qq.tokens.every(function (t) { return qq.whole ? o.hay.indexOf(' ' + t + ' ') >= 0 || o.hay.indexOf(' ' + t + 's ') >= 0 : o.hay.indexOf(' ' + t) >= 0; });
      });
    }
    /* a word that some packages print they are free of ("soy") finds both
       kinds of label; the shop says how to see only the free-from ones */
    function freeHint() {
      var qq = query();
      if (qq.free.length) { return null; }
      var hit = null;
      R.freeClaims(IX).some(function (x) {
        return qq.tokens.some(function (t) { if (t === x.t || t === x.t + 's') { hit = { say: x.say, word: t }; } return !!hit; });
      });
      return hit;
    }
    function sorted(list) {
      var by = {
        'price-asc': function (a, b) { return a.price - b.price; },
        'price-desc': function (a, b) { return b.price - a.price; },
        pps: function (a, b) { return a.price / a.servings.n - b.price / b.servings.n; },
        protein: function (a, b) { return b.protein - a.protein; },
        date: function (a, b) { return a.date.sort < b.date.sort ? 1 : (a.date.sort > b.date.sort ? -1 : 0); }
      }[S.sort];
      /* in the shop's own order, a search's own matches first (their brand, name and flavor hold every word searched);
         whatever the order, a sold-out product comes after the rest */
      if (!by && S.q) {
        var qr = query(), rank = {};
        list.forEach(function (p, i) { rank[p.id] = [R.searchRank(IX, qr, p.id), i]; });
        by = function (a, b) { return rank[b.id][0] - rank[a.id][0] || rank[a.id][1] - rank[b.id][1]; };
      }
      return R.shelf(by ? list.slice().sort(by) : list.slice());
    }
    function active() { return L.facets.reduce(function (n, g) { return n + S.f[g.id].length; }, 0) + (S.q ? 1 : 0); }

    /* category tabs */
    var n = counts();
    var cats = $('#cats');
    var TABS = [{ id: '', name: 'Everything', k: all.length }].concat(L.categories.map(function (c) { return { id: c.id, name: c.name, k: n[c.id] || 0 }; }));
    cats.innerHTML = TABS.map(function (t) {
      return '<button class="cat" type="button" role="tab" id="tab-' + (t.id || 'all') + '" aria-controls="results" data-cat="' + esc(t.id) + '">' +
        esc(t.name) + ' <span class="n">' + (t.k ? t.k : esc(R.NOT_HERE)) + '</span></button>';
    }).join('');
    cats.addEventListener('click', function (e) {
      var b = e.target.closest('.cat');
      if (b) { setCat(b.getAttribute('data-cat'), false); }
    });
    cats.addEventListener('keydown', function (e) {
      var tabs = $$('.cat', cats), i = tabs.indexOf(doc.activeElement), j = -1;
      if (e.key === 'ArrowRight') { j = (i + 1) % tabs.length; }
      else if (e.key === 'ArrowLeft') { j = (i - 1 + tabs.length) % tabs.length; }
      else if (e.key === 'Home') { j = 0; } else if (e.key === 'End') { j = tabs.length - 1; }
      if (j < 0) { return; }
      e.preventDefault();
      tabs[j].focus();
      setCat(tabs[j].getAttribute('data-cat'), false);
    });
    function setCat(id, jump) {
      S.c = catOf(id) ? id : '';
      render('c');
      if (jump) {
        var shop = $('#shop');
        if (shop) {
          shop.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
          shop.focus({ preventScroll: true });
        }
      }
    }

    /* filters, each with how many products it would show */
    var facetsBox = $('#facets');
    facetsBox.addEventListener('click', function (e) {
      var c = e.target.closest('.chip');
      if (!c || c.disabled) { return; }
      var g = c.getAttribute('data-g'), v = c.getAttribute('data-v'), list = S.f[g], i = list.indexOf(v);
      if (i >= 0) { list.splice(i, 1); } else { list.push(v); }
      render('f');
      var again = $('.chip[data-g="' + g + '"][data-v="' + CSS.escape(v) + '"]', facetsBox);
      if (again) { again.focus(); }
    });
    function chips() {
      facetsBox.innerHTML = L.facets.map(function (g) {
        var vals = [];
        all.forEach(function (p) {
          if (S.c && p.category !== S.c) { return; }
          p.facet[g.id].forEach(function (v) { if (vals.indexOf(v) < 0) { vals.push(v); } });
        });
        S.f[g.id].forEach(function (v) { if (vals.indexOf(v) < 0) { vals.push(v); } });
        if (!vals.length) { return ''; }
        return '<div class="group" role="group" aria-labelledby="fg-' + esc(g.id) + '"><span class="legend" id="fg-' + esc(g.id) + '">' + esc(g.name) + '</span>' + vals.map(function (v) {
          var on = S.f[g.id].indexOf(v) >= 0;
          /* a chip's number is what the shop would show with it chosen: in an
             `every` group, with the group's other choices too; in the others,
             as an alternative to them. A label chip that would leave nothing
             stays pressable, so the shop can say plainly that nothing has both */
          var k = all.filter(function (p) { return matches(p, g.every ? null : g.id) && p.facet[g.id].indexOf(v) >= 0; }).length;
          return '<button class="chip" type="button" data-g="' + esc(g.id) + '" data-v="' + esc(v) + '" aria-pressed="' + on + '"' +
            (!k && !on && !g.every ? ' disabled' : '') + ' aria-label="' + esc(v) + ', ' + items(k) + '"><span class="box" aria-hidden="true">' + ICON.check + '</span>' +
            '<span class="v">' + esc(v) + '</span><span class="n" aria-hidden="true">' + k + '</span></button>';
        }).join('') + '</div>';
      }).join('');
    }

    /* what is applied, above the grid: one chip per filter and the search,
       each removed with one press, and Clear all */
    var applied = $('#applied');
    function appliedChips() {
      var list = [];
      if (S.q) { list.push({ g: 'q', v: S.q, t: '“' + S.q + '”', sr: 'Remove the search for ' + S.q }); }
      L.facets.forEach(function (g) {
        S.f[g.id].forEach(function (v) {
          var t = R.facetLabel(g.id, v);
          list.push({ g: g.id, v: v, t: t, sr: 'Remove the filter ' + g.name + ': ' + t });
        });
      });
      applied.hidden = !list.length;
      applied.innerHTML = list.length ? '<span class="applied-l" id="applied-l">Applied</span>' +
        '<ul class="achips" aria-labelledby="applied-l">' + list.map(function (x) {
          return '<li><button class="achip" type="button" data-g="' + esc(x.g) + '" data-v="' + esc(x.v) + '" aria-label="' + esc(x.sr) + '">' +
            '<span>' + esc(x.t) + '</span>' + ICON.close.replace('width="18" height="18"', 'width="12" height="12"') + '</button></li>';
        }).join('') + '<li><button class="clear" type="button" id="clear">Clear all</button></li></ul>' : '';
    }
    applied.addEventListener('click', function (e) {
      if (e.target.closest('#clear')) { clearAll(); focusAfter(0); return; }
      var b = e.target.closest('.achip');
      if (!b) { return; }
      var i = $$('.achip', applied).indexOf(b), g = b.getAttribute('data-g'), v = b.getAttribute('data-v');
      if (g === 'q') { S.q = ''; setField(''); } else { S.f[g] = S.f[g].filter(function (x) { return x !== v; }); }
      render('f');
      focusAfter(i);
    });
    /* after a removal, focus the chip that took its place, or the products */
    function focusAfter(i) {
      var left = $$('.achip', applied);
      if (left.length) { left[Math.min(i, left.length - 1)].focus(); }
      else { var c = $('#shop'); if (c) { c.focus({ preventScroll: true }); } }
    }

    /* the sort listbox */
    var sb = $('#sort-b'), sl = $('#sort-l'), sv = $('#sort-v');
    sl.innerHTML = SORTS.map(function (s) {
      return '<li role="option" id="sort-' + s.id + '" data-v="' + s.id + '" aria-selected="false">' + esc(s.name) + ICON.check + '</li>';
    }).join('');
    var act = 0;
    function opts() { return $$('[role="option"]', sl); }
    function markActive(i) {
      act = i;
      opts().forEach(function (o, k) { o.classList.toggle('is-active', k === i); });
      sl.setAttribute('aria-activedescendant', opts()[i].id);
    }
    function sortOpen() {
      sl.classList.add('is-open');
      sb.setAttribute('aria-expanded', 'true');
      markActive(Math.max(0, SORTS.map(function (s) { return s.id; }).indexOf(S.sort)));
      sl.focus();
    }
    function sortClose(back) {
      if (!sl.classList.contains('is-open')) { return; }
      sl.classList.remove('is-open');
      sb.setAttribute('aria-expanded', 'false');
      if (back) { sb.focus(); }
    }
    function choose(i) { S.sort = SORTS[i].id; sortClose(true); render('s'); }
    sb.addEventListener('click', function () { if (sl.classList.contains('is-open')) { sortClose(true); } else { sortOpen(); } });
    sb.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); sortOpen(); }
    });
    sl.addEventListener('keydown', function (e) {
      var k = opts().length;
      if (e.key === 'ArrowDown') { e.preventDefault(); markActive((act + 1) % k); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); markActive((act - 1 + k) % k); }
      else if (e.key === 'Home') { e.preventDefault(); markActive(0); }
      else if (e.key === 'End') { e.preventDefault(); markActive(k - 1); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(act); }
      else if (e.key === 'Escape') { e.preventDefault(); sortClose(true); }
      else if (e.key === 'Tab') { sortClose(false); }
    });
    sl.addEventListener('click', function (e) {
      var o = e.target.closest('[role="option"]');
      if (o) { choose(opts().indexOf(o)); }
    });
    sl.addEventListener('mousemove', function (e) {
      var o = e.target.closest('[role="option"]');
      if (o) { markActive(opts().indexOf(o)); }
    });
    doc.addEventListener('click', function (e) { if (!$('#sort').contains(e.target)) { sortClose(false); } });

    /* search: filters as you type; nothing to wait for, so no loading state */
    var tq = null;
    function fromField(f) {
      S.q = f.value.trim().slice(0, 80);
      setField(f.value, f);
      if (S.q && S.c && !counts()[S.c]) { S.c = ''; }
      render('q');
    }
    fields.forEach(function (f) {
      f.addEventListener('input', function () { clearTimeout(tq); tq = setTimeout(function () { fromField(f); }, 60); });
      f.form.addEventListener('submit', function (e) {
        e.preventDefault();
        clearTimeout(tq);
        fromField(f);
        if (f === q) { searchOpen(false); }
        $('#shop').scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
      });
    });

    /* clearing: every filter and the search, in one step */
    function clearAll() {
      L.facets.forEach(function (g) { S.f[g.id] = []; });
      S.q = '';
      setField('');
      render('clear');
    }
    $('#clear-s').addEventListener('click', clearAll);

    /* The filter sheet on phones is a modal: while it is open it is the only
       thing that can be reached. It moves to the end of the page so the rest
       can be made inert, Tab wraps inside it, and closing it puts it back,
       lifts the scrim and returns focus to the Filters button. On wider
       screens the same filters sit in the rail and none of this applies. */
    var fb = $('#filters-b'), groups = $('#groups'), sscrim = $('#scrim');
    var home = doc.createComment(' filters '), back = 0;
    var phone = window.matchMedia ? window.matchMedia('(max-width: 899px)') : null;
    groups.parentNode.insertBefore(home, groups);
    function sheetOpen() { return groups.classList.contains('is-open'); }
    /* On wide screens the rail holds still beside the products only while it
       fits the window under the header. Taller than that (a short laptop
       window), it scrolls with the page, so its last filter can always be
       reached, by scrolling or by Tab. */
    function railFit() {
      var wide = !phone || !phone.matches, top = $('#top') ? $('#top').getBoundingClientRect().height + 20 : 0;
      groups.classList.toggle('is-tall', wide && !sheetOpen() && groups.offsetHeight + top + 20 > innerHeight);
    }
    window.addEventListener('resize', function () { frame(railFit); });
    function reachable() {
      return $$('button, a[href], input', groups).filter(function (el) { return !el.disabled && el.offsetParent !== null; });
    }
    function rehome() { if (groups.parentNode !== home.parentNode) { home.parentNode.insertBefore(groups, home.nextSibling); } }
    function sheet(on, now) {
      if (on === sheetOpen()) { return; }
      var token = ++back;
      if (on) {
        if (phone && !phone.matches) { return; }
        doc.body.appendChild(groups);
        groups.setAttribute('role', 'dialog');
        groups.setAttribute('aria-modal', 'true');
        groups.setAttribute('aria-labelledby', 'filters-h');
        groups.removeAttribute('aria-label');
        background().forEach(function (el) { el.setAttribute('inert', ''); });
        void groups.offsetWidth; /* so the slide starts from below the screen */
        groups.classList.add('is-open');
        sscrim.classList.add('is-open');
        fb.setAttribute('aria-expanded', 'true');
        var f = $('.chip:not(:disabled)', groups) || reachable()[0];
        if (f) { f.focus(); }
        return;
      }
      groups.classList.remove('is-open');
      sscrim.classList.remove('is-open');
      fb.setAttribute('aria-expanded', 'false');
      background().forEach(function (el) { el.removeAttribute('inert'); });
      groups.setAttribute('role', 'group');
      groups.removeAttribute('aria-modal');
      groups.removeAttribute('aria-labelledby');
      groups.setAttribute('aria-label', 'Filters');
      /* Back in its place once the slide is over, or at once when the view is
         changing under it (a wider window, an empty category). */
      if (now || REDUCED) { rehome(); } else { setTimeout(function () { if (token === back && !sheetOpen()) { rehome(); } }, 300); }
      if (fb.offsetParent !== null) { fb.focus(); }
      else { var c = $('#shop'); if (c) { c.focus({ preventScroll: true }); } }
    }
    fb.addEventListener('click', function () { sheet(!sheetOpen()); });
    sscrim.addEventListener('click', function () { sheet(false); });
    $('#done').addEventListener('click', function () { sheet(false); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && sheetOpen()) { e.preventDefault(); sheet(false); } });
    groups.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab' || !sheetOpen()) { return; }
      var f = reachable();
      if (!f.length) { return; }
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (doc.activeElement === first || !groups.contains(doc.activeElement))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    if (phone) {
      var wider = function () { if (!phone.matches && sheetOpen()) { sheet(false, true); } };
      if (phone.addEventListener) { phone.addEventListener('change', wider); } else if (phone.addListener) { phone.addListener(wider); }
    }

    var grid = $('#grid'), count = $('#count'), body = $('.shop-body'), rail = $('.rail'), hits = $('#hits'), first = true;
    var gnote = $('#grid-note'), cmpSec = $('#compare');
    reveal(grid);
    /* the categories as one line of links, each with what it holds here */
    function catLinks() {
      var k = counts();
      return '<ul class="ecats">' + L.categories.map(function (c) {
        return '<li><a class="ecat" href="' + esc(ROOT + 'shop.html?c=' + c.id) + '" data-cat="' + esc(c.id) + '"><span>' + esc(c.name) + '</span>' +
          '<small>' + (k[c.id] ? items(k[c.id]) : esc(R.NOT_HERE)) + '</small></a></li>';
      }).join('') + '</ul>';
    }
    function render(kind) {
      var catList = all.filter(function (p) { return !S.c || p.category === S.c; });
      var shown = sorted(all.filter(function (p) { return matches(p, null); }));
      $$('.cat', cats).forEach(function (b) {
        var on = b.getAttribute('data-cat') === S.c;
        b.setAttribute('aria-selected', on ? 'true' : 'false');
        b.tabIndex = on ? 0 : -1;
      });
      pillInView(kind === null || kind === 'pop');
      $('#results').setAttribute('aria-labelledby', 'tab-' + (S.c || 'all'));
      chips();
      railFit();
      appliedChips();
      if (!catList.length) { applied.hidden = true; }
      var sel = SORTS.filter(function (s) { return s.id === S.sort; })[0];
      sv.textContent = sel.name;
      opts().forEach(function (o) { o.setAttribute('aria-selected', o.getAttribute('data-v') === S.sort ? 'true' : 'false'); });
      var nf = L.facets.reduce(function (k, g) { return k + S.f[g.id].length; }, 0);
      $('#fcount').textContent = nf ? ' (' + nf + ')' : '';
      $('#done').textContent = shown.length ? 'Show ' + items(shown.length) : 'No products match';
      /* the count says what the results are: products, and for a search, what was searched */
      count.textContent = !catList.length ? '' : S.q
        ? (shown.length ? items(shown.length) + (shown.length === 1 ? ' matches' : ' match') : 'No products match') + ' “' + S.q + '”'
        : (shown.length === catList.length ? items(shown.length) : 'Showing ' + shown.length + ' of ' + catList.length);
      $('.tools').hidden = !catList.length;
      rail.hidden = !catList.length;
      body.classList.toggle('is-empty', !catList.length);
      /* the dated price note sits only under prices, and the comparison only
         under a category that has products */
      if (gnote) { gnote.hidden = !shown.length; }
      if (cmpSec) { cmpSec.hidden = !catList.length; }
      /* a search also names the categories, directions and help it matches,
         each with what kind of thing it is */
      var oh = catList.length ? otherHits() : [];
      /* a free-from search says what it goes by; a word some packages print
         they are free of says how to see only those */
      var qq = query(), hint = catList.length && S.q && shown.length ? freeHint() : null;
      var fnote = catList.length && S.q && qq.free.length && shown.length
        ? '<p class="hits-note">A free-from search shows only products whose own package prints that claim, and leaves out any whose label also lists it as an allergen or says the same facility or equipment processes it. Read the label on the package before you buy.</p>'
        : (hint ? '<p class="hits-note">Some of these packages print that they are free of ' + esc(hint.word) + '. <a href="' + esc(ROOT + 'shop.html?q=' + encodeURIComponent(hint.say)) + '" data-q="' + esc(hint.say) + '">See only those (“' + esc(hint.say) + '”)</a></p>' : '');
      hits.hidden = !oh.length && !fnote;
      hits.innerHTML = fnote + (oh.length ? '<p class="hits-h" id="hits-h">Also on the site</p><ul class="hits-l" aria-labelledby="hits-h">' + oh.map(function (o) {
        return '<li><a class="hit" href="' + esc(o.cat ? ROOT + 'shop.html?c=' + o.cat : o.href) + '"' + (o.cat ? ' data-cat="' + esc(o.cat) + '"' : '') + '>' +
          '<span class="hit-k">' + esc(o.kind) + '</span><span class="hit-n">' + esc(o.name) + '</span>' +
          (o.st ? '<span class="hit-s">' + esc(o.st) + '</span>' : '') + '</a></li>';
      }).join('') + '</ul>' : '');

      if (!catList.length) {
        if (sheetOpen()) { sheet(false, true); }
        var c = catOf(S.c);
        grid.className = '';
        grid.innerHTML = '<div class="empty"><h2>Nothing in ' + esc(c ? c.name : 'this category') + ' is listed on this site yet.</h2>' +
          '<p>' + esc(R.NOTICE) + ' What this site lists now is in ' + esc(listed()) + '.</p>' +
          '<div class="row-b"><button class="btn btn-1" type="button" data-go="all">See everything listed here</button>' +
          R.storeLink('Visit our eBay store', 'btn btn-2') + '</div></div>';
      } else if (!shown.length) {
        grid.className = '';
        var only = S.q && !L.facets.some(function (g) { return S.f[g.id].length; });
        /* a free-from search that finds nothing offers the claims the packages
           here do print, each with what it finds */
        var claims = only && qq.free.length ? R.freeClaims(IX) : null;
        grid.innerHTML = '<div class="empty"><h2>No products match' + (S.q ? ' “' + esc(S.q) + '”' : ' these filters') + '.</h2>' +
          (claims ? '<p>A free-from search goes only by what a package itself prints. These are the free-from claims printed on the packages here:</p>' +
            '<ul class="ecats">' + claims.map(function (c) {
              return '<li><a class="ecat" href="' + esc(ROOT + 'shop.html?q=' + encodeURIComponent(c.say)) + '" data-q="' + esc(c.say) + '"><span>' + esc(c.say) + '</span><small>' + items(c.n) + '</small></a></li>';
            }).join('') + '</ul>'
          : '<p>' + (only ? 'Try another brand, flavor or ingredient, or start from a category.' : 'Try fewer filters, or start from a category.') + '</p>' +
          catLinks()) +
          '<div class="row-b"><button class="btn btn-1" type="button" data-go="clear">Clear ' + (only ? 'the search' : 'filters and search') + '</button></div></div>';
      } else if (first && grid.hasAttribute('data-gen') && !S.c && !S.q && !active() && S.sort === 'featured' &&
                 $$('.card', grid).map(function (c) { return c.getAttribute('data-id'); }).join() === shown.map(function (p) { return p.id; }).join()) {
        /* the cards written into the page are already this view: keep them */
        $$('.card', grid).forEach(function (c) { watch($('.ph', c)); });
      } else {
        grid.className = 'grid';
        grid.removeAttribute('data-gen');
        grid.innerHTML = R.cards(shown, ROOT, S.q ? query() : null) + R.storeTile();
        settle(grid);
      }
      if (kind && kind !== 'pop') { save(kind); }
      first = false;
    }
    /* The chosen category's pill is kept whole in its row (the row scrolls
       sideways on phones; Skincare sat beyond its right edge), measured
       against the row's own padding, which on phones is the page's gutter.
       Only the row moves, never the page: at once on arrival and on Back,
       smoothly when someone chooses (and at once under reduced motion). */
    function pillInView(now) {
      var a = $('.cat[aria-selected="true"]', cats);
      if (!a || cats.scrollWidth <= cats.clientWidth + 1) { return; }
      var cs = getComputedStyle(cats), r = a.getBoundingClientRect(), c = cats.getBoundingClientRect();
      var l = c.left + (parseFloat(cs.paddingLeft) || 0), rr = c.right - (parseFloat(cs.paddingRight) || 0), d = 0;
      if (r.left < l) { d = r.left - l; } else if (r.right > rr) { d = Math.min(r.right - rr, r.left - l); }
      if (Math.abs(d) < 1) { return; }
      var to = Math.max(0, Math.min(cats.scrollWidth - cats.clientWidth, cats.scrollLeft + d));
      if (cats.scrollTo) { cats.scrollTo({ left: to, behavior: now || REDUCED ? 'auto' : 'smooth' }); } else { cats.scrollLeft = to; }
    }
    /* the categories that have products here, by name */
    function listed() {
      var k = counts();
      return L.categories.filter(function (c) { return k[c.id]; }).map(function (c) { return c.name; }).join(', ') || 'the shop';
    }
    /* a category named in the results (a search's other matches, or the empty
       state's list) is a change of view here, starting from that category */
    function toCat(id) {
      L.facets.forEach(function (g) { S.f[g.id] = []; });
      S.q = '';
      setField('');
      setCat(id, false);
      var t = $('#tab-' + (id || 'all'));
      if (t) { t.focus(); }
    }
    $('#results').addEventListener('click', function (e) {
      var l = e.target.closest('a[data-cat]');
      if (l) { e.preventDefault(); toCat(l.getAttribute('data-cat')); return; }
      /* a printed claim named in the results is a search for it, here */
      var fq = e.target.closest('a[data-q]');
      if (fq) {
        e.preventDefault();
        S.q = fq.getAttribute('data-q');
        setField(S.q);
        render('s');
        var sq = $('#sq');
        if (sq && visible(sq)) { sq.focus({ preventScroll: true }); }
        return;
      }
      var g = e.target.closest('[data-go]');
      if (!g) { return; }
      if (g.getAttribute('data-go') === 'all') { setCat('', false); $('#tab-all').focus(); }
      else { clearAll(); var f = $('#sq'); if (f && visible(f)) { f.focus(); } }
    });
    /* Back and Forward: the address is the view */
    window.addEventListener('popstate', function () {
      parse();
      setField(S.q);
      sortClose(false);
      render('pop');
    });

    var co = $('#cmp-o'), cw = co ? $('.cmp-w', co) : null;
    if (cw) {
      /* the frame is a tab stop only while it scrolls (not once phones stack it) */
      var more = function () {
        var can = cw.scrollWidth - cw.clientWidth > 2;
        co.classList.toggle('is-more', can && cw.scrollLeft < cw.scrollWidth - cw.clientWidth - 2);
        if (can) { cw.setAttribute('tabindex', '0'); } else { cw.removeAttribute('tabindex'); }
      };
      cw.addEventListener('scroll', function () { frame(more); }, { passive: true });
      window.addEventListener('resize', function () { frame(more); });
      more();
    }

    SHOP = { setCat: setCat };
    render(null);
    /* the address as arrived, tidied (unknown values dropped), as this entry */
    try { history.replaceState({ life: 'load' }, '', address()); } catch (e) { /* file: */ }
    /* An address that names a view (a category, a filter, a search, a sort)
       opens on that view: the category row with its choice, the tools and the
       results, rather than the shop's introduction, which on a phone filled
       the first screen. A reload or Back keeps the browser's own place. */
    var how = window.performance && performance.getEntriesByType ? (performance.getEntriesByType('navigation')[0] || {}).type : 'navigate';
    if ((S.c || S.q || active() || S.sort !== 'featured') && !location.hash && how !== 'reload' && how !== 'back_forward') {
      frame(function () { $('#shop').scrollIntoView({ block: 'start' }); });
    }
  }

  /* ── the full-screen viewer: a picture as large as the screen allows ─────
     A modal dialog over the whole page: the picture fitted to the screen, its
     counter and caption, arrows, Escape to close, and zoom (the Zoom button
     steps 1×, 2×, 3×; a double click or double tap zooms where it lands; a
     pinch on touch; a drag pans while zoomed; + and − on the keyboard, and
     the arrow keys pan once zoomed). Focus stays inside it and goes back to
     whatever opened it; the page behind is inert. */
  function makeViewer(p, list) {
    doc.body.insertAdjacentHTML('beforeend',
      '<div class="lv" id="lv" role="dialog" aria-modal="true" aria-label="Pictures of the ' + esc(R.fullName(p)) + ' package" aria-describedby="lv-how" tabindex="-1" hidden>' +
        '<div class="lv-top">' +
          '<p class="lv-c" id="lv-c"></p>' +
          '<div class="lv-tools">' +
            '<button class="lv-b lv-z" type="button" id="lv-z"><span class="lv-zi" id="lv-zi">' + ICON.plus + '</span><span>Zoom <b id="lv-zl">1×</b></span></button>' +
            '<button class="lv-b lv-x" type="button" id="lv-x" aria-label="Close">' + ICON.close + '</button>' +
          '</div>' +
        '</div>' +
        '<div class="lv-s" id="lv-s"><img id="lv-i" alt="" draggable="false" decoding="async">' +
          '<div class="lv-bar" id="lv-bar" aria-hidden="true"></div>' +
          '<div class="lv-fail" id="lv-fail" hidden><p>This picture didn’t load.</p><button class="btn btn-2 btn-s" type="button" id="lv-retry">Try again</button></div>' +
        '</div>' +
        '<div class="lv-foot">' +
          '<button class="lv-b lv-n" type="button" id="lv-p" aria-label="Previous picture">' + ICON.prev + '</button>' +
          '<p class="lv-cap" id="lv-cap" aria-hidden="true"></p>' +
          '<button class="lv-b lv-n" type="button" id="lv-n" aria-label="Next picture">' + ICON.next + '</button>' +
        '</div>' +
        '<p class="sr" id="lv-how">Left and right arrows move between pictures. Plus and minus zoom; once zoomed, the arrow keys move the picture. Escape closes.</p>' +
        '<p class="sr" id="lv-live" aria-live="polite"></p>' +
      '</div>');
    var box = $('#lv'), st = $('#lv-s'), img = $('#lv-i'), lbar = $('#lv-bar'), lfail = $('#lv-fail');
    var zb = $('#lv-z'), zl = $('#lv-zl'), zi = $('#lv-zi'), zout = false;
    var N = list.length, cur = 0, seq = 0, opener = null;
    /* the picture's fitted size, and the zoom: scale s, pan tx/ty from centre */
    var fw = 0, fh = 0, s = 1, tx = 0, ty = 0, MAX = 3;

    function bounds() { var r = st.getBoundingClientRect(); return { w: r.width, h: r.height, l: r.left, t: r.top }; }
    function fit() {
      var b = bounds(), sl = list[cur], k = Math.min(b.w / sl.w, b.h / sl.h);
      fw = Math.round(sl.w * k); fh = Math.round(sl.h * k);
      img.style.width = fw + 'px'; img.style.height = fh + 'px';
      img.style.marginLeft = -fw / 2 + 'px'; img.style.marginTop = -fh / 2 + 'px';
      clamp(); apply(false);
    }
    function clamp() {
      var b = bounds(), mx = Math.max(0, (fw * s - b.w) / 2), my = Math.max(0, (fh * s - b.h) / 2);
      tx = Math.max(-mx, Math.min(mx, tx)); ty = Math.max(-my, Math.min(my, ty));
    }
    function apply(anim) {
      box.classList.toggle('is-anim', !!anim && !REDUCED);
      img.style.transform = 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px) scale(' + s.toFixed(3) + ')';
      box.classList.toggle('is-zoomed', s > 1.001);
      var lv = Math.round(s * 10) / 10, next = s >= MAX - 0.001 ? 1 : Math.floor(s + 0.001) + 1;
      zl.textContent = (lv % 1 ? lv.toFixed(1) : String(lv)) + '×';
      zb.setAttribute('aria-label', 'Zoom, now ' + zl.textContent + '. Press for ' + next + '×');
      /* the mark says what the next press does: in, or back out to 1× */
      if ((next === 1) !== zout) { zout = next === 1; zi.innerHTML = zout ? ICON.minus : ICON.plus; }
    }
    /* zoom to s2, keeping the point (px, py) from the centre where it is */
    function zoomTo(s2, px, py, anim) {
      s2 = Math.max(1, Math.min(MAX, s2));
      px = px || 0; py = py || 0;
      tx = px - (px - tx) * s2 / s; ty = py - (py - ty) * s2 / s;
      s = s2;
      if (s <= 1.001) { s = 1; tx = 0; ty = 0; }
      clamp(); apply(anim);
    }
    function step(dir) {
      var to = dir > 0 ? (s >= MAX - 0.001 ? 1 : Math.floor(s + 0.001) + 1) : Math.max(1, Math.ceil(s - 0.001) - 1);
      zoomTo(to, 0, 0, true);
    }
    function centre(e) { var b = bounds(); return { x: e.clientX - b.l - b.w / 2, y: e.clientY - b.t - b.h / 2 }; }

    function show(i) {
      cur = (i + N) % N;
      var sl = list[cur], token = ++seq;
      s = 1; tx = 0; ty = 0;
      $('#lv-c').textContent = sl.count;
      $('#lv-cap').textContent = sl.cap || sl.alt;
      $('#lv-live').textContent = sl.count + ': ' + sl.alt;
      lfail.hidden = true;
      img.classList.remove('is-shown');
      fit();
      var pre = new Image();
      var slow = setTimeout(function () { if (token === seq) { lbar.classList.add('is-on'); } }, 150);
      pre.onload = function () {
        if (token !== seq) { return; }
        clearTimeout(slow); lbar.classList.remove('is-on');
        img.src = sl.src; img.alt = sl.alt;
        frame(function () { if (token === seq) { img.classList.add('is-shown'); } });
      };
      pre.onerror = function () {
        if (token !== seq) { return; }
        clearTimeout(slow); lbar.classList.remove('is-on');
        img.removeAttribute('src'); img.alt = '';
        lfail.hidden = false;
      };
      pre.src = sl.src;
    }
    function isOpen() { return !box.hidden; }
    /* zoomed onto one part of the picture (x, y, w, h in its own pixels), as
       large as the screen allows up to 3×: a label photo opened from its panel */
    function focusOn(r) {
      var b = bounds(), sl = list[cur], k = fw / sl.w;
      if (!k || !r) { return; }
      var s2 = Math.max(1, Math.min(MAX, b.w * 0.94 / (r[2] * k), b.h * 0.94 / (r[3] * k)));
      s = s2;
      tx = -((r[0] + r[2] / 2) - sl.w / 2) * k * s;
      ty = -((r[1] + r[3] / 2) - sl.h / 2) * k * s;
      if (s <= 1.001) { s = 1; tx = 0; ty = 0; }
      clamp(); apply(false);
    }
    function open(i, from, focus) {
      opener = from || doc.activeElement;
      box.hidden = false;
      background().forEach(function (el) { el.setAttribute('inert', ''); });
      doc.documentElement.style.overflow = 'hidden';
      void box.offsetWidth; /* so the fade starts from nothing */
      box.classList.add('is-open');
      show(i);
      if (focus) { focusOn(focus); }
      $('#lv-x').focus();
    }
    function close() {
      if (!isOpen()) { return; }
      box.classList.remove('is-open', 'is-zoomed');
      box.hidden = true;
      background().forEach(function (el) { el.removeAttribute('inert'); });
      doc.documentElement.style.overflow = '';
      if (api.onClose) { api.onClose(cur); }
      if (opener && opener.isConnected && visible(opener)) { opener.focus({ preventScroll: true }); }
    }
    $('#lv-x').addEventListener('click', close);
    $('#lv-p').addEventListener('click', function () { show(cur - 1); });
    $('#lv-n').addEventListener('click', function () { show(cur + 1); });
    zb.addEventListener('click', function () { step(1); });
    $('#lv-retry').addEventListener('click', function () { show(cur); });
    /* its keys are heard wherever focus is while it is open: a click on the
       picture must not leave the keyboard behind */
    st.addEventListener('pointerdown', function () { if (!box.contains(doc.activeElement)) { box.focus({ preventScroll: true }); } });
    doc.addEventListener('keydown', function (e) {
      if (!isOpen()) { return; }
      var k = e.key;
      if (!box.contains(doc.activeElement)) { box.focus({ preventScroll: true }); }
      if (k === 'Escape') { e.preventDefault(); close(); return; }
      if (k === 'Tab') {
        var f = focusables(box);
        if (!f.length) { return; }
        var at = f.indexOf(doc.activeElement);
        if (e.shiftKey && at <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && (at < 0 || at === f.length - 1)) { e.preventDefault(); f[0].focus(); }
        return;
      }
      if (e.target.closest && e.target.closest('button') && (k === 'Enter' || k === ' ')) { return; }
      if (k === '+' || k === '=') { e.preventDefault(); step(1); return; }
      if (k === '-' || k === '_') { e.preventDefault(); step(-1); return; }
      if (k === '0') { e.preventDefault(); zoomTo(1, 0, 0, true); return; }
      var arrows = { ArrowLeft: [1, 0], ArrowRight: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[k];
      if (!arrows) { return; }
      e.preventDefault();
      if (s > 1.001) { tx += arrows[0] * 80; ty += arrows[1] * 80; clamp(); apply(true); }
      else if (k === 'ArrowLeft') { show(cur - 1); }
      else if (k === 'ArrowRight') { show(cur + 1); }
    });
    window.addEventListener('resize', function () { if (isOpen()) { fit(); } });

    /* pointers: drag to pan, pinch to zoom, a swipe at 1× to move, a double
       tap or double click to zoom where it lands */
    var pts = {}, drag = null, pinch = null, tap = { t: 0, x: 0, y: 0 };
    function pair() { var k = Object.keys(pts); return k.length === 2 ? [pts[k[0]], pts[k[1]]] : null; }
    st.addEventListener('pointerdown', function (e) {
      if (e.target.closest('button')) { return; }
      try { st.setPointerCapture(e.pointerId); } catch (er) { /* already released */ }
      pts[e.pointerId] = { x: e.clientX, y: e.clientY };
      var two = pair();
      if (two) {
        var c = centre({ clientX: (two[0].x + two[1].x) / 2, clientY: (two[0].y + two[1].y) / 2 });
        pinch = { d: Math.hypot(two[0].x - two[1].x, two[0].y - two[1].y) || 1, s: s, x: c.x, y: c.y, tx: tx, ty: ty };
        drag = null;
      } else {
        drag = { x: e.clientX, y: e.clientY, tx: tx, ty: ty, moved: false, type: e.pointerType };
      }
    });
    st.addEventListener('pointermove', function (e) {
      if (!pts[e.pointerId]) { return; }
      pts[e.pointerId] = { x: e.clientX, y: e.clientY };
      var two = pair();
      if (pinch && two) {
        var c = centre({ clientX: (two[0].x + two[1].x) / 2, clientY: (two[0].y + two[1].y) / 2 });
        var s2 = Math.max(1, Math.min(MAX, pinch.s * Math.hypot(two[0].x - two[1].x, two[0].y - two[1].y) / pinch.d));
        tx = c.x - (pinch.x - pinch.tx) * s2 / pinch.s; ty = c.y - (pinch.y - pinch.ty) * s2 / pinch.s; s = s2;
        clamp(); apply(false);
        return;
      }
      if (!drag) { return; }
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 6) { drag.moved = true; }
      if (s > 1.001 && drag.moved) {
        box.classList.add('is-dragging');
        tx = drag.tx + dx; ty = drag.ty + dy; clamp(); apply(false);
      }
    });
    function up(e) {
      if (!pts[e.pointerId]) { return; }
      delete pts[e.pointerId];
      box.classList.remove('is-dragging');
      if (pinch) {
        if (!pair()) { pinch = null; if (s < 1.05) { zoomTo(1, 0, 0, true); } }
        drag = null;
        return;
      }
      if (!drag || e.type === 'pointercancel') { drag = null; return; }
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y, d = drag;
      drag = null;
      if (s <= 1.001 && d.moved && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) { show(dx < 0 ? cur + 1 : cur - 1); return; }
      if (!d.moved && d.type !== 'mouse') {
        var now = Date.now();
        if (now - tap.t < 320 && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) < 30) {
          tap.t = 0;
          var c = centre(e);
          if (s > 1.001) { zoomTo(1, 0, 0, true); } else { zoomTo(2, c.x, c.y, true); }
        } else { tap = { t: now, x: e.clientX, y: e.clientY }; }
      }
    }
    st.addEventListener('pointerup', up);
    st.addEventListener('pointercancel', up);
    function onPicture(e) { var r = img.getBoundingClientRect(); return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; }
    st.addEventListener('dblclick', function (e) {
      /* the pointer is captured by the stage, so the target is the stage: ask
         whether the point is on the picture */
      if (!onPicture(e)) { return; }
      var c = centre(e);
      if (s > 1.001) { zoomTo(1, 0, 0, true); } else { zoomTo(2, c.x, c.y, true); }
    });
    /* a trackpad pinch arrives as a wheel with the control key; once zoomed,
       a plain wheel pans */
    st.addEventListener('wheel', function (e) {
      e.preventDefault();
      if (e.ctrlKey) { var c = centre(e); zoomTo(s * Math.exp(-e.deltaY * 0.01), c.x, c.y, false); return; }
      if (s > 1.001) { tx -= e.deltaX; ty -= e.deltaY; clamp(); apply(false); }
    }, { passive: false });

    var api = { open: open, close: close, isOpen: isOpen, onClose: null, index: function () { return cur; } };
    return api;
  }

  /* ── a product page: written in full as HTML; this adds the viewer and folds ── */
  function initProduct() {
    var box = $('.pdp');
    if (!box) { return; }
    var id = box.getAttribute('data-product');
    var p = L ? L.products.filter(function (x) { return x.id === id; })[0] : null;

    /* fold every section but the first; all of them are open in the HTML */
    $$('.acc-b', box).forEach(function (b, i) {
      var panel = doc.getElementById(b.getAttribute('aria-controls'));
      if (i === 0 || !panel) { return; }
      b.setAttribute('aria-expanded', 'false');
      panel.classList.remove('is-open');
      panel.setAttribute('inert', '');
    });
    var acc = $('.acc', box);
    if (acc) {
      acc.addEventListener('click', function (e) {
        var b = e.target.closest('.acc-b');
        if (!b) { return; }
        var panel = doc.getElementById(b.getAttribute('aria-controls'));
        var on = b.getAttribute('aria-expanded') !== 'true';
        b.setAttribute('aria-expanded', on ? 'true' : 'false');
        panel.classList.toggle('is-open', on);
        if (on) { panel.removeAttribute('inert'); } else { panel.setAttribute('inert', ''); }
      });
    }
    if (!p || !R) { return; }

    /* the gallery: the packshot, every photo, then how buying works. The
       thumbnails become buttons, and arrows, keys and swipes move between
       them; the bar shows only while a picture is still loading. */
    var list = R.slides(p, ROOT), BUY = list.length, total = list.length + 1;
    var im = $('#stage-img'), stage = $('#stage'), sbar = $('#stage-bar'), fail = $('#stage-fail'), card = $('#stage-buy');
    var cnt = $('#stage-count'), live = $('#stage-live');
    function toButton(a, cls) {
      var b = doc.createElement('button');
      b.type = 'button';
      b.className = cls || a.className;
      ['data-i', 'data-photo', 'data-focus', 'aria-current', 'aria-label'].forEach(function (k) { if (a.hasAttribute(k)) { b.setAttribute(k, a.getAttribute(k)); } });
      while (a.firstChild) { b.appendChild(a.firstChild); }
      a.parentNode.replaceChild(b, a);
      return b;
    }
    var thumbs = $$('.thumb', box).map(function (a) { var b = toButton(a); if ($('img', b)) { watch(b); } return b; });
    /* Full size opens the viewer (without scripts it is a link to the picture) */
    var full = toButton($('#full'), '');
    full.id = 'full';
    full.setAttribute('aria-haspopup', 'dialog');
    $('.sr', full).textContent = ' (opens a full-screen viewer)';
    var V = makeViewer(p, list);
    V.onClose = function (i) { if (V.from === 'stage' && i !== cur) { show(i); } };
    function openAt(i, from, opener, focus) { V.from = from; V.open(i, opener, focus); }

    /* the thumbnails are a column beside the picture as tall as it (or, below
       900 px, a row to the screen's edges), so the strip itself scrolls to
       keep the current one in view; the page never moves */
    var strip = $('.thumbs', box), narrow = window.matchMedia ? window.matchMedia('(max-width: 899px)') : null;
    /* the column (360 to 559 px, and from 900 px) holds a whole number of
       thumbnails and snaps to them: the current one is brought to the middle,
       so it never rests under a faded end; at the ends the strip stops on the
       first or last */
    function column() { return getComputedStyle(strip).flexDirection === 'column'; }
    function keepInView(t) {
      if (!strip || !t) { return; }
      if (column()) {
        var li = thumbs.map(function (b) { return b.parentNode; }), k = thumbs.indexOf(t);
        if (li.length < 2 || k < 0) { return; }
        var top0 = li[0].getBoundingClientRect().top, pitch = li[1].getBoundingClientRect().top - top0;
        var gap = pitch - li[0].getBoundingClientRect().height, ccs = getComputedStyle(strip);
        var room = strip.clientHeight - parseFloat(ccs.paddingTop) - parseFloat(ccs.paddingBottom);
        var n = Math.max(1, Math.round((room + gap) / pitch));
        var first = Math.max(0, Math.min(k - Math.floor((n - 1) / 2), li.length - n));
        var to = Math.min(li[first].getBoundingClientRect().top - top0, strip.scrollHeight - strip.clientHeight);
        if (Math.abs(strip.scrollTop - to) < 1) { return; }
        if (strip.scrollTo) { strip.scrollTo({ top: to, behavior: REDUCED ? 'auto' : 'smooth' }); } else { strip.scrollTop = to; }
        return;
      }
      if (!narrow || !narrow.matches) { return; }
      var s = strip.getBoundingClientRect(), r = t.getBoundingClientRect(), cs = getComputedStyle(strip), dy = 0, dx = 0;
      var pad = function (k) { var v = parseFloat(cs['scrollPadding' + k]); return isNaN(v) ? 4 : Math.max(4, v); };
      if (r.top < s.top + pad('Top')) { dy = r.top - s.top - pad('Top'); } else if (r.bottom > s.bottom - pad('Bottom')) { dy = r.bottom - s.bottom + pad('Bottom'); }
      if (r.left < s.left + pad('Left')) { dx = r.left - s.left - pad('Left'); } else if (r.right > s.right - pad('Right')) { dx = r.right - s.right + pad('Right'); }
      if (!dx && !dy) { return; }
      if (strip.scrollBy) { strip.scrollBy({ top: dy, left: dx, behavior: REDUCED ? 'auto' : 'smooth' }); } else { strip.scrollTop += dy; strip.scrollLeft += dx; }
    }
    /* each end of the column fades while more thumbnails lie past it: its
       edge is 0 (faded) with 24 px or more still to scroll that way, and
       rises to 1 (no fade) as the strip reaches that end */
    var endsQueued = false;
    function ends() {
      endsQueued = false;
      if (!strip) { return; }
      var up = strip.scrollTop, down = strip.scrollHeight - strip.clientHeight - up;
      var edge = function (d) { return d < 1 ? '1' : String(Math.round(Math.max(0, 1 - d / 24) * 1000) / 1000); };
      strip.style.setProperty('--mt', edge(up));
      strip.style.setProperty('--mb', edge(down));
    }
    function queueEnds() { if (!endsQueued) { endsQueued = true; frame(ends); } }
    if (strip) {
      /* the strip opens at its start, on the current (first) picture; the
         column's height is known from the first layout, so this only holds
         that place against any browser that snapped it elsewhere first */
      strip.scrollTop = 0;
      strip.scrollLeft = 0;
      strip.addEventListener('scroll', queueEnds, { passive: true });
      window.addEventListener('resize', queueEnds);
      window.addEventListener('load', queueEnds);
      ends();
    }
    var cur = 0, seq = 0;
    function show(i) {
      i = (i + total) % total;
      var token = ++seq;
      cur = i;
      thumbs.forEach(function (t, k) { t.setAttribute('aria-current', k === i ? 'true' : 'false'); });
      keepInView(thumbs[i]);
      fail.hidden = true;
      /* the last card: how buying works, designed in the page */
      var buy = i === BUY;
      stage.classList.toggle('is-buy', buy);
      card.hidden = !buy;
      cnt.hidden = buy;
      full.hidden = buy;
      if (buy) {
        sbar.classList.remove('is-on');
        im.hidden = true;
        if (live) { live.textContent = 'How buying works'; }
        return;
      }
      var sl = list[i];
      im.hidden = false;
      im.classList.toggle('is-pack', sl.kind === 'pack');
      cnt.textContent = sl.count;
      if (live) { live.textContent = sl.label; }
      im.classList.remove('is-shown');
      var pre = new Image();
      var slow = setTimeout(function () { if (token === seq) { sbar.classList.add('is-on'); } }, 150);
      pre.onload = function () {
        if (token !== seq) { return; }
        clearTimeout(slow);
        sbar.classList.remove('is-on');
        im.src = sl.src;
        im.alt = sl.alt;
        frame(function () { if (token === seq) { im.classList.add('is-shown'); } });
      };
      pre.onerror = function () {
        if (token !== seq) { return; }
        clearTimeout(slow);
        sbar.classList.remove('is-on');
        im.removeAttribute('src');
        im.alt = '';
        fail.hidden = false;
      };
      pre.src = sl.src;
    }
    /* the first picture is already in the page; if it fails, say so */
    function firstFailed() { if (cur === 0 && seq === 0) { im.classList.remove('is-shown'); im.alt = ''; fail.hidden = false; } }
    im.addEventListener('error', firstFailed);
    if (im.complete && !im.naturalWidth && im.getAttribute('src')) { firstFailed(); }
    $('#stage-retry').addEventListener('click', function () { stage.focus(); show(cur); });
    thumbs.forEach(function (t) {
      t.addEventListener('click', function () { show(+t.getAttribute('data-i')); });
    });
    $('#prev').addEventListener('click', function () { show(cur - 1); });
    $('#next').addEventListener('click', function () { show(cur + 1); });
    full.addEventListener('click', function () { if (cur < BUY) { openAt(cur, 'stage', full); } });
    stage.setAttribute('aria-label', stage.getAttribute('aria-label') + '. Use the arrow keys to move between them, and Enter to view one full screen.');
    stage.addEventListener('keydown', function (e) {
      if (e.target !== stage) { return; }
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(cur - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); show(cur + 1); }
      else if ((e.key === 'Enter' || e.key === ' ') && cur < BUY) { e.preventDefault(); openAt(cur, 'stage', stage); }
    });
    /* a tap or click on the picture opens it full screen; a swipe moves */
    var x0 = null, y0 = null, swiped = false;
    stage.addEventListener('pointerdown', function (e) { swiped = false; if (e.pointerType !== 'mouse') { x0 = e.clientX; y0 = e.clientY; } });
    stage.addEventListener('pointerup', function (e) {
      if (x0 === null) { return; }
      var dx = e.clientX - x0, dy = e.clientY - y0;
      x0 = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) { swiped = true; show(dx < 0 ? cur + 1 : cur - 1); }
    });
    stage.addEventListener('pointercancel', function () { x0 = null; });
    im.addEventListener('click', function () { if (!swiped && cur < BUY) { openAt(cur, 'stage', full); } });

    /* every "View photo N" by the label text opens that photo full screen */
    $$('.lab-ph[data-photo]').forEach(function (a) {
      var b = toButton(a, 'lab-ph');
      b.setAttribute('aria-haspopup', 'dialog');
      $('.sr', b).textContent = ' (opens the label photo full screen)';
      b.addEventListener('click', function () {
        var n = +b.getAttribute('data-photo'), i = -1, f = b.getAttribute('data-focus');
        list.forEach(function (s, k) { if (i < 0 && s.kind === 'photo' && s.n === n) { i = k; } });
        /* from beside a facts panel, the photo opens zoomed onto that panel */
        if (i >= 0) { openAt(i, 'label', b, f ? f.split(',').map(Number) : null); }
      });
    });

    initBuyBar();
  }

  /* ── phones: a slim buy bar once the price and Buy have scrolled away ──
     Below 900 px the price and its date sit above the gallery and Buy on
     eBay under it. The bar shows once the price has scrolled above the
     screen, while Buy on eBay is not whole on it either (still below, or
     passed), and steps aside for the footer (and its eBay notice); so the
     price and Buy are always one glance away, and never shown twice. While it shows,
     a focused element is never left underneath it. */
  function initBuyBar() {
    /* a sold-out page's second listing (the two-pack) has its own price and Buy, in its block in the buy box */
    var two = $('#buy-two');
    var bb = $('#bbar'), price = two ? two.closest('.alt').querySelector('.alt-p') : $('.buy-price'), btn = two || $('#buy'), foot = $('.foot'), topEl = $('#top');
    if (!bb || !price || !btn || !window.matchMedia) { return; }
    var mq = window.matchMedia('(max-width: 899px)'), queued = false;
    /* measured on every scroll (not by an observer, which stays silent when a
       jump to the top carries the buy box from above the screen to below it) */
    function update() {
      queued = false;
      var head = topEl ? topEl.getBoundingClientRect().bottom : 0;
      var p = price.getBoundingClientRect(), b = btn.getBoundingClientRect();
      var passed = p.bottom <= head + 1;
      /* Buy on eBay counts as shown only when it is whole on the screen: a
         sliver at the bottom edge leaves the bar up, with its own button */
      var btnIn = b.top >= head - 1 && b.bottom <= window.innerHeight + 1;
      var footIn = !!foot && foot.getBoundingClientRect().top < window.innerHeight;
      var on = mq.matches && passed && !btnIn && !footIn;
      if (on === bb.classList.contains('is-on')) { return; }
      bb.classList.toggle('is-on', on);
      doc.documentElement.classList.toggle('has-bbar', on);
    }
    function soon() { if (!queued) { queued = true; frame(update); } }
    window.addEventListener('scroll', soon, { passive: true });
    window.addEventListener('resize', soon);
    if (mq.addEventListener) { mq.addEventListener('change', soon); } else if (mq.addListener) { mq.addListener(soon); }
    update();
    doc.addEventListener('focusin', function (e) {
      if (!bb.classList.contains('is-on') || bb.contains(e.target) || !e.target.getBoundingClientRect) { return; }
      var r = e.target.getBoundingClientRect(), t = bb.getBoundingClientRect().top;
      if (r.bottom > t - 8) { window.scrollBy({ top: r.bottom - t + 16, behavior: 'auto' }); }
    });
  }


  /* ── the old address, product.html?p=<id>: straight to the product's page ── */
  function initResolve() {
    var id = new URLSearchParams(location.search).get('p');
    var p = id && L ? L.products.filter(function (x) { return x.id === id; })[0] : null;
    if (p && R) {
      busy(true);
      location.replace(R.productHref(p, ROOT) + location.hash);
      return;
    }
    if (id) {
      var m = $('#resolve-msg');
      if (m) { m.textContent = 'That product isn’t here. Everything in the shop now is below.'; }
    }
  }

  buildPanel();
  buildMenu();
  if (PAGE === 'shop') { initShop(); }
  else if (PAGE === 'product') { initProduct(); }
  else if (PAGE === 'resolve') { initResolve(); }
  if (PAGE !== 'shop') { $$('.card .ph').forEach(watch); }
  initRows();
  initCatlist();
  $$('.hero-m img, .dhero-m img, .dir-detail img, .going-m img, .catlist-stage img, .catlist-tile img, .dim img, .dlink-m img, .panel-tile img, .thumb img, .ctile img').forEach(quiet);
  $$('[data-life="checked"]').forEach(function (el) { if (L) { el.textContent = L.checkedText; } });
}());
