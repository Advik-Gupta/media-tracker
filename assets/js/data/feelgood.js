/* ============================================================
   FEEL-GOOD FILMS
   Fifty films chosen for how they leave you, not for how they rank.
   ============================================================ */

(() => {

const ITEMS = [
  { w: 1, film: 'paddington-2014', type: 'film', saga: 'd2010', phase: 1, chrono: 2014, cLabel: '2014', rel: 'essential' },
  { w: 2, film: 'paddington-2-2017', type: 'film', saga: 'd2010', phase: 1, chrono: 2017, cLabel: '2017', rel: 'essential' },
  { w: 3, film: 'secret-life-of-walter-mitty-2013', type: 'film', saga: 'd2010', phase: 1, chrono: 2013, cLabel: '2013', rel: 'essential' },
  { w: 4, film: 'about-time-2013', type: 'film', saga: 'd2010', phase: 1, chrono: 2013, cLabel: '2013', rel: 'essential' },
  { w: 5, film: 'little-miss-sunshine-2006', type: 'film', saga: 'd2000', phase: 1, chrono: 2006, cLabel: '2006', rel: 'essential' },
  { w: 6, film: 'holdovers-2023', type: 'film', saga: 'd2020', phase: 1, chrono: 2023, cLabel: '2023', rel: 'essential' },
  { w: 7, film: 'perfect-days-2023', type: 'film', saga: 'd2020', phase: 1, chrono: 2023, cLabel: '2023', rel: 'essential' },
  { w: 8, film: 'forrest-gump-1994', type: 'film', saga: 'd1990', phase: 1, chrono: 1994, cLabel: '1994', rel: 'essential' },
  { w: 9, film: 'good-will-hunting-1997', type: 'film', saga: 'd1990', phase: 1, chrono: 1997, cLabel: '1997', rel: 'essential' },
  { w: 10, film: 'intouchables-2011', type: 'film', saga: 'd2010', phase: 1, chrono: 2011, cLabel: '2011', rel: 'essential' },
  { w: 11, film: 'up-2009', type: 'film', saga: 'd2000', phase: 1, chrono: 2009, cLabel: '2009', rel: 'recommended' },
  { w: 12, film: 'wall-e-2008', type: 'film', saga: 'd2000', phase: 1, chrono: 2008, cLabel: '2008', rel: 'recommended' },
  { w: 13, film: 'ratatouille-2007', type: 'film', saga: 'd2000', phase: 1, chrono: 2007, cLabel: '2007', rel: 'recommended' },
  { w: 14, film: 'coco-2017', type: 'film', saga: 'd2010', phase: 1, chrono: 2017, cLabel: '2017', rel: 'recommended' },
  { w: 15, film: 'spirited-away-2001', type: 'film', saga: 'd2000', phase: 1, chrono: 2001, cLabel: '2001', rel: 'recommended' },
  { w: 16, film: 'my-neighbor-totoro-1988', type: 'film', saga: 'd1980', phase: 1, chrono: 1988, cLabel: '1988', rel: 'recommended' },
  { w: 17, film: 'kiki-s-delivery-service-1989', type: 'film', saga: 'd1980', phase: 1, chrono: 1989, cLabel: '1989', rel: 'recommended' },
  { w: 18, film: 'your-name-2016', type: 'film', saga: 'd2010', phase: 1, chrono: 2016, cLabel: '2016', rel: 'recommended' },
  { w: 19, film: 'wild-robot-2024', type: 'film', saga: 'd2020', phase: 1, chrono: 2024, cLabel: '2024', rel: 'recommended' },
  { w: 20, film: 'big-hero-6-2014', type: 'film', saga: 'd2010', phase: 1, chrono: 2014, cLabel: '2014', rel: 'recommended' },
  { w: 21, film: 'toy-story-1995', type: 'film', saga: 'd1990', phase: 2, chrono: 1995, cLabel: '1995', rel: 'recommended' },
  { w: 22, film: 'toy-story-3-2010', type: 'film', saga: 'd2010', phase: 2, chrono: 2010, cLabel: '2010', rel: 'recommended' },
  { w: 23, film: 'finding-nemo-2003', type: 'film', saga: 'd2000', phase: 2, chrono: 2003, cLabel: '2003', rel: 'recommended' },
  { w: 24, film: 'sing-street-2016', type: 'film', saga: 'd2010', phase: 2, chrono: 2016, cLabel: '2016', rel: 'recommended' },
  { w: 25, film: 'hunt-for-the-wilderpeople-2016', type: 'film', saga: 'd2010', phase: 2, chrono: 2016, cLabel: '2016', rel: 'recommended' },
  { w: 26, film: 'jojo-rabbit-2019', type: 'film', saga: 'd2010', phase: 2, chrono: 2019, cLabel: '2019', rel: 'recommended' },
  { w: 27, film: 'wonder-2017', type: 'film', saga: 'd2010', phase: 2, chrono: 2017, cLabel: '2017', rel: 'recommended' },
  { w: 28, film: 'gifted-2017', type: 'film', saga: 'd2010', phase: 2, chrono: 2017, cLabel: '2017', rel: 'recommended' },
  { w: 29, film: 'dead-poets-society-1989', type: 'film', saga: 'd1980', phase: 2, chrono: 1989, cLabel: '1989', rel: 'recommended' },
  { w: 30, film: 'october-sky-1999', type: 'film', saga: 'd1990', phase: 2, chrono: 1999, cLabel: '1999', rel: 'recommended' },
  { w: 31, film: 'pursuit-of-happyness-2006', type: 'film', saga: 'd2000', phase: 2, chrono: 2006, cLabel: '2006', rel: 'optional' },
  { w: 32, film: 'captain-fantastic-2016', type: 'film', saga: 'd2010', phase: 2, chrono: 2016, cLabel: '2016', rel: 'optional' },
  { w: 33, film: 'terminal-2004', type: 'film', saga: 'd2000', phase: 2, chrono: 2004, cLabel: '2004', rel: 'optional' },
  { w: 34, film: 'cinema-paradiso-1988', type: 'film', saga: 'd1980', phase: 2, chrono: 1988, cLabel: '1988', rel: 'optional' },
  { w: 35, film: 'iron-giant-1999', type: 'film', saga: 'd1990', phase: 2, chrono: 1999, cLabel: '1999', rel: 'optional' },
  { w: 36, film: 'children-of-heaven-1997', type: 'film', saga: 'd1990', phase: 2, chrono: 1997, cLabel: '1997', rel: 'optional' },
  { w: 37, film: 'lion-2016', type: 'film', saga: 'd2010', phase: 2, chrono: 2016, cLabel: '2016', rel: 'optional' },
  { w: 38, film: 'perks-of-being-a-wallflower-2012', type: 'film', saga: 'd2010', phase: 2, chrono: 2012, cLabel: '2012', rel: 'optional' },
  { w: 39, film: 'ferris-bueller-s-day-off-1986', type: 'film', saga: 'd1980', phase: 2, chrono: 1986, cLabel: '1986', rel: 'optional' },
  { w: 40, film: 'groundhog-day-1993', type: 'film', saga: 'd1990', phase: 2, chrono: 1993, cLabel: '1993', rel: 'optional' },
  { w: 41, film: 'am-lie-2001', type: 'film', saga: 'd2000', phase: 3, chrono: 2001, cLabel: '2001', rel: 'optional' },
  { w: 42, film: 'princess-bride-1987', type: 'film', saga: 'd1980', phase: 3, chrono: 1987, cLabel: '1987', rel: 'optional' },
  { w: 43, film: 'pride-and-prejudice-2005', type: 'film', saga: 'd2000', phase: 3, chrono: 2005, cLabel: '2005', rel: 'optional' },
  { w: 44, film: 'before-sunrise-1995', type: 'film', saga: 'd1990', phase: 3, chrono: 1995, cLabel: '1995', rel: 'optional' },
  { w: 45, film: 'sound-of-music-1965', type: 'film', saga: 'd1960', phase: 3, chrono: 1965, cLabel: '1965', rel: 'optional' },
  { w: 46, film: 'singin-in-the-rain-1952', type: 'film', saga: 'd1950', phase: 3, chrono: 1952, cLabel: '1952', rel: 'optional' },
  { w: 47, film: 'jab-we-met-2007', type: 'film', saga: 'd2000', phase: 3, chrono: 2007, cLabel: '2007', rel: 'optional' },
  { w: 48, film: 'zindagi-na-milegi-dobara-2011', type: 'film', saga: 'd2010', phase: 3, chrono: 2011, cLabel: '2011', rel: 'optional' },
  { w: 49, film: 'piku-2015', type: 'film', saga: 'd2010', phase: 3, chrono: 2015, cLabel: '2015', rel: 'optional' },
  { w: 50, film: 'swades-2004', type: 'film', saga: 'd2000', phase: 3, chrono: 2004, cLabel: '2004', rel: 'optional' },
];

const TYPE_META = {
  'film': { label: 'Film', short: 'FILM', color: '#e8b04e' },
};

const REL_META = {
  essential:     { label: 'Top ten',       rank: 0, color: '#e8b04e', blurb: 'Position top ten in this list.' },
  recommended:   { label: 'Next twenty',   rank: 1, color: '#e8913d', blurb: 'Position next twenty in this list.' },
  optional:      { label: 'The rest',      rank: 2, color: '#4ea8f2', blurb: 'Position the rest in this list.' },
  skippable:     { label: 'Skippable',     rank: 3, color: '#6b6b78', blurb: 'Position skippable in this list.' },
};

const SAGA_META = {
  'd1950': { label: '1950s',                 range: '' },
  'd1960': { label: '1960s',                 range: '' },
  'd1980': { label: '1980s',                 range: '' },
  'd1990': { label: '1990s',                 range: '' },
  'd2000': { label: '2000s',                 range: '' },
  'd2010': { label: '2010s',                 range: '' },
  'd2020': { label: '2020s',                 range: '' },
};

const PHASE_META = {
  1: { label: '1 – 20',          sub: '' },
  2: { label: '21 – 40',         sub: '' },
  3: { label: '41 – 50',         sub: '' },
};

const WATCH_BLOCKS = [
  { max: 20, phase: 1 },
  { max: 40, phase: 2 },
  { max: 50, phase: 3 },
];

const ERAS = [
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

(window.CATALOGUES ||= {}).feelgood = {
  items: ITEMS,
  posters: POSTERS,
  imgDir: 'assets/img/feelgood/',
  types: TYPE_META,
  rel: REL_META,
  saga: SAGA_META,
  phase: PHASE_META,
  watchBlocks: WATCH_BLOCKS,
  eras: ERAS,
};

})();
