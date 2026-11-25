// Page behaviour: the two-page swipe. Wheel, touch, keyboard and the ANFRAGEN /
// logo links all call the same go(), so every move takes the same time
// (--swipe in css/style.css). The intro reveal is triggered from js/map.js.
(function () {
  'use strict';
  var root = document.documentElement;
  var pages = document.querySelector('.pages');
  var p2 = document.getElementById('anfragen');
  if (!pages || !p2) return;

  // Every load starts on the map; drop any #hash so a refresh shows the intro.
  if (location.hash) history.replaceState(null, '', location.pathname + location.search);

  // Safety net: if the map script fails, still show header, footer and ANFRAGEN.
  setTimeout(function () { root.classList.add('chrome-in'); }, 5000);

  var SWIPE = parseFloat(getComputedStyle(root).getPropertyValue('--swipe')) || 620;
  if (root.classList.contains('reduce')) SWIPE = 0;
  var current = 0, movedAt = -1e9;

  function go(n) {
    n = n ? 1 : 0;
    if (n === current) return;
    current = n;
    movedAt = performance.now();
    root.classList.toggle('on-p2', n === 1);
  }
  function busy() { return performance.now() - movedAt < SWIPE + 80; }

  // ---- wheel / trackpad: one gesture = one page, ignore the inertia tail ----
  var lastWheel = 0;
  window.addEventListener('wheel', function (e) {
    e.preventDefault();
    var now = performance.now(), gapSince = now - lastWheel;
    lastWheel = now;
    if (busy() || Math.abs(e.deltaY) < 4) return;
    // a new gesture starts after a short pause, or well after the last move
    if (gapSince < 160 && now - movedAt < 1400) return;
    go(e.deltaY > 0 ? 1 : 0);
  }, { passive: false });

  // ---- touch: vertical swipe ----
  var ty = null, tx = 0;
  window.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 1) { ty = null; return; }
    ty = e.touches[0].clientY; tx = e.touches[0].clientX;
  }, { passive: true });
  window.addEventListener('touchmove', function (e) {
    if (ty !== null && e.cancelable) e.preventDefault();   // no rubber-banding
  }, { passive: false });
  window.addEventListener('touchend', function (e) {
    if (ty === null) return;
    var t = e.changedTouches[0], dy = ty - t.clientY, dx = tx - t.clientX;
    ty = null;
    if (Math.abs(dy) > 36 && Math.abs(dy) > Math.abs(dx) * 1.2 && !busy()) go(dy > 0 ? 1 : 0);
  });

  // ---- keyboard ----
  window.addEventListener('keydown', function (e) {
    var k = e.key;
    if (k === 'ArrowDown' || k === 'PageDown' || k === 'End' || (k === ' ' && !e.shiftKey)) { e.preventDefault(); go(1); }
    else if (k === 'ArrowUp' || k === 'PageUp' || k === 'Home' || (k === ' ' && e.shiftKey)) { e.preventDefault(); go(0); }
  });

  // Tabbing into a page brings it into view.
  document.addEventListener('focusin', function (e) {
    if (!pages.contains(e.target)) return;
    go(p2.contains(e.target) ? 1 : 0);
    window.scrollTo(0, 0); pages.scrollTop = 0;
  });

  // ---- page 2 sizing: photo is never cropped, page never scrolls ----
  // Desktop: photo as wide as the text column, made smaller only if photo +
  //          caption + text would not fit the screen height.
  // Phones:  photo grows until the text beside it is no taller than the photo,
  //          then the line spacing opens slightly so the text fills its height.
  var grid = p2.querySelector('.contact-grid');
  var photo = p2.querySelector('.c-photo img');
  var text = p2.querySelector('.c-text');
  var cap = p2.querySelector('.c-name');
  var mobileMQ = window.matchMedia('(max-width: 760px), (max-aspect-ratio: 4/5)');
  var RATIO = 1.5;   // photo height / width (500 x 750)

  function px(v) { return parseFloat(v) || 0; }
  function fitPage2() {
    if (!grid) return;
    grid.style.removeProperty('--pw');
    grid.style.removeProperty('--lh');
    grid.style.removeProperty('--fs');
    var cs = getComputedStyle(p2);
    var availH = p2.clientHeight - px(cs.paddingTop) - px(cs.paddingBottom);

    if (!mobileMQ.matches) {
      var tw = text.getBoundingClientRect().width;
      var below = cap.offsetHeight + px(getComputedStyle(cap).marginTop) +
                  text.offsetHeight + px(getComputedStyle(text).marginTop);
      var pw = Math.min(tw, (availH - below - 4) / RATIO);
      grid.style.setProperty('--pw', Math.max(150, pw).toFixed(1) + 'px');
      return;
    }

    var gw = grid.clientWidth;
    var gap = px(getComputedStyle(grid).columnGap);
    var fs = px(getComputedStyle(grid).fontSize);
    for (var round = 0; round < 6; round++) {
      // smallest photo width at which the text is no taller than the photo
      var lo = gw * 0.30, hi = gw * 0.58;
      for (var i = 0; i < 9; i++) {
        var mid = (lo + hi) / 2;
        grid.style.setProperty('--pw', mid.toFixed(1) + 'px');
        if (text.offsetHeight <= mid * RATIO) hi = mid; else lo = mid;
      }
      grid.style.setProperty('--pw', hi.toFixed(1) + 'px');
      // open the line spacing a touch so the text fills the photo height
      var base = 1.5, th = text.offsetHeight, target = hi * RATIO;
      var lh = Math.min(1.78, base * target / th);
      grid.style.setProperty('--lh', lh.toFixed(3));
      if (grid.offsetHeight <= availH || fs <= 11.5) break;
      fs -= 0.5;                                   // very small screens: step the text down
      grid.style.setProperty('--fs', fs + 'px');
      grid.style.removeProperty('--lh');
    }
  }
  fitPage2();
  if (photo && !photo.complete) photo.addEventListener('load', fitPage2);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitPage2);
  var ft;
  window.addEventListener('resize', function () { clearTimeout(ft); ft = setTimeout(fitPage2, 100); });

  // ---- in-page links (#anfragen, #start) ----
  document.querySelectorAll('a[href="#anfragen"], a[href="#start"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      go(a.getAttribute('href') === '#anfragen' ? 1 : 0);
    });
  });
})();
