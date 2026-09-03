
(() => {

const ITEMS = [
  { w: 1, film: 'hunt-2012', type: 'film', saga: 'd2010', phase: 1, chrono: 2012, cLabel: '2012', rel: 'essential' },
  { w: 2, film: 'another-round-2020', type: 'film', saga: 'd2020', phase: 1, chrono: 2020, cLabel: '2020', rel: 'essential' },
  { w: 3, film: 'melancholia-2011', type: 'film', saga: 'd2010', phase: 1, chrono: 2011, cLabel: '2011', rel: 'essential' },
  { w: 4, film: 'house-that-jack-built-2018', type: 'film', saga: 'd2010', phase: 1, chrono: 2018, cLabel: '2018', rel: 'essential' },
  { w: 5, film: 'dogville-2003', type: 'film', saga: 'd2000', phase: 1, chrono: 2003, cLabel: '2003', rel: 'essential' },
  { w: 6, film: 'dancer-in-the-dark-2000', type: 'film', saga: 'd2000', phase: 1, chrono: 2000, cLabel: '2000', rel: 'essential' },
  { w: 7, film: 'nymphomaniac-vol-i-2013', type: 'film', saga: 'd2010', phase: 1, chrono: 2013, cLabel: '2013', rel: 'essential' },
  { w: 8, film: 'celebration-1998', type: 'film', saga: 'd1990', phase: 1, chrono: 1998, cLabel: '1998', rel: 'essential' },
  { w: 9, film: 'girl-with-the-needle-2024', type: 'film', saga: 'd2020', phase: 1, chrono: 2024, cLabel: '2024', rel: 'essential' },
  { w: 10, film: 'pusher-1996', type: 'film', saga: 'd1990', phase: 1, chrono: 1996, cLabel: '1996', rel: 'essential' },
  { w: 11, film: 'breaking-the-waves-1996', type: 'film', saga: 'd1990', phase: 1, chrono: 1996, cLabel: '1996', rel: 'recommended' },
  { w: 12, film: 'idiots-1998', type: 'film', saga: 'd1990', phase: 1, chrono: 1998, cLabel: '1998', rel: 'recommended' },
  { w: 13, film: 'ordet-1955', type: 'film', saga: 'd1950', phase: 1, chrono: 1955, cLabel: '1955', rel: 'recommended' },
  { w: 14, film: 'pusher-ii-2004', type: 'film', saga: 'd2000', phase: 1, chrono: 2004, cLabel: '2004', rel: 'recommended' },
  { w: 15, film: 'promised-land-2023', type: 'film', saga: 'd2020', phase: 1, chrono: 2023, cLabel: '2023', rel: 'recommended' },
  { w: 16, film: 'riders-of-justice-2020', type: 'film', saga: 'd2020', phase: 1, chrono: 2020, cLabel: '2020', rel: 'recommended' },
  { w: 17, film: 'bleeder-1999', type: 'film', saga: 'd1990', phase: 1, chrono: 1999, cLabel: '1999', rel: 'recommended' },
  { w: 18, film: 'guilty-2018', type: 'film', saga: 'd2010', phase: 1, chrono: 2018, cLabel: '2018', rel: 'recommended' },
  { w: 19, film: 'godland-2022', type: 'film', saga: 'd2020', phase: 1, chrono: 2022, cLabel: '2022', rel: 'recommended' },
  { w: 20, film: 'babette-s-feast-1987', type: 'film', saga: 'd1980', phase: 1, chrono: 1987, cLabel: '1987', rel: 'recommended' },
  { w: 21, film: 'pusher-iii-2005', type: 'film', saga: 'd2000', phase: 2, chrono: 2005, cLabel: '2005', rel: 'recommended' },
  { w: 22, film: 'europa-1991', type: 'film', saga: 'd1990', phase: 2, chrono: 1991, cLabel: '1991', rel: 'recommended' },
  { w: 23, film: 'royal-affair-2012', type: 'film', saga: 'd2010', phase: 2, chrono: 2012, cLabel: '2012', rel: 'recommended' },
  { w: 24, film: 'last-viking-2025', type: 'film', saga: 'd2020', phase: 2, chrono: 2025, cLabel: '2025', rel: 'recommended' },
  { w: 25, film: 'day-of-wrath-1943', type: 'film', saga: 'd1940', phase: 2, chrono: 1943, cLabel: '1943', rel: 'recommended' },
  { w: 26, film: 'land-of-mine-2015', type: 'film', saga: 'd2010', phase: 2, chrono: 2015, cLabel: '2015', rel: 'recommended' },
  { w: 27, film: 'adam-s-apples-2005', type: 'film', saga: 'd2000', phase: 2, chrono: 2005, cLabel: '2005', rel: 'recommended' },
  { w: 28, film: 'gertrud-1964', type: 'film', saga: 'd1960', phase: 2, chrono: 1964, cLabel: '1964', rel: 'recommended' },
  { w: 29, film: 'manderlay-2005', type: 'film', saga: 'd2000', phase: 2, chrono: 2005, cLabel: '2005', rel: 'recommended' },
  { w: 30, film: 'after-the-wedding-2006', type: 'film', saga: 'd2000', phase: 2, chrono: 2006, cLabel: '2006', rel: 'recommended' },
  { w: 31, film: 'green-butchers-2003', type: 'film', saga: 'd2000', phase: 2, chrono: 2003, cLabel: '2003', rel: 'optional' },
  { w: 32, film: 'flickering-lights-2000', type: 'film', saga: 'd2000', phase: 2, chrono: 2000, cLabel: '2000', rel: 'optional' },
  { w: 33, film: 'men-and-chicken-2015', type: 'film', saga: 'd2010', phase: 2, chrono: 2015, cLabel: '2015', rel: 'optional' },
  { w: 34, film: 'queen-of-hearts-2019', type: 'film', saga: 'd2010', phase: 2, chrono: 2019, cLabel: '2019', rel: 'optional' },
  { w: 35, film: 'shadow-in-my-eye-2021', type: 'film', saga: 'd2020', phase: 2, chrono: 2021, cLabel: '2021', rel: 'optional' },
  { w: 36, film: 'submarino-2010', type: 'film', saga: 'd2010', phase: 2, chrono: 2010, cLabel: '2010', rel: 'optional' },
  { w: 37, film: 'in-a-better-world-2010', type: 'film', saga: 'd2010', phase: 2, chrono: 2010, cLabel: '2010', rel: 'optional' },
  { w: 38, film: 'flame-and-citron-2008', type: 'film', saga: 'd2000', phase: 2, chrono: 2008, cLabel: '2008', rel: 'optional' },
  { w: 39, film: 'pelle-the-conqueror-1987', type: 'film', saga: 'd1980', phase: 2, chrono: 1987, cLabel: '1987', rel: 'optional' },
  { w: 40, film: 'medea-1988', type: 'film', saga: 'd1980', phase: 2, chrono: 1988, cLabel: '1988', rel: 'optional' },
  { w: 41, film: 'terkel-in-trouble-2004', type: 'film', saga: 'd2000', phase: 3, chrono: 2004, cLabel: '2004', rel: 'optional' },
  { w: 42, film: 'open-hearts-2002', type: 'film', saga: 'd2000', phase: 3, chrono: 2002, cLabel: '2002', rel: 'optional' },
  { w: 43, film: 'in-china-they-eat-dogs-1999', type: 'film', saga: 'd1990', phase: 3, chrono: 1999, cLabel: '1999', rel: 'optional' },
  { w: 44, film: 'italian-for-beginners-2000', type: 'film', saga: 'd2000', phase: 3, chrono: 2000, cLabel: '2000', rel: 'optional' },
  { w: 45, film: 'master-of-the-house-1925', type: 'film', saga: 'd1920', phase: 3, chrono: 1925, cLabel: '1925', rel: 'optional' },
  { w: 46, film: 'hijacking-2012', type: 'film', saga: 'd2010', phase: 3, chrono: 2012, cLabel: '2012', rel: 'optional' },
  { w: 47, film: 'purity-of-vengeance-2018', type: 'film', saga: 'd2010', phase: 3, chrono: 2018, cLabel: '2018', rel: 'optional' },
  { w: 48, film: 'war-2014', type: 'film', saga: 'd2010', phase: 3, chrono: 2014, cLabel: '2014', rel: 'optional' },
  { w: 49, film: 'hunger-1966', type: 'film', saga: 'd1960', phase: 3, chrono: 1966, cLabel: '1966', rel: 'optional' },
  { w: 50, film: 'klown-2010', type: 'film', saga: 'd2010', phase: 3, chrono: 2010, cLabel: '2010', rel: 'optional' },
];

const TYPE_META = {
  'film': { label: 'Film', short: 'FILM', color: '#c94e4e' },
};

const REL_META = {
  essential:     { label: 'Top ten',       rank: 0, color: '#c94e4e', blurb: 'Position top ten in this list.' },
  recommended:   { label: 'Next twenty',   rank: 1, color: '#e8913d', blurb: 'Position next twenty in this list.' },
  optional:      { label: 'The rest',      rank: 2, color: '#4ea8f2', blurb: 'Position the rest in this list.' },
  skippable:     { label: 'Skippable',     rank: 3, color: '#6b6b78', blurb: 'Position skippable in this list.' },
};

const SAGA_META = {
  'd1920': { label: '1920s', range: '' },
  'd1940': { label: '1940s', range: '' },
  'd1950': { label: '1950s', range: '' },
  'd1960': { label: '1960s', range: '' },
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
  { max: 1990, key: 'd1980', title: '1980s', sub: '' },
  { max: 2000, key: 'd1990', title: '1990s', sub: '' },
  { max: 2010, key: 'd2000', title: '2000s', sub: '' },
  { max: 2020, key: 'd2010', title: '2010s', sub: '' },
  { max: 2030, key: 'd2020', title: '2020s', sub: '' },
];

const POSTERS = {};   // posters live in _films.js

/* ---------- publish ---------- */

(window.CATALOGUES ||= {}).danish = {
  items: ITEMS,
  posters: POSTERS,
  imgDir: 'assets/img/danish/',
  types: TYPE_META,
  rel: REL_META,
  saga: SAGA_META,
  phase: PHASE_META,
  watchBlocks: WATCH_BLOCKS,
  eras: ERAS,
};

})();
