
(() => {

const ITEMS = [
  { w: 1, film: 'anatomy-of-a-fall-2023', type: 'film', saga: 'd2020', phase: 1, chrono: 2023, cLabel: '2023', rel: 'essential' },
  { w: 2, film: 'am-lie-2001', type: 'film', saga: 'd2000', phase: 1, chrono: 2001, cLabel: '2001', rel: 'essential' },
  { w: 3, film: 'portrait-of-a-lady-on-fire-2019', type: 'film', saga: 'd2010', phase: 1, chrono: 2019, cLabel: '2019', rel: 'essential' },
  { w: 4, film: 'la-haine-1995', type: 'film', saga: 'd1990', phase: 1, chrono: 1995, cLabel: '1995', rel: 'essential' },
  { w: 5, film: 'intouchables-2011', type: 'film', saga: 'd2010', phase: 1, chrono: 2011, cLabel: '2011', rel: 'essential' },
  { w: 6, film: 'piano-teacher-2001', type: 'film', saga: 'd2000', phase: 1, chrono: 2001, cLabel: '2001', rel: 'essential' },
  { w: 7, film: 'fantastic-planet-1973', type: 'film', saga: 'd1970', phase: 1, chrono: 1973, cLabel: '1973', rel: 'essential' },
  { w: 8, film: '400-blows-1959', type: 'film', saga: 'd1950', phase: 1, chrono: 1959, cLabel: '1959', rel: 'essential' },
  { w: 9, film: 'cl-o-from-5-to-7-1962', type: 'film', saga: 'd1960', phase: 1, chrono: 1962, cLabel: '1962', rel: 'essential' },
  { w: 10, film: 'three-colours-blue-1993', type: 'film', saga: 'd1990', phase: 1, chrono: 1993, cLabel: '1993', rel: 'essential' },
  { w: 11, film: 'umbrellas-of-cherbourg-1964', type: 'film', saga: 'd1960', phase: 1, chrono: 1964, cLabel: '1964', rel: 'recommended' },
  { w: 12, film: 'count-of-monte-cristo-2024', type: 'film', saga: 'd2020', phase: 1, chrono: 2024, cLabel: '2024', rel: 'recommended' },
  { w: 13, film: 'persepolis-2007', type: 'film', saga: 'd2000', phase: 1, chrono: 2007, cLabel: '2007', rel: 'recommended' },
  { w: 14, film: 'three-colours-red-1994', type: 'film', saga: 'd1990', phase: 1, chrono: 1994, cLabel: '1994', rel: 'recommended' },
  { w: 15, film: 'my-life-as-a-zucchini-2016', type: 'film', saga: 'd2010', phase: 1, chrono: 2016, cLabel: '2016', rel: 'recommended' },
  { w: 16, film: 'le-samoura-1967', type: 'film', saga: 'd1960', phase: 1, chrono: 1967, cLabel: '1967', rel: 'recommended' },
  { w: 17, film: 'passion-of-joan-of-arc-1928', type: 'film', saga: 'd1920', phase: 1, chrono: 1928, cLabel: '1928', rel: 'recommended' },
  { w: 18, film: 'pierrot-le-fou-1965', type: 'film', saga: 'd1960', phase: 1, chrono: 1965, cLabel: '1965', rel: 'recommended' },
  { w: 19, film: 'beau-travail-1999', type: 'film', saga: 'd1990', phase: 1, chrono: 1999, cLabel: '1999', rel: 'recommended' },
  { w: 20, film: 'petite-maman-2021', type: 'film', saga: 'd2020', phase: 1, chrono: 2021, cLabel: '2021', rel: 'recommended' },
  { w: 21, film: 'hiroshima-mon-amour-1959', type: 'film', saga: 'd1950', phase: 2, chrono: 1959, cLabel: '1959', rel: 'recommended' },
  { w: 22, film: 'young-girls-of-rochefort-1967', type: 'film', saga: 'd1960', phase: 2, chrono: 1967, cLabel: '1967', rel: 'recommended' },
  { w: 23, film: 'double-life-of-v-ronique-1991', type: 'film', saga: 'd1990', phase: 2, chrono: 1991, cLabel: '1991', rel: 'recommended' },
  { w: 24, film: 'amour-2012', type: 'film', saga: 'd2010', phase: 2, chrono: 2012, cLabel: '2012', rel: 'recommended' },
  { w: 25, film: 'playtime-1967', type: 'film', saga: 'd1960', phase: 2, chrono: 1967, cLabel: '1967', rel: 'recommended' },
  { w: 26, film: 'cach-2005', type: 'film', saga: 'd2000', phase: 2, chrono: 2005, cLabel: '2005', rel: 'recommended' },
  { w: 27, film: 'summer-s-tale-1996', type: 'film', saga: 'd1990', phase: 2, chrono: 1996, cLabel: '1996', rel: 'recommended' },
  { w: 28, film: 'le-bonheur-1965', type: 'film', saga: 'd1960', phase: 2, chrono: 1965, cLabel: '1965', rel: 'recommended' },
  { w: 29, film: 'vagabond-1985', type: 'film', saga: 'd1980', phase: 2, chrono: 1985, cLabel: '1985', rel: 'recommended' },
  { w: 30, film: 'diabolique-1955', type: 'film', saga: 'd1950', phase: 2, chrono: 1955, cLabel: '1955', rel: 'recommended' },
  { w: 31, film: 'green-ray-1986', type: 'film', saga: 'd1980', phase: 2, chrono: 1986, cLabel: '1986', rel: 'optional' },
  { w: 32, film: 'chorus-2004', type: 'film', saga: 'd2000', phase: 2, chrono: 2004, cLabel: '2004', rel: 'optional' },
  { w: 33, film: 'lovers-on-the-bridge-1991', type: 'film', saga: 'd1990', phase: 2, chrono: 1991, cLabel: '1991', rel: 'optional' },
  { w: 34, film: 'prophet-2009', type: 'film', saga: 'd2000', phase: 2, chrono: 2009, cLabel: '2009', rel: 'optional' },
  { w: 35, film: 'purple-noon-1960', type: 'film', saga: 'd1960', phase: 2, chrono: 1960, cLabel: '1960', rel: 'optional' },
  { w: 36, film: 'le-trou-1960', type: 'film', saga: 'd1960', phase: 2, chrono: 1960, cLabel: '1960', rel: 'optional' },
  { w: 37, film: 'army-of-shadows-1969', type: 'film', saga: 'd1960', phase: 2, chrono: 1969, cLabel: '1969', rel: 'optional' },
  { w: 38, film: 'man-escaped-1956', type: 'film', saga: 'd1950', phase: 2, chrono: 1956, cLabel: '1956', rel: 'optional' },
  { w: 39, film: 'wages-of-fear-1953', type: 'film', saga: 'd1950', phase: 2, chrono: 1953, cLabel: '1953', rel: 'optional' },
  { w: 40, film: 'z-1969', type: 'film', saga: 'd1960', phase: 2, chrono: 1969, cLabel: '1969', rel: 'optional' },
  { w: 41, film: 'last-year-at-marienbad-1961', type: 'film', saga: 'd1960', phase: 3, chrono: 1961, cLabel: '1961', rel: 'optional' },
  { w: 42, film: 'au-hasard-balthazar-1966', type: 'film', saga: 'd1960', phase: 3, chrono: 1966, cLabel: '1966', rel: 'optional' },
  { w: 43, film: 'little-am-lie-or-the-character-of-rain-2025', type: 'film', saga: 'd2020', phase: 3, chrono: 2025, cLabel: '2025', rel: 'optional' },
  { w: 44, film: 'elevator-to-the-gallows-1958', type: 'film', saga: 'd1950', phase: 3, chrono: 1958, cLabel: '1958', rel: 'optional' },
  { w: 45, film: 'le-cercle-rouge-1970', type: 'film', saga: 'd1970', phase: 3, chrono: 1970, cLabel: '1970', rel: 'optional' },
  { w: 46, film: 'certified-copy-2010', type: 'film', saga: 'd2010', phase: 3, chrono: 2010, cLabel: '2010', rel: 'optional' },
  { w: 47, film: 'black-girl-1966', type: 'film', saga: 'd1960', phase: 3, chrono: 1966, cLabel: '1966', rel: 'optional' },
  { w: 48, film: 'au-revoir-les-enfants-1987', type: 'film', saga: 'd1980', phase: 3, chrono: 1987, cLabel: '1987', rel: 'optional' },
  { w: 49, film: 'beauty-and-the-beast-1946', type: 'film', saga: 'd1940', phase: 3, chrono: 1946, cLabel: '1946', rel: 'optional' },
  { w: 50, film: 'man-who-sleeps-1974', type: 'film', saga: 'd1970', phase: 3, chrono: 1974, cLabel: '1974', rel: 'optional' },
];

const TYPE_META = {
  'film': { label: 'Film', short: 'FILM', color: '#4e7ce8' },
};

const REL_META = {
  essential:     { label: 'Top ten',       rank: 0, color: '#4e7ce8', blurb: 'Position top ten in this list.' },
  recommended:   { label: 'Next twenty',   rank: 1, color: '#e8913d', blurb: 'Position next twenty in this list.' },
  optional:      { label: 'The rest',      rank: 2, color: '#4ea8f2', blurb: 'Position the rest in this list.' },
  skippable:     { label: 'Skippable',     rank: 3, color: '#6b6b78', blurb: 'Position skippable in this list.' },
};

const SAGA_META = {
  'd1920': { label: '1920s', range: '' },
  'd1940': { label: '1940s', range: '' },
  'd1950': { label: '1950s', range: '' },
  'd1960': { label: '1960s', range: '' },
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
  { max: 1950, key: 'd1940', title: '1940s', sub: '' },
  { max: 1960, key: 'd1950', title: '1950s', sub: '' },
  { max: 1970, key: 'd1960', title: '1960s', sub: '' },
  { max: 1980, key: 'd1970', title: '1970s', sub: '' },
  { max: 1990, key: 'd1980', title: '1980s', sub: '' },
  { max: 2000, key: 'd1990', title: '1990s', sub: '' },
  { max: 2010, key: 'd2000', title: '2000s', sub: '' },
  { max: 2020, key: 'd2010', title: '2010s', sub: '' },
  { max: 2030, key: 'd2020', title: '2020s', sub: '' },
];

const POSTERS = {};   // posters live in _films.js

/* ---------- publish ---------- */

(window.CATALOGUES ||= {}).french = {
  items: ITEMS,
  posters: POSTERS,
  imgDir: 'assets/img/french/',
  types: TYPE_META,
  rel: REL_META,
  saga: SAGA_META,
  phase: PHASE_META,
  watchBlocks: WATCH_BLOCKS,
  eras: ERAS,
};

})();
