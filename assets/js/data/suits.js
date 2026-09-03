/* ============================================================
   SUITS
   Nine seasons at Pearson Hardman and its many later names, plus the
   Los Angeles spin-off. Entirely linear.
   ============================================================ */

(() => {

const ITEMS = [
  { w: 1, film: 'suits-season-1-2011', type: 'season', saga: 'suits', phase: 1, chrono: 2011, cLabel: '2011', rel: 'essential',
    note: 'Harvey hires a college dropout with a photographic memory and no law degree.' },
  { w: 2, film: 'suits-season-2-2012', type: 'season', saga: 'suits', phase: 1, chrono: 2012, cLabel: '2012', rel: 'essential',
    note: 'The Hardman arc, and the show at its sharpest.' },
  { w: 3, film: 'suits-season-3-2013', type: 'season', saga: 'suits', phase: 1, chrono: 2013, cLabel: '2013', rel: 'recommended' },
  { w: 4, film: 'suits-season-4-2014', type: 'season', saga: 'suits', phase: 1, chrono: 2014, cLabel: '2014', rel: 'recommended' },
  { w: 5, film: 'suits-season-5-2015', type: 'season', saga: 'suits', phase: 1, chrono: 2015, cLabel: '2015', rel: 'essential',
    note: 'The secret finally starts to collapse.' },
  { w: 6, film: 'suits-season-6-2016', type: 'season', saga: 'suits', phase: 1, chrono: 2016, cLabel: '2016', rel: 'recommended' },
  { w: 7, film: 'suits-season-7-2017', type: 'season', saga: 'suits', phase: 1, chrono: 2017, cLabel: '2017', rel: 'essential',
    note: 'Mike and Rachel\'s last season, and the end of the original ensemble.' },
  { w: 8, film: 'suits-season-8-2018', type: 'season', saga: 'suits', phase: 2, chrono: 2018, cLabel: '2018', rel: 'optional',
    note: 'A largely new cast. A noticeably different show from here.' },
  { w: 9, film: 'suits-season-9-2019', type: 'season', saga: 'suits', phase: 2, chrono: 2019, cLabel: '2019', rel: 'optional',
    note: 'The final, shortened season.' },
  { w: 10, film: 'suits-la-season-1-2025', type: 'season', saga: 'la', phase: 3, chrono: 2025, cLabel: '2025', rel: 'optional',
    note: 'A Los Angeles spin-off with a new firm and only glancing ties to the original.' },
];

const TYPE_META = {
  'season':    { label: 'Season',            short: 'SEASON',   color: '#3f6fb5' },
};

const REL_META = {
  essential:     { label: 'Essential',    rank: 0, color: '#3f6fb5', blurb: 'Load-bearing. The story does not work without it.' },
  recommended:   { label: 'Recommended',  rank: 1, color: '#e8913d', blurb: 'Strong connective tissue. You will feel the gap.' },
  optional:      { label: 'Optional',     rank: 2, color: '#4ea8f2', blurb: 'Rewarding, but the main story holds without it.' },
  skippable:     { label: 'Skippable',    rank: 3, color: '#6b6b78', blurb: 'Safe to skip entirely on a first run.' },
};

const SAGA_META = {
  'suits':     { label: 'Suits',                   range: '2011 – 2019' },
  'la':        { label: 'Suits LA',                range: '2025' },
};

const PHASE_META = {
  1: { label: 'The Mike Ross Years',       sub: 'The secret holds · seasons 1–7' },
  2: { label: 'After Mike',                sub: 'A new firm · seasons 8–9' },
  3: { label: 'Suits LA',                  sub: 'The spin-off · 2025' },
};

const WATCH_BLOCKS = [
  { max: 7, phase: 1 },
  { max: 9, phase: 2 },
  { max: 10, phase: 3 },
];

const ERAS = [
  { max: 2018, key: 'a',     title: 'The Mike Ross Years',         sub: '2011–2017' },
  { max: 2024, key: 'b',     title: 'After Mike',                  sub: '2018–2019' },
  { max: 9999, key: 'c',     title: 'Los Angeles',                 sub: '2025' },
];

const POSTERS = {};   // posters live in _films.js

/* ---------- publish ---------- */

(window.CATALOGUES ||= {}).suits = {
  items: ITEMS,
  posters: POSTERS,
  imgDir: 'assets/img/suits/',
  types: TYPE_META,
  rel: REL_META,
  saga: SAGA_META,
  phase: PHASE_META,
  watchBlocks: WATCH_BLOCKS,
  eras: ERAS,
};

})();
