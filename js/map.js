// =============================================================================
// Map: Vienna in red, destinations in black, joined by fine dotted lines that
// roughly follow the real motorways. Routes form one road network (a tree
// rooted in Vienna), so shared stretches are drawn once and every route
// travels at the same pace. A destination pops up when its route arrives.
//
// Coastline: Natural Earth (public domain) via the jsDelivr CDN, cached in
// localStorage after the first visit. If it can't load, the routes still show.
// =============================================================================
(function () {
  'use strict';

  var stage = document.querySelector('.page-map');
  if (!stage) return;
  var coastC = stage.querySelector('.map-coast');
  var routeC = stage.querySelector('.map-routes');
  var wienEl = stage.querySelector('.wien-label');
  var tipEl  = stage.querySelector('.map-tip');
  var cta    = stage.querySelector('.cta');
  var header = document.querySelector('.site-header');

  var reduce = document.documentElement.classList.contains('reduce');

  // ---- timeline (ms from start) ------------------------------------------
  var T = {
    home:    80,     // Vienna pops
    start:   450,    // routes leave Vienna
    travel:  2950,   // time for the longest route  -> arrives ~3400
    coastIn: 450,    // coastline starts fading in
    wien:    3150,   // "Wien" label
    chrome:  3400    // header, footer and ANFRAGEN fade in together (done ~4.5 s)
  };
  var DOT_FADE = 150, POP = 420;

  // ---- road network -------------------------------------------------------
  // [lon, lat]. Waypoints sit on (or near) the actual motorway corridors.
  var P = {
    wien: [16.37, 48.21],
    // A1 west
    a1a: [16.12, 48.17], a1b: [15.86, 48.19], stpoelten: [15.63, 48.18], melk: [15.33, 48.21],
    ybbs: [15.07, 48.15], amstetten: [14.86, 48.11], enns: [14.47, 48.20], linz: [14.27, 48.22],
    wels: [14.03, 48.16], seewalchen: [13.58, 47.95], mondsee: [13.35, 47.86], salzburg: [13.00, 47.80],
    // Mariazell (B20)
    traisen: [15.61, 48.05], tuernitz: [15.49, 47.94], annaberg: [15.38, 47.87], mariazell: [15.32, 47.77],
    // Krumau (A7 / S10)
    gallneu: [14.41, 48.36], freistadt: [14.50, 48.51], kaplice: [14.49, 48.74], krumau: [14.32, 48.81],
    // A8 -> Passau, A3 -> Regensburg, Nürnberg, Frankfurt, Selters
    ried: [13.49, 48.22], suben: [13.43, 48.42], passau: [13.36, 48.56], deggendorf: [12.96, 48.82],
    straubing: [12.57, 48.88], regensburg: [12.10, 49.01], parsberg: [11.72, 49.16], nuernberg: [11.08, 49.45],
    hoechstadt: [10.80, 49.70], wuerzburg: [9.93, 49.77], marktheid: [9.60, 49.84], aschaffenburg: [9.15, 49.97],
    frankfurt: [8.62, 50.05], wiesbaden: [8.42, 50.09], idstein: [8.27, 50.22], selters: [8.24, 50.34],
    // A8 Germany -> Munich, Stuttgart, Karlsruhe, A5 -> Freiburg, Colmar
    traunstein: [12.62, 47.85], rosenheim: [12.06, 47.81], holzkirchen: [11.70, 47.92], muenchen: [11.52, 48.13],
    augsburg: [10.90, 48.38], guenzburg: [10.27, 48.43], ulm: [9.95, 48.44], merklingen: [9.74, 48.52],
    kirchheim: [9.45, 48.65], stuttgart: [9.17, 48.72], leonberg: [8.99, 48.80], pforzheim: [8.70, 48.88],
    karlsruhe: [8.45, 48.95], rastatt: [8.29, 48.87], badenbaden: [8.19, 48.75], offenburg: [7.93, 48.47], lahr: [7.81, 48.32],
    riegel: [7.74, 48.15], fbnord: [7.76, 48.05], freiburg: [7.85, 47.99], breisach: [7.58, 48.03], colmar: [7.36, 48.08],
    // Zell am See (A10 / B311)
    hallein: [13.09, 47.68], lueg: [13.18, 47.52], bischofshofen: [13.22, 47.42], stjohann: [13.19, 47.35],
    taxenbach: [12.96, 47.29], zell: [12.80, 47.32],
    // Inntal, Brenner, A22 -> Gardasee, Verona; A1 -> Florence, Livorno
    kufstein: [12.17, 47.58], woergl: [12.06, 47.48], schwaz: [11.70, 47.35], innsbruck: [11.40, 47.25],
    matrei: [11.45, 47.13], brenner: [11.51, 47.00], sterzing: [11.43, 46.89], brixen: [11.65, 46.71],
    bozen: [11.33, 46.47], salurn: [11.20, 46.24], trento: [11.12, 46.06], rovereto: [11.04, 45.89],
    garda: [10.84, 45.88], ala: [10.98, 45.75], verona: [10.97, 45.44], mantova: [10.80, 45.15],
    modena: [10.93, 44.66], bologna: [11.30, 44.52], appennino: [11.24, 44.24], barberino: [11.23, 44.00],
    firenze: [11.18, 43.78], empoli: [10.95, 43.71], pontedera: [10.63, 43.66], colle: [10.47, 43.59],
    livorno: [10.31, 43.55],
    // A2 south: St. Corona, Lendava, Venice, Umag, Plitvice
    voesendorf: [16.31, 48.07], baden: [16.25, 47.98], wrneustadt: [16.22, 47.81], seebenstein: [16.14, 47.69],
    grimmenstein: [16.12, 47.62], stcorona: [16.00, 47.58], aspang: [16.10, 47.54], wechsel: [16.05, 47.44],
    hartberg: [15.97, 47.28], ilz: [15.92, 47.10], gleisdorf: [15.71, 47.10], graz: [15.42, 47.02],
    fuerstenfeld: [16.08, 47.05], jennersdorf: [16.14, 46.94], goricko: [16.17, 46.77], msobota: [16.16, 46.66],
    beltinci: [16.31, 46.60], lendava: [16.45, 46.56],
    pack: [14.98, 46.97], wolfsberg: [14.84, 46.84], voelkermarkt: [14.62, 46.67], klagenfurt: [14.31, 46.62],
    velden: [14.05, 46.61], villach: [13.85, 46.60], arnoldstein: [13.70, 46.55], tarvisio: [13.58, 46.51],
    pontebba: [13.30, 46.50], chiusaforte: [13.30, 46.41], gemona: [13.18, 46.25], udine: [13.23, 46.06],
    palmanova: [13.30, 45.90], portogruaro: [12.84, 45.77], sandona: [12.57, 45.63], mestre: [12.25, 45.49],
    venedig: [12.33, 45.44],
    wildon: [15.52, 46.88], spielfeld: [15.64, 46.71], maribor: [15.65, 46.53],
    konjice: [15.42, 46.33], celje: [15.26, 46.24], trojane: [14.88, 46.18], ljubljana: [14.51, 46.05],
    vrhnika: [14.30, 45.95], postojna: [14.22, 45.78], kozina: [13.93, 45.61], koper: [13.78, 45.52],
    dragonja: [13.65, 45.46], umag: [13.52, 45.43],
    ptuj: [15.87, 46.42], macelj: [15.86, 46.24], zabok: [15.91, 46.03], zagreb: [15.93, 45.80],
    jastreb: [15.72, 45.66], karlovac: [15.55, 45.49], tusilovic: [15.58, 45.31], slunj: [15.59, 45.12],
    rakovica: [15.63, 45.00], plitvice: [15.62, 44.88],
    // A4 east
    ebreichsdorf: [16.40, 47.96], eisenstadt: [16.52, 47.84], klingenbach: [16.54, 47.75], sopron: [16.60, 47.68],
    kapuvar: [17.03, 47.60], gyor: [17.63, 47.67], tatabanya: [18.40, 47.58], budapest: [19.04, 47.50],
    // A5 north, D1, D8, A13, A24
    wolkersdorf: [16.52, 48.38], poysdorf: [16.63, 48.67], mikulov: [16.64, 48.81], brno: [16.58, 49.15],
    velkemez: [16.02, 49.35], jihlava: [15.60, 49.42], humpolec: [15.36, 49.54], praha: [14.50, 50.03],
    prahan: [14.40, 50.15], lovosice: [14.05, 50.51], usti: [14.00, 50.65], petrovice: [13.86, 50.84],
    drnord: [13.74, 51.11],
    a4ost: [14.05, 51.15], bautzen: [14.43, 51.18],
    thiendorf: [13.75, 51.35], ruhland: [13.80, 51.55], calau: [13.92, 51.70], spreewald: [13.96, 51.87],
    luckau: [13.75, 52.10], schoenefeld: [13.52, 52.34], ludwigsfelde: [13.25, 52.30], michendorf: [13.02, 52.33],
    werder: [12.92, 52.45], havelland: [12.95, 52.64], neuruppin: [12.80, 52.90], wittstock: [12.47, 53.16],
    putlitz: [11.90, 53.30], ludwigslust: [11.40, 53.40], wittenburg: [10.85, 53.50], schwarzenbek: [10.42, 53.52],
    hamburg: [10.00, 53.55]
  };

  // Each route is a list of waypoints from Vienna. Shared prefixes are drawn once.
  var ROUTES = [
    ['wien','wolkersdorf','poysdorf','mikulov','brno','velkemez','jihlava','humpolec','praha','prahan','lovosice','usti','petrovice','drnord','thiendorf','ruhland','calau','spreewald','luckau','schoenefeld','ludwigsfelde','michendorf','werder','havelland','neuruppin','wittstock','putlitz','ludwigslust','wittenburg','schwarzenbek','hamburg'],
    ['drnord','a4ost','bautzen'],
    ['wien','a1a','a1b','stpoelten','melk','ybbs','amstetten','enns','linz','wels','seewalchen','mondsee','salzburg','traunstein','rosenheim','holzkirchen','muenchen','augsburg','guenzburg','ulm','merklingen','kirchheim','stuttgart','leonberg','pforzheim','karlsruhe','rastatt','badenbaden','offenburg','lahr','riegel','fbnord','breisach','colmar'],
    ['fbnord','freiburg'],
    ['wels','ried','suben','passau','deggendorf','straubing','regensburg','parsberg','nuernberg','hoechstadt','wuerzburg','marktheid','aschaffenburg','frankfurt','wiesbaden','idstein','selters'],
    ['linz','gallneu','freistadt','kaplice','krumau'],
    ['stpoelten','traisen','tuernitz','annaberg','mariazell'],
    ['salzburg','hallein','lueg','bischofshofen','stjohann','taxenbach','zell'],
    ['rosenheim','kufstein','woergl','schwaz','innsbruck','matrei','brenner','sterzing','brixen','bozen','salurn','trento','rovereto','ala','verona','modena','bologna','barberino','firenze','empoli','pontedera','colle','livorno'],
    ['rovereto','garda'],
    ['wien','voesendorf','baden','wrneustadt','seebenstein','grimmenstein','aspang','wechsel','hartberg','ilz','gleisdorf','graz','pack','wolfsberg','voelkermarkt','klagenfurt','velden','villach','arnoldstein','tarvisio','chiusaforte','gemona','udine','palmanova','portogruaro','sandona','mestre','venedig'],
    ['grimmenstein','stcorona'],
    ['voesendorf','ebreichsdorf','eisenstadt','klingenbach','sopron','kapuvar','gyor','tatabanya','budapest'],
    ['ilz','fuerstenfeld','jennersdorf','goricko','msobota','beltinci','lendava'],
    ['graz','wildon','spielfeld','maribor','konjice','celje','trojane','ljubljana','vrhnika','postojna','kozina','koper','dragonja','umag'],
    ['maribor','ptuj','macelj','zabok','zagreb','jastreb','karlovac','tusilovic','slunj','rakovica','plitvice']
  ];

  var DEST = {
    hamburg: 'Hamburg', spreewald: 'Spreewald', bautzen: 'Bautzen', krumau: 'Krumau',
    regensburg: 'Regensburg', nuernberg: 'Nürnberg', selters: 'Selters', colmar: 'Colmar',
    freiburg: 'Freiburg', zell: 'Zell am See', garda: 'Gardasee', verona: 'Verona',
    livorno: 'Livorno', venedig: 'Venedig', umag: 'Umag', plitvice: 'Plitvice',
    lendava: 'Lendava', budapest: 'Budapest', mariazell: 'Mariazell', stcorona: 'St. Corona'
  };

  // Build the tree: parent of each node, children in order of first mention.
  var parent = {}, kids = { wien: [] };
  ROUTES.forEach(function (r) {
    for (var i = 1; i < r.length; i++) {
      var a = r[i - 1], b = r[i];
      if (parent[b] === undefined) {
        parent[b] = a;
        (kids[a] = kids[a] || []).push(b);
        kids[b] = kids[b] || [];
      }
    }
  });

  // ---- projection: Lambert azimuthal equal-area, in km ---------------------
  var D2R = Math.PI / 180, LON0 = 13 * D2R, LAT0 = 49 * D2R, RE = 6371;
  var sin0 = Math.sin(LAT0), cos0 = Math.cos(LAT0);
  function proj(lon, lat) {
    var l = lon * D2R - LON0, p = lat * D2R;
    var cp = Math.cos(p), sp = Math.sin(p), cl = Math.cos(l);
    var k = Math.sqrt(2 / (1 + sin0 * sp + cos0 * cp * cl)) * RE;
    return [k * cp * Math.sin(l), -k * (cos0 * sp - sin0 * cp * cl)];
  }
  var KM = {}, bb = [1e9, 1e9, -1e9, -1e9];
  Object.keys(P).forEach(function (n) {
    if (n !== 'wien' && parent[n] === undefined) return;
    var q = KM[n] = proj(P[n][0], P[n][1]);
    bb[0] = Math.min(bb[0], q[0]); bb[1] = Math.min(bb[1], q[1]);
    bb[2] = Math.max(bb[2], q[0]); bb[3] = Math.max(bb[3], q[1]);
  });

  // ---- layout state -------------------------------------------------------
  var W = 0, H = 0, DPR = 1, view = null;   // view: {k, ox, oy}
  var dots = null, dests = null, home = null, Smax = 1, sz = null;
  var cctx = coastC.getContext('2d'), rctx = routeC.getContext('2d');

  function toPx(q) { return [q[0] * view.k + view.ox, q[1] * view.k + view.oy]; }

  function layout() {
    var r = stage.getBoundingClientRect();
    W = Math.round(r.width); H = Math.round(r.height);
    if (!W || !H) return false;
    DPR = Math.min(window.devicePixelRatio || 1, 2.5);
    [coastC, routeC].forEach(function (c) {
      c.width = Math.round(W * DPR); c.height = Math.round(H * DPR);
    });

    var small = W < 600;
    sz = {
      dotR: small ? 0.8 : 0.9,
      gap:  small ? 3.0 : 3.4,
      dest: small ? 2.5 : 2.9,
      home: small ? 4.3 : 5,
      margin: small ? 10 : 12
    };

    // Safe box for the network: below the header, above ANFRAGEN.
    var hb = header ? header.getBoundingClientRect().bottom : 80;
    var cb = cta ? cta.getBoundingClientRect().top - r.top : H - 110;
    var padX = Math.max(14, W * 0.045);
    var bleed = parseFloat(getComputedStyle(header || document.body, '::after').height) || 0;
    var top = hb + bleed * 0.62, bottom = cb - (small ? 8 : 14);
    var sw = W - 2 * padX - 2 * sz.margin, sh = bottom - top - 2 * sz.margin;
    var bw = bb[2] - bb[0], bh = bb[3] - bb[1];
    var k = Math.min(sw / bw, sh / bh) * 0.86;   // a little more of Europe around the routes
    view = {
      k: k,
      ox: W / 2 - (bb[0] + bw / 2) * k,
      oy: (top + bottom) / 2 - (bb[1] + bh / 2) * k
    };
    buildNetwork();
    return true;
  }

  // ---- geometry: smooth edges, evenly spaced dots ---------------------------
  function unit(v) { var l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; }

  function buildNetwork() {
    var px = {}, tan = {}, cum = {};
    Object.keys(KM).forEach(function (n) { px[n] = toPx(KM[n]); });
    // tangent at each node: average of incoming and the main outgoing direction
    Object.keys(px).forEach(function (n) {
      var p = parent[n], c = kids[n] && kids[n][0];
      var din = p ? unit([px[n][0] - px[p][0], px[n][1] - px[p][1]]) : null;
      var dout = c ? unit([px[c][0] - px[n][0], px[c][1] - px[n][1]]) : null;
      tan[n] = din && dout ? unit([din[0] + dout[0], din[1] + dout[1]]) : (din || dout || [1, 0]);
    });

    dots = []; dests = [];
    cum.wien = 0;
    var gap = sz.gap;
    // breadth-first from Vienna so parents are done before children
    var queue = ['wien'];
    while (queue.length) {
      var a = queue.shift();
      (kids[a] || []).forEach(function (b, idx) {
        var A = px[a], B = px[b];
        var chord = Math.hypot(B[0] - A[0], B[1] - A[1]);
        var dirAB = unit([B[0] - A[0], B[1] - A[1]]);
        var t0;
        if (a === 'wien') t0 = dirAB;                       // each road leaves Vienna its own way
        else if (idx === 0) t0 = tan[a];                    // main road carries on smoothly
        else t0 = unit([tan[a][0] * 0.5 + dirAB[0], tan[a][1] * 0.5 + dirAB[1]]); // exit ramp
        var t1 = tan[b];
        var c1 = [A[0] + t0[0] * chord / 3, A[1] + t0[1] * chord / 3];
        var c2 = [B[0] - t1[0] * chord / 3, B[1] - t1[1] * chord / 3];
        // sample the cubic, walk its length, drop dots on the global grid
        var n = Math.max(8, Math.ceil(chord / 1.5));
        var prev = A, s = cum[a];
        var next = (Math.floor(s / gap) + 1) * gap;
        for (var i = 1; i <= n; i++) {
          var t = i / n, u = 1 - t;
          var q = [
            u*u*u*A[0] + 3*u*u*t*c1[0] + 3*u*t*t*c2[0] + t*t*t*B[0],
            u*u*u*A[1] + 3*u*u*t*c1[1] + 3*u*t*t*c2[1] + t*t*t*B[1]
          ];
          var seg = Math.hypot(q[0] - prev[0], q[1] - prev[1]);
          while (s + seg >= next) {
            var f = (next - s) / seg;
            dots.push(prev[0] + (q[0] - prev[0]) * f, prev[1] + (q[1] - prev[1]) * f, next);
            next += gap;
          }
          s += seg; prev = q;
        }
        cum[b] = s;
        queue.push(b);
      });
    }
    Smax = 0;
    Object.keys(cum).forEach(function (n) { if (cum[n] > Smax) Smax = cum[n]; });
    Object.keys(DEST).forEach(function (n) {
      if (px[n]) dests.push({ x: px[n][0], y: px[n][1], s: cum[n], name: DEST[n] });
    });
    home = px.wien;

    // Keep dots clear of the end-point discs
    var clearHome = sz.home + 2.2, clearDest = sz.dest + 1.6;
    var kept = [];
    for (var j = 0; j < dots.length; j += 3) {
      var x = dots[j], y = dots[j + 1], ok = Math.hypot(x - home[0], y - home[1]) > clearHome;
      for (var d = 0; ok && d < dests.length; d++) {
        if (Math.abs(x - dests[d].x) < clearDest && Math.abs(y - dests[d].y) < clearDest &&
            Math.hypot(x - dests[d].x, y - dests[d].y) < clearDest) ok = false;
      }
      if (ok) kept.push(x, y, dots[j + 2]);
    }
    dots = kept;

    // "Wien": directly to the right of the dot, centred on its horizon
    // (all roads leave Vienna to the north, west and south).
    wienEl.style.transform = 'translate(' + (home[0] + sz.home + 7).toFixed(1) + 'px,' +
                             home[1].toFixed(1) + 'px) translateY(-46%)';
  }

  // ---- timing: one wave front, same pace on every route ---------------------
  // Position of the front at time fraction x: s = Smax*(0.7x + 0.3x^2), i.e. it
  // starts at a calm pace and gently speeds up.
  function timeAt(s) {
    var y = s / Smax;
    var x = (-0.7 + Math.sqrt(0.49 + 1.2 * y)) / 0.6;
    return T.start + T.travel * x;
  }
  function easeOutBack(p) { var c = 1.9; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); }
  function easeOut(p) { return 1 - Math.pow(1 - p, 3); }

  // ---- drawing --------------------------------------------------------------
  var INK = '31,23,14', RED = '#A23425';

  function drawRoutes(now) {
    var c = rctx;
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    c.clearRect(0, 0, W, H);

    // route dots
    var r = sz.dotR, full = [];
    c.fillStyle = 'rgba(' + INK + ',.62)';
    c.beginPath();
    for (var i = 0; i < dots.length; i += 3) {
      var t = timeAt(dots[i + 2]);
      if (now < t) continue;
      var a = (now - t) / DOT_FADE;
      if (a >= 1) { c.moveTo(dots[i] + r, dots[i + 1]); c.arc(dots[i], dots[i + 1], r, 0, 6.2832); }
      else full.push(dots[i], dots[i + 1], a);
    }
    c.fill();
    for (var j = 0; j < full.length; j += 3) {
      c.fillStyle = 'rgba(' + INK + ',' + (0.62 * full[j + 2]).toFixed(3) + ')';
      c.beginPath(); c.arc(full[j], full[j + 1], r * 1.25, 0, 6.2832); c.fill();
    }

    // destinations
    dests.forEach(function (d) {
      var t = timeAt(d.s) - 40;
      if (now < t) return;
      var p = Math.min(1, (now - t) / POP);
      var sc = easeOutBack(p);
      c.fillStyle = 'rgb(' + INK + ')';
      c.beginPath(); c.arc(d.x, d.y, Math.max(0, sz.dest * sc), 0, 6.2832); c.fill();
      if (p < 1) {
        c.strokeStyle = 'rgba(' + INK + ',' + (0.38 * (1 - p)).toFixed(3) + ')';
        c.lineWidth = 0.8;
        c.beginPath(); c.arc(d.x, d.y, sz.dest + 9 * easeOut(p), 0, 6.2832); c.stroke();
      }
    });

    // Vienna
    if (now >= T.home) {
      var ph = Math.min(1, (now - T.home) / 480);
      c.fillStyle = RED;
      c.beginPath(); c.arc(home[0], home[1], sz.home * easeOutBack(ph), 0, 6.2832); c.fill();
      var rp = (now - T.home - 200) / 1900;               // one soft ripple
      if (rp > 0 && rp < 1) {
        c.strokeStyle = 'rgba(162,52,37,' + (0.55 * (1 - rp)).toFixed(3) + ')';
        c.lineWidth = 1;
        c.beginPath(); c.arc(home[0], home[1], sz.home + 18 * easeOut(rp), 0, 6.2832); c.stroke();
      }
    }
  }

  // ---- coastline ------------------------------------------------------------
  var COAST_URLS = [
    'https://cdn.jsdelivr.net/npm/world-atlas@2/land-50m.json',
    'https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json'
  ];
  var CACHE_KEY = 'dm-coast-v1';
  var lines = null;          // array of Float64Array of km coords [x0,y0,x1,y1,...]

  function fromTopo(topo) {
    var tr = topo.transform, sx = tr.scale[0], sy = tr.scale[1], tx = tr.translate[0], ty = tr.translate[1];
    var out = [];
    topo.arcs.forEach(function (arc) {
      var x = 0, y = 0, cur = [];
      for (var i = 0; i < arc.length; i++) {
        x += arc[i][0]; y += arc[i][1];
        var lon = x * sx + tx, lat = y * sy + ty;
        if (lon < -32 || lon > 52 || lat < 27 || lat > 74) {
          if (cur.length > 2) out.push(cur);
          cur = []; continue;
        }
        cur.push(Math.round(lon * 1000) / 1000, Math.round(lat * 1000) / 1000);
      }
      if (cur.length > 2) out.push(cur);
    });
    return out;
  }
  function useLonLat(arr) {
    lines = arr.map(function (ll) {
      var a = new Float64Array(ll.length);
      for (var i = 0; i < ll.length; i += 2) { var q = proj(ll[i], ll[i + 1]); a[i] = q[0]; a[i + 1] = q[1]; }
      return a;
    });
  }
  function drawCoast() {
    var c = cctx;
    c.setTransform(DPR, 0, 0, DPR, 0, 0);
    c.clearRect(0, 0, W, H);
    if (!lines) return;
    var k = view.k, ox = view.ox, oy = view.oy;
    c.beginPath();
    for (var i = 0; i < lines.length; i++) {
      var a = lines[i];
      c.moveTo(a[0] * k + ox, a[1] * k + oy);
      for (var j = 2; j < a.length; j += 2) c.lineTo(a[j] * k + ox, a[j + 1] * k + oy);
    }
    c.strokeStyle = 'rgba(' + INK + ',.36)';
    c.lineWidth = W < 600 ? 0.75 : 0.85;
    c.lineJoin = 'round'; c.lineCap = 'round';
    c.stroke();
  }

  var t0 = null;
  function coastReady() {
    drawCoast();
    var elapsed = t0 === null ? 0 : performance.now() - t0;
    if (reduce) { coastC.style.transition = 'none'; coastC.classList.add('is-on'); return; }
    if (elapsed > T.coastIn + 600) coastC.classList.add('is-late');
    setTimeout(function () {
      requestAnimationFrame(function () { coastC.classList.add('is-on'); });
    }, Math.max(0, T.coastIn - elapsed));
  }
  function loadCoast() {
    try {
      var cached = localStorage.getItem(CACHE_KEY);
      if (cached) { useLonLat(JSON.parse(cached)); coastReady(); return; }
    } catch (e) {}
    (function tryUrl(i) {
      if (i >= COAST_URLS.length || !window.fetch) return;
      fetch(COAST_URLS[i]).then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      }).then(function (topo) {
        var ll = fromTopo(topo);
        useLonLat(ll);
        if (i === 0) { try { localStorage.setItem(CACHE_KEY, JSON.stringify(ll)); } catch (e) {} }
        coastReady();
      }).catch(function () { tryUrl(i + 1); });
    })(0);
  }

  // ---- run --------------------------------------------------------------------
  var END = T.start + T.travel + POP + 200;
  var done = false;

  function frame(ts) {
    if (t0 === null) t0 = ts;
    var now = ts - t0;
    drawRoutes(now);
    if (now >= T.wien) wienEl.classList.add('is-on');
    if (now >= T.chrome) document.documentElement.classList.add('chrome-in');
    if (now < END) requestAnimationFrame(frame);
    else done = true;
  }

  if (!layout()) return;
  loadCoast();
  if (reduce) {
    done = true; t0 = 0;
    drawRoutes(1e9); wienEl.classList.add('is-on');
    document.documentElement.classList.add('chrome-in');
  } else {
    requestAnimationFrame(frame);
  }

  // Re-layout on real size changes only (ignore mobile toolbar wobble).
  var lastW = W, lastH = H, rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      var r = stage.getBoundingClientRect();
      if (Math.abs(r.width - lastW) < 2 && Math.abs(r.height - lastH) < 60) return;
      if (!layout()) return;
      lastW = W; lastH = H;
      drawCoast();
      if (done) drawRoutes(1e9);         // otherwise the running animation picks it up
    }, 120);
  });

  // ---- hover: show a destination's name (mouse only) -----------------------
  if (window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    stage.addEventListener('mousemove', function (e) {
      if (!done || !dests) return;
      var r = stage.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      var best = null, bd = 12;
      dests.forEach(function (d) { var dd = Math.hypot(d.x - x, d.y - y); if (dd < bd) { bd = dd; best = d; } });
      if (Math.hypot(home[0] - x, home[1] - y) < 10) best = null;
      if (best) {
        tipEl.textContent = best.name;
        tipEl.style.transform = 'translate(' + (best.x + 8).toFixed(1) + 'px,' + (best.y - 22).toFixed(1) + 'px)';
        tipEl.classList.add('is-on');
        stage.style.cursor = 'default';
      } else tipEl.classList.remove('is-on');
    });
    stage.addEventListener('mouseleave', function () { tipEl.classList.remove('is-on'); });
  }
})();
