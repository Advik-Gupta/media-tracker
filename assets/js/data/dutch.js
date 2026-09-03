
(() => {

const ITEMS = [
  { w: 1, film: 'vanishing-1988', type: 'film', saga: 'd1980', phase: 1, chrono: 1988, cLabel: '1988', rel: 'essential' },
  { w: 2, film: 'boys-2014', type: 'film', saga: 'd2010', phase: 1, chrono: 2014, cLabel: '2014', rel: 'essential' },
  { w: 3, film: 'black-book-2006', type: 'film', saga: 'd2000', phase: 1, chrono: 2006, cLabel: '2006', rel: 'essential' },
  { w: 4, film: '4th-man-1983', type: 'film', saga: 'd1980', phase: 1, chrono: 1983, cLabel: '1983', rel: 'essential' },
  { w: 5, film: 'turkish-delight-1973', type: 'film', saga: 'd1970', phase: 1, chrono: 1973, cLabel: '1973', rel: 'essential' },
  { w: 6, film: 'borgman-2013', type: 'film', saga: 'd2010', phase: 1, chrono: 2013, cLabel: '2013', rel: 'essential' },
  { w: 7, film: 'soldier-of-orange-1977', type: 'film', saga: 'd1970', phase: 1, chrono: 1977, cLabel: '1977', rel: 'essential' },
  { w: 8, film: 'antonia-s-line-1995', type: 'film', saga: 'd1990', phase: 1, chrono: 1995, cLabel: '1995', rel: 'essential' },
  { w: 9, film: 'question-of-silence-1982', type: 'film', saga: 'd1980', phase: 1, chrono: 1982, cLabel: '1982', rel: 'essential' },
  { w: 10, film: 'hardcore-never-dies-2023', type: 'film', saga: 'd2020', phase: 1, chrono: 2023, cLabel: '2023', rel: 'essential' },
  { w: 11, film: 'spetters-1980', type: 'film', saga: 'd1980', phase: 1, chrono: 1980, cLabel: '1980', rel: 'recommended' },
  { w: 12, film: 'woman-like-eve-1979', type: 'film', saga: 'd1970', phase: 1, chrono: 1979, cLabel: '1979', rel: 'recommended' },
  { w: 13, film: 'cool-kids-don-t-cry-2012', type: 'film', saga: 'd2010', phase: 1, chrono: 2012, cLabel: '2012', rel: 'recommended' },
  { w: 14, film: 'sweet-dreams-2023', type: 'film', saga: 'd2020', phase: 1, chrono: 2023, cLabel: '2023', rel: 'recommended' },
  { w: 15, film: 'character-1997', type: 'film', saga: 'd1990', phase: 1, chrono: 1997, cLabel: '1997', rel: 'recommended' },
  { w: 16, film: 'our-girls-2025', type: 'film', saga: 'd2020', phase: 1, chrono: 2025, cLabel: '2025', rel: 'recommended' },
  { w: 17, film: 'northerners-1992', type: 'film', saga: 'd1990', phase: 1, chrono: 1992, cLabel: '1992', rel: 'recommended' },
  { w: 18, film: 'nothing-personal-2009', type: 'film', saga: 'd2000', phase: 1, chrono: 2009, cLabel: '2009', rel: 'recommended' },
  { w: 19, film: 'oink-2022', type: 'film', saga: 'd2020', phase: 1, chrono: 2022, cLabel: '2022', rel: 'recommended' },
  { w: 20, film: 'katie-tippel-1975', type: 'film', saga: 'd1970', phase: 1, chrono: 1975, cLabel: '1975', rel: 'recommended' },
  { w: 21, film: 'miss-minoes-2001', type: 'film', saga: 'd2000', phase: 2, chrono: 2001, cLabel: '2001', rel: 'recommended' },
  { w: 22, film: 'kauwboy-2012', type: 'film', saga: 'd2010', phase: 2, chrono: 2012, cLabel: '2012', rel: 'recommended' },
  { w: 23, film: 'winter-in-wartime-2008', type: 'film', saga: 'd2000', phase: 2, chrono: 2008, cLabel: '2008', rel: 'recommended' },
  { w: 24, film: 'assault-1986', type: 'film', saga: 'd1980', phase: 2, chrono: 1986, cLabel: '1986', rel: 'recommended' },
  { w: 25, film: 'honestly-i-m-fine-2026', type: 'film', saga: 'd2020', phase: 2, chrono: 2026, cLabel: '2026', rel: 'recommended' },
  { w: 26, film: 'joe-speedboot-2026', type: 'film', saga: 'd2020', phase: 2, chrono: 2026, cLabel: '2026', rel: 'recommended' },
  { w: 27, film: 'broken-mirrors-1984', type: 'film', saga: 'd1980', phase: 2, chrono: 1984, cLabel: '1984', rel: 'recommended' },
  { w: 28, film: 'twin-sisters-2002', type: 'film', saga: 'd2000', phase: 2, chrono: 2002, cLabel: '2002', rel: 'recommended' },
  { w: 29, film: 'on-top-of-the-whale-1982', type: 'film', saga: 'd1980', phase: 2, chrono: 1982, cLabel: '1982', rel: 'recommended' },
  { w: 30, film: 'waiter-2006', type: 'film', saga: 'd2000', phase: 2, chrono: 2006, cLabel: '2006', rel: 'recommended' },
  { w: 31, film: 'abel-1986', type: 'film', saga: 'd1980', phase: 2, chrono: 1986, cLabel: '1986', rel: 'optional' },
  { w: 32, film: 'marathon-2012', type: 'film', saga: 'd2010', phase: 2, chrono: 2012, cLabel: '2012', rel: 'optional' },
  { w: 33, film: 'kiddo-2023', type: 'film', saga: 'd2020', phase: 2, chrono: 2023, cLabel: '2023', rel: 'optional' },
  { w: 34, film: 'pentimento-1979', type: 'film', saga: 'd1970', phase: 2, chrono: 1979, cLabel: '1979', rel: 'optional' },
  { w: 35, film: 'memory-lane-2024', type: 'film', saga: 'd2020', phase: 2, chrono: 2024, cLabel: '2024', rel: 'optional' },
  { w: 36, film: 'pink-moon-2022', type: 'film', saga: 'd2020', phase: 2, chrono: 2022, cLabel: '2022', rel: 'optional' },
  { w: 37, film: 'cool-lakes-of-death-1982', type: 'film', saga: 'd1980', phase: 2, chrono: 1982, cLabel: '1982', rel: 'optional' },
  { w: 38, film: 'three-days-of-fish-2024', type: 'film', saga: 'd2020', phase: 2, chrono: 2024, cLabel: '2024', rel: 'optional' },
  { w: 39, film: 'one-people-1976', type: 'film', saga: 'd1970', phase: 2, chrono: 1976, cLabel: '1976', rel: 'optional' },
  { w: 40, film: 'pluk-and-his-tow-truck-2004', type: 'film', saga: 'd2000', phase: 2, chrono: 2004, cLabel: '2004', rel: 'optional' },
  { w: 41, film: 'narcosis-2022', type: 'film', saga: 'd2020', phase: 3, chrono: 2022, cLabel: '2022', rel: 'optional' },
  { w: 42, film: 'family-2026', type: 'film', saga: 'd2020', phase: 3, chrono: 2026, cLabel: '2026', rel: 'optional' },
  { w: 43, film: 'wolf-2013', type: 'film', saga: 'd2010', phase: 3, chrono: 2013, cLabel: '2013', rel: 'optional' },
  { w: 44, film: 'little-sister-1995', type: 'film', saga: 'd1990', phase: 3, chrono: 1995, cLabel: '1995', rel: 'optional' },
  { w: 45, film: 'alpha-2024', type: 'film', saga: 'd2020', phase: 3, chrono: 2024, cLabel: '2024', rel: 'optional' },
  { w: 46, film: 'last-days-of-emma-blank-2009', type: 'film', saga: 'd2000', phase: 3, chrono: 2009, cLabel: '2009', rel: 'optional' },
  { w: 47, film: 'het-huis-anubis-the-path-of-7-sins-2008', type: 'film', saga: 'd2000', phase: 3, chrono: 2008, cLabel: '2008', rel: 'optional' },
  { w: 48, film: 'my-extraordinary-summer-with-tess-2019', type: 'film', saga: 'd2010', phase: 3, chrono: 2019, cLabel: '2019', rel: 'optional' },
  { w: 49, film: 'dress-1996', type: 'film', saga: 'd1990', phase: 3, chrono: 1996, cLabel: '1996', rel: 'optional' },
  { w: 50, film: 'blind-2007', type: 'film', saga: 'd2000', phase: 3, chrono: 2007, cLabel: '2007', rel: 'optional' },
];

const TYPE_META = {
  'film': { label: 'Film', short: 'FILM', color: '#e8843d' },
};

const REL_META = {
  essential:     { label: 'Top ten',       rank: 0, color: '#e8843d', blurb: 'Position top ten in this list.' },
  recommended:   { label: 'Next twenty',   rank: 1, color: '#e8913d', blurb: 'Position next twenty in this list.' },
  optional:      { label: 'The rest',      rank: 2, color: '#4ea8f2', blurb: 'Position the rest in this list.' },
  skippable:     { label: 'Skippable',     rank: 3, color: '#6b6b78', blurb: 'Position skippable in this list.' },
};

const SAGA_META = {
  'd1970': { label: '1970s', range: '' },
  'd1980': { label: '1980s', range: '' },
  'd1990': { label: '1990s', range: '' },
  'd2000': { label: '2000s', range: '' },
  'd2010': { label: '2010s', range: '' },
  'd2020': { label: '2020s', range: '' },
};

const PHASE_META = {
  1: { label: '1 – 20',      sub: '' },
  2: { label: '21 – 40',     sub: '' },
  3: { label: '41 – 50',     sub: '' },
};

const WATCH_BLOCKS = [
  { max: 20, phase: 1 },
  { max: 40, phase: 2 },
  { max: 50, phase: 3 },
];

const ERAS = [
  { max: 1980, key: 'd1970', title: '1970s', sub: '' },
  { max: 1990, key: 'd1980', title: '1980s', sub: '' },
  { max: 2000, key: 'd1990', title: '1990s', sub: '' },
  { max: 2010, key: 'd2000', title: '2000s', sub: '' },
  { max: 2020, key: 'd2010', title: '2010s', sub: '' },
  { max: 2030, key: 'd2020', title: '2020s', sub: '' },
];

const POSTERS = {};   // posters live in _films.js

/* ---------- publish ---------- */

(window.CATALOGUES ||= {}).dutch = {
  items: ITEMS,
  posters: POSTERS,
  imgDir: 'assets/img/dutch/',
  types: TYPE_META,
  rel: REL_META,
  saga: SAGA_META,
  phase: PHASE_META,
  watchBlocks: WATCH_BLOCKS,
  eras: ERAS,
};

})();
