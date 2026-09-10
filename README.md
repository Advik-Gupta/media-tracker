<h2 align="center">Media Vault</h2>
<br/>

> A personal viewing tracker for film and television - 93 curated universes and lists spanning 2,100+ titles, plus a shows and anime vault where anyone can add and track their own series. Plain HTML, CSS and JavaScript, generated to static pages by a small Node build script; Vercel serverless functions proxy the episode-data API where the browser can't call it directly.

## 🔗 Live Demo

**[media-tracker-xi.vercel.app](https://media-tracker-xi.vercel.app)**

## ⚙️ Tech Stack

**Frontend**

- Vanilla HTML / CSS / JavaScript - no framework, no client-side build step
- [EJS](https://ejs.co/) page templates, rendered once at build time into static HTML
- [jsVectorMap](https://jvectormap.com/) for the by-country film map

**Data**

- [TMDB](https://www.themoviedb.org/) episode data via [seriesgraph.com](https://seriesgraph.com), proxied through Vercel functions since it sends no CORS header
- [OMDb](https://www.omdbapi.com/) for movie ratings, cast and plot - called directly from the browser
- [ratingraph.com](https://www.ratingraph.com/) for the movie/show search used when adding to My List

**Accounts (optional)**

- [Supabase](https://supabase.com/) - email/password auth and a single JSONB row per account for synced state

**Infra**

- [Vercel](https://vercel.com/) - static hosting, serverless API routes, and the build step

## 🔧 Features

- **Curated universes and lists** - movie franchises in watch order, release order, in-universe chronology and relevance tier; TV show and anime lists tracked season by season
- **Personal shows & anime vault** - search any series and add it; each visitor's additions live only in their own browser (or account), never on the shared site
- **Dynamic show pages** - episode grids are fetched on demand rather than baked at build time, so an added show is fully interactive immediately
- **Movie detail pages** - ratings, cast, director and plot fetched from OMDb on arrival, with a plain "no details found" fallback for titles it doesn't have
- **Progress tracking** - per-episode and per-film watched state, filler marking, seasons markable as not worth watching, an ongoing/hiatus override, drag-to-reorder carousels, and archive/hide - automatic or manual
- **My List, for shows and anime too** - save a title by name as a reference (poster, year, blurb) without adding it; promote it to a tracked show whenever you actually decide to
- **Hold Tab to switch libraries** - hold it for about three seconds anywhere to cycle Movies → Shows → Anime; a quick tap still behaves as normal keyboard navigation
- **Analytics** - completion by universe, total runtime logged, best- and worst-rated episodes with the show and episode name attached
- **Films by country** - an interactive world map linking into per-country lists
- **Optional accounts** - sign in to sync watch state across devices; everything works fully signed out, saved to that browser only
- **Export / import** - a dated JSON backup of everything local storage holds, portable between browsers with no account needed

## 🚀 Getting Started

```bash
npm install     # once - EJS is the only dependency, and only at build time
npm run build   # regenerates every page from the registry
npm run serve   # http://localhost:8000
```

Copy `.env.example` to `.env` and fill in the two Supabase values if you want accounts - see [Accounts](#accounts-optional) below. Everything else works with no environment at all.

## Layout

```
index.html, pages/**.html    generated pages - do not hand-edit
api/
  search.js                  TMDB search, proxied for CORS
  show/[id].js                episode data for one show
  show/[id]/seasons.js        season-by-season detail
build/
  build.js                   renders every page + generated CSS/JS indexes
  *.ejs                       page templates
  seriesgraph.js              CLI: add/remove/merge curated show & anime entries
  *.js                        one-off and maintenance scripts (posters, imports, links)
assets/
  css/                        base tokens + one stylesheet per page family
  js/
    store.js                  durable progress, shared across every page
    home.js, tracker.js       vault grids and per-universe tracking UI
    uservault.js              the per-visitor shows/anime vault (local storage)
    seriesview.js, movieview.js   dynamic detail pages, fetched on arrival
    cloud.js, account.js      optional Supabase sync and the sign-in page
    data/                     one catalogue per built-in universe + the film registry
supabase/schema.sql           run once in the Supabase SQL editor to enable accounts
```

## Where progress is stored

Written to **localStorage** and mirrored to **IndexedDB**; both carry an `updated` timestamp and the newer one wins on load. **Export backup** writes a dated JSON file; **Import backup** takes it back on any browser or machine - the same mechanism accounts use under the hood.

**Storage is per-origin.** Opening the site from a different address (a different port, `file://` vs `http://`) looks exactly like the data was wiped, because it's a separate store. Use one address consistently.

## Accounts (optional)

Off by default - the site works completely without them. Turning them on:

1. Create a [Supabase](https://supabase.com) project.
2. **SQL Editor** → run the whole of `supabase/schema.sql`. It creates one table, `user_state`, with row-level security so an account can only ever read and write its own row.
3. Set two environment variables, then rebuild - they're read at **build time**, not runtime:

   | Variable            | Where to find it                                |
   | ------------------- | ----------------------------------------------- |
   | `SUPABASE_URL`      | Project Settings → Data API → Project URL       |
   | `SUPABASE_ANON_KEY` | Project Settings → API Keys → `anon` / `public` |

   The anon key is meant to be public; row-level security is what protects the data. Never put the `service_role` key here.

4. Decide whether new accounts need to confirm their email (Authentication → Sign In / Providers → Email) - the app handles either setting.

Once configured, a **Sign in** chip appears in the top bar. Signing in for the first time uploads whatever is already in that browser; after that, changes sync a couple of seconds after you make them. Two devices editing offline at the same time don't merge - the later save wins, which is a deliberate simplification for a personal tracker.

## Adding a curated universe

No HTML or CSS to touch - movie universes and lists are added the same way as before:

1. Add `assets/js/data/<name>.js`, publishing to `window.CATALOGUES.<name>`.
2. Add an entry to `UNIVERSES` in `assets/js/data/universes.js` - `kind`, accent colors, cover art, and the page copy block.
3. `npm run build`.

The build refuses to run if a dataset is inconsistent - an unknown type, relevance tier, or a watch block with no matching phase.

Curated shows and anime (the ones behind **Best Mini Series**, **Top Rated Shows**, etc.) go through `npm run series` instead - see `build/seriesgraph.js` for its subcommands. Anything a visitor adds through **+ Add show** never touches these files; it stays in their own browser or account.

#### AI Disclosure

This project was developed with AI assistance from Claude. All final decisions, integration, and project direction were made by the author.
