// Page behaviour: intro timing for header/footer/ANFRAGEN, and the two-page swipe.
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = root.classList.contains('reduce');

  // Every load starts on the map, so the intro is always seen from the top.
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  window.scrollTo(0, 0);

  // Header + footer arrive with the routes; ANFRAGEN just after (all < 4 s).
  if (reduce) {
    root.classList.add('chrome-in', 'cta-in');
  } else {
    setTimeout(function () { root.classList.add('chrome-in'); }, 2900);
    setTimeout(function () { root.classList.add('cta-in'); }, 3150);
  }

  // In-page links swipe to their page without putting a #hash in the URL.
  function go(id) {
    var el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href').slice(1);
      if (!document.getElementById(id)) return;
      e.preventDefault();
      go(id);
    });
  });
})();
