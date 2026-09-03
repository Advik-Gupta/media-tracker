# Media Vault

A local-first viewing tracker for film and television universes. Plain HTML, CSS and
JavaScript in the browser - no framework, no runtime dependencies. Pages are generated
from templates by a small Node script; the output is static HTML that deploys anywhere.

```bash
npm install     # once - EJS is the only dependency, and only at build time
npm run build   # regenerates every page from the registry
npm run serve   # http://localhost:8000
```

**27 universes · 612 distinct titles.** One list (IMDb Top 250), twenty film universes,
six show universes.

## Layout

```
index.html                generated home hub
<universe>.html           27 generated tracker pages
build/
  universe.ejs            tracker page template
  index.ejs               home page template
  build.js                renders both + assets/css/universes.css
assets/
  css/
    base.css              tokens, reset, shared primitives, badges
    universes.css         per-universe accents - GENERATED
    home.css              home page: cards, carousel, random picker
    tracker.css           tracker pages: timeline, compact list, detail sheet
  js/
    store.js              durable progress + shared helpers
    home.js               universe grids, carousels, global stats
    tracker.js            filtering, sorting, grouping, rendering, detail sheet
    random.js             the "Surprise me" picker
    data/
      universes.js        the registry - accents, covers, and per-page copy
      <universe>.js       one catalogue per universe
  img/                    only the 14 posters with no working URL
```

## Where progress is stored

Written to **localStorage** and mirrored to **IndexedDB**. Both carry an `updated`
timestamp and the newer wins on load, so if localStorage is cleared but IndexedDB
survives, progress returns automatically on the next visit. The app also calls
`navigator.storage.persist()` to ask the browser not to evict it under storage pressure.

**Storage is per-origin.** `file:///…/index.html`, `http://127.0.0.1:5500` and
`http://localhost:5500` are three separate stores - and Live Server silently moves to
port 5501 if 5500 is busy. Opening from a different address looks exactly like the data
was wiped. Use one address consistently; once deployed, use the deployed URL.

The home page shows when progress was last saved and whether the browser marked the
storage persistent. **Export backup** writes a dated JSON file; **Import backup** takes
it back on any origin or machine.

Shape, under the key `watchvault.v1`:

```json
{
  "updated": 1755500000000,
  "data": { "marvel": { "im1": 1 }, "__shared": { "inception": 1 } }
}
```

## Poster images

Posters load from remote URLs, so the site ships almost no image files (~2 MB total).
Sources: IMDb's CDN for the Top 250, AniList for Attack on Titan, Wikipedia for most
franchises, mcu-timeline.com for Marvel.

A poster value is used as-is if it starts with `http` or `assets/`, and otherwise
resolved inside that universe's folder - so remote and local mix freely. Fourteen
posters had no URL available and remain local under `assets/img/`.

Wikipedia and mcu-timeline are the fragile links. If they hotlink-block, those posters
degrade to a generated placeholder tile rather than breaking the layout.

## Data model

Each entry in `assets/js/data/<universe>.js`:

| field                   | meaning                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| `w`                     | watch-order index. Some universes use 201+ for material outside the main run (Fox X-Men, non-EON Bond). |
| `id`                    | stable key for saved progress - **never change one after watching things**, or that progress detaches.  |
| `title`, `sub`          | display title and qualifier (`Season 1 · Ep 1–7`)                                                       |
| `type`, `saga`, `phase` | keys into `TYPE_META`, `SAGA_META`, `PHASE_META`                                                        |
| `release`               | ISO date - drives release sorting and the countdown                                                     |
| `chrono`                | in-universe position as a sortable number (years, ABY, AC…)                                             |
| `cLabel`                | how that position reads to a human, e.g. `Christmas 2024`, `32 BBY`                                     |
| `rel`                   | `essential`, `recommended`, `optional`, `skippable`                                                     |
| `mins`, `eps`           | runtime and episode count                                                                               |
| `note`                  | context, recasting notes, post-credits guidance                                                         |
| `upcoming`              | `true` for unreleased titles                                                                            |
| `link`                  | shared id for a title that appears in several lists - ticking one ticks all, and it counts once         |
| `alias`                 | same idea, within a single list                                                                         |

Each file also publishes `WATCH_BLOCKS` (contiguous watch-order ranges for group
headers), `ERAS` (in-universe buckets), `POSTERS` and optionally `sideGroup`.

## The four orderings

- **Watch order** - the recommended sequence. Headers follow contiguous blocks of the
  watch order rather than each entry's own phase, because entries like Black Widow and
  I Am Groot are deliberately interleaved out of phase.
- **Release order** - strict release date, grouped by year.
- **In-universe** - sorted by `chrono`, grouped into eras. This is where Tokyo Drift
  moves to seventh and Final Destination 5 becomes a prequel.
- **Relevance** - essentials first, grouped by tier.

## Adding a universe

No HTML or CSS to touch.

1. Add `assets/js/data/<name>.js` in the usual shape, publishing to
   `window.CATALOGUES.<name>`.
2. Add an entry to `UNIVERSES` in `assets/js/data/universes.js` - `kind`
   (`list`/`movie`/`show`), `accent`, `cover`, and the `page` copy block.
3. `npm run build`.

The build **refuses to run** if a dataset is inconsistent: a watch block with no
matching `PHASE_META` entry, or an item with an unknown type, relevance or phase.
That is exactly the bug that once shipped a blank Game of Thrones page.

## Keyboard and interaction

- Click a card for its detail sheet; `Esc` closes.
- Click the checkbox, or focus a card and press `Space`, to toggle watched.
- **Next up ↓** jumps to the first unwatched title in view.
- **Surprise me** draws a random title from every list, or one you pick; `R` re-rolls.
- Filters stack - relevance, media type, phase/saga, status - and combine with search.

## Note on the old file

`mcu-tracker (1).html` is the original single-file version, left untouched and
unreferenced. Delete it whenever you like.
