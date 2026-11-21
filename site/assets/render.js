/* Venerabull Life — the markup, written once.

   Every piece of shared markup comes from here: the header and footer, the
   phone menu, and the four directions. The browser uses it to build the phone
   menu (assets/life.js), and the site's generator uses the very same functions
   to write the static pages, so the HTML a visitor gets before any script runs
   and the HTML the script draws cannot differ. Pure functions; nothing here
   touches the page.

   `root` is the path from the page to the site's top: '' for the pages at the
   top, '/' for the not-found page. */
(function (g) {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  var ICON = {
    arrow: '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 7h8m-3-3.2L11 7l-3 3.2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    menu: '<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M2.5 5.5h13M2.5 12.5h13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    close: '<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="m4 4 10 10M14 4 4 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>'
  };

  /* The site's own pictures: every editorial image with its true pixel size
     and that of its 800-wide copy, so each <img> carries honest width, height
     and srcset values. */
  var IMG = {
    'life-hero': [1752, 897, 800, 409], 'dim-mind': [1086, 1448, 600, 800], 'dim-body': [1024, 1536, 533, 800],
    'dim-heart': [1024, 1536, 533, 800], 'dim-soul': [1024, 1536, 533, 800],
    'spa-hero': [1672, 941, 800, 450], 'spa-detail': [1672, 941, 800, 450], 'rest-hero': [1774, 887, 800, 400],
    'rest-detail': [1672, 941, 800, 450], 'exp-hero': [1672, 941, 800, 450], 'exp-detail': [1200, 675, 800, 450],
    'lon-hero': [1672, 941, 800, 450], 'lon-detail': [1672, 941, 800, 450]
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
    { id: 'spa', href: 'spa.html', name: 'Spa' },
    { id: 'rest', href: 'rest.html', name: 'Rest' },
    { id: 'experiences', href: 'experiences.html', name: 'Experiences' },
    { id: 'longevity', href: 'longevity.html', name: 'Longevity' }
  ];
  /* the directions: shown with real presence, never offered */
  var DIRECTIONS = [
    { id: 'spa', href: 'spa.html', name: 'The Spa', short: 'Spa', status: 'Not yet open', img: 'spa-hero', pos: '50% 55%',
      line: 'Warmth, water and stillness, in rooms made for quiet.' },
    { id: 'rest', href: 'rest.html', name: 'Rest', short: 'Rest', status: 'Not yet available', img: 'rest-hero', pos: '62% 60%',
      line: 'Mattresses, bedding and everything for sleep, in natural materials.' },
    { id: 'experiences', href: 'experiences.html', name: 'Experiences', short: 'Experiences', status: 'Not yet available', img: 'exp-hero', pos: '50% 50%',
      line: 'Retreats, classes and gatherings, much of it outdoors.' },
    { id: 'longevity', href: 'longevity.html', name: 'Longevity', short: 'Longevity', status: 'Not yet available', img: 'lon-hero', pos: '60% 30%',
      line: 'Biosciences for everyday life: measurement, heat, cold and light, and supplements.' }
  ];

  function status(text) { return '<span class="status' + (text === 'Open now' ? ' is-open' : '') + '">' + esc(text) + '</span>'; }

  /* cur: which page this is (home, spa, rest, experiences, longevity) */
  function header(root, cur) {
    return '<header class="top" id="top">\n  <div class="wrap top-in">\n' +
      '    <a class="brand" href="' + root + 'index.html"' + (cur === 'home' ? ' aria-current="page"' : '') + ' aria-label="Venerabull Life, home">' +
        '<img src="' + root + 'assets/venerabull-mark.png" alt="" width="30" height="24" decoding="async"><span class="brand-w">Venerabull <span>Life</span></span></a>\n' +
      '    <nav class="nav" id="nav" aria-label="Main">\n      <ul class="nav-l">\n' +
      NAV.map(function (n) {
        var here = n.id === cur;
        return '        <li><a class="nav-a' + (here ? ' is-here' : '') + '" href="' + root + n.href + '"' + (here ? ' aria-current="page"' : '') + '>' + esc(n.name) + '</a></li>\n';
      }).join('') +
      '      </ul>\n    </nav>\n' +
      '    <div class="top-end">\n' +
      '      <a class="icon-b menu-a" id="menu-a" href="#foot-nav">' + ICON.menu + '<span class="sr">Menu</span></a>\n' +
      '    </div>\n  </div>\n</header>\n';
  }
  function footer(root, cur) {
    function li(href, text, id, st) {
      return '<li><a href="' + root + href + '"' + (id && id === cur ? ' aria-current="page"' : '') + (st ? ' class="has-st"' : '') + '>' +
        (st ? '<span>' + text + '</span><small>' + esc(st) + '</small>' : text) + '</a></li>';
    }
    return '<footer class="foot" id="foot">\n  <div class="wrap">\n' +
      '    <div class="foot-top">\n' +
      '      <div class="foot-brand"><a class="brand" href="' + root + 'index.html" aria-label="Venerabull Life, home"><img src="' + root + 'assets/venerabull-mark.png" alt="" width="30" height="24" loading="lazy" decoding="async"><span class="brand-w">Venerabull <span>Life</span></span></a>' +
        '<p>Venerabull Life, from Venerabull. Everything for a good life: mind, body, heart and soul.</p></div>\n' +
      '      <nav class="foot-nav" id="foot-nav" aria-label="Footer">\n' +
      '        <div><h2>Life</h2><ul>' + li('index.html', 'Home', 'home') +
        DIRECTIONS.map(function (d) { return li(d.href, esc(d.short), d.id, d.status); }).join('') + '</ul></div>\n' +
      '      </nav>\n    </div>\n' +
      '    <div class="foot-fine">\n' +
      '      <p>Nothing on this site is medical advice.</p>\n' +
      '      <p>The images of the spa, Rest, Experiences and Longevity are illustrations of directions that aren’t open yet. Lifestyle images are illustrations too.</p>\n' +
      '      <p>© 2026 Venerabull</p>\n    </div>\n  </div>\n</footer>\n';
  }

  /* ── the menu sheet (phones) ──────────────────────────────────────────── */
  function menuSheet(root, cur) {
    return '<div class="msheet" id="menu-s" role="dialog" aria-modal="true" aria-labelledby="menu-h" hidden>' +
      '<div class="msheet-h"><p class="msheet-t" id="menu-h">Menu</p><button class="icon-b" type="button" id="menu-x" aria-label="Close the menu">' + ICON.close + '</button></div>' +
      '<div class="msheet-b">' +
        '<p class="msheet-l"><a href="' + root + 'index.html"' + (cur === 'home' ? ' aria-current="page"' : '') + '>Home</a></p>' +
        DIRECTIONS.map(function (d) {
          return '<p class="msheet-l"><a href="' + root + d.href + '"' + (cur === d.id ? ' aria-current="page"' : '') + '>' + esc(d.short) + ' ' + status(d.status) + '</a></p>';
        }).join('') +
      '</div></div>';
  }

  var R = {
    DIRECTIONS: DIRECTIONS, IMG: IMG, ICON: ICON,
    esc: esc, pic: pic, status: status, header: header, footer: footer, menuSheet: menuSheet
  };
  g.LIFE_RENDER = R;
  if (typeof module !== 'undefined' && module.exports) { module.exports = R; }
}(typeof window !== 'undefined' ? window : globalThis));
