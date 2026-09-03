/* ============================================================
   JASON BOURNE
   Five films. The Bourne Legacy runs concurrently with The Bourne Ultimatum
   and follows a different agent entirely.
   ============================================================ */

(() => {

const ITEMS = [
  { w: 1, film: 'bourne-identity-2002', type: 'film', saga: 'bourne', phase: 1, chrono: 2002, cLabel: '2002', rel: 'essential',
    note: 'The film that reset the template for spy thrillers, Bond included.' },
  { w: 2, film: 'bourne-supremacy-2004', type: 'film', saga: 'bourne', phase: 1, chrono: 2004, cLabel: '2004', rel: 'essential',
    note: 'Greengrass takes over. Its final scene is replayed inside Ultimatum.' },
  { w: 3, film: 'bourne-ultimatum-2007', type: 'film', saga: 'bourne', phase: 1, chrono: 2004.5, cLabel: '2004', rel: 'essential',
    note: 'Most of it takes place before Supremacy\'s final scene, which it then repeats from the other side.' },
  { w: 4, film: 'bourne-legacy-2012', type: 'film', saga: 'cross', phase: 2, chrono: 2004.6, cLabel: '2004', rel: 'optional',
    note: 'Runs concurrently with Ultimatum and does not feature Bourne at all. Skippable without losing the thread.' },
  { w: 5, film: 'jason-bourne-2016', type: 'film', saga: 'bourne', phase: 2, chrono: 2016, cLabel: '2016', rel: 'recommended',
    note: 'Damon and Greengrass return nine years later.' },
];

const TYPE_META = {
  'film':      { label: 'Film',                short: 'FILM',      color: '#4f7fa8' },
};

const REL_META = {
  essential:     { label: 'Essential',    rank: 0, color: '#4f7fa8', blurb: 'Load-bearing. The story does not work without it.' },
  recommended:   { label: 'Recommended',  rank: 1, color: '#e8913d', blurb: 'Strong connective tissue. You will feel the gap.' },
  optional:      { label: 'Optional',     rank: 2, color: '#4ea8f2', blurb: 'Rewarding, but the main story holds without it.' },
  skippable:     { label: 'Skippable',    rank: 3, color: '#6b6b78', blurb: 'Safe to skip entirely on a first run.' },
};

const SAGA_META = {
  'bourne':      { label: 'The Bourne Films',        range: '2002 – 2016' },
  'cross':       { label: 'The Aaron Cross Spin-off', range: '2012' },
};

const PHASE_META = {
  1: { label: 'The Bourne Trilogy',        sub: 'Damon and Greengrass · 2002–2007' },
  2: { label: 'The Expansion',             sub: 'Spin-off and return · 2012–2016' },
};

/* Contiguous blocks of the watch order, used for its group headers. */
const WATCH_BLOCKS = [
  { max: 3, phase: 1 },
  { max: 5, phase: 2 },
];

/* In-universe era buckets, keyed by the highest chrono value in each. */
const ERAS = [
  { max: 2003, key: 'start',   title: 'Amnesia',                     sub: '2002 · Bourne washes up in the Mediterranean' },
  { max: 2010, key: 'run',     title: 'On the Run',                  sub: '2004 · Supremacy, Ultimatum and Legacy overlap' },
  { max: 9999, key: 'late',    title: 'Out of Retirement',           sub: '2016' },
];

const POSTERS = {};   // posters live in _films.js

/* ---------- publish ---------- */

(window.CATALOGUES ||= {}).bourne = {
  items: ITEMS,
  posters: POSTERS,
  imgDir: 'assets/img/bourne/',
  types: TYPE_META,
  rel: REL_META,
  saga: SAGA_META,
  phase: PHASE_META,
  watchBlocks: WATCH_BLOCKS,
  eras: ERAS,
};

})();
