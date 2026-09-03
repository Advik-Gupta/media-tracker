/* ============================================================
   ATTACK ON TITAN
   The anime, season by season. Season 4 was released in four separate
   chunks over three years, which is why it is split here.
   ============================================================ */

(() => {

const ITEMS = [
  { w: 1, film: 'attack-on-titan-season-1-2013', type: 'season', saga: 'aot', phase: 1, chrono: 845, cLabel: 'Year 845–850', rel: 'essential',
    note: 'The fall of Wall Maria and the 104th Cadet Corps.' },
  { w: 2, film: 'attack-on-titan-season-2-2017', type: 'season', saga: 'aot', phase: 1, chrono: 850, cLabel: 'Year 850', rel: 'essential',
    note: 'Four years after season 1 aired. The Beast Titan and the identity reveals.' },
  { w: 3, film: 'attack-on-titan-season-3-2018', type: 'season', saga: 'aot', phase: 1, chrono: 851, cLabel: 'Year 850–851', rel: 'essential',
    note: 'Aired in two cours. The basement, and the answer the whole series was built around.' },
  { w: 4, film: 'attack-on-titan-final-season-part-1-2020', type: 'season', saga: 'aot', phase: 2, chrono: 854, cLabel: 'Year 854', rel: 'essential',
    note: 'A four-year time skip and a change of studio. Opens in Marley with an almost entirely new cast.' },
  { w: 5, film: 'attack-on-titan-final-season-part-2-2022', type: 'season', saga: 'aot', phase: 2, chrono: 854.5, cLabel: 'Year 854', rel: 'essential',
    note: 'The Rumbling begins.' },
  { w: 6, film: 'attack-on-titan-final-chapters-2023', type: 'special', saga: 'aot', phase: 2, chrono: 855, cLabel: 'Year 854–855', rel: 'essential',
    note: 'Two feature-length specials that close the series.' },
];

const TYPE_META = {
  'season':    { label: 'Season',            short: 'SEASON',   color: '#8a5a2b' },
  'special':   { label: 'Finale',            short: 'FINALE',   color: '#c98a3f' },
};

const REL_META = {
  essential:     { label: 'Essential',    rank: 0, color: '#8a5a2b', blurb: 'Load-bearing. The story does not work without it.' },
  recommended:   { label: 'Recommended',  rank: 1, color: '#e8913d', blurb: 'Strong connective tissue. You will feel the gap.' },
  optional:      { label: 'Optional',     rank: 2, color: '#4ea8f2', blurb: 'Rewarding, but the main story holds without it.' },
  skippable:     { label: 'Skippable',    rank: 3, color: '#6b6b78', blurb: 'Safe to skip entirely on a first run.' },
};

const SAGA_META = {
  'aot':       { label: 'Attack on Titan',         range: '2013 – 2023' },
};

const PHASE_META = {
  1: { label: 'Behind the Walls',          sub: 'Seasons 1–3 · 2013–2019' },
  2: { label: 'The Final Season',          sub: 'Marley and after · 2020–2023' },
};

const WATCH_BLOCKS = [
  { max: 3, phase: 1 },
  { max: 6, phase: 2 },
];

const ERAS = [
  { max: 848, key: 'a',     title: 'Behind the Walls',            sub: 'Years 845–850' },
  { max: 9999, key: 'b',     title: 'Beyond the Walls',            sub: 'Years 854 onward' },
];

const POSTERS = {};   // posters live in _films.js

/* ---------- publish ---------- */

(window.CATALOGUES ||= {}).aot = {
  items: ITEMS,
  posters: POSTERS,
  imgDir: 'assets/img/aot/',
  types: TYPE_META,
  rel: REL_META,
  saga: SAGA_META,
  phase: PHASE_META,
  watchBlocks: WATCH_BLOCKS,
  eras: ERAS,
};

})();
