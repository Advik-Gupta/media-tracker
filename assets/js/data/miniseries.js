/* ============================================================
   BEST MINI SERIES - a curated list, in the same shape as
   Top Rated Shows. Entries point at the film registry, and any
   that is tracked as a series in its own right is matched back
   to it by TMDB id.
   ============================================================ */

(() => {

const ITEMS = [
  { w: 1, film: 'band-of-brothers-2001', type: 'show', saga: 'd2000', phase: 1, chrono: 2001, cLabel: '2001', rel: 'essential' },
  { w: 2, film: 'chernobyl-2019', type: 'show', saga: 'd2010', phase: 1, chrono: 2019, cLabel: '2019', rel: 'essential' },
  { w: 3, film: 'dekalog-1989', type: 'show', saga: 'd1980', phase: 1, chrono: 1989, cLabel: '1989', rel: 'essential' },
  { w: 4, film: 'when-they-see-us-2019', type: 'show', saga: 'd2010', phase: 1, chrono: 2019, cLabel: '2019', rel: 'essential' },
  { w: 5, film: 'bombing-of-pan-am-103-2025', type: 'show', saga: 'd2020', phase: 1, chrono: 2025, cLabel: '2025', rel: 'essential' },
  { w: 6, film: 'queen-s-gambit-2020', type: 'show', saga: 'd2020', phase: 1, chrono: 2020, cLabel: '2020', rel: 'essential' },
  { w: 7, film: 'penguin-2024', type: 'show', saga: 'd2020', phase: 1, chrono: 2024, cLabel: '2024', rel: 'essential' },
  { w: 8, film: 'night-of-2016', type: 'show', saga: 'd2010', phase: 1, chrono: 2016, cLabel: '2016', rel: 'essential' },
  { w: 9, film: 'mare-of-easttown-2021', type: 'show', saga: 'd2020', phase: 1, chrono: 2021, cLabel: '2021', rel: 'essential' },
  { w: 10, film: 'sharp-objects-2018', type: 'show', saga: 'd2010', phase: 1, chrono: 2018, cLabel: '2018', rel: 'essential' },
  { w: 11, film: 'haunting-of-hill-house-2018', type: 'show', saga: 'd2010', phase: 1, chrono: 2018, cLabel: '2018', rel: 'recommended' },
  { w: 12, film: 'watchmen-2019', type: 'show', saga: 'd2010', phase: 1, chrono: 2019, cLabel: '2019', rel: 'recommended' },
  { w: 13, film: 'adolescence-2025', type: 'show', saga: 'd2020', phase: 1, chrono: 2025, cLabel: '2025', rel: 'recommended' },
  { w: 14, film: 'generation-kill-2008', type: 'show', saga: 'd2000', phase: 1, chrono: 2008, cLabel: '2008', rel: 'recommended' },
  { w: 15, film: 'midnight-mass-2021', type: 'show', saga: 'd2020', phase: 1, chrono: 2021, cLabel: '2021', rel: 'recommended' },
  { w: 16, film: 'station-eleven-2021', type: 'show', saga: 'd2020', phase: 1, chrono: 2021, cLabel: '2021', rel: 'recommended' },
  { w: 17, film: 'angels-in-america-2003', type: 'show', saga: 'd2000', phase: 1, chrono: 2003, cLabel: '2003', rel: 'recommended' },
  { w: 18, film: 'offer-2022', type: 'show', saga: 'd2020', phase: 1, chrono: 2022, cLabel: '2022', rel: 'recommended' },
  { w: 19, film: 'lonesome-dove-1989', type: 'show', saga: 'd1980', phase: 1, chrono: 1989, cLabel: '1989', rel: 'recommended' },
  { w: 20, film: '1883-2021', type: 'show', saga: 'd2020', phase: 1, chrono: 2021, cLabel: '2021', rel: 'recommended' },
  { w: 21, film: 'unbelievable-2019', type: 'show', saga: 'd2010', phase: 1, chrono: 2019, cLabel: '2019', rel: 'recommended' },
  { w: 22, film: 'dopesick-2021', type: 'show', saga: 'd2020', phase: 1, chrono: 2021, cLabel: '2021', rel: 'recommended' },
  { w: 23, film: 'godless-2017', type: 'show', saga: 'd2010', phase: 1, chrono: 2017, cLabel: '2017', rel: 'recommended' },
  { w: 24, film: 'patrick-melrose-2018', type: 'show', saga: 'd2010', phase: 1, chrono: 2018, cLabel: '2018', rel: 'recommended' },
  { w: 25, film: 'olive-kitteridge-2014', type: 'show', saga: 'd2010', phase: 1, chrono: 2014, cLabel: '2014', rel: 'recommended' },
  { w: 26, film: 'escape-at-dannemora-2018', type: 'show', saga: 'd2010', phase: 2, chrono: 2018, cLabel: '2018', rel: 'recommended' },
  { w: 27, film: 'and-then-there-were-none-2015', type: 'show', saga: 'd2010', phase: 2, chrono: 2015, cLabel: '2015', rel: 'recommended' },
  { w: 28, film: 'young-pope-2016', type: 'show', saga: 'd2010', phase: 2, chrono: 2016, cLabel: '2016', rel: 'recommended' },
  { w: 29, film: 'black-bird-2022', type: 'show', saga: 'd2020', phase: 2, chrono: 2022, cLabel: '2022', rel: 'recommended' },
  { w: 30, film: 'pacific-2010', type: 'show', saga: 'd2010', phase: 2, chrono: 2010, cLabel: '2010', rel: 'recommended' },
  { w: 31, film: 'undoing-2020', type: 'show', saga: 'd2020', phase: 2, chrono: 2020, cLabel: '2020', rel: 'optional' },
  { w: 32, film: '11-22-63-2016', type: 'show', saga: 'd2010', phase: 2, chrono: 2016, cLabel: '2016', rel: 'optional' },
  { w: 33, film: 'i-may-destroy-you-2020', type: 'show', saga: 'd2020', phase: 2, chrono: 2020, cLabel: '2020', rel: 'optional' },
  { w: 34, film: 'move-to-heaven-2021', type: 'show', saga: 'd2020', phase: 2, chrono: 2021, cLabel: '2021', rel: 'optional' },
  { w: 35, film: 'weak-hero-2022', type: 'show', saga: 'd2020', phase: 2, chrono: 2022, cLabel: '2022', rel: 'optional' },
  { w: 36, film: 'veneno-2020', type: 'show', saga: 'd2020', phase: 2, chrono: 2020, cLabel: '2020', rel: 'optional' },
  { w: 37, film: 'english-2022', type: 'show', saga: 'd2020', phase: 2, chrono: 2022, cLabel: '2022', rel: 'optional' },
  { w: 38, film: 'years-and-years-2019', type: 'show', saga: 'd2010', phase: 2, chrono: 2019, cLabel: '2019', rel: 'optional' },
  { w: 39, film: 'normal-people-2020', type: 'show', saga: 'd2020', phase: 2, chrono: 2020, cLabel: '2020', rel: 'optional' },
  { w: 40, film: 'bodyguard-2018', type: 'show', saga: 'd2010', phase: 2, chrono: 2018, cLabel: '2018', rel: 'optional' },
  { w: 41, film: 'maid-2021', type: 'show', saga: 'd2020', phase: 2, chrono: 2021, cLabel: '2021', rel: 'optional' },
  { w: 42, film: 'alias-grace-2017', type: 'show', saga: 'd2010', phase: 2, chrono: 2017, cLabel: '2017', rel: 'optional' },
  { w: 43, film: 'spy-2019', type: 'show', saga: 'd2010', phase: 2, chrono: 2019, cLabel: '2019', rel: 'optional' },
  { w: 44, film: 'lost-room-2006', type: 'show', saga: 'd2000', phase: 2, chrono: 2006, cLabel: '2006', rel: 'optional' },
  { w: 45, film: 'john-adams-2008', type: 'show', saga: 'd2000', phase: 2, chrono: 2008, cLabel: '2008', rel: 'optional' },
  { w: 46, film: 'five-days-at-memorial-2022', type: 'show', saga: 'd2020', phase: 2, chrono: 2022, cLabel: '2022', rel: 'optional' },
  { w: 47, film: 'staircase-2022', type: 'show', saga: 'd2020', phase: 2, chrono: 2022, cLabel: '2022', rel: 'optional' },
  { w: 48, film: 'war-and-peace-2016', type: 'show', saga: 'd2010', phase: 2, chrono: 2016, cLabel: '2016', rel: 'optional' },
  { w: 49, film: 'pride-and-prejudice-1995', type: 'show', saga: 'd1990', phase: 2, chrono: 1995, cLabel: '1995', rel: 'optional' },
  { w: 50, film: 'north-and-south-2004', type: 'show', saga: 'd2000', phase: 2, chrono: 2004, cLabel: '2004', rel: 'optional' },
];

const TYPE_META = {
  'show': { label: 'Series', short: 'SERIES', color: '#6a9ee8' },
};

const REL_META = {
  essential:   { label: 'Top tier',    rank: 0, color: '#e3a83b', blurb: 'The short version of this list.' },
  recommended: { label: 'Recommended', rank: 1, color: '#6a9ee8', blurb: 'Worth your time.' },
  optional:    { label: 'Also here',   rank: 2, color: '#4ea8f2', blurb: 'Rounds the list out.' },
};

const SAGA_META = {
  d1980: { label: '1980s', range: '' },
  d1990: { label: '1990s', range: '' },
  d2000: { label: '2000s', range: '' },
  d2010: { label: '2010s', range: '' },
  d2020: { label: '2020s', range: '' },
  dna: { label: 'Undated', range: '' },
};

const PHASE_META = {
  1: { label: '1 – 25', sub: '' },
  2: { label: '26 – 50', sub: '' },
};

const WATCH_BLOCKS = [
  { max: 25, phase: 1 },
  { max: 50, phase: 2 },
];

const ERAS = [
  { max: 1990, key: 'd1980', title: '1980s', sub: '' },
  { max: 2000, key: 'd1990', title: '1990s', sub: '' },
  { max: 2010, key: 'd2000', title: '2000s', sub: '' },
  { max: 2020, key: 'd2010', title: '2010s', sub: '' },
  { max: 2030, key: 'd2020', title: '2020s', sub: '' },
  { max: 9999, key: 'dna', title: 'Undated', sub: '' },
];

const POSTERS = {};

(window.CATALOGUES ||= {}).miniseries = {
  items: ITEMS,
  posters: POSTERS,
  imgDir: 'assets/img/miniseries/',
  types: TYPE_META,
  rel: REL_META,
  saga: SAGA_META,
  phase: PHASE_META,
  watchBlocks: WATCH_BLOCKS,
  eras: ERAS,
};

})();
