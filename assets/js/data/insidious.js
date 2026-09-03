/* ============================================================
   INSIDIOUS
   Five films. The middle two are prequels, so the watch order and the
   in-universe order diverge sharply.
   ============================================================ */

(() => {

const ITEMS = [
  { w: 1, film: 'insidious-2010', type: 'film', saga: 'lambert', phase: 1, chrono: 2010.5, cLabel: '2010', rel: 'essential',
    note: 'Introduces The Further. Premiered at Toronto in September 2010 before a wide release in April 2011.' },
  { w: 2, film: 'insidious-chapter-2-2013', type: 'film', saga: 'lambert', phase: 1, chrono: 2010.6, cLabel: '2010', rel: 'essential',
    note: 'Picks up immediately where the first film ends, and loops back through its own events.' },
  { w: 3, film: 'insidious-chapter-3-2015', type: 'film', saga: 'elise', phase: 2, chrono: 2007, cLabel: '2007', rel: 'recommended',
    note: 'A prequel set three years before the first film, following Elise Rainier.' },
  { w: 4, film: 'insidious-the-last-key-2018', type: 'film', saga: 'elise', phase: 2, chrono: 2010, cLabel: '2010', rel: 'recommended',
    note: 'Elise\'s own backstory, ending days before the first film begins.' },
  { w: 5, film: 'insidious-the-red-door-2023', type: 'film', saga: 'lambert', phase: 3, chrono: 2019, cLabel: '2019', rel: 'essential',
    note: 'Returns to the Lambert family nine years after Chapter 2. Requires the first two films.' },
  { w: 6, film: 'insidious-6-2026', type: 'film', saga: 'lambert', phase: 3, chrono: 2026, cLabel: '2026', rel: 'recommended',
    note: 'Announced for 2026 and shot under the working title Thread: An Insidious Tale. Date and runtime here are approximate.' },
];

const TYPE_META = {
  'film':      { label: 'Film',                short: 'FILM',      color: '#6a4fb5' },
};

const REL_META = {
  essential:     { label: 'Essential',    rank: 0, color: '#6a4fb5', blurb: 'Load-bearing. The story does not work without it.' },
  recommended:   { label: 'Recommended',  rank: 1, color: '#e8913d', blurb: 'Strong connective tissue. You will feel the gap.' },
  optional:      { label: 'Optional',     rank: 2, color: '#4ea8f2', blurb: 'Rewarding, but the main story holds without it.' },
  skippable:     { label: 'Skippable',    rank: 3, color: '#6b6b78', blurb: 'Safe to skip entirely on a first run.' },
};

const SAGA_META = {
  'lambert':     { label: 'The Lambert Story',       range: '2010 – 2023' },
  'elise':       { label: 'The Elise Prequels',      range: '2015 – 2018' },
};

const PHASE_META = {
  1: { label: 'The Lambert Haunting',      sub: 'Chapters 1 and 2 · 2010–2013' },
  2: { label: 'The Elise Prequels',        sub: 'Before the Lamberts · 2015–2018' },
  3: { label: 'Return to The Further',     sub: 'Ten years later · 2023' },
};

/* Contiguous blocks of the watch order, used for its group headers. */
const WATCH_BLOCKS = [
  { max: 2, phase: 1 },
  { max: 4, phase: 2 },
  { max: 6, phase: 3 },
];

/* In-universe era buckets, keyed by the highest chrono value in each. */
const ERAS = [
  { max: 2009, key: 'pre',     title: 'Before the Lamberts',         sub: '2007 · Elise on her own cases' },
  { max: 2015, key: 'lam',     title: 'The Lambert Haunting',        sub: '2010 · the events of Chapters 1 and 2' },
  { max: 9999, key: 'after',   title: 'A Decade Later',              sub: '2019 · the Red Door' },
];

const POSTERS = {};   // posters live in _films.js

/* ---------- publish ---------- */

(window.CATALOGUES ||= {}).insidious = {
  items: ITEMS,
  posters: POSTERS,
  imgDir: 'assets/img/insidious/',
  types: TYPE_META,
  rel: REL_META,
  saga: SAGA_META,
  phase: PHASE_META,
  watchBlocks: WATCH_BLOCKS,
  eras: ERAS,
};

})();
