# Dušan Milojević — Busunternehmer

Static two-page site: plain HTML/CSS/JS, no build step. Upload the folder contents to a
GitHub repo and serve with GitHub Pages (Settings → Pages → Deploy from branch → `main`, `/ (root)`)
or Cloudflare Pages (Framework: None, build command empty, output directory `/`).

```
index.html                 Both pages (map + Anfragen), fixed header and footer
css/style.css              All styling; colours at the top (--sky, --paper, --red, --ink)
js/map.js                  Map: coastline, road-following routes, intro animation
js/site.js                 Header/footer/ANFRAGEN timing, page swipe
images/brand.svg           Header: logo + "Dušan Milojević / Busunternehmer" block
images/name.svg            Name lettering (caption under the photo)
images/logo.svg            Logo on its own
images/favicon.svg, apple-touch-icon.png
images/dusan-milojevic-*.jpg / .webp   Portrait in two sizes
```

## Editing
- **Destinations / roads:** in `js/map.js`, `P` holds the waypoints (longitude, latitude), `ROUTES`
  lists the roads from Vienna, `DEST` names the end points. Branches start from any node already
  on a road, e.g. `['graz','wildon', … ,'umag']`.
- **Intro timing:** `T` at the top of `js/map.js`, and the two timeouts in `js/site.js`
  (header/footer at 2.9 s, ANFRAGEN at 3.15 s).
- **Texts, e-mail, phone:** `index.html`.

The coastline is Natural Earth data (public domain), loaded from the jsDelivr CDN and cached in the
visitor's browser after the first visit.
