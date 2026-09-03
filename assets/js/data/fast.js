/* ============================================================
   FAST & FURIOUS
   Thirteen entries including two canon shorts. Tokyo Drift released third
   but is set after Fast & Furious 6, so watch order and release order differ.
   ============================================================ */

(() => {

const ITEMS = [
  { w: 1, film: 'fast-and-the-furious-2001', type: 'film', saga: 'main', phase: 1, chrono: 2001, cLabel: '2001', rel: 'essential',
    note: 'Where it all starts, back when it was a film about stealing DVD players.' },
  { w: 2, film: 'turbo-charged-prelude-2003', sub: 'Short', type: 'short', saga: 'main', phase: 1, chrono: 2003, cLabel: '2003', rel: 'optional',
    note: 'A six-minute short bridging the first film and 2 Fast 2 Furious, showing Brian on the run.' },
  { w: 3, film: '2-fast-2-furious-2003', type: 'film', saga: 'main', phase: 1, chrono: 2003.1, cLabel: '2003', rel: 'recommended',
    note: 'No Dom. Introduces Roman and Tej, who become permanent crew.' },
  { w: 4, film: 'los-bandoleros-2009', sub: 'Short', type: 'short', saga: 'main', phase: 1, chrono: 2009, cLabel: '2009', rel: 'optional',
    note: 'Directed by Vin Diesel. Sets up Fast & Furious and explains how the crew reassembles.' },
  { w: 5, film: 'fast-and-furious-2009', type: 'film', saga: 'main', phase: 1, chrono: 2009.1, cLabel: '2009', rel: 'essential',
    note: 'The original cast reunites and the series finds the shape it keeps.' },
  { w: 6, film: 'fast-five-2011', type: 'film', saga: 'main', phase: 2, chrono: 2011, cLabel: '2011', rel: 'essential',
    note: 'The pivot from street racing to heist blockbuster, and the arrival of Hobbs.' },
  { w: 7, film: 'fast-and-furious-6-2013', type: 'film', saga: 'main', phase: 2, chrono: 2013, cLabel: '2013', rel: 'essential',
    note: 'Its mid-credits scene finally connects the series to Tokyo Drift.' },
  { w: 8, film: 'fast-and-the-furious-tokyo-drift-2006', type: 'film', saga: 'main', phase: 2, chrono: 2013.5, cLabel: '2013', rel: 'essential',
    note: 'Released third but set here, seven years later. Watching it in release order breaks the timeline and spoils a death.' },
  { w: 9, film: 'furious-7-2015', type: 'film', saga: 'main', phase: 2, chrono: 2013.6, cLabel: '2013', rel: 'essential',
    note: 'Picks up straight after Tokyo Drift, and serves as Paul Walker\'s send-off.' },
  { w: 10, film: 'fate-of-the-furious-2017', type: 'film', saga: 'main', phase: 3, chrono: 2017, cLabel: '2017', rel: 'essential',
    note: 'Introduces Cipher, the throughline villain for the rest of the saga.' },
  { w: 11, film: 'fast-and-furious-presents-hobbs-and-shaw-2019', type: 'film', saga: 'spinoff', phase: 3, chrono: 2019, cLabel: '2019', rel: 'optional',
    note: 'A spin-off running parallel to the main saga. Skippable without losing the plot.' },
  { w: 12, film: 'f9-2021', type: 'film', saga: 'main', phase: 3, chrono: 2021, cLabel: '2021', rel: 'recommended',
    note: 'Introduces Dom\'s brother Jakob, and retcons a good deal of family history.' },
  { w: 13, film: 'fast-x-2023', type: 'film', saga: 'main', phase: 3, chrono: 2023, cLabel: '2023', rel: 'essential',
    note: 'Reaches back to Fast Five for its villain, and ends on a cliffhanger.' },
  { w: 14, film: 'fast-x-part-2-2027', type: 'film', saga: 'main', phase: 3, chrono: 2027, cLabel: '2027', rel: 'essential', upcoming: true,
    note: 'Billed as the finale of the main saga. Announced for April 2027; runtime here is an estimate.' },
];

const TYPE_META = {
  'film':      { label: 'Film',                short: 'FILM',      color: '#2b9ee0' },
  'short':     { label: 'Short',               short: 'SHORT',     color: '#6bc4f2' },
};

const REL_META = {
  essential:     { label: 'Essential',    rank: 0, color: '#2b9ee0', blurb: 'Load-bearing. The story does not work without it.' },
  recommended:   { label: 'Recommended',  rank: 1, color: '#e8913d', blurb: 'Strong connective tissue. You will feel the gap.' },
  optional:      { label: 'Optional',     rank: 2, color: '#4ea8f2', blurb: 'Rewarding, but the main story holds without it.' },
  skippable:     { label: 'Skippable',    rank: 3, color: '#6b6b78', blurb: 'Safe to skip entirely on a first run.' },
};

const SAGA_META = {
  'main':        { label: 'Main Saga',               range: '2001 – 2023' },
  'spinoff':     { label: 'Spin-off',                range: '2019' },
};

const PHASE_META = {
  1: { label: 'The Street Racing Years',   sub: 'Before the heists · 2001–2009' },
  2: { label: 'The Heist Era',             sub: 'The team assembles · 2011–2015' },
  3: { label: 'Going Global',              sub: 'Family, worldwide · 2017–2023' },
};

/* Contiguous blocks of the watch order, used for its group headers. */
const WATCH_BLOCKS = [
  { max: 5, phase: 1 },
  { max: 9, phase: 2 },
  { max: 14, phase: 3 },
];

/* In-universe era buckets, keyed by the highest chrono value in each. */
const ERAS = [
  { max: 2005, key: 'street',  title: 'The Street Racing Years',     sub: '2001–2003' },
  { max: 2012, key: 'heist',   title: 'The Heist Era',               sub: '2009–2011' },
  { max: 2016, key: 'tokyo',   title: 'Tokyo and After',             sub: '2013 · where Tokyo Drift actually sits' },
  { max: 9999, key: 'global',  title: 'Going Global',                sub: '2017 onward' },
];

const POSTERS = {};   // posters live in _films.js

/* ---------- publish ---------- */

(window.CATALOGUES ||= {}).fast = {
  items: ITEMS,
  posters: POSTERS,
  imgDir: 'assets/img/fast/',
  types: TYPE_META,
  rel: REL_META,
  saga: SAGA_META,
  phase: PHASE_META,
  watchBlocks: WATCH_BLOCKS,
  eras: ERAS,
};

})();
