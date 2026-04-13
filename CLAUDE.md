# CLAUDE.md — South America Trip Itinerary

## Project Overview

This is a **self-contained progressive web app (PWA)** for a 17-day South America trip itinerary (April 24 – May 10, 2026). It is designed to work fully offline on mobile and desktop.

- **Route:** Christchurch → Santiago → Valparaíso → Lima → Cusco → Machu Picchu → Galápagos → Auckland → Christchurch
- **Countries:** Chile, Peru, Ecuador (+ New Zealand as departure/return point)
- **Travelers:** 5 people
- **Flights:** 10

## Repository Structure

```
south-america-trip/
├── index.html   # Entire application (HTML + CSS + JS, ~998 lines, ~1.2 MB)
└── sw.js        # Service Worker for offline caching (32 lines)
```

There are **no build tools, no package managers, no external dependencies, and no test suite.** Everything is embedded directly in `index.html`, including WOFF2 fonts (base64 encoded), CSS, and JavaScript.

## Key Data Structures (inside `index.html`)

All application data is defined as JavaScript constants in a `<script>` tag near the bottom of `index.html`:

| Constant | Purpose |
|----------|---------|
| `D` | Array of 17 day objects — the core itinerary |
| `GL` | Galápagos tour options and links |
| `PP` | Traveler passport/contact info (5 travelers) |
| `DW` | Day-of-week abbreviations |
| `MN` | Month name abbreviations |
| `RF` | Region → flag emoji mapping |

### Day Object Shape (`D` array)

```js
{
  d: "2026-04-24",   // ISO date string
  r: "cl",           // Region code: cl | pe | ga | hm (home)
  t: "Title",        // Day heading
  i: [               // Array of itinerary items
    {
      type: "flight" | "stay" | "activity" | "note" | "train",
      // ... type-specific fields (label, ref, link, addr, etc.)
    }
  ]
}
```

### Region Codes

| Code | Region |
|------|--------|
| `cl` | Chile |
| `pe` | Peru |
| `ga` | Galápagos (Ecuador) |
| `hm` | Home (New Zealand) |

## CSS Design System

CSS variables are defined in an embedded `<style>` tag in `<head>`. Key tokens:

| Variable | Purpose |
|----------|---------|
| `--accent` | Primary brand color (`#BF4417`, warm reddish-brown) |
| `--bg-card` / `--bg-surface` / `--bg-card-hover` | Background layers |
| `--text` / `--text-muted` / `--text-dim` | Text hierarchy |
| `--border` | Border color |
| `--flight` / `--train` / `--stay` / `--activity` | Event-type accent colors |
| `--radius` | Border radius |

Responsive design is mobile-first with a max container width of 660px.

## JavaScript Functions

All UI logic lives in a single inline `<script>` block:

| Function | Purpose |
|----------|---------|
| `buildStrip()` | Renders horizontal day-navigation pills |
| `buildDays()` | Renders the main itinerary day cards |
| `buildTravelers()` | Generates traveler profile cards for the modal |
| `openTravelers()` / `closeTravelers()` / `closeTravelersOutside()` | Slide-up traveler modal management |
| `tog(h)` | Toggles expand/collapse of a day card |
| `jump(ds)` | Scrolls to a specific day by date string |
| `ri(items)` | Renders itinerary item list with icons and links |
| `cp(text, btn)` | Copies text to clipboard (Clipboard API) |
| `toast(msg)` | Shows a temporary notification |
| `doSearch()` | Filters itinerary items in real-time (150ms debounce) |
| `updatePill()` | Syncs the active day pill with scroll position |
| `toggleHeroDetails()` | Expands/collapses the hero route details section |

## Service Worker (`sw.js`)

- Cache name: `sa-trip-v1`
- Strategy: **cache-first** with network fallback
- Cached assets: `/` and `/index.html`
- Scope: `/south-america-trip/`
- Old cache versions are deleted on `activate`

Registration is done at the bottom of `index.html`:
```js
navigator.serviceWorker.register('/south-america-trip/sw.js', { scope: '/south-america-trip/' })
```

If you bump the cache version (e.g., `sa-trip-v2`), do it **in both `sw.js` and any version references** so that old caches are correctly purged.

## Development Workflow

### Editing the app

1. Open `index.html` directly in a browser — no build step required.
2. Make edits and refresh; the browser will use the updated file.
3. **Service Worker note:** During development, either open DevTools → Application → Service Workers → "Update on reload", or use an incognito window to avoid stale cache serving your old file.

### Adding a new itinerary day

Add an object to the `D` array in `index.html` following the day object shape above. Items in the `i` array support these types:

- `flight` — needs `label`, optionally `ref` (booking code), `link`
- `stay` — needs `label`, optionally `addr`, `link`
- `activity` — needs `label`, optionally `link`, `note`
- `note` — free-text note, `label` only
- `train` — needs `label`, optionally `ref`, `link`

### Updating traveler info

Edit the `PP` array in `index.html`. Each entry contains personal/passport details; treat this data with appropriate care.

### Changing the visual theme

Edit CSS variables in the `<style>` block inside `<head>`. The `--accent` variable controls the primary brand color across all components.

## Conventions

- **No external dependencies** — keep everything embedded. Do not add npm, CDN links, or external fonts.
- **No build pipeline** — changes to `index.html` are immediately deployable.
- **No tests** — this is a personal travel app; verify changes manually in a browser.
- **Single-file principle** — all HTML, CSS, and JS stay in `index.html`. Only the Service Worker lives separately in `sw.js`.
- **Vanilla JS only** — do not introduce frameworks (React, Vue, etc.) or bundlers.
- **Mobile-first** — keep the 660px max-width layout and touch-friendly interactions.
- **Offline-first** — any new assets must also be added to the Service Worker cache list in `sw.js`.

## Git Branches

| Branch | Purpose |
|--------|---------|
| `main` | Stable production branch |
| `claude/add-claude-documentation-hLRYC` | Documentation branch (this file) |

Commit history shows iterative UI improvements (theme, offline support, modal UX, search bar). Follow the same concise, imperative commit message style (e.g., `Fix route cities; move passport btn into search bar`).

## Sensitive Data

`index.html` contains **real passport numbers and traveler names** in the `PP` constant. Do not log, expose, or share file contents carelessly. Do not commit this data to public repositories without the travelers' consent.
