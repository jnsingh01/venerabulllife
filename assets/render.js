/* Venerabull Life — the markup, written once.

   Every piece of shared markup comes from here: the eBay notice, the header and
   footer, the product cards and rows, the comparison table, the Shop panel and
   the phone menu, and the whole product page. The browser uses it to redraw
   the shop when someone filters or sorts and to build the menus
   (assets/life.js), and the site's generator uses the very same functions to
   write the static pages, so the HTML a visitor gets before any script runs
   and the HTML the script draws cannot differ. Pure functions of window.LIFE
   (assets/catalog.js); nothing here touches the page.

   `root` is the path from the page to the site's top: '' for the pages at the
   top, '../' for a product page. */
(function (g) {
  'use strict';

  var STORE = 'https://www.ebay.com/str/everydaywellness';
  var STORE_NAME = 'Everyday Wellness';
  var NOTICE = 'For now, everything we sell is sold through our eBay store, ' + STORE_NAME + '.';
  /* the one way an empty category is described, everywhere */
  var NOT_HERE = 'Not here yet';

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function money(n) { return '$' + Number(n).toFixed(2); }
  /* listed price ÷ the servings on the label, to the cent; "about" when the
     label gives the servings as approximate */
  function perServing(p) { return (p.servings.about ? 'about ' : '') + money(Math.round(p.price * 100 / p.servings.n) / 100); }
  function servingsText(p) { return (p.servings.about ? 'About ' : '') + p.servings.n; }
  function fullName(p) { return p.brand + ' ' + p.name; }
  /* the name a screen reader hears for a product: its flavour too where another
     product shares its brand and name (twin, below) */
  function named(p) { return fullName(p) + (twin(p) ? ', ' + p.flavor : ''); }
  function items(n) { return n + (n === 1 ? ' product' : ' products'); }
  /* A product whose listing was sold out when last checked (`stock.out`) keeps
     its page, its place in the range and its item number for the restock, but
     no page shows its price or a way to buy it: each place it appears says it
     was sold out, and when that was checked. */
  function out(p) { return !!(p.stock && p.stock.out); }
  /* a list as it is shown: in its own order, with any sold-out product after the rest */
  function shelf(list) { return list.filter(function (p) { return !out(p); }).concat(list.filter(out)); }
  /* the date a product's listing, and so its price, was checked */
  function checkedOf(p, L) { L = L || g.LIFE || {}; return (p.ebay && p.ebay.checkedText) || L.checkedText || ''; }
  /* the date a listing's terms (condition, shipping, location, returns) were seen,
     where that differs from its price's check */
  function termsOf(p, L) { return (p.ebay && p.ebay.termsCheckedText) || checkedOf(p, L); }
  /* every price's check date in one phrase: "30 Oct 2026", or, when a listing
     was checked on another day, "30 Oct 2026 (Ka’Chava’s on 3 Nov 2026)" */
  /* "Equip’s", "Just Ingredients’": a brand's possessive, once per date however
     many of its products were checked that day */
  function possessive(b) { return b + (/s$/.test(b) ? '’' : '’s'); }
  /* A brand whose listings were checked on more than one day is named with each
     product's flavor ("Equip Chocolate’s on 7 Nov 2026"), so no date is read as
     the whole brand's. */
  function checkedAll(L, of, keep) {
    var by = {}, order = [], days = {};
    of = of || checkedOf;
    /* a sold-out product shows no price or terms, so it names no date here */
    var list = L.products.filter(function (p) { return !out(p) && (!keep || keep(p)); });
    list.forEach(function (p) { (days[p.brand] = days[p.brand] || {})[of(p, L)] = 1; });
    /* a brand is named with each product's flavor when its products here carry more than one date, or when one of
       its products isn't in this list (sold out, or its terms only partly recorded), so a date never reads as the
       whole brand's */
    function whole(b) { return L.products.filter(function (x) { return x.brand === b; }).every(function (x) { return list.indexOf(x) >= 0; }); }
    function add(d, who) {
      if (d === L.checkedText) { return; }
      if (!by[d]) { by[d] = []; order.push(d); }
      if (by[d].indexOf(who) < 0) { by[d].push(who); }
    }
    list.forEach(function (p) {
      add(of(p, L), possessive(Object.keys(days[p.brand]).length > 1 || !whole(p.brand) ? p.brand + ' ' + p.flavor : p.brand));
    });
    /* a price's dates take in each second listing's own ("Equip Chocolate two-pack’s on 9 Nov 2026"); its terms are
       left to its listing, so a phrase of terms never names it */
    if (of === checkedOf && !keep) {
      L.products.forEach(function (p) { if (also(p)) { add(also(p).ebay.checkedText, possessive(hold(alsoName(p)))); } });
    }
    return day(L.checkedText) + (order.length ? ' (' + order.map(function (d) { return andList(by[d]) + ' on ' + day(d); }).join('; ') + ')' : '');
  }
  /* The listing terms a product's own records verify: all four for most listings (condition and shipping seen on
     the listing, item location and returns the store's standing policies); a relist whose records name only some
     (`ebay.terms`: Equip Chocolate's and Ascent Chocolate's name only free shipping) shows only those, and says the
     rest are shown on the listing. */
  var TERMS = [['condition', 'Condition'], ['shipping', 'Shipping'], ['from', 'Item location'], ['returns', 'Returns']];
  function termKeys(p) { return (p && p.ebay && p.ebay.terms) || TERMS.map(function (t) { return t[0]; }); }
  function partTerms(p) { return !!(p.ebay && p.ebay.terms); }
  function unseen(p) { return TERMS.filter(function (t) { return termKeys(p).indexOf(t[0]) < 0; }).map(function (t) { return t[1].toLowerCase(); }); }
  /* the shown listings whose terms are only partly recorded */
  function partListed(L) { return L.products.filter(function (p) { return !out(p) && partTerms(p); }); }
  /* every listing whose terms are all recorded, with each one's date; then which are not covered */
  function termsAll(L) {
    var part = partListed(L), alsos = L.products.filter(also);
    var but = part.map(function (p) { return possessive(p.brand + ' ' + p.flavor); }).concat(alsos.map(function (p) { return 'the ' + possessive(hold(alsoName(p))); }));
    return checkedAll(L, termsOf, function (p) { return !partTerms(p); }) + (but.length ? ', all but ' + andList(but) : '');
  }
  /* what a partly recorded listing's records show, said where the shared terms are */
  function partNote(L) {
    var lst = L.listing;
    var say = { condition: lst.condition.toLowerCase() + ' condition', shipping: lst.shipping.toLowerCase(), from: 'item located in ' + day(lst.from), returns: lst.returns.replace(/\.$/, '').toLowerCase() };
    return partListed(L).map(function (p) {
      return possessive(p.brand + ' ' + p.flavor) + ' relisted listing showed ' + andList(termKeys(p).map(function (k) { return say[k]; })) + ' when it was published on ' + day(termsOf(p, L)) +
        '. Its ' + andList(unseen(p)) + ' are shown on the listing.';
    }).join(' ');
  }
  /* a second listing's terms: none are recorded here, so the shared terms never read as its */
  function alsoNote(L) {
    return L.products.filter(also).map(function (p) { return 'The ' + hold(alsoName(p)) + '’s condition, shipping, item location and returns are shown on its own listing.'; }).join(' ');
  }
  /* every note that follows the shared terms */
  function termsNote(L) { return [partNote(L), alsoNote(L)].filter(Boolean).join(' '); }
  function andList(b) { return b.length > 1 ? b.slice(0, -1).join(', ') + ' and ' + b[b.length - 1] : b.join(''); }
  /* A printed date known only for the bag in the photos (a bag bought
     through its current listing may carry another, which isn't recorded) says
     whose date it is wherever it is shown, and the product page says what
     that means. */
  var PHOTO_DATE = 'on the bag in the photos';
  var PHOTO_DATE_NOTE = 'That date is the one printed on the bag in the photos. A bag bought through the current listing may carry a different date; ' +
    'to confirm it, ask through “Contact seller” on the listing.';
  /* the same note on a sold-out product's page, which offers no way to buy */
  var PHOTO_DATE_OUT = 'That date is the one printed on the bag in the photos.';
  function whose(p) { return p.date.photographed ? ' ' + PHOTO_DATE : ''; }
  /* A date no photo shows (`date.none`: Equip's strawberry pouches print theirs
     where these photos don't reach) is never set out as printed: the page says
     the photos don't show it, and what the listing recorded, and when. */
  function dateNote(p) {
    var d = p.date, k = d.kind.toLowerCase();
    return 'No ' + k.replace(/ /g, '-') + ' date can be read in these photos. When the listing was published on ' + day(d.listed.on) + ', its ' + (p.bundle ? p.bundle.units : 'bags') +
      ' were recorded as ' + k + ' ' + day(d.listed.text) + '. To confirm the date on ' + (p.bundle ? 'a bundle' : 'a bag') + ' bought now, ask through “Contact seller” on the listing.';
  }
  /* A listing that sells several identical packages together (`bundle`: Equip's
     two strawberry pouches): every page says how many and each one's size, and
     the price, the servings and the per-serving price are the whole bundle's. */
  function count(p) { return p.bundle.n + ' ' + p.bundle.units; }
  /* what a packshot shows: "the bag", or for a bundle, "both pouches" */
  function thing(p) { return p.bundle ? (p.bundle.n === 2 ? 'both ' : 'all ' + p.bundle.n + ' ') + p.bundle.units : 'the bag'; }
  function cap1(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  /* where a sold-out product's page points instead of Buy: the shop's products
     of its flavor (itself among them, last), or else the whole shop */
  function instead(p, root) {
    var L = g.LIFE || { products: [] }, f = p.facet.flavor && p.facet.flavor[0];
    var more = f && L.products.some(function (x) { return x !== p && !out(x) && (x.facet.flavor || []).indexOf(f) >= 0; });
    return more ? { href: shopHref(root, 'flavor', f), text: 'See all ' + f.toLowerCase() } : { href: shopHref(root), text: 'See the whole shop' };
  }
  /* on a sold-out page: the brand's other products for sale, if it has any here */
  function sameBrand(p) {
    var L = g.LIFE || { products: [] };
    return L.products.some(function (x) { return x !== p && x.brand === p.brand && !out(x); });
  }
  /* A second listing of a product's flavor in another pack (`also`: Equip Chocolate's two-pack, two smaller pouches).
     It is an item of its own: wherever the product appears it is offered in words, apart from the product's own
     figures, with its pack count and each package's size, its price for every package together, the date that price
     was checked and its own Buy, which names it. No photo here shows it, so it never stands under the product's
     picture as if it were that package. */
  function also(p) { return (p && p.also) || null; }
  /* "Equip Chocolate two-pack", the name it goes by in running text and to a screen reader */
  function alsoName(p) { return p.brand + ' ' + p.flavor + ' ' + p.also.name; }
  /* the name as it is shown in running text: its hyphen a non-breaking one, so "two-pack" never parts at a line's end
     (ids, links and the words search goes by keep the plain hyphen) */
  function hold(s) { return String(s).replace(/(\S)-(\S)/g, '$1\u2011$2'); }
  function alsoCount(a) { return a.n + ' ' + a.units; }
  /* "for both", or "for all 3" */
  function alsoFor(a) { return 'for ' + (a.n === 2 ? 'both' : 'all ' + a.n); }
  function alsoPer(a) { return money(Math.round(a.price * 100 / a.servings) / 100); }
  /* "9.1 oz", each package's size without its grams, for a narrow line */
  function alsoEach(a) { return a.each.replace(/ \(.*\)$/, ''); }
  function alsoBuy(p, text, cls) {
    return ext(p.also.ebay.url, text, cls, 'opens the eBay listing for the ' + alsoName(p) + ', ' + alsoCount(p.also) + ', in a new tab');
  }
  /* "6 Nov 2026" in one piece in running text (a no-break space between its parts) */
  function day(d) { return String(d || '').replace(/ /g, '\u00a0'); }
  /* escaped text whose figures keep their units ("9.1 oz", "20 g") and whose "&" keeps its next word */
  function glue(s) { return esc(s).replace(/(\d) (g|mg|oz|servings)\b/g, '$1&nbsp;$2').replace(/&amp; /g, '&amp;&nbsp;'); }
  function productHref(p, root) { return (root || '') + 'products/' + p.id + '.html'; }
  function photo(p, n, card, root) { return (root || '') + 'assets/img/' + p.id + '-' + n + (card ? '-card' : '') + '.jpg'; }
  /* the packshot: the package from one of its photos, on the plain ground */
  function pack(p, card, root) { return (root || '') + 'assets/img/' + p.id + '-pack' + (card ? '-card' : '') + '.jpg'; }
  /* Every picture a product page shows, in order: the packshot first, then
     each photo of the actual package. Each says exactly what it is. */
  /* Every photo was taken under a warm lamp, so no packshot's colors are
     exact. A packshot whose white print measured cleanly has the lamp's cast
     reduced by one matrix; the others keep their colors as photographed. Each
     says which, everywhere it is described. */
  function colors(p) {
    var its = p.bundle ? 'their' : 'its';
    return p.pack.balanced ? 'with the lamp’s color cast reduced; ' + its + ' colors are approximate'
      : its + ' colors are as photographed under a warm lamp, so they are approximate';
  }
  function slides(p, root) {
    var N = p.photos.length, out = [];
    if (p.pack) {
      out.push({ kind: 'pack', n: p.pack.photo, src: pack(p, false, root), thumb: pack(p, true, root), w: p.pack.w, h: p.pack.h, tw: 480, th: 600,
        alt: (p.bundle ? cap1(thing(p)) + ' of the ' + named(p) + ' bundle' : 'The ' + named(p) + ' bag') + ' from photo ' + p.pack.photo + ', lifted onto a plain ground' +
          (p.pack.balanced ? ' ' : '; ') + colors(p),
        /* the viewer's caption: its counter already says "From photo N" */
        cap: cap1(thing(p)) + ', lifted onto a plain ground' + (p.pack.balanced ? ' with the lamp’s color cast reduced. ' + (p.bundle ? 'Their' : 'Its') + ' colors are approximate.'
          : '. ' + (p.bundle ? 'Their' : 'Its') + ' colors are as photographed under a warm lamp, so they are approximate.'),
        count: 'From photo ' + p.pack.photo, label: cap1(thing(p)) + ' from photo ' + p.pack.photo + ', on a plain ground; colors approximate' });
    }
    p.photos.forEach(function (ph, i) {
      out.push({ kind: 'photo', n: ph.n, src: photo(p, ph.n, false, root), thumb: photo(p, ph.n, true, root), w: 720, h: 1280, tw: 405, th: 720,
        alt: ph.alt, cap: ph.alt, count: 'Photo ' + (i + 1) + ' of ' + N, label: 'Photo ' + (i + 1) + ' of ' + N + ': ' + ph.alt });
    });
    return out;
  }
  /* what the first picture is, and what the rest are */
  function galNote(p) {
    /* a bundle says what each photo shows (its photos needn't show every package
       from both sides) */
    var N = p.photos.length, rest = p.bundle && p.bundle.photos ? p.bundle.photos
      : (N === 2 ? 'Photos 1 and 2 are' : 'Photos 1 to ' + N + ' are') + ' the package as photographed, front and back.';
    if (!p.pack) { return 'Photos of the actual package, front and back.'; }
    return 'The first picture is ' + thing(p) + ' from photo ' + p.pack.photo + ', lifted onto a plain ground' + (p.pack.balanced ? ' ' : '; ') + colors(p) + '. ' + rest;
  }
  function catOf(L, id) { return L.categories.filter(function (c) { return c.id === id; })[0] || null; }
  function counts(L) {
    var n = {};
    L.products.forEach(function (p) { n[p.category] = (n[p.category] || 0) + 1; });
    return n;
  }
  function brands(L) {
    var b = [];
    L.products.forEach(function (p) { if (b.indexOf(p.brand) < 0) { b.push(p.brand); } });
    return b;
  }
  function brandList(L) { return andList(brands(L)); }
  /* every value a facet group carries, in catalogue order, with its count */
  function facetValues(L, gid) {
    var vals = [], n = {};
    L.products.forEach(function (p) {
      (p.facet[gid] || []).forEach(function (v) { if (vals.indexOf(v) < 0) { vals.push(v); } n[v] = (n[v] || 0) + 1; });
    });
    return vals.map(function (v) { return { v: v, n: n[v] }; });
  }
  /* how a facet value reads as a link: "Plant" in "Protein from" is "Plant protein" */
  function facetLabel(gid, v) { return gid === 'source' ? v + ' protein' : v; }
  function shopHref(root, key, v) { return (root || '') + 'shop.html' + (key ? '?' + key + '=' + encodeURIComponent(v) : ''); }

  var ICON = {
    chev: '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    check: '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="m2.5 6.2 2.3 2.3 4.7-5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    arrow: '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 7h8m-3-3.2L11 7l-3 3.2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    ne: '<svg class="ne" width="11" height="11" viewBox="0 0 11 11" aria-hidden="true"><path d="M3 8 8 3M4 2.6h4.4V7" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    plus: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M3 8h10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    prev: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    next: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3 5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    search: '<svg width="17" height="17" viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="5.2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="m11 11 3.4 3.4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    menu: '<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M2.5 5.5h13M2.5 12.5h13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    close: '<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="m4 4 10 10M14 4 4 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    zoom: '<svg class="zm" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M8.5 1.75h3.75V5.5M5.5 12.25H1.75V8.5M12.25 1.75 8.4 5.6M1.75 12.25 5.6 8.4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    minus: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    steps: '<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><circle cx="4" cy="5" r="1.3" fill="currentColor"/><circle cx="4" cy="10" r="1.3" fill="currentColor"/><circle cx="4" cy="15" r="1.3" fill="currentColor"/><path d="M8 5h9M8 10h9M8 15h6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>'
  };

  /* a link that leaves for eBay: always a new tab, always said so */
  function ext(href, text, cls, sr) {
    return '<a' + (cls ? ' class="' + cls + '"' : '') + ' href="' + esc(href) + '" target="_blank" rel="noopener">' + text + ICON.ne +
      '<span class="sr"> (' + esc(sr || 'opens eBay in a new tab') + ')</span></a>';
  }
  function storeLink(text, cls) { return ext(STORE, text || 'Visit the store', cls, 'opens our eBay store in a new tab'); }

  /* The site's own pictures (not product photos): every editorial image with
     its true pixel size and that of its 800-wide copy, so each <img> carries
     honest width, height and srcset values. */
  var IMG = {
    'life-hero': [1752, 897, 800, 409], 'dim-mind': [1086, 1448, 600, 800], 'dim-body': [1024, 1536, 533, 800],
    'dim-heart': [1024, 1536, 533, 800], 'dim-soul': [1024, 1536, 533, 800], 'cat-protein': [1200, 1200, 800, 800],
    'cat-vitamins': [1254, 1254, 800, 800], 'cat-skin': [1254, 1254, 800, 800], 'cat-bath': [1200, 1200, 800, 800],
    'spa-hero': [1672, 941, 800, 450], 'spa-detail': [1672, 941, 800, 450], 'rest-hero': [1774, 887, 800, 400],
    'rest-detail': [1672, 941, 800, 450], 'exp-hero': [1672, 941, 800, 450], 'exp-detail': [1200, 675, 800, 450]
  };
  /* <img> for one of those pictures. o: alt, sizes, lazy, pos (object-position), cls, high */
  function pic(name, root, o) {
    var d = IMG[name], b = (root || '') + 'assets/img/' + name;
    o = o || {};
    return '<img' + (o.cls ? ' class="' + o.cls + '"' : '') + ' src="' + b + '.jpg" srcset="' + b + '-800.jpg ' + d[2] + 'w, ' + b + '.jpg ' + d[0] + 'w"' +
      ' sizes="' + esc(o.sizes || '100vw') + '" width="' + d[0] + '" height="' + d[1] + '" alt="' + esc(o.alt || '') + '"' +
      (o.lazy === false ? '' : ' loading="lazy"') + ' decoding="async"' + (o.high ? ' fetchpriority="high"' : '') +
      (o.pos ? ' style="object-position:' + o.pos + '"' : '') + '>';
  }

  /* ── the frame of every page ───────────────────────────────────────────── */
  var NAV = [
    { id: 'shop', href: 'shop.html', name: 'Shop' },
    { id: 'spa', href: 'spa.html', name: 'Spa' },
    { id: 'rest', href: 'rest.html', name: 'Rest' },
    { id: 'experiences', href: 'experiences.html', name: 'Experiences' },
    { id: 'help', href: 'help.html', name: 'How buying works' }
  ];
  /* the directions: shown with real presence, never offered */
  var DIRECTIONS = [
    { id: 'spa', href: 'spa.html', name: 'The Spa', short: 'Spa', status: 'Not yet open', img: 'spa-hero', pos: '50% 55%',
      line: 'Warmth, water and stillness, in rooms made for quiet.',
      keys: 'thermal circuit warm rooms cool water sauna cold heat treatments quiet' },
    { id: 'rest', href: 'rest.html', name: 'Rest', short: 'Rest', status: 'Not yet available', img: 'rest-hero', pos: '62% 60%',
      line: 'Mattresses, bedding and everything for sleep, in natural materials.',
      keys: 'mattresses natural materials bedding linen cotton wool sleep bed night' },
    { id: 'experiences', href: 'experiences.html', name: 'Experiences', short: 'Experiences', status: 'Not yet available', img: 'exp-hero', pos: '50% 50%',
      line: 'Retreats, classes and gatherings, much of it outdoors.',
      keys: 'retreats classes movement breath craft gatherings food company outdoors walks woods open air' }
  ];
  /* the help page, as search finds it (`keys`: words its page uses) */
  var HELP = { href: 'help.html', name: 'How buying works', line: 'Every product is bought through its own eBay listing.',
    keys: 'ebay buy buying order delivery shipping returns payment pay price listing seller everyday wellness store' };
  var DIRECTIONS_NOTE = 'A direction for Venerabull Life, not an announcement. Nothing here can be booked or ordered yet.';

  function status(text) { return '<span class="status' + (text === 'Open now' ? ' is-open' : '') + '">' + esc(text) + '</span>'; }

  function notice(root) {
    return '<aside class="notice" aria-label="Where to buy">\n  <div class="wrap notice-in"><p>' + esc(NOTICE) + ' ' +
      storeLink('Visit the store', 'notice-a') + '</p></div>\n</aside>\n';
  }
  /* cur: which page this is (home, shop, product, spa, rest, experiences, help, resolve) */
  function header(root, cur) {
    return '<header class="top" id="top">\n  <div class="wrap top-in">\n' +
      '    <a class="brand" href="' + root + 'index.html"' + (cur === 'home' ? ' aria-current="page"' : '') + ' aria-label="Venerabull Life, home">' +
        '<img src="' + root + 'assets/venerabull-mark.png" alt="" width="30" height="24" decoding="async"><span class="brand-w">Venerabull <span>Life</span></span></a>\n' +
      '    <nav class="nav" id="nav" aria-label="Main">\n      <ul class="nav-l">\n' +
      NAV.map(function (n) {
        var here = n.id === cur || (n.id === 'shop' && (cur === 'product' || cur === 'resolve'));
        return '        <li' + (n.id === 'shop' ? ' class="nav-shop"' : '') + '><a class="nav-a' + (here ? ' is-here' : '') + '"' + (n.id === 'shop' ? ' id="shop-a"' : '') +
          ' href="' + root + n.href + '"' + (n.id === cur ? ' aria-current="page"' : '') + '>' + esc(n.name) + (n.id === 'shop' ? ' ' + ICON.chev : '') + '</a></li>\n';
      }).join('') +
      '      </ul>\n    </nav>\n' +
      '    <div class="top-end">\n' +
      '      <button class="icon-b search-t js-only" type="button" id="search-t" aria-expanded="false" aria-controls="search" aria-label="Search the shop">' + ICON.search + '</button>\n' +
      '      <form class="search js-only" role="search" action="' + root + 'shop.html" id="search">\n' +
      '        <label class="sr" for="q">Search the shop</label>\n' +
      '        ' + ICON.search.replace('<svg ', '<svg class="ico" ') + '\n' +
      '        <input id="q" name="q" type="search" placeholder="Search the shop" autocomplete="off" enterkeyhint="search">\n' +
      '        <kbd aria-hidden="true">/</kbd>\n      </form>\n' +
      '      ' + storeLink('eBay store', 'pill ebay-pill') + '\n' +
      '      <a class="icon-b menu-a" id="menu-a" href="#foot-nav">' + ICON.menu + '<span class="sr">Menu</span></a>\n' +
      '    </div>\n  </div>\n</header>\n';
  }
  function footer(L, root, cur) {
    var n = counts(L);
    function li(href, text, id, st) {
      return '<li><a href="' + root + href + '"' + (id && id === cur ? ' aria-current="page"' : '') + (st ? ' class="has-st"' : '') + '>' +
        (st ? '<span>' + text + '</span><small>' + esc(st) + '</small>' : text) + '</a></li>';
    }
    return '<footer class="foot" id="foot">\n  <div class="wrap">\n' +
      '    <div class="foot-top">\n' +
      '      <div class="foot-brand"><a class="brand" href="' + root + 'index.html" aria-label="Venerabull Life, home"><img src="' + root + 'assets/venerabull-mark.png" alt="" width="30" height="24" loading="lazy" decoding="async"><span class="brand-w">Venerabull <span>Life</span></span></a>' +
        '<p>Venerabull Life, from Venerabull. Everything for a good life: mind, body, heart and soul.</p></div>\n' +
      '      <nav class="foot-nav" id="foot-nav" aria-label="Footer">\n' +
      '        <div><h2>Shop</h2><ul>' + li('shop.html', 'The shop', 'shop') +
        L.categories.map(function (c) { return li('shop.html?c=' + c.id, esc(c.name), null, n[c.id] ? '' : NOT_HERE); }).join('') +
        li('shop.html#compare', 'Compare products') + '</ul></div>\n' +
      '        <div><h2>Life</h2><ul>' + li('index.html', 'Home', 'home') +
        DIRECTIONS.map(function (d) { return li(d.href, esc(d.short), d.id, d.status); }).join('') + '</ul></div>\n' +
      '        <div><h2>Help</h2><ul>' + li('help.html', 'How buying works', 'help') + '<li>' + storeLink('Our eBay store') + '</li></ul></div>\n' +
      '      </nav>\n    </div>\n' +
      '    <p class="foot-store">' + esc(NOTICE) + ' ' + storeLink('Visit the store') + '</p>\n' +
      '    <div class="foot-fine">\n' +
      '      <p>Purchases are completed on eBay, in eBay’s own checkout. Product facts come from each package’s label, and the label on the package is authoritative. Nothing on this site is medical advice.</p>\n' +
      '      <p>The images of the spa, Rest and Experiences are illustrations of directions that aren’t open yet. Category and lifestyle images are illustrations too; product photos are of the actual packages.</p>\n' +
      '      <p>© 2026 Venerabull</p>\n    </div>\n  </div>\n</footer>\n';
  }

  /* ── the Shop panel (wide screens) and the menu sheet (phones) ──────────── */
  function panelGroups(L, root) {
    var n = counts(L);
    var cats = '<li><a href="' + shopHref(root) + '" data-cat=""><b>Everything</b><span class="st is-in">' + items(L.products.length) + '</span></a></li>' +
      L.categories.map(function (c) {
        return '<li><a href="' + esc(shopHref(root, 'c', c.id)) + '" data-cat="' + esc(c.id) + '"><b>' + esc(c.name) + '</b>' +
          (n[c.id] ? '<span class="st is-in">' + items(n[c.id]) + '</span>' : '<span class="st">' + NOT_HERE + '</span>') + '</a></li>';
      }).join('');
    var groups = [{ h: 'Categories', id: 'cats', list: cats }];
    L.facets.forEach(function (f) {
      if (f.id === 'flavor') { return; }
      var vals = facetValues(L, f.id);
      if (!vals.length) { return; }
      groups.push({ h: f.name, id: f.id, list: vals.map(function (x) {
        return '<li><a href="' + esc(shopHref(root, f.id, x.v)) + '"><b>' + esc(facetLabel(f.id, x.v)) + '</b><span class="st">' + x.n + '</span></a></li>';
      }).join('') });
    });
    groups.push({ h: 'Brands', id: 'brands', list: brands(L).map(function (b) {
      var k = L.products.filter(function (p) { return p.brand === b; }).length;
      return '<li><a href="' + esc(shopHref(root, 'q', b)) + '"><b>' + esc(b) + '</b><span class="st">' + k + '</span></a></li>';
    }).join('') });
    return groups;
  }
  function shopPanel(L, root) {
    return '<div class="panel" id="shop-p" role="region" aria-label="Shop">' +
      '<div class="wrap panel-in">' +
        panelGroups(L, root).map(function (gr) {
          return '<div class="panel-g"><h2 class="panel-h" id="pg-' + gr.id + '">' + esc(gr.h) + '</h2><ul aria-labelledby="pg-' + gr.id + '">' + gr.list + '</ul></div>';
        }).join('') +
        '<a class="panel-tile" href="' + STORE + '" target="_blank" rel="noopener">' +
          pic('cat-protein', root, { sizes: '280px', alt: '' }) +
          '<span class="panel-tile-t">Everything we sell is in our eBay store, ' + STORE_NAME + ' ' + ICON.ne + '<span class="sr"> (opens our eBay store in a new tab)</span></span>' +
          '<span class="cap">Illustration</span></a>' +
      '</div></div>';
  }
  function menuSheet(L, root, cur) {
    var groups = panelGroups(L, root);
    return '<div class="msheet" id="menu-s" role="dialog" aria-modal="true" aria-labelledby="menu-h" hidden>' +
      '<div class="msheet-h"><p class="msheet-t" id="menu-h">Menu</p><button class="icon-b" type="button" id="menu-x" aria-label="Close the menu">' + ICON.close + '</button></div>' +
      '<div class="msheet-b">' +
        '<p class="msheet-l"><a href="' + root + 'index.html"' + (cur === 'home' ? ' aria-current="page"' : '') + '>Home</a></p>' +
        '<div class="macc"><h2 class="macc-h"><button class="macc-b" type="button" aria-expanded="false" aria-controls="macc-shop" id="macc-shop-b">Shop' + ICON.chev + '</button></h2>' +
          '<div class="macc-p" id="macc-shop" role="region" aria-labelledby="macc-shop-b" hidden>' +
            '<p class="msheet-l"><a href="' + shopHref(root) + '"' + (cur === 'shop' ? ' aria-current="page"' : '') + '>The shop</a></p>' +
            groups.map(function (gr) { return '<div class="macc-g"><h3>' + esc(gr.h) + '</h3><ul>' + gr.list + '</ul></div>'; }).join('') +
          '</div></div>' +
        DIRECTIONS.map(function (d) {
          return '<p class="msheet-l"><a href="' + root + d.href + '"' + (cur === d.id ? ' aria-current="page"' : '') + '>' + esc(d.short) + ' ' + status(d.status) + '</a></p>';
        }).join('') +
        '<p class="msheet-l"><a href="' + root + 'help.html"' + (cur === 'help' ? ' aria-current="page"' : '') + '>How buying works</a></p>' +
        '<p class="msheet-l">' + storeLink('Our eBay store') + '</p>' +
        '<p class="msheet-note">' + esc(NOTICE) + '</p>' +
      '</div></div>';
  }

  /* ── a product card ───────────────────────────────────────────────────── */
  /* The card's picture is the packshot: one package, centred on the well's own
     ground, so every card in a row reads at one scale. Its alt is empty
     because the card's link names the product. */
  /* a product's flavour, for a screen reader, only where another product
     shares its brand and name, so two cards never read the same */
  function twin(p) {
    var L = g.LIFE || { products: [] };
    return L.products.some(function (x) { return x !== p && x.brand === p.brand && x.name === p.name; });
  }
  function card(p, root, Q) {
    var im = p.pack
      ? '<img src="' + esc(pack(p, true, root)) + '" srcset="' + esc(pack(p, true, root)) + ' 480w, ' + esc(pack(p, false, root)) + ' ' + p.pack.w + 'w"' +
        ' sizes="(min-width: 1100px) 330px, (min-width: 760px) 34vw, (min-width: 560px) 46vw, 74vw" alt="" width="480" height="600" loading="lazy" decoding="async">'
      : '<img src="' + esc(photo(p, 1, true, root)) + '" srcset="' + esc(photo(p, 1, true, root)) + ' 405w, ' + esc(photo(p, 1, false, root)) + ' 720w"' +
        ' sizes="(min-width: 1100px) 330px, (min-width: 760px) 34vw, (min-width: 560px) 46vw, 74vw" alt="" width="405" height="720" loading="lazy" decoding="async"' +
        /* where a narrow card crops the photo, it keeps the package (its centre across the photo, cardX) */
        (p.cardX ? ' style="object-position:' + esc(p.cardX) + ' 50%"' : '') + '>';
    return '<article class="card" data-id="' + esc(p.id) + '" data-dated>' +
      '<div class="ph' + (p.pack ? ' is-pack' : '') + '">' + im + '<span class="fail">Photo didn’t load</span></div>' +
      '<div class="card-b">' +
        '<p class="card-brand">' + esc(p.brand) + '</p>' +
        '<h3 class="card-name"><a class="card-a" href="' + esc(productHref(p, root)) + '"><span class="sr">' + esc(p.brand) + ' </span>' + esc(p.name) + (twin(p) ? '<span class="sr">, ' + esc(p.flavor) + '</span>' : '') + '</a></h3>' +
        '<p class="card-sub">' + glue(p.flavor) + '&nbsp;· ' + (p.bundle
          ? '<span class="nw">' + esc(count(p)) + '</span>, <span class="nw">' + esc(p.bundle.each) + '</span> each'
          : '<span class="nw">' + esc(p.size.text) + '</span>') + '</p>' +
        '<p class="card-facts">' + p.protein + '&nbsp;g protein · ' + esc(servingsText(p).replace('About', 'about')).replace(/ /g, '&nbsp;') + '&nbsp;servings' + (p.bundle ? '&nbsp;in&nbsp;all' : '') + '</p>' +
        (out(p) ? '<p class="card-price"><span class="price is-out">Sold out</span></p>' +
            '<p class="card-when">On eBay, checked <span class="nw">' + esc(p.stock.checkedText) + '</span></p>'
          : '<p class="card-price"><span class="price">' + money(p.price) + '</span> <span class="pps">' + esc(perServing(p)) + ' a serving</span></p>' +
            '<p class="card-when">On eBay, checked <span class="nw">' + esc(checkedOf(p)) + '</span></p>') +
        alsoCard(p, Q) +
        '<div class="card-foot"><span class="card-go" aria-hidden="true">View ' + ICON.arrow + '</span>' +
          (out(p) ? (alsoShown(p, Q) ? alsoBuy(p, 'Buy the ' + esc(hold(also(p).name)), 'card-buy card-alt-b') : '')
            : ext(p.ebay.url, 'Buy on eBay', 'card-buy', 'opens the eBay listing for the ' + named(p) + ' in a new tab')) + '</div>' +
      '</div></article>';
  }
  /* A card's second listing, unless a free-from search names a claim its own packages don't print (`also.free`; the
     two-pack's pouches print no "artificial sweeteners", which the 18.1 oz bag does): set apart by a rule, in two lines,
     what it is and its pack, then its price for every package and its date. Its Buy sits in the card's foot, where a
     card's Buy on eBay sits, when the product itself is sold out (when it is for sale, its own Buy is there, so this one is in the block). */
  function alsoShown(p, Q) {
    var a = also(p);
    if (!a || !(Q && Q.free && Q.free.length)) { return a; }
    var f = (a.free || []).map(stem);
    return Q.free.every(function (t) { return f.indexOf(t) >= 0; }) ? a : null;
  }
  function alsoCard(p, Q) {
    var a = alsoShown(p, Q);
    if (!a) { return ''; }
    return '<div class="card-alt" data-dated>' +
      '<p class="card-alt-d">Also as a ' + esc(hold(a.name)) + ': <span class="nw">' + esc(alsoCount(a)) + '</span> of <span class="nw">' + glue(alsoEach(a)) + '</span></p>' +
      '<p class="card-alt-p"><span class="price">' + money(a.price) + '</span> ' + alsoFor(a) + ', checked <span class="nw">' + esc(a.ebay.checkedText) + '</span></p>' +
      (out(p) ? '' : alsoBuy(p, 'Buy the ' + esc(hold(a.name)), 'card-buy card-alt-b')) +
    '</div>';
  }
  /* Q: the shop's search, when the cards are its results */
  function cards(list, root, Q) { return list.map(function (p) { return card(p, root, Q); }).join(''); }
  /* the shop's last cell: the store itself, so a grid of five never ends on a gap */
  function storeTile() {
    return '<a class="stile" href="' + STORE + '" target="_blank" rel="noopener">' +
      '<span class="stile-e">' + STORE_NAME + ', on eBay</span>' +
      '<span class="stile-t">Everything we sell is in our eBay store.</span>' +
      '<span class="stile-go">Visit the store' + ICON.ne + '</span><span class="sr"> (opens our eBay store in a new tab)</span></a>';
  }
  function priceNote(L) {
    return 'Prices are the listed eBay prices, checked ' + checkedAll(L) + '. Per-serving prices are the listed price divided by the servings on the label' +
      (L.products.some(function (p) { return p.bundle || p.also; }) ? ' (for a bundle, every package’s servings together)' : '') + '. eBay shows the current price and availability.';
  }

  /* ── the shop's written sections ──────────────────────────────────────── */
  function cmpTable(L, root) {
    return '<caption class="sr">Every product here, compared on its label figures, with prices as listed on eBay and checked ' + esc(checkedAll(L)) + '</caption>' +
      '<thead role="rowgroup"><tr role="row">' + ['Product', 'Size', 'Servings', 'Protein', 'Listed price', 'Per serving', 'Date on the bag'].map(function (h) {
        return '<th scope="col" role="columnheader">' + h + '</th>'; }).join('') + '</tr></thead><tbody role="rowgroup">' +
      shelf(L.products).map(function (p) {
        function td(l, v, num) { return '<td' + (num ? ' class="num"' : '') + ' role="cell" data-l="' + l + '">' + v + '</td>'; }
        var a = also(p);
        /* a second listing has its own row, just above its product's, with its own figures */
        return (a ? '<tr role="row"><th scope="row" role="rowheader"><a href="' + esc(productHref(p, root)) + '#' + esc(a.name) + '">' + esc(fullName(p)) + '</a>' +
            '<small>' + glue(p.flavor) + ', ' + esc(hold(a.name)) + '</small></th>' +
          td('Size', esc(alsoCount(a)) + ' <small>' + glue(a.each) + '&nbsp;each</small>') +
          td('Servings', a.servings + '&nbsp;in&nbsp;all <small>' + a.per + '&nbsp;per&nbsp;' + esc(a.unit) + '</small>', true) + td('Protein', a.protein + ' g', true) +
          td('Listed price', money(a.price) + ' <small>' + alsoFor(a) + '</small>', true) + td('Per serving', esc(alsoPer(a)), true) +
          td('Date on the bag', esc(a.date.kind + ' ' + day(a.date.text)) + ', on the ' + esc(a.unit) + ' in its listing’s\u00a0photos') + '</tr>' : '') +
          '<tr role="row"><th scope="row" role="rowheader"><a href="' + esc(productHref(p, root)) + '">' + esc(fullName(p)).replace(/ \+ /g, '&nbsp;+&nbsp;').replace(/(\S)-(\S)/g, '$1\u2011$2') + '</a><small>' + glue(p.flavor) + '</small></th>' +
          td('Size', p.bundle ? esc(count(p)) + ' <small>' + glue(p.bundle.each) + '&nbsp;each</small>' : esc(p.size.text).replace(/\(([^)]*)\)/, '<span class="nw">($1)</span>')) +
          td('Servings', esc(servingsText(p)) + (p.bundle ? '&nbsp;in&nbsp;all <small>' + p.bundle.servings + '&nbsp;per&nbsp;' + esc(p.bundle.unit) + '</small>' : ''), true) + td('Protein', p.protein + ' g', true) +
          (out(p) ? td('Listed price', 'Sold out <small>checked <span class="nw">' + esc(p.stock.checkedText) + '</span></small>', true) +
              td('Per serving', '<span aria-hidden="true">–</span><span class="sr">none while sold out</span>', true)
            : td('Listed price', money(p.price), true) + td('Per serving', esc(perServing(p)), true)) +
          td('Date on the bag', p.date.none ? 'Not shown in the photos' : esc(p.date.kind + ' ' + day(p.date.text) + (p.date.photographed ? (', ' + PHOTO_DATE).replace(/ (\S+)$/, '\u00a0$1') : ''))) + '</tr>';
      }).join('') + '</tbody>';
  }
  function cmpNote(L) { return 'Listed prices as checked on eBay on ' + checkedAll(L) + '. eBay shows the current price and availability.'; }
  function howListing(L) {
    return 'As listed when the listings were checked on ' + termsAll(L) + ': ' + L.listing.shipping.toLowerCase() +
      ', item located in ' + day(L.listing.from) + '. ' + L.listing.returns + (termsNote(L) ? ' ' + termsNote(L) : '');
  }
  /* a term's last two words held together, so it never ends on one word alone */
  function tail(s) { return String(s).replace(/ (\S+)$/, '\u00a0$1'); }
  /* the listing terms as a list: all four, or for a product, only those its records verify */
  function listingDl(L, p) {
    var v = { condition: L.listing.condition, shipping: tail(L.listing.shipping), from: day(L.listing.from), returns: tail(L.listing.returns) };
    return '<dl class="listing">' + TERMS.filter(function (t) { return termKeys(p).indexOf(t[0]) >= 0; }).map(function (t) {
      return '<dt>' + t[1] + '</dt><dd>' + esc(v[t[0]]) + '</dd>'; }).join('') + '</dl>';
  }
  function intro(L) {
    var cat = L.categories.filter(function (c) { return counts(L)[c.id]; }).map(function (c) { return c.name.toLowerCase().replace('&', 'and'); });
    /* kept to the length the phone layout was measured with: with six brands the
       older ending ("…, servings and the date on the package") took one more line at
       most widths and pushed the shop's Filters and Sort under Safari's toolbar */
    return (cat.length ? cat.join(', ').replace(/^./, function (x) { return x.toUpperCase(); }) : 'Nothing yet') + ' from ' + brandList(L) +
      ', each with its size and servings.';
  }

  /* ── the home page's written sections ─────────────────────────────────── */
  /* chips for what the labels say, with how many products carry each */
  function homeChips(L, root) {
    return L.facets.filter(function (f) { return f.id !== 'flavor'; }).map(function (f) {
      var vals = facetValues(L, f.id);
      if (!vals.length) { return ''; }
      return '<div class="mchips" role="group" aria-labelledby="mc-' + f.id + '"><span class="mchips-l" id="mc-' + f.id + '">' + esc(f.name) + '</span>' +
        vals.map(function (x) {
          return '<a class="mchip" href="' + esc(shopHref(root, f.id, x.v)) + '">' + esc(facetLabel(f.id, x.v)) +
            ' <span class="n" aria-hidden="true">' + x.n + '</span><span class="sr">, ' + items(x.n) + '</span></a>';
        }).join('') + '</div>';
    }).join('');
  }
  /* shop by category: a typographic list, with the category's picture beside
     it on wide screens and on each tile on phones */
  function homeCats(L, root) {
    var n = counts(L);
    return '<ul class="catlist-l">' + L.categories.map(function (c, i) {
      var k = n[c.id] || 0;
      return '<li><a class="catlist-a" href="' + esc(shopHref(root, 'c', c.id)) + '" data-i="' + i + '">' +
        '<span class="catlist-tile">' + pic('cat-' + c.id, root, { sizes: '50vw', alt: '' }) + '</span>' +
        '<span class="catlist-name">' + esc(c.name) + '</span>' +
        '<span class="catlist-n">' + (k ? items(k) + ' here' : NOT_HERE) + '</span></a></li>';
    }).join('') + '</ul>' +
    '<div class="catlist-stage" aria-hidden="true">' + L.categories.map(function (c, i) {
      return pic('cat-' + c.id, root, { sizes: '(min-width: 1360px) 620px, 46vw', alt: '', cls: i === 0 ? 'is-on' : '' });
    }).join('') + '</div>';
  }

  /* ── the label, set as text ────────────────────────────────────────────── */
  /* A link to one photo of the package: without scripts it opens the photo
     itself; the product page's script opens it in the full-screen viewer,
     zoomed onto `focus` (x, y, w, h in the photo) where it is given. */
  function photoLink(p, n, root, text, focus) {
    return '<a class="lab-ph" href="' + esc(photo(p, n, false, root)) + '" data-photo="' + n + '"' + (focus ? ' data-focus="' + esc(focus.join(',')) + '"' : '') +
      ' target="_blank" rel="noopener">' + esc(text || 'View photo ' + n) + '<span class="sr"> (the label photo)</span></a>';
  }
  function photoOf(p, n) { return p.photos.filter(function (ph) { return ph.n === n; })[0] || {}; }
  var COUNT = { 2: 'two', 3: 'three', 4: 'four', 5: 'five' };
  /* the marks a label uses to point to a footnote */
  var MARKS = /^[*†‡^]+/;
  /* One facts panel, set the way a label sets it: the title, the serving
     lines, heavy and light rules, the amount after each name, the % Daily
     Value at the right, sub-rows indented, the footnotes. Every word is the
     catalogue's, which is the label's. On a Nutrition Facts panel the calories
     stand large and the heavy rule follows Protein; on a Supplement Facts panel
     it comes before the ingredients that have no Daily Value (**). */
  function factsPanel(pa, uid) {
    var nf = /^Nutrition/.test(pa.title), rows = pa.rows.slice(), cal = null;
    var dvCol = !!pa.header || rows.some(function (r) { return r.dv; });
    if (nf && rows.length && rows[0].name === 'Calories') { cal = rows.shift(); }
    var bar = -1;
    rows.forEach(function (r, i) {
      if (bar < 0 && (nf ? i > 0 && rows[i - 1].name === 'Protein' : r.dv === '**')) { bar = i; }
    });
    function line(r) {
      /* the line as printed where that differs from name + amount: either the
         whole line ("Includes 0g Added Sugars") or the name alone ("Vitamin B₆") */
      if (r.printed && r.amount && r.printed.indexOf(r.amount) >= 0) { return esc(r.printed); }
      var name = esc(r.printed || r.name);
      if (nf && !r.indent && (bar < 0 || rows.indexOf(r) < bar)) { name = '<b>' + name + '</b>'; }
      return dvCol ? name + (r.amount ? ' <span class="nf-a">' + esc(r.amount) + '</span>' : '') : name;
    }
    var serving = [pa.serving_size ? '<p class="nf-ss">' + esc(pa.serving_size) + '</p>' : '', pa.servings ? '<p class="nf-sp">' + esc(pa.servings) + '</p>' : ''];
    if (nf) { serving.reverse(); }
    var head = dvCol
      ? '<thead><tr><th scope="col">' + (pa.header && !nf ? esc(pa.header.amount) : '<span class="sr">Nutrient and amount</span>') + '</th>' +
        '<th scope="col" class="nf-dv">' + (pa.header ? esc(pa.header.dv) : '') + '</th></tr></thead>'
      : '<thead class="sr"><tr><th scope="col">Name</th><th scope="col">Amount</th></tr></thead>';
    return '<section class="nf' + (nf ? ' is-nf' : ' is-sf') + (dvCol ? '' : ' no-dv') + '" aria-labelledby="' + uid + '-t">' +
      '<h3 class="nf-t" id="' + uid + '-t">' + esc(pa.title) + '</h3>' +
      (pa.subtitle ? '<p class="nf-sub">' + esc(pa.subtitle) + '</p>' : '') + serving.join('') +
      (cal ? '<div class="nf-calb"><p class="nf-aps">' + esc(pa.header ? pa.header.amount : '') + '</p><p class="nf-cal"><span>Calories</span> <span>' + esc(cal.amount) + '</span></p></div>' : '') +
      '<table class="nf-tb"><caption class="sr">' + esc(pa.title) + (pa.serving_size ? ', ' + esc(pa.serving_size) : '') + '</caption>' + head + '<tbody>' +
        rows.map(function (r, i) {
          /* a % Daily Value the package prints but the photo can't show legibly
             (dv: null) is a dash, never a blank, which would read as "none printed" */
          var cell = dvCol && r.dv === null ? '<span aria-hidden="true">—</span><span class="sr">not legible in the photo</span>' : esc(dvCol ? r.dv : r.amount);
          return '<tr class="' + ['i' + (r.indent || 0), i === bar ? 'bar' : ''].join(' ').trim() + '"><th scope="row">' + line(r) + '</th>' +
            '<td' + (dvCol ? ' class="nf-dv' + (r.dv === null ? ' nf-ur' : '') + '"' : ' class="nf-a"') + '>' + cell + '</td></tr>';
        }).join('') + '</tbody></table>' +
      '<div class="nf-fn">' + pa.footnotes.map(function (f) { return '<p>' + esc(f) + '</p>'; }).join('') + '</div>' +
    '</section>';
  }
  /* a panel read in part: some figure is printed but not legible in the photo */
  function partial(pa) { return pa.complete === false || pa.rows.some(function (r) { return r.dv === null; }); }
  /* The label as text: its facts panels, its ingredients, and its allergen,
     facility and warning statements, each as printed and tied to the photo it
     was read from. Only complete statements are shown, and a line too blurred
     to set out is named (never quoted) so the page never implies the label has
     no such line. A product with no verified transcription shows none of this. */
  var KINDS = ['allergen', 'facility', 'warning'];
  /* the label section's first line names only what it sets out: the panels, the ingredients if read, and each kind of
     notice it holds ("the facility and warning notices", "the warning notice") */
  /* "the facility and warning notices", "the warning notice we could read in full", or '' where the page shows none */
  function notices(p, lb) {
    var kinds = KINDS.filter(function (k) { return lb.statements.some(function (s) { return s.complete && s.kind === k; }); });
    var n = lb.statements.filter(function (s) { return s.complete && KINDS.indexOf(s.kind) >= 0; }).length;
    return kinds.length ? 'the ' + andList(kinds) + ' notice' + (n > 1 ? 's' : '') + readable(p) : '';
  }
  function labIntro(p, lb) {
    var parts = ['the facts panel' + (lb.panels.length > 1 ? 's' : '')];
    if (lb.ingredients) { parts.push('the ingredients'); }
    if (notices(p, lb)) { parts.push(notices(p, lb)); }
    return cap1(andList(parts)) + ', as the package prints ' + (parts.length > 1 || lb.panels.length > 1 ? 'them' : 'it') + '.';
  }
  /* "the notices", or where the photos hide some, "the notices we could read in full" */
  function readable(p) { return p.withheld ? ' we could read in full' : ''; }
  function labelSection(p, L, root) {
    var lb = L.labels && L.labels[p.id];
    if (!lb) { return ''; }
    var others = lb.statements.filter(function (s) { return s.complete && s.kind === 'other' && !s.items; });
    var panels = lb.panels.map(function (pa, i) {
      /* a mark printed in this panel's rows that its own footnotes don't
         explain is explained by a line the label prints beside the panel
         ("†Upcycled"): set under the box, never inside it */
      var beside = others.filter(function (s) {
        var m = MARKS.exec(s.text);
        return m && pa.rows.some(function (r) { return r.name.indexOf(m[0]) >= 0; }) &&
          !pa.footnotes.some(function (f) { return f.indexOf(m[0]) === 0; });
      }).map(function (s) { return '<p class="lab-src lab-beside">Printed beside the panel: “' + esc(s.text) + '”</p>'; }).join('');
      var next = lb.panels[i + 1];
      var dashes = pa.rows.some(function (r) { return r.dv === null; })
        ? '<p class="lab-src lab-beside">A dash marks a % Daily Value the package prints that can’t be read in this photo. Read it on the package.</p>' : '';
      /* a mark in the panel ("<1%*") whose footnote the photo can't show legibly */
      var mk = pa.rows.map(function (r) { return /[*†‡]+$/.exec(r.dv || '') ; }).filter(Boolean)[0];
      if (mk && !pa.footnotes.some(function (f) { return f.indexOf(mk[0]) === 0; })) {
        dashes += '<p class="lab-src lab-beside">The footnote its ' + esc(mk[0]) + ' points to can’t be read in this photo. Read it on the package.</p>';
      }
      return factsPanel(pa, p.id + '-p' + i) + beside + dashes + (next && next.photo === pa.photo ? '' :
        '<p class="lab-src">Transcribed from the label in photo ' + pa.photo + '. If anything here differs, the label is right. ' +
          photoLink(p, pa.photo, root, null, photoOf(p, pa.photo).panel) + '</p>');
    }).join('');
    var ing = lb.ingredients;
    var where = ing && (ing.heading ? 'Printed under “' + esc(ing.heading) + '”.' : (/^Back of the bag/.test(photoOf(p, ing.photo).alt || '') ? 'Printed on the back of the bag.' : ''));
    /* the line that explains a mark in the ingredients ("*With Tapioca Starch"),
       when no panel already sets it beside itself: under the list, quoted */
    var foot = !ing ? [] : others.filter(function (s) {
      var m = MARKS.exec(s.text);
      return m && ing.text.indexOf(m[0]) >= 0 && !lb.panels.some(function (pa) { return pa.rows.some(function (r) { return r.name.indexOf(m[0]) >= 0; }); });
    });
    var side = ing ? '<div class="lab-b"><h3 class="lab-h">Ingredients</h3><blockquote class="lab-q"><p>' + esc(ing.text) + '</p></blockquote>' +
      foot.map(function (s) { return '<p class="lab-src lab-beside">Printed below the ingredients: “' + esc(s.text) + '”</p>'; }).join('') +
      '<p class="lab-src">' + (where ? where + ' ' : '') + photoLink(p, ing.photo, root) + '</p></div>' : '';
    var notes = lb.statements.filter(function (s) { return s.complete && KINDS.indexOf(s.kind) >= 0; })
      .sort(function (a, b) { return KINDS.indexOf(a.kind) - KINDS.indexOf(b.kind); });
    var wh = p.withheld;
    var held = !wh ? '' : '<p class="lab-held">' + (wh.items.length > 1
      ? 'The package also prints ' + (COUNT[wh.items.length] || wh.items.length) + ' more lines: ' + esc(wh.items.slice(0, -1).join('; ')) + '; and ' + esc(wh.items[wh.items.length - 1]) +
        '. They are ' + esc(wh.why) + ', so read them on the package.'
      : 'The package also prints ' + esc(wh.items[0]) + ', ' + esc(wh.why) + '. Read it on the package.') + '</p><p class="lab-src">' + photoLink(p, wh.photo, root) + '</p>';
    if (notes.length || held) {
      side += '<div class="lab-b lab-warn"><h3 class="lab-h">' + (notes.length && notes[0].kind === 'allergen' ? 'Allergens and notices' : 'Notices') + '</h3>' +
        (notes.length ? '<ul class="lab-n">' + notes.map(function (s) {
          return '<li><blockquote class="lab-q"><p>“' + esc(s.text) + '”</p></blockquote><p class="lab-src">' + photoLink(p, s.photo, root) + '</p></li>';
        }).join('') + '</ul>' : '') + held + '</div>';
    }
    /* the package's own marks, word for word: set as printed tokens, apart
       from the shop's sage filter chips */
    var marks = lb.statements.filter(function (s) { return s.complete && s.items; });
    if (marks.length) {
      side += '<div class="lab-b"><h3 class="lab-h">Marks on the package</h3><p class="lab-lead">As printed, word for word:</p>' + marks.map(function (s) {
        return '<ul class="tags is-printed">' + s.items.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
          '<p class="lab-src">' + photoLink(p, s.photo, root) + '</p>';
      }).join('') + '</div>';
    }
    return '<section class="sec lab" id="label" aria-labelledby="label-h">' +
      '<div class="sec-h"><div><p class="eyebrow">From the label</p><h2 class="h2" id="label-h">The label, as text</h2>' +
        '<p class="sec-p">' + labIntro(p, lb) + '</p></div></div>' +
      '<div class="lab-g"><div class="lab-panels">' + panels + '</div><div class="lab-side">' + side + '</div></div></section>';
  }

  /* the four categories as picture tiles, each with what it holds here: the
     not-found page's way back into the shop */
  function catTiles(L, root) {
    var n = counts(L);
    return '<ul class="ctiles">' + L.categories.map(function (c) {
      var k = n[c.id] || 0;
      return '<li><a class="ctile" href="' + esc(shopHref(root, 'c', c.id)) + '">' +
        '<span class="ctile-m">' + pic('cat-' + c.id, root, { sizes: '(min-width: 1360px) 310px, (min-width: 760px) 23vw, 46vw', alt: '' }) + '</span>' +
        '<span class="ctile-n">' + esc(c.name) + '</span><span class="ctile-s">' + (k ? items(k) + ' here' : NOT_HERE) + '</span></a></li>';
    }).join('') + '</ul>';
  }

  /* ── a product page's main content ────────────────────────────────────── */
  function accordion(p, L) {
    var acc = [], lb = L.labels && L.labels[p.id];
    acc.push({ t: 'From the label', h:
      '<ul>' + p.facts.map(function (f) { return '<li><b>' + esc(f[0]) + ':</b> ' + esc(f[1]) + '</li>'; }).join('') +
      (p.date.none ? '<li><b>' + esc(p.date.kind) + ':</b> not shown in these photos</li></ul>'
        : '<li><b>' + esc(p.date.kind) + ':</b> ' + esc(p.date.text) + ' (printed ' + esc(p.date.printed) + esc(whose(p)) + ')</li></ul>') +
      p.notes.concat(p.date.none ? [out(p) ? dateNote(p).replace(/ To confirm .*$/, '') : dateNote(p)] : p.date.photographed ? [out(p) ? PHOTO_DATE_OUT : PHOTO_DATE_NOTE] : [])
        .map(function (x) { return '<p class="note">' + esc(x) + '</p>'; }).join('') +
      (lb
        ? '<p class="acc-more">' + cap1(andList(['the ' + (lb.panels.some(partial) ? '' : 'full ') + esc(lb.panels[0].title.toLowerCase()) + ' panel']
            .concat(lb.ingredients ? ['the ingredients'] : []).concat(notices(p, lb) ? [notices(p, lb)] : []))) +
          ((lb.ingredients || notices(p, lb)) ? ' are' : ' is') + ' <a href="#label">set out as text below</a>.</p>'
        : '<p class="acc-more">The photos show the full ' + (/supplement/i.test(p.photos.map(function (x) { return x.alt; }).join(' ')) ? 'supplement' : 'nutrition') +
          ' facts panel and the rest of the package.</p>') });
    /* the ingredients appear once: as printed, in the label section, when it exists */
    if (p.ingredients && !(lb && lb.ingredients)) {
      acc.push({ t: 'Ingredients', h: '<p class="acc-lead">As listed on the label, ' + p.ingredients.length + ' in all:</p><ul>' +
        p.ingredients.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' });
    }
    /* a sold-out product: no terms to buy by, and nothing that sends a shopper to a listing this page doesn't link */
    var a = also(p);
    acc.push(out(p) && a ? { t: 'Buying, delivery and returns', h:
      /* sold out, with a second listing: the bag can't be bought, the two-pack can, through its own listing alone */
      '<p class="acc-lead">This bag’s listing was sold out on eBay when checked on ' + esc(p.stock.checkedText) + ', so the bag can’t be bought here.</p>' +
      '<p class="acc-more">' + esc(p.flavor) + ' is also listed as a <a href="#' + esc(a.name) + '">' + esc(hold(a.name)) + '</a>, ' + esc(alsoCount(a)) + ' of ' + esc(alsoEach(a)) +
        ' each, on its own eBay listing. You pay on eBay, and that listing is what applies to your purchase, so check it before you buy; its condition, shipping and returns are shown there. ' +
        'Everything we sell is in our eBay store.</p>' } : out(p) ? { t: 'Buying, delivery and returns', h:
      '<p class="acc-lead">Its listing was sold out on eBay when checked on ' + esc(p.stock.checkedText) + ', so there is no way to buy it here.</p>' +
      '<p class="acc-more">Every purchase is made on eBay, and everything we sell is in our eBay store.</p>' } : { t: 'Buying, delivery and returns', h:
      '<p class="acc-lead">As listed on eBay when the listing was checked on ' + esc(termsOf(p, L)) + ':</p>' + listingDl(L, p) +
      '<p class="acc-more">' + (partTerms(p) ? 'Its ' + esc(andList(unseen(p))) + ' are shown on the listing. ' : '') + 'You pay on eBay, and the listing is what applies to your purchase, so check it before you buy. ' +
      'Questions about this item can be asked through “Contact seller” on the listing.</p>' });
    acc.push({ t: 'Where these details come from', h:
      '<p>The product facts on this page are transcribed from the package label in the photos; if anything here differs from the label on the package, the label is right. ' +
      (out(p) ? 'The sold-out status is as its eBay listing showed when checked on ' + esc(p.stock.checkedText) + '. ' +
          (a ? 'The ' + esc(hold(a.name)) + '’s price is as listed on eBay when its own listing was checked on ' + esc(a.ebay.checkedText) + '; its size, servings, protein and date are from the ' +
            esc(a.units) + ' in that listing’s photos. ' : '')
        : partTerms(p) ? (termsOf(p, L) === checkedOf(p, L)
          ? 'The price and ' + esc(andList(termKeys(p))) + ' are as listed on eBay when the listing was checked on ' + esc(checkedOf(p, L)) + '. '
          : 'The price is as listed on eBay when the listing was checked on ' + esc(checkedOf(p, L)) + ', and the ' + esc(andList(termKeys(p))) + ' as listed on ' + esc(termsOf(p, L)) + '. ')
        : termsOf(p, L) === checkedOf(p, L)
        ? 'The price, condition, shipping and returns are as listed on eBay when the listing was checked on ' + esc(checkedOf(p, L)) + '. '
        : 'The price is as listed on eBay when the listing was checked on ' + esc(checkedOf(p, L)) + ', and the condition, shipping and returns as listed on ' + esc(termsOf(p, L)) + '. ') +
      'This page makes no health claims, and nothing on it is medical advice.</p>' });
    /* Every panel is open in the HTML, so all of it is there without scripts;
       the script folds all but the first. */
    return '<div class="acc">' + acc.map(function (a, i) {
      return '<div class="acc-i"><h2 class="acc-h"><button class="acc-b" type="button" id="acc-b' + i + '" aria-expanded="true" aria-controls="acc-p' + i + '">' +
        esc(a.t) + ICON.plus + '</button></h2>' +
        '<div class="acc-p is-open" id="acc-p' + i + '" role="region" aria-labelledby="acc-b' + i + '"><div><div class="in">' + a.h + '</div></div></div></div>';
    }).join('') + '</div>';
  }

  /* a row of cards that scrolls sideways, with arrow buttons; nothing moves by itself */
  function row(id, title, list, root, tail) {
    return '<section class="sec rowsec" aria-labelledby="' + id + '-h">' +
      '<div class="sec-h"><h2 class="h2" id="' + id + '-h">' + esc(title) + '</h2>' +
        '<div class="row-nav js-only"><button class="rn" type="button" data-dir="-1" aria-controls="' + id + '-r" aria-label="Scroll back">' + ICON.prev + '</button>' +
        '<button class="rn" type="button" data-dir="1" aria-controls="' + id + '-r" aria-label="Scroll on">' + ICON.next + '</button></div></div>' +
      '<div class="row" id="' + id + '-r">' + cards(list, root) + '</div>' + (tail || '') + '</section>';
  }

  /* The gallery's last card: how buying works, in three lines, with the two
     ways on. Designed in the page, not a picture; shown by the viewer only
     (without scripts the buy box beside the photos says all of it). */
  function closingCard(p, L, root) {
    var a = also(p);
    return '<div class="sbuy js-only" id="stage-buy" hidden data-dated>' +
      '<p class="sbuy-t">' + (out(p) ? 'Sold out on eBay.' : 'Choose here. Buy on eBay.') + '</p>' +
      '<ol class="sbuy-l">' +
        '<li><span>Sold through our eBay store, ' + STORE_NAME + '.</span></li>' +
        /* sold out, with a second listing: the bag's status, then what the second listing is, its price for every
           package and its date; still three lines, so the card keeps its room in a phone's shortest frame */
        (out(p) && a ? '<li><span>This bag’s listing was sold out when checked on <span class="nw">' + esc(p.stock.checkedText) + '</span>.</span></li>' +
            /* in two lines at a phone's shortest frame (375 x 652): the pack in words, its price and date; Buy, right
               under it, names the two-pack */
            '<li><span>' + cap1(({ 2: 'two', 3: 'three' })[a.n] || String(a.n)) + ' <span class="nw">' + glue(alsoEach(a)) + '</span> ' + esc(a.units) + ': <span class="price">' + money(a.price) + '</span> ' +
              alsoFor(a) + ', checked <span class="nw">' + esc(a.ebay.checkedText) + '</span>.</span></li>'
          : out(p) ? '<li><span>Its listing was sold out when checked on <span class="nw">' + esc(p.stock.checkedText) + '</span>.</span></li>' +
            '<li><span>Product facts from the package’s own label.</span></li>'
          : '<li><span><span class="price">' + money(p.price) + '</span> ' + (p.bundle ? 'for ' + esc(count(p)) + ', ' : '') + 'as listed on eBay, checked <span class="nw">' + esc(checkedOf(p, L)) + '</span>.</span></li>' +
            '<li><span>Product facts from the package’s own label.</span></li>') +
      '</ol>' +
      '<a class="sbuy-more" href="' + esc(root) + 'help.html">How buying works</a>' +
      '<p class="sbuy-a">' + (out(p) && a ? alsoBuy(p, 'Buy the ' + esc(hold(a.name)), 'btn btn-1 btn-s sbuy-two')
        : out(p) ? '<a class="btn btn-2 btn-s sbuy-go" href="' + esc(instead(p, root).href) + '">' + esc(instead(p, root).text) + '</a>'
        : ext(p.ebay.url, 'Buy on eBay', 'btn btn-1 btn-s', 'opens the eBay listing for the ' + named(p) + ' in a new tab')) +
        '<a class="btn btn-2 btn-s" href="' + esc(root) + 'help.html">How buying works</a></p>' +
    '</div>';
  }
  /* On phones, once the buy box has scrolled away, a slim bar with the
     package, its name, the price, its check date and Buy on eBay (shown by the
     script; hidden without it). */
  function buyBar(p, L, root) {
    var a = also(p);
    /* sold out, with a second listing: the bar is that listing's, named first (the name is what a narrow bar cuts),
       with no picture, since none here shows it */
    if (out(p) && a) {
      return '<aside class="bbar js-only" id="bbar" aria-label="Buy the ' + esc(alsoName(p)) + '" data-dated><div class="bbar-in">' +
        '<p class="bbar-p"><span class="bbar-n">' + esc(cap1(hold(a.name)) + ', ' + alsoCount(a) + ' of ' + alsoEach(a)) + '</span><span class="price">' + money(a.price) + '</span>' +
          '<span class="bbar-w">' + cap1(alsoFor(a)) + ', checked <span class="nw">' + esc(a.ebay.checkedText) + '</span></span></p>' +
        alsoBuy(p, 'Buy on eBay', 'btn btn-1 btn-s bbar-b') +
      '</div></aside>';
    }
    if (out(p)) { return ''; }
    return '<aside class="bbar js-only" id="bbar" aria-label="Buy the ' + esc(named(p)) + '" data-dated><div class="bbar-in">' +
      (p.pack ? '<img class="bbar-im" src="' + esc(pack(p, true, root)) + '" alt="" width="480" height="600" loading="lazy" decoding="async">' : '') +
      '<p class="bbar-p"><span class="bbar-n">' + esc(fullName(p) + (p.bundle ? ', ' + count(p) : '')) + '</span><span class="price">' + money(p.price) + '</span><span class="bbar-w">On eBay, checked <span class="nw">' + esc(checkedOf(p, L)) + '</span></span></p>' +
      ext(p.ebay.url, 'Buy on eBay', 'btn btn-1 btn-s bbar-b', 'opens the eBay listing for the ' + named(p) + ' in a new tab') +
    '</div></aside>';
  }

  /* A sold-out product's second listing on its page: a block of its own in the buy box, under the bag's status (on a
     phone, right under the gallery, where Buy on eBay would be), with its pack, price for every package, per-serving
     price, check date and Buy; and a line saying the photos above are the bag's, not its. */
  function alsoPanel(p) {
    var a = also(p);
    if (!a) { return ''; }
    return '<section class="alt" id="' + esc(a.name) + '" aria-labelledby="' + esc(a.name) + '-h" data-dated>' +
      '<h2 class="alt-h" id="' + esc(a.name) + '-h">Also as a ' + esc(hold(a.name)) + '</h2>' +
      '<p class="alt-d"><span class="nw">' + esc(alsoCount(a)) + '</span>, <span class="nw">' + glue(a.each) + '</span>&nbsp;each: ' +
        '<span class="nw">' + a.servings + ' servings</span> in all, <span class="nw">' + a.per + ' per ' + esc(a.unit) + '</span>.</p>' +
      '<p class="alt-p"><span class="price">' + money(a.price) + '</span> <span class="pps">' + esc(alsoPer(a)) + ' a serving</span></p>' +
      '<p class="alt-u">The price is ' + alsoFor(a) + ' ' + esc(a.units) + '.</p>' +
      '<p class="alt-w">On its own eBay listing, checked <span class="nw">' + esc(a.ebay.checkedText) + '</span>. eBay shows the current price and availability.</p>' +
      '<a class="btn btn-1" id="buy-two" href="' + esc(a.ebay.url) + '" target="_blank" rel="noopener">Buy the ' + esc(hold(a.name)) + ' on eBay ' + ICON.ne +
        '<span class="sr"> (opens the eBay listing for the ' + esc(alsoName(p)) + ' in a new tab)</span></a>' +
      '<p class="alt-n">The photos on this page are of the ' + glue(p.size.text.replace(/ \(.*\)$/, '')) + '&nbsp;bag. The ' + esc(hold(a.name)) + '’s listing shows its own ' + esc(a.units) + '; the one ' +
        'photographed there is printed ' + esc(a.date.kind.toLowerCase()) + ' ' + esc(day(a.date.text)) + ', and a ' + esc(hold(a.name)) + ' bought now may carry another&nbsp;date.</p>' +
    '</section>';
  }
  function productMain(p, L, root) {
    var sl = slides(p, root), first = sl[0];
    var size = /^(.*) \((.*)\)$/.exec(p.size.text) || [p.size.text, p.size.text, ''];
    var others = shelf(L.products.filter(function (x) { return x.id !== p.id; }));
    var cat = catOf(L, p.category);
    var kv = [
      p.bundle ? ['Size', esc(count(p)) + ' <small><span class="nw">' + esc(p.bundle.each) + ' each;</span> <span class="nw">' + esc(p.bundle.total) + ' together</span></small>', 'kv-wide']
        : ['Size', esc(size[1]) + (size[2] ? ' <small>' + esc(size[2]) + '</small>' : '')],
      ['Servings', esc(servingsText(p)) + (p.bundle ? ' <small>in all, ' + p.bundle.servings + '&nbsp;per&nbsp;' + esc(p.bundle.unit) + '</small>' : ' <small>per bag</small>')],
      ['Protein', p.protein + ' g <small>per serving</small>'],
      /* "Strawberries &" never parts from "Cream" */
      ['Flavor', esc(p.flavor).replace('&amp; ', '&amp;&nbsp;')]
    ];
    if (p.facet.source && p.facet.source.length) { kv.push(['Protein from', esc(p.facet.source.join(', ')) + (p.sourceNote ? ' <small>' + esc(p.sourceNote) + '</small>' : '')]); }
    kv.push([esc(p.date.kind), p.date.none
      ? 'Not shown in these&nbsp;photos <small>recorded as ' + esc(p.date.listed.text).replace(/^(\w+) (\d{4})/, '$1&nbsp;$2').replace(/ or later$/, ' or&nbsp;later') +
        ' when listed on <span class="nw">' + esc(p.date.listed.on) + '</span></small>'
      : esc(p.date.text).replace(/^(\w+) (\d+)/, '$1&nbsp;$2') + ' <small>printed ' + esc(p.date.printed) + esc(whose(p)).replace(/ photos$/, '&nbsp;photos') + '</small>']);
    return '<nav aria-label="Breadcrumb"><ol class="crumbs">' +
        '<li><a href="' + esc(root) + 'index.html">Home</a></li>' +
        '<li><a href="' + esc(root) + 'shop.html">Shop</a></li>' +
        '<li><a href="' + esc(shopHref(root, 'c', p.category)) + '">' + esc(cat ? cat.name : '') + '</a></li>' +
        '<li><a href="' + esc(shopHref(root, 'q', p.brand)) + '">' + esc(p.brand) + '</a></li>' +
        '<li aria-current="page">' + esc(p.name) + '</li></ol></nav>' +
      '<div class="pdp" data-product="' + esc(p.id) + '">' +
        '<div class="gal">' +
          /* the photo first, then its thumbnails, which is also the order on a
             phone; on wide screens the thumbnails are placed to its left */
          /* the picture and its controls: on wide screens the controls sit on
             the picture's corner, on phones in a row under it */
          '<div class="stage-w">' +
          '<div class="stage" id="stage" tabindex="0" role="group" aria-roledescription="picture viewer" aria-label="Pictures of the ' + esc(named(p)) + ' package">' +
            '<img id="stage-img" class="is-shown' + (first.kind === 'pack' ? ' is-pack' : '') + '" src="' + esc(first.src) + '" alt="' + esc(first.alt) + '" width="' + first.w + '" height="' + first.h + '" decoding="async" fetchpriority="high">' +
            '<div class="ph-state" id="stage-fail" hidden><div>This photo didn’t load.<br><button class="btn btn-2 btn-s" type="button" id="stage-retry">Try again</button></div></div>' +
            closingCard(p, L, root) +
            '<div class="stage-bar" id="stage-bar" aria-hidden="true"></div>' +
            '<span class="stage-count js-only" id="stage-count" aria-hidden="true">' + esc(first.count) + '</span>' +
          '</div>' +
            '<div class="stage-nav">' +
              '<button class="js-only" type="button" id="prev" aria-label="Previous picture">' + ICON.prev + '</button><button class="js-only" type="button" id="next" aria-label="Next picture">' + ICON.next + '</button>' +
              '<a id="full" href="' + esc(first.src) + '" target="_blank" rel="noopener">' + ICON.zoom + 'Full size<span class="sr"> (opens the picture in a new tab)</span></a>' +
            '</div>' +
          '</div>' +
          /* without scripts each thumbnail opens its full-size picture; with them
             it shows the picture in the viewer, and the last shows how buying works */
          '<ul class="thumbs" aria-label="Pictures">' + sl.map(function (s, i) {
            return '<li><a class="thumb" href="' + esc(s.src) + '" data-i="' + i + '" aria-current="' + (i === 0) + '" aria-label="' + esc(s.label) + '">' +
              '<img src="' + esc(s.thumb) + '" alt="" width="' + s.tw + '" height="' + s.th + '" loading="lazy" decoding="async"></a></li>';
          }).join('') +
            '<li class="js-only"><a class="thumb thumb-buy" href="#stage" data-i="' + sl.length + '" aria-current="false" aria-label="How buying works">' +
              '<span aria-hidden="true">' + ICON.steps + '</span></a></li>' +
          '</ul>' +
          '<p class="gal-note">' + esc(galNote(p)) + '</p>' +
          '<p class="sr" id="stage-live" aria-live="polite"></p>' +
        '</div>' +
        '<div class="info">' +
          '<h1><span class="brand-l">' + esc(p.brand) + '</span> ' + esc(p.name) + '</h1>' +
          '<p class="sub">' + glue(p.flavor) + '&nbsp;· ' + (p.bundle ? esc(count(p)) + ', <span class="nw">' + esc(p.bundle.each) + ' each</span>' : esc(p.size.text)) + '</p>' +
          /* a figure never parts from its unit at a line’s end ("20 g", "6 g", "39.6 oz bag"), nor a hyphenated word
             at its hyphen ("grass-fed", "7-serving": a non-breaking hyphen holds it, so the line can still wrap well) */
          '<p class="summary">' + glue(p.summary).replace(/&nbsp;oz (bag|pouch)/g, '&nbsp;oz&nbsp;$1').replace(/(\S)-(\S)/g, '$1\u2011$2') + '</p>' +
          '<div class="buy" data-dated>' +
            (out(p) ? '<p class="buy-price"><span class="price is-out">Sold out</span></p>' +
                /* on a phone the two-pack's block sits under the gallery, past the first screen: the bag's status line
                   points down to it (within the two lines its date may take); beside the gallery, from 900 px, it shows */
                '<p class="when">On eBay, checked ' + esc(p.stock.checkedText) + '.' + (also(p) ? '<span class="when-two"> <a href="#' + esc(also(p).name) + '">See the ' +
                  esc(hold(also(p).name)) + ' below</a></span>' : '') + '</p>' +
                alsoPanel(p) +
                '<a class="btn btn-2" id="instead" href="' + esc(instead(p, root).href) + '">' + esc(instead(p, root).text) + '</a>' +
                (sameBrand(p) ? '<p class="how">Its other flavors and bundles have their own listings. <a class="nw" href="' + esc(shopHref(root, 'q', p.brand)) + '">See ' + esc(p.brand) + ' in the shop</a></p>'
                  : '<p class="how">Every purchase is completed on eBay. <a class="nw" href="' + esc(root) + 'help.html">How buying works</a></p>')
              : '<p class="buy-price"><span class="price">' + money(p.price) + '</span> <span class="pps">' + esc(perServing(p)) + ' a serving</span></p>' +
                (p.bundle ? '<p class="buy-unit">The price is for ' + esc(thing(p)) + '.</p>' : '') +
                '<p class="when">Listed on eBay, checked ' + esc(checkedOf(p, L)) + '. eBay shows the current price and availability.</p>' +
                '<a class="btn btn-1" id="buy" href="' + esc(p.ebay.url) + '" target="_blank" rel="noopener">Buy on eBay ' + ICON.ne + '<span class="sr"> (opens the eBay listing in a new tab)</span></a>' +
                '<p class="how">You’ll complete your purchase on eBay. <a href="' + esc(root) + 'help.html">How buying works</a></p>') +
            '<p class="buy-store">' + esc(NOTICE) + ' ' + storeLink('Visit the store') + '</p>' +
          '</div>' +
          '<h2 class="h-s">Key info</h2>' +
          /* a wide cell (the bundle's size) takes its row; the per-serving cell takes its row only when the cells before
             it leave it alone in one */
          '<dl class="kv">' + kv.map(function (x) { return '<div' + (x[2] ? ' class="' + x[2] + '"' : '') + '><dt>' + x[0] + '</dt><dd>' + x[1] + '</dd></div>'; }).join('') +
            (out(p) ? '' : '<div' + (kv.filter(function (x) { return !x[2]; }).length % 2 ? '' : ' class="kv-full"') + ' data-dated><dt>Per serving</dt><dd>' + esc(perServing(p).replace('about ', 'About ')) + ' <small>listed price' + (p.bundle ? ' for ' + esc(count(p)).replace(' ', '&nbsp;') : '') + ' ÷ ' +
              esc(servingsText(p).toLowerCase()) + '&nbsp;servings, checked <span class="nw">' + esc(checkedOf(p, L)) + '</span></small></dd></div>') +
          '</dl>' +
          (p.label.length ? '<h2 class="h-s">The label says</h2><ul class="tags">' + p.label.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '') +
          accordion(p, L) +
        '</div>' +
      '</div>' +
      labelSection(p, L, root) +
      (others.length ? row('more', 'More in the shop', others, root,
        '<p class="foot-note">' + esc(priceNote(L)) + ' <a href="' + esc(root) + 'shop.html">See the whole shop</a></p>') : '') +
      buyBar(p, L, root);
  }

  /* ── the shop's search ─────────────────────────────────────────────────
     Every word of a search must be a word of what a product's page says (or
     its plural): "nut" finds "tree nuts", not "nutrition". Only when no
     product has every word whole does a word count as the start of one, so
     a search still finds as it is typed ("choc", "veg"). A free-from search ("no nuts", "nut free", "dairy-free", "without
     soy", "free of gluten", "non-GMO") is different: it never goes by the
     words on a page, which also hold "Contains tree nuts" and the
     ingredients. It finds only a product whose own package prints that it is
     free of exactly that (its `free` list), and leaves out any whose label
     also names it, or its family, as an allergen or in its facility line. */
  function fold(s) {
    s = String(s == null ? '' : s).toLowerCase().replace(/[’'`]/g, '');
    return s.normalize ? s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '') : s;
  }
  function words(s) { return fold(s).split(/[^a-z0-9]+/).filter(Boolean); }
  /* one form for a word and its plural: "nuts" is "nut", "sugars" is "sugar" */
  function one(w) { return w.length > 3 && /s$/.test(w) && !/ss$/.test(w) ? w.slice(0, -1) : w; }
  function stem(s) { return words(s).map(one).join(' '); }
  var NEG = { no: 1, without: 1, non: 1, zero: 1 };
  var JOIN = { and: 1, or: 1 };
  /* a free-from term's wider family, used only to leave a product out */
  var KIN = { gluten: ['wheat'], dairy: ['milk'], whey: ['milk', 'dairy'], nut: ['peanut', 'tree nut'] };
  /* how each printed claim is named in the shop */
  var SAY = { gmo: 'Non-GMO', 'added sugar': 'No added sugars', 'artificial flavor': 'No artificial flavors', 'artificial sweetener': 'No artificial sweeteners',
    'seed oil': 'No seed oils', preservative: 'No preservatives', stevia: 'No stevia', rbst: 'rBST free', rbgh: 'rBGH free',
    'natural flavor': 'No natural flavors', gum: 'No gums', filler: 'No fillers' };
  function say(t) { return SAY[t] || t.charAt(0).toUpperCase() + t.slice(1) + ' free'; }
  function searchIndex(L) {
    var list = L.products.map(function (p) {
      var cat = catOf(L, p.category), lb = L.labels && L.labels[p.id];
      /* a bundle is found by the words its listing uses: its total, "2-pack", "bundle" */
      var bundle = p.bundle ? [p.bundle.total, p.bundle.n + '-pack', 'pack bundle', ({ 2: 'two', 3: 'three' })[p.bundle.n] || ''].join(' ') : '';
      /* and a product's second listing by the words its own listing uses ("two-pack", "2-pack", "pouches", its sizes) */
      var a = also(p);
      var two = a ? [a.name, a.n + '-pack', 'pack bundle', ({ 2: 'two', 3: 'three' })[a.n] || '', a.units, a.each, a.total].join(' ') : '';
      var hay = [p.brand, p.name, p.flavor, p.summary, cat && cat.name, p.size.text, bundle, two,
        (p.facts || []).map(function (f) { return f.join(' '); }).join(' '),
        (p.ingredients || []).join(' '), (p.label || []).join(' '), (p.notes || []).join(' '),
        p.facet.flavor.join(' '), p.facet.source.join(' '), p.facet.label.join(' '),
        /* the label as printed: its ingredients, allergen statement and marks */
        lb && lb.ingredients ? lb.ingredients.text : '',
        lb ? lb.statements.filter(function (s) { return s.complete && (s.kind === 'allergen' || s.items); }).map(function (s) { return s.text; }).join(' ') : ''].join(' ');
      var hazard = (lb ? lb.statements.filter(function (s) { return s.kind === 'allergen' || s.kind === 'facility'; }).map(function (s) { return s.text; }) : [])
        .concat((p.notes || []).filter(function (x) { return /contain/i.test(x); })).join(' ');
      return { id: p.id, hay: ' ' + words(hay).join(' ') + ' ', free: (p.free || []).map(stem), hazard: ' ' + words(hazard).map(one).join(' ') + ' ' };
    });
    var vocab = [];
    list.forEach(function (x) { x.free.forEach(function (t) { if (vocab.indexOf(t) < 0) { vocab.push(t); } }); });
    return { list: list, vocab: vocab };
  }
  /* A search, read: the free-from terms it names and its other words. */
  function parseQuery(q, IX) {
    var w = words(q), used = w.map(function () { return false; }), free = [];
    /* the longest run of up to three words at `at`, read onward (dir 1) or
       back (dir -1), that a package prints as a free-from term; else one word */
    function term(at, dir) {
      for (var k = 3; k >= 1; k--) {
        var a = dir > 0 ? at : at - k + 1, b = a + k;
        if (a < 0 || b > w.length || used.slice(a, b).some(Boolean)) { continue; }
        var t = w.slice(a, b).map(one).join(' ');
        if (IX.vocab.indexOf(t) >= 0 || (k === 1 && !JOIN[w[a]] && !NEG[w[a]] && w[a] !== 'free')) { return { a: a, b: b, t: t }; }
      }
      return null;
    }
    function take(r) { for (var i = r.a; i < r.b; i++) { used[i] = true; } free.push(r.t); }
    /* "X free", "X and Y free", "X-free" */
    w.forEach(function (x, f) {
      if (x !== 'free' || used[f] || w[f + 1] === 'of' || w[f + 1] === 'from') { return; }
      var pos = f - 1, got = false, r;
      while ((r = term(pos, -1))) {
        take(r); got = true; pos = r.a - 1;
        if (pos > 0 && JOIN[w[pos]] && !used[pos]) { used[pos] = true; pos--; } else { break; }
      }
      if (got) { used[f] = true; }
    });
    /* "no X", "no X or Y", "without X", "non-X", "free of X", "free from X" */
    w.forEach(function (x, n) {
      if (used[n]) { return; }
      var start = NEG[x] ? n + 1 : (x === 'free' && (w[n + 1] === 'of' || w[n + 1] === 'from') ? n + 2 : -1);
      if (start < 0) { return; }
      var pos = start, got = false, r;
      while (pos < w.length && (r = term(pos, 1))) {
        take(r); got = true; pos = r.b;
        if (pos < w.length - 1 && JOIN[w[pos]] && !used[pos]) { used[pos] = true; pos++; } else { break; }
      }
      if (got) { for (var i = n; i < start; i++) { used[i] = true; } }
    });
    var Q = { q: q, free: free, tokens: w.filter(function (x, i) { return !used[i]; }), whole: true };
    /* whole words where any product has them all; otherwise word starts */
    Q.whole = IX.list.some(function (x) { return hit(x, Q); });
    return Q;
  }
  /* a word whole, or its plural; and "-ies" plurals both ways, so "strawberries"
     finds a label that says "strawberry" and "strawberry" one that says "strawberries" */
  function hasWord(hay, t, whole) {
    if (!whole) { return hay.indexOf(' ' + t) >= 0; }
    var forms = [t, t + 's', t + 'es'];
    if (t.length > 4 && /ies$/.test(t)) { forms.push(t.slice(0, -3) + 'y'); }
    if (t.length > 3 && /[^aeiou]y$/.test(t)) { forms.push(t.slice(0, -1) + 'ies'); }
    return forms.some(function (f) { return hay.indexOf(' ' + f + ' ') >= 0; });
  }
  function hit(x, Q) {
    if (!Q.tokens.every(function (t) { return hasWord(x.hay, t, Q.whole); })) { return false; }
    return Q.free.every(function (t) {
      return x.free.indexOf(t) >= 0 && ![t].concat(KIN[t] || []).some(function (k) { return x.hazard.indexOf(' ' + k + ' ') >= 0; });
    });
  }
  function searchHit(IX, Q, id) {
    var x = IX.list.filter(function (e) { return e.id === id; })[0];
    return !!x && hit(x, Q);
  }
  /* every free-from claim the packages here print, with how many products a
     search for it finds: what the shop offers when a free-from search finds none */
  function freeClaims(IX) {
    return IX.vocab.map(function (t) {
      var Q = { free: [t], tokens: [], whole: true };
      return { t: t, say: say(t), n: IX.list.filter(function (x) { return searchHit(IX, Q, x.id); }).length };
    }).filter(function (c) { return c.n; });
  }

  function pageTitle(p) { return fullName(p) + ', ' + p.flavor + ' — Venerabull Life'; }
  function pageDescription(p, L) {
    var a = also(p);
    if (out(p) && a) {
      return p.summary + ' Sold out on eBay when checked ' + p.stock.checkedText + '. Also listed as a ' + a.name + ' of ' + alsoCount(a) + ', ' + alsoEach(a) + ' each: ' +
        money(a.price) + ' ' + alsoFor(a) + ' on eBay when checked ' + a.ebay.checkedText + '.';
    }
    if (out(p)) { return p.summary + ' Sold out on eBay when checked ' + p.stock.checkedText + '.'; }
    return p.summary + ' ' + money(p.price) + ' on eBay when checked ' + checkedOf(p, L) + '; bought through the eBay listing.';
  }

  var R = {
    STORE: STORE, STORE_NAME: STORE_NAME, NOTICE: NOTICE, NOT_HERE: NOT_HERE, DIRECTIONS: DIRECTIONS, HELP: HELP, DIRECTIONS_NOTE: DIRECTIONS_NOTE, IMG: IMG,
    checkedOf: checkedOf, checkedAll: checkedAll, termsOf: termsOf, termsAll: termsAll, storeTile: storeTile,
    esc: esc, money: money, perServing: perServing, servingsText: servingsText, fullName: fullName, items: items,
    productHref: productHref, photo: photo, catOf: catOf, counts: counts, brands: brands, facetValues: facetValues, facetLabel: facetLabel,
    ICON: ICON, ext: ext, storeLink: storeLink, pic: pic, status: status,
    notice: notice, header: header, footer: footer, shopPanel: shopPanel, menuSheet: menuSheet,
    card: card, cards: cards, row: row, priceNote: priceNote, cmpTable: cmpTable, cmpNote: cmpNote, howListing: howListing, listingDl: listingDl,
    intro: intro, homeChips: homeChips, homeCats: homeCats, productMain: productMain, pageTitle: pageTitle, pageDescription: pageDescription,
    pack: pack, slides: slides, galNote: galNote, factsPanel: factsPanel, labelSection: labelSection, catTiles: catTiles,
    out: out, shelf: shelf, partNote: partNote, termsNote: termsNote, also: also, alsoName: alsoName,
    fold: fold, words: words, searchIndex: searchIndex, parseQuery: parseQuery, searchHit: searchHit, freeClaims: freeClaims
  };
  g.LIFE_RENDER = R;
  if (typeof module !== 'undefined' && module.exports) { module.exports = R; }
}(typeof window !== 'undefined' ? window : globalThis));
