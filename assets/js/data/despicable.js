/* ============================================================
   DESPICABLE ME
   Four Despicable Me films and two Minions prequels. Minions (2015) is set
   decades before everything else, so watch order and in-universe order pull
   apart sharply.
   ============================================================ */

(() => {

const ITEMS = [
  { w: 1, film: 'despicable-me-2010', type: 'film', saga: 'dm', phase: 1, chrono: 2010, cLabel: 'present day', rel: 'essential',
    note: 'The original. Introduces Gru, the girls and the Minions.' },
  { w: 2, film: 'despicable-me-2-2013', type: 'film', saga: 'dm', phase: 1, chrono: 2013, cLabel: 'present day', rel: 'recommended' },
  { w: 3, film: 'minions-2015', type: 'film', saga: 'minions', phase: 1, chrono: 1968, cLabel: '1968', rel: 'optional',
    note: 'A prequel set in 1968, decades before Gru. Chronologically the earliest film in the series.' },
  { w: 4, film: 'despicable-me-3-2017', type: 'film', saga: 'dm', phase: 1, chrono: 2017, cLabel: 'present day', rel: 'optional' },
  { w: 5, film: 'minions-the-rise-of-gru-2022', type: 'film', saga: 'minions', phase: 1, chrono: 1976, cLabel: '1976', rel: 'recommended',
    note: 'Set in 1976, with a twelve-year-old Gru. Bridges the two prequels to the main films.' },
  { w: 6, film: 'despicable-me-4-2024', type: 'film', saga: 'dm', phase: 1, chrono: 2024, cLabel: 'present day', rel: 'optional' },
];

const TYPE_META = {
  'film':    { label: 'Film',            short: 'FILM',    color: '#f2c14e' },
};

const REL_META = {
  essential:     { label: 'Essential',    rank: 0, color: '#f2c14e', blurb: 'Load-bearing. The story does not work without it.' },
  recommended:   { label: 'Recommended',  rank: 1, color: '#e8913d', blurb: 'Strong connective tissue. You will feel the gap.' },
  optional:      { label: 'Optional',     rank: 2, color: '#4ea8f2', blurb: 'Rewarding, but the main story holds without it.' },
  skippable:     { label: 'Skippable',    rank: 3, color: '#6b6b78', blurb: 'Safe to skip entirely on a first run.' },
};

const SAGA_META = {
  'dm':        { label: 'Despicable Me',         range: '2010 – 2024' },
  'minions':   { label: 'Minions',               range: '2015 – 2022' },
};

const PHASE_META = {
  1: { label: 'Despicable Me',           sub: 'The Gru films' },
  2: { label: 'The Minions Prequels',    sub: 'Before Gru grew up' },
};

const WATCH_BLOCKS = [
  { max: 6, phase: 1 },
];

const ERAS = [
  { max: 1970, key: 'a',   title: 'The Minions Prequels',    sub: '1968–1976 · long before Gru' },
  { max: 9999, key: 'b',   title: 'The Gru Films',           sub: 'Present day' },
];

const POSTERS = {};   // posters live in _films.js

/* ---------- publish ---------- */

(window.CATALOGUES ||= {}).despicable = {
  items: ITEMS,
  posters: POSTERS,
  imgDir: 'assets/img/despicable/',
  types: TYPE_META,
  rel: REL_META,
  saga: SAGA_META,
  phase: PHASE_META,
  watchBlocks: WATCH_BLOCKS,
  eras: ERAS,
};

})();
