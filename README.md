# Dušan Milojević — Busunternehmer

One-page static site: plain HTML/CSS/JS, no build step.

```
index.html            The page (header, map, footer)
css/style.css         All styling (white header fading into grainy light blue)
js/map.js             Europe map, Vienna dot, destinations, animated dotted routes
images/wordmark.svg   "Dušan Milojević Busunternehmer" in one line
images/favicon.svg    Tab icon
```

## Deploy (Cloudflare Pages)
Framework: None · Build command: empty · Output directory: empty (or `/`).

## Editing
- **Destinations:** `DESTS` list at the top of `js/map.js` (name, longitude, latitude).
- **Colours:** variables at the top of `css/style.css` (`--sky`, `--red`, `--ink`).
- **Footer text / email:** `index.html`.

The coastline is Natural Earth data (public domain), loaded from the jsDelivr CDN
when the page opens.
