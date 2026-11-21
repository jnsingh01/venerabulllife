/* Venerabull Life — the behaviour of every page.

   One file, no framework, no build. The pages arrive complete as HTML (the
   frame of every page is written by the site's generator from
   assets/render.js); this enhances them: the loading bar, the header's
   shadow, and the phone menu, whose markup comes from assets/render.js, the
   same functions that wrote the HTML. Motion is functional only: it confirms
   a press, and it shows loading only while something is really loading.
   Reduced motion turns it off (the stylesheet does the rest). */
(function () {
  'use strict';

  var doc = document;
  var REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var PAGE = doc.body.getAttribute('data-page');

  var R = window.LIFE_RENDER || null;
  var ROOT = doc.body.getAttribute('data-root') || '';
  /* Without the markup there is nothing to enhance with, and the page as
     written is the whole experience: nothing is removed, hidden or animated. */
  if (!R) { return; }

  doc.documentElement.classList.add('enhanced');
  function $(s, el) { return (el || doc).querySelector(s); }
  function $$(s, el) { return Array.prototype.slice.call((el || doc).querySelectorAll(s)); }
  function visible(el) { return !!el && el.offsetParent !== null; }
  function focusables(box) {
    return $$('a[href], button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])', box).filter(visible);
  }
  var ICON = R.ICON;
  var CUR = { home: 'home', spa: 'spa', rest: 'rest', experiences: 'experiences', longevity: 'longevity' }[PAGE] || '';

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
  function background() { return [$('.skip'), $('#top'), $('#main'), $('.foot')].filter(Boolean); }

  /* The site's own pictures sit on a tonal ground; if one fails to load, the
     ground shows clean, never a broken-image mark or its alt text. */
  function quiet(im) {
    function f() { im.classList.add('is-failed'); }
    im.addEventListener('error', f);
    if (im.complete && !im.naturalWidth && im.getAttribute('src')) { f(); }
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
    doc.body.insertAdjacentHTML('beforeend', R.menuSheet(ROOT, CUR));
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

  buildMenu();
  $$('.hero-m img, .dhero-m img, .dir-detail img, .going-m img, .dim img, .dlink-m img').forEach(quiet);
}());
