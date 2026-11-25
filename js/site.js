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

  // ---- page 2 sizing: photo never cropped by CSS, page never scrolls ----
  // Desktop: photo and the text under it share one width (one block). The
  //          block is as large as possible while the whole page fits.
  // Phones:  portrait photo fills about the left half; the text beside it is
  //          set to fill the photo's height. Short phones get a compact contact
  //          row, then slightly smaller text, then a slightly smaller photo.
  var grid = p2.querySelector('.contact-grid');
  var photo = p2.querySelector('.c-photo img');
  var text = p2.querySelector('.c-text');
  var mobileMQ = window.matchMedia('(max-width: 760px), (max-aspect-ratio: 4/5)');

  function px(v) { return parseFloat(v) || 0; }
  function setVar(k, v) { grid.style.setProperty(k, v); }

  function fitPage2() {
    if (!grid) return;
    ['--pw', '--lh', '--fs'].forEach(function (k) { grid.style.removeProperty(k); });
    grid.classList.remove('is-compact');
    var cs = getComputedStyle(p2);
    var availH = p2.clientHeight - px(cs.paddingTop) - px(cs.paddingBottom);
    var gw = grid.clientWidth;
    var fits = function () { return grid.offsetHeight <= availH; };

    if (!mobileMQ.matches) {
      // largest block width that fits, between 240px and 40% of the width (max 480)
      var lo = 240, hi = Math.min(480, gw * 0.40);
      setVar('--pw', hi + 'px');
      if (!fits()) {
        for (var i = 0; i < 10; i++) {
          var mid = (lo + hi) / 2;
          setVar('--pw', mid.toFixed(1) + 'px');
          if (fits()) lo = mid; else hi = mid;
        }
        setVar('--pw', lo.toFixed(1) + 'px');
      }
      return;
    }

    var ratio = 1.5;                       // portrait photo, 2:3
    var fs = px(getComputedStyle(grid).fontSize);
    var pwMin = gw * 0.5, pwMax = gw * 0.6;
    function layoutMobile(pwFloor) {
      // photo: at least pwFloor, wider if the text would otherwise overflow it
      var lo = pwFloor, hi = Math.max(pwFloor, pwMax);
      setVar('--lh', '1.5');
      setVar('--pw', lo.toFixed(1) + 'px');
      if (text.offsetHeight > lo * ratio) {
        for (var i = 0; i < 9; i++) {
          var mid = (lo + hi) / 2;
          setVar('--pw', mid.toFixed(1) + 'px');
          if (text.offsetHeight <= mid * ratio) hi = mid; else lo = mid;
        }
        lo = hi; setVar('--pw', hi.toFixed(1) + 'px');
      }
      // open the line spacing so the text fills the photo height
      var lh = Math.min(1.8, 1.5 * (lo * ratio) / text.offsetHeight);
      setVar('--lh', Math.max(1.5, lh).toFixed(3));
    }
    layoutMobile(pwMin);
    if (fits()) return;
    grid.classList.add('is-compact');
    layoutMobile(pwMin);
    while (!fits() && fs > 12) {           // smaller text first …
      fs -= 0.5; setVar('--fs', fs + 'px'); layoutMobile(pwMin);
    }
    var floor = pwMin;
    while (!fits() && floor > gw * 0.36) {   // … then a slightly smaller photo
      floor -= gw * 0.02; layoutMobile(floor);
    }
  }
  fitPage2();
  if (photo && !photo.complete) photo.addEventListener('load', fitPage2);
  mobileMQ.addEventListener && mobileMQ.addEventListener('change', fitPage2);
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
