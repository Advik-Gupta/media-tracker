/* ============================================================
   PIRATES OF THE CARIBBEAN
   Five films in a single continuous story. Release order and in-universe
   order are identical.
   ============================================================ */

(() => {

const ITEMS = [
  { w: 1, film: 'curse-of-the-black-pearl-2003', type: 'film', saga: 'trilogy', phase: 1, chrono: 2003, cLabel: '1720s', rel: 'essential',
    note: 'Nobody expected a theme-park ride adaptation to be this good. Depp\'s performance reset the whole franchise.' },
  { w: 2, film: 'dead-man-s-chest-2006', type: 'film', saga: 'trilogy', phase: 1, chrono: 2006, cLabel: '1720s', rel: 'essential',
    note: 'Davy Jones, and one of the best practical-and-digital creature designs of its era. Ends on a cliffhanger.' },
  { w: 3, film: 'at-world-s-end-2007', type: 'film', saga: 'trilogy', phase: 1, chrono: 2007, cLabel: '1720s', rel: 'essential',
    note: 'Resolves the cliffhanger directly. Long and convoluted, but it closes the trilogy properly.' },
  { w: 4, film: 'on-stranger-tides-2011', type: 'film', saga: 'later', phase: 2, chrono: 2011, cLabel: '1750s', rel: 'optional',
    note: 'A soft reboot without Will or Elizabeth. Blackbeard and the Fountain of Youth.' },
  { w: 5, film: 'dead-men-tell-no-tales-2017', type: 'film', saga: 'later', phase: 2, chrono: 2017, cLabel: '1750s', rel: 'optional',
    note: 'Brings back Will and Elizabeth for a proper send-off. The last film to date.' },
];

const TYPE_META = {
  'film':      { label: 'Film',              short: 'FILM',     color: '#3f9ab5' },
};

const REL_META = {
  essential:     { label: 'Essential',    rank: 0, color: '#3f9ab5', blurb: 'Load-bearing. The story does not work without it.' },
  recommended:   { label: 'Recommended',  rank: 1, color: '#e8913d', blurb: 'Strong connective tissue. You will feel the gap.' },
  optional:      { label: 'Optional',     rank: 2, color: '#4ea8f2', blurb: 'Rewarding, but the main story holds without it.' },
  skippable:     { label: 'Skippable',    rank: 3, color: '#6b6b78', blurb: 'Safe to skip entirely on a first run.' },
};

const SAGA_META = {
  'trilogy':   { label: 'The Original Trilogy',    range: '2003 – 2007' },
  'later':     { label: 'The Later Films',         range: '2011 – 2017' },
};

const PHASE_META = {
  1: { label: 'The Original Trilogy',      sub: 'Jack, Will and Elizabeth · 2003–2007' },
  2: { label: 'The Later Films',           sub: 'After the trilogy · 2011–2017' },
};

const WATCH_BLOCKS = [
  { max: 3, phase: 1 },
  { max: 5, phase: 2 },
];

const ERAS = [
  { max: 2008, key: 'a',     title: 'The Original Trilogy',        sub: '2003–2007' },
  { max: 9999, key: 'b',     title: 'The Later Films',             sub: '2011–2017' },
];

const POSTERS = {};   // posters live in _films.js

/* ---------- publish ---------- */

(window.CATALOGUES ||= {}).potc = {
  items: ITEMS,
  posters: POSTERS,
  imgDir: 'assets/img/potc/',
  types: TYPE_META,
  rel: REL_META,
  saga: SAGA_META,
  phase: PHASE_META,
  watchBlocks: WATCH_BLOCKS,
  eras: ERAS,
};

})();
