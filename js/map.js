// Map of Europe: coastline only (no countries), Vienna in red, a few
// destinations in neighbouring countries in black. On load, dotted routes
// travel out slowly from Vienna to each destination.
//
// The coastline comes from Natural Earth (public domain), loaded from the
// jsDelivr CDN as TopoJSON and drawn here without any library. If it can't
// be loaded, the dots and routes still show on their own.
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var svg = document.getElementById('map');
  if (!svg) return;

  var HOME = { name: 'Wien', lon: 16.37, lat: 48.21 };
  var DESTS = [
    { name: 'München',   lon: 11.58, lat: 48.14 },
    { name: 'Prag',      lon: 14.42, lat: 50.08 },
    { name: 'Budapest',  lon: 19.04, lat: 47.50 },
    { name: 'Ljubljana', lon: 14.51, lat: 46.06 },
    { name: 'Venedig',   lon: 12.34, lat: 45.44 },
    { name: 'Zürich',    lon:  8.54, lat: 47.38 },
    { name: 'Krakau',    lon: 19.94, lat: 50.06 }
  ];

  var COAST_URLS = [
    'https://cdn.jsdelivr.net/npm/world-atlas@2/land-50m.json',
    'https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json'
  ];

  // ---- projection: Lambert azimuthal equal-area, centred on Europe ----
  var D = Math.PI / 180, LON0 = 15 * D, LAT0 = 52 * D;
  var sin0 = Math.sin(LAT0), cos0 = Math.cos(LAT0);
  function project(lon, lat) {
    var l = lon * D - LON0, p = lat * D;
    var cp = Math.cos(p), sp = Math.sin(p), cl = Math.cos(l);
    var k = Math.sqrt(2 / (1 + sin0 * sp + cos0 * cp * cl));
    return [k * cp * Math.sin(l) * 1000, -k * (cos0 * sp - sin0 * cp * cl) * 1000];
  }

  // The view is fitted to the screen's shape: this core area (all routes,
  // with room around them) always fits; a wide screen shows more of Europe
  // to the west and east, a tall one more to the north and south. The
  // coastline beyond simply fades out at the edges.
  var CORE = [[-1, 44], [33, 44], [-1, 56], [33, 56], [16, 41], [16, 58.5]];
  var cMinX = 1e9, cMinY = 1e9, cMaxX = -1e9, cMaxY = -1e9;
  CORE.forEach(function (c) {
    var p = project(c[0], c[1]);
    cMinX = Math.min(cMinX, p[0]); cMaxX = Math.max(cMaxX, p[0]);
    cMinY = Math.min(cMinY, p[1]); cMaxY = Math.max(cMaxY, p[1]);
  });
  var VB = { x: cMinX, y: cMinY, w: cMaxX - cMinX, h: cMaxY - cMinY };
  function fitView(bw, bh) {
    var cx = (cMinX + cMaxX) / 2, cy = (cMinY + cMaxY) / 2;
    var cw = cMaxX - cMinX, ch = cMaxY - cMinY;
    if (bh > bw) { cw *= 0.66; ch *= 0.66; }   // upright phone: zoom in on the routes
    var w = cw, h = ch;
    if (bw / bh > cw / ch) w = ch * bw / bh; else h = cw * bh / bw;
    VB = { x: cx - w / 2, y: cy - h / 2, w: w, h: h };
    svg.setAttribute('viewBox', [VB.x, VB.y, VB.w, VB.h].map(function (n) { return n.toFixed(1); }).join(' '));
    maskRect.setAttribute('x', VB.x); maskRect.setAttribute('y', VB.y);
    maskRect.setAttribute('width', VB.w); maskRect.setAttribute('height', VB.h);
    mask.setAttribute('x', VB.x); mask.setAttribute('y', VB.y);
    mask.setAttribute('width', VB.w); mask.setAttribute('height', VB.h);
  }
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

  function el(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  // Soft edge: the coastline fades out toward the edges of the frame, so the
  // map has no hard border and simply dissolves into the page.
  var defs = el('defs', {}, svg);
  var grad = el('radialGradient', { id: 'edge-fade', cx: '50%', cy: '50%', r: '50%' }, defs);
  el('stop', { offset: '55%', 'stop-color': '#fff' }, grad);
  el('stop', { offset: '100%', 'stop-color': '#000' }, grad);
  var mask = el('mask', { id: 'edge-mask', maskUnits: 'userSpaceOnUse' }, defs);
  var maskRect = el('rect', { fill: 'url(#edge-fade)' }, mask);

  var coast = el('path', { 'class': 'coast', mask: 'url(#edge-mask)' }, svg);
  var routesG = el('g', { 'class': 'routes' }, svg);
  var dotsG = el('g', { 'class': 'points' }, svg);

  // ---- coastline from TopoJSON (arcs are the outlines; no rings needed) ----
  function coastPath(topo) {
    var t = topo.transform, sx = t.scale[0], sy = t.scale[1], tx = t.translate[0], ty = t.translate[1];
    var out = [];
    topo.arcs.forEach(function (arc) {
      var x = 0, y = 0, pen = false;
      for (var i = 0; i < arc.length; i++) {
        x += arc[i][0]; y += arc[i][1];
        var lon = x * sx + tx, lat = y * sy + ty;
        if (lon < -30 || lon > 60 || lat < 25 || lat > 80) { pen = false; continue; }
        var p = project(lon, lat);
        out.push((pen ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1));
        pen = true;
      }
    });
    return out.join('');
  }

  function loadCoast(i) {
    if (i >= COAST_URLS.length || !window.fetch) return;
    fetch(COAST_URLS[i]).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    }).then(function (topo) {
      coast.setAttribute('d', coastPath(topo));
      requestAnimationFrame(function () { coast.classList.add('is-on'); });
    }).catch(function () { loadCoast(i + 1); });
  }
  loadCoast(0);

  // ---- routes: gently curved, drawn as a row of small round dots ----
  var home = project(HOME.lon, HOME.lat);
  var dests = DESTS.map(function (d) { return project(d.lon, d.lat); });

  function curvePoints(a, b, n) {
    var dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
    // control point bowed to one side, so every route arcs the same way
    var cx = (a[0] + b[0]) / 2 + (dy / len) * len * 0.2;
    var cy = (a[1] + b[1]) / 2 - (dx / len) * len * 0.2;
    var pts = [];
    for (var i = 0; i <= n; i++) {
      var t = i / n, u = 1 - t;
      pts.push([u * u * a[0] + 2 * u * t * cx + t * t * b[0],
                u * u * a[1] + 2 * u * t * cy + t * t * b[1]]);
    }
    return pts;
  }

  function evenlySpaced(pts, step) {
    var out = [], acc = 0, next = step;
    for (var i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i], seg = Math.hypot(b[0] - a[0], b[1] - a[1]);
      while (acc + seg >= next) {
        var t = (next - acc) / seg;
        out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
        next += step;
      }
      acc += seg;
    }
    return out;
  }

  var played = false;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Sizes are in screen pixels and converted to map units, so dots stay the
  // same size on a phone and on a big screen.
  function draw() {
    var box = svg.getBoundingClientRect();
    if (!box.width || !box.height) return;
    fitView(box.width, box.height);
    var u = VB.w / box.width;   // map units per pixel

    routesG.textContent = '';
    dotsG.textContent = '';

    var START = 700, ROUTE_MS = 2600, STAGGER = 380;
    var gapPx = box.width < 500 ? 5 : 7;

    dests.forEach(function (d, k) {
      var pts = evenlySpaced(curvePoints(home, d, 120), gapPx * u);
      // keep clear of the two end dots
      var clear = 7 * u;
      pts = pts.filter(function (p) {
        return Math.hypot(p[0] - home[0], p[1] - home[1]) > clear &&
               Math.hypot(p[0] - d[0], p[1] - d[1]) > clear * .8;
      });
      pts.forEach(function (p, i) {
        var c = el('circle', { 'class': 'route-dot', cx: p[0].toFixed(2), cy: p[1].toFixed(2),
          r: (1.1 * u).toFixed(2) }, routesG);
        c.style.animationDelay = (START + k * STAGGER + (i / Math.max(pts.length - 1, 1)) * ROUTE_MS) + 'ms';
      });
      el('circle', { 'class': 'dest', cx: d[0].toFixed(2), cy: d[1].toFixed(2), r: (3.4 * u).toFixed(2) }, dotsG);
    });

    el('circle', { 'class': 'home-ring', cx: home[0].toFixed(2), cy: home[1].toFixed(2), r: (5 * u).toFixed(2) }, dotsG);
    el('circle', { 'class': 'home', cx: home[0].toFixed(2), cy: home[1].toFixed(2), r: (5 * u).toFixed(2) }, dotsG);

    if (!played && !reduce) {
      svg.classList.add('animate');
      played = true;
    } else {
      svg.classList.remove('animate');
      svg.classList.add('static');
    }
  }

  draw();
  var timer;
  window.addEventListener('resize', function () {
    clearTimeout(timer);
    timer = setTimeout(draw, 120);
  });
})();
