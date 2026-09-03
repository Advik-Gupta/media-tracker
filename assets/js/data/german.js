
(() => {

const ITEMS = [
  { w: 1, film: 'paris-texas-1984', type: 'film', saga: 'd1980', phase: 1, chrono: 1984, cLabel: '1984', rel: 'essential' },
  { w: 2, film: 'all-quiet-on-the-western-front-2022', type: 'film', saga: 'd2020', phase: 1, chrono: 2022, cLabel: '2022', rel: 'essential' },
  { w: 3, film: 'nosferatu-1922', type: 'film', saga: 'd1920', phase: 1, chrono: 1922, cLabel: '1922', rel: 'essential' },
  { w: 4, film: 'metropolis-1927', type: 'film', saga: 'd1920', phase: 1, chrono: 1927, cLabel: '1927', rel: 'essential' },
  { w: 5, film: 'wings-of-desire-1987', type: 'film', saga: 'd1980', phase: 1, chrono: 1987, cLabel: '1987', rel: 'essential' },
  { w: 6, film: 'cabinet-of-dr-caligari-1920', type: 'film', saga: 'd1920', phase: 1, chrono: 1920, cLabel: '1920', rel: 'essential' },
  { w: 7, film: 'run-lola-run-1998', type: 'film', saga: 'd1990', phase: 1, chrono: 1998, cLabel: '1998', rel: 'essential' },
  { w: 8, film: 'm-1931', type: 'film', saga: 'd1930', phase: 1, chrono: 1931, cLabel: '1931', rel: 'essential' },
  { w: 9, film: 'christiane-f-1981', type: 'film', saga: 'd1980', phase: 1, chrono: 1981, cLabel: '1981', rel: 'essential' },
  { w: 10, film: 'lives-of-others-2006', type: 'film', saga: 'd2000', phase: 1, chrono: 2006, cLabel: '2006', rel: 'essential' },
  { w: 11, film: 'nosferatu-the-vampyre-1979', type: 'film', saga: 'd1970', phase: 1, chrono: 1979, cLabel: '1979', rel: 'recommended' },
  { w: 12, film: 'aguirre-the-wrath-of-god-1972', type: 'film', saga: 'd1970', phase: 1, chrono: 1972, cLabel: '1972', rel: 'recommended' },
  { w: 13, film: 'good-bye-lenin-2003', type: 'film', saga: 'd2000', phase: 1, chrono: 2003, cLabel: '2003', rel: 'recommended' },
  { w: 14, film: 'victoria-2015', type: 'film', saga: 'd2010', phase: 1, chrono: 2015, cLabel: '2015', rel: 'recommended' },
  { w: 15, film: 'das-boot-1981', type: 'film', saga: 'd1980', phase: 1, chrono: 1981, cLabel: '1981', rel: 'recommended' },
  { w: 16, film: 'downfall-2004', type: 'film', saga: 'd2000', phase: 1, chrono: 2004, cLabel: '2004', rel: 'recommended' },
  { w: 17, film: 'fitzcarraldo-1982', type: 'film', saga: 'd1980', phase: 1, chrono: 1982, cLabel: '1982', rel: 'recommended' },
  { w: 18, film: 'white-ribbon-2009', type: 'film', saga: 'd2000', phase: 1, chrono: 2009, cLabel: '2009', rel: 'recommended' },
  { w: 19, film: 'teachers-lounge-2023', type: 'film', saga: 'd2020', phase: 1, chrono: 2023, cLabel: '2023', rel: 'recommended' },
  { w: 20, film: 'vampyr-1932', type: 'film', saga: 'd1930', phase: 1, chrono: 1932, cLabel: '1932', rel: 'recommended' },
  { w: 21, film: 'ali-fear-eats-the-soul-1974', type: 'film', saga: 'd1970', phase: 2, chrono: 1974, cLabel: '1974', rel: 'recommended' },
  { w: 22, film: 'toni-erdmann-2016', type: 'film', saga: 'd2010', phase: 2, chrono: 2016, cLabel: '2016', rel: 'recommended' },
  { w: 23, film: 'american-friend-1977', type: 'film', saga: 'd1970', phase: 2, chrono: 1977, cLabel: '1977', rel: 'recommended' },
  { w: 24, film: 'bitter-tears-of-petra-von-kant-1972', type: 'film', saga: 'd1970', phase: 2, chrono: 1972, cLabel: '1972', rel: 'recommended' },
  { w: 25, film: 'faust-1926', type: 'film', saga: 'd1920', phase: 2, chrono: 1926, cLabel: '1926', rel: 'recommended' },
  { w: 26, film: 'alice-in-the-cities-1974', type: 'film', saga: 'd1970', phase: 2, chrono: 1974, cLabel: '1974', rel: 'recommended' },
  { w: 27, film: 'head-on-2004', type: 'film', saga: 'd2000', phase: 2, chrono: 2004, cLabel: '2004', rel: 'recommended' },
  { w: 28, film: 'phoenix-2014', type: 'film', saga: 'd2010', phase: 2, chrono: 2014, cLabel: '2014', rel: 'recommended' },
  { w: 29, film: 'stroszek-1977', type: 'film', saga: 'd1970', phase: 2, chrono: 1977, cLabel: '1977', rel: 'recommended' },
  { w: 30, film: 'until-the-end-of-the-world-1991', type: 'film', saga: 'd1990', phase: 2, chrono: 1991, cLabel: '1991', rel: 'recommended' },
  { w: 31, film: 'pandora-s-box-1929', type: 'film', saga: 'd1920', phase: 2, chrono: 1929, cLabel: '1929', rel: 'optional' },
  { w: 32, film: 'last-laugh-1924', type: 'film', saga: 'd1920', phase: 2, chrono: 1924, cLabel: '1924', rel: 'optional' },
  { w: 33, film: 'marriage-of-maria-braun-1979', type: 'film', saga: 'd1970', phase: 2, chrono: 1979, cLabel: '1979', rel: 'optional' },
  { w: 34, film: 'system-crasher-2019', type: 'film', saga: 'd2010', phase: 2, chrono: 2019, cLabel: '2019', rel: 'optional' },
  { w: 35, film: 'transit-2018', type: 'film', saga: 'd2010', phase: 2, chrono: 2018, cLabel: '2018', rel: 'optional' },
  { w: 36, film: 'enigma-of-kaspar-hauser-1974', type: 'film', saga: 'd1970', phase: 2, chrono: 1974, cLabel: '1974', rel: 'optional' },
  { w: 37, film: 'adventures-of-prince-achmed-1926', type: 'film', saga: 'd1920', phase: 2, chrono: 1926, cLabel: '1926', rel: 'optional' },
  { w: 38, film: 'fox-and-his-friends-1975', type: 'film', saga: 'd1970', phase: 2, chrono: 1975, cLabel: '1975', rel: 'optional' },
  { w: 39, film: 'never-look-away-2018', type: 'film', saga: 'd2010', phase: 2, chrono: 2018, cLabel: '2018', rel: 'optional' },
  { w: 40, film: 'testament-of-dr-mabuse-1933', type: 'film', saga: 'd1930', phase: 2, chrono: 1933, cLabel: '1933', rel: 'optional' },
  { w: 41, film: 'm-dchen-in-uniform-1931', type: 'film', saga: 'd1930', phase: 3, chrono: 1931, cLabel: '1931', rel: 'optional' },
  { w: 42, film: 'before-the-fall-2004', type: 'film', saga: 'd2000', phase: 3, chrono: 2004, cLabel: '2004', rel: 'optional' },
  { w: 43, film: 'blue-angel-1930', type: 'film', saga: 'd1930', phase: 3, chrono: 1930, cLabel: '1930', rel: 'optional' },
  { w: 44, film: 'lola-mont-s-1955', type: 'film', saga: 'd1950', phase: 3, chrono: 1955, cLabel: '1955', rel: 'optional' },
  { w: 45, film: 'edge-of-heaven-2007', type: 'film', saga: 'd2000', phase: 3, chrono: 2007, cLabel: '2007', rel: 'optional' },
  { w: 46, film: 'kings-of-the-road-1976', type: 'film', saga: 'd1970', phase: 3, chrono: 1976, cLabel: '1976', rel: 'optional' },
  { w: 47, film: 'dr-mabuse-the-gambler-1922', type: 'film', saga: 'd1920', phase: 3, chrono: 1922, cLabel: '1922', rel: 'optional' },
  { w: 48, film: 'die-nibelungen-siegfried-1924', type: 'film', saga: 'd1920', phase: 3, chrono: 1924, cLabel: '1924', rel: 'optional' },
  { w: 49, film: 'europa-europa-1990', type: 'film', saga: 'd1990', phase: 3, chrono: 1990, cLabel: '1990', rel: 'optional' },
  { w: 50, film: 'stalingrad-1993', type: 'film', saga: 'd1990', phase: 3, chrono: 1993, cLabel: '1993', rel: 'optional' },
];

const TYPE_META = {
  'film': { label: 'Film', short: 'FILM', color: '#c9a94e' },
};

const REL_META = {
  essential:     { label: 'Top ten',       rank: 0, color: '#c9a94e', blurb: 'Position top ten in this list.' },
  recommended:   { label: 'Next twenty',   rank: 1, color: '#e8913d', blurb: 'Position next twenty in this list.' },
  optional:      { label: 'The rest',      rank: 2, color: '#4ea8f2', blurb: 'Position the rest in this list.' },
  skippable:     { label: 'Skippable',     rank: 3, color: '#6b6b78', blurb: 'Position skippable in this list.' },
};

const SAGA_META = {
  'd1920': { label: '1920s', range: '' },
  'd1930': { label: '1930s', range: '' },
  'd1950': { label: '1950s', range: '' },
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
  { max: 1930, key: 'd1920', title: '1920s', sub: '' },
  { max: 1940, key: 'd1930', title: '1930s', sub: '' },
  { max: 1960, key: 'd1950', title: '1950s', sub: '' },
  { max: 1980, key: 'd1970', title: '1970s', sub: '' },
  { max: 1990, key: 'd1980', title: '1980s', sub: '' },
  { max: 2000, key: 'd1990', title: '1990s', sub: '' },
  { max: 2010, key: 'd2000', title: '2000s', sub: '' },
  { max: 2020, key: 'd2010', title: '2010s', sub: '' },
  { max: 2030, key: 'd2020', title: '2020s', sub: '' },
];

const POSTERS = {};   // posters live in _films.js

/* ---------- publish ---------- */

(window.CATALOGUES ||= {}).german = {
  items: ITEMS,
  posters: POSTERS,
  imgDir: 'assets/img/german/',
  types: TYPE_META,
  rel: REL_META,
  saga: SAGA_META,
  phase: PHASE_META,
  watchBlocks: WATCH_BLOCKS,
  eras: ERAS,
};

})();
