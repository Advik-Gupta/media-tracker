# Where we left off

Show and anime pages moved from build-time generation to fetch-on-visit, so
any visitor can add series to their own vault without a terminal. **This is
finished and tested locally** — the remaining step is deploying it.

## The shape of the change

Show and anime pages are no longer generated one file per show. There are now
two pages — `pages/shows/view.html` and `pages/anime/view.html` — that take a
TMDB id (`view.html?id=1396`), fetch through the `/api` proxy, and render with
the same `series.js` as before. 47 generated HTML files went away.

Key idea: `seriesview.js` shapes the API response into exactly what
`build/seriesgraph.js` used to bake in, then loads `series.js`, which cannot
tell the difference. Filler marking, ticking, the ongoing override and season
toggles all work unchanged.

## Done and verified

- `api/search.js`, `api/show/[id].js`, `api/show/[id]/seasons.js` — proxy
  seriesgraph server-side (it sends no CORS header). All three return real data.
- `pages/{shows,anime}/view.html` renders any series live. Verified: Breaking
  Bad, 5 seasons, 62 episodes; ticking writes `e1396-1x1` as before.
- **Built-in shows keep their identity.** `seriesview.js` checks the episode
  index first: if a built-in universe owns that TMDB id, the page adopts that
  universe's id, so existing progress is not orphaned, *and* it fetches every
  show under it. Verified on `?id=1396` → `uni=breakingbad`, 2 shows, 125
  episodes (Better Call Saul included).
- `assets/js/uservault.js` — per-browser store. `mediavault.myshows` (yours,
  belongs in the export) and `mediavault.showdata` (refetchable cache, does not).
- Add panel adds to your own vault instead of printing a command, storing the
  season data it already fetched for the preview.
- Vault grids merge in self-added shows; cards link to `view.html?id=`.
- `vercel.json`, `.gitignore` (`.vercel`, `.env`), secrets scan clean.
- Fixed a stray `}` in `home.css` that had been silently breaking every rule
  after `.rnd-poster .ph-init`.

## Pick up here

1. **Deploy.** Everything below is done and tested locally; the next step is
   pushing to Vercel and verifying the routes in a real deployment (see the
   routing note below).
2. **Optional: refresh on a schedule.** Show pages fetch fresh on every visit,
   so a new season appears on its own. The `Refresh` button forces it. Nothing
   else is outstanding here.
3. **Optional: `assets/js/data/series/*.js`.** Still the build input for
   `_counts.js` (vault progress, ongoing badges, archive) and `_stats.js`
   (analytics). Keeping them costs repo size but means those pages make zero
   API calls. Recommend keeping.

## Done since

- **Anime vault verified end to end.** Vinland Saga (48 eps), Naruto (3 merged
  series, 1013 eps), Attack on Titan (89). Filler marking works on the dynamic
  page and still writes to `__filler_naruto`, so existing marks carry over.
- **Export/import rewritten** (`Store.exportBundle` / `importBundle`). A backup
  is now `{version: 2, progress, prefs}` — progress plus everything of yours
  that cannot be refetched: added shows, hidden shows, drag order. It
  deliberately excludes `mediavault.showdata` and the OMDb cache, which come
  back from the API. Verified: add a show, tick it, export, wipe storage,
  import — show, tick and order all return, cache correctly absent. Old
  backups (bare map, and the `{data, updated}` wrapper) still import.
- **Movie detail pages.** `pages/movies/view.html?film=<key>`, reached from a
  small `i` on every movie card in both grid and list view. The registry
  answers instantly (title, year, poster, genres, rating); OMDb is fetched on
  arrival for cast, writers, plot, runtime, certification, country, awards,
  box office and the Rotten Tomatoes and Metacritic scores. Titles OMDb does
  not have keep what the registry knows and say so — verified on Inception
  (full) and Dekalog (partial, no director/RT).
- **`_shelves.js`** — a build-time reverse index (film key → the lists holding
  it), so the film page can link back to them without loading every catalogue.

## Known consequences to keep in mind

- **Show pages now need the proxy.** On GitHub Pages or `npm run serve` there is
  no `/api`, so a show page falls back to the last cached copy and otherwise
  shows a clear failure. The shows/anime vaults effectively require the Vercel
  deploy now. The movies side is unaffected.
- The OMDb key in `assets/js/omdb.js` is public in view-source and capped at
  1,000 requests/day **shared across everyone using the site** — that matters
  more now that other people will be on it.

## Local testing

There is no `vercel` CLI installed. To exercise `/api` locally, a small Node
harness that runs the three handlers and serves the site is the approach used
here — it is not committed; recreate it or use `vercel dev` after linking.
