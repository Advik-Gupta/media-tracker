
(() => {

const ITEMS = [
  { w: 1, film: 'inglourious-basterds-2009', type: 'film', saga: 'd2000', phase: 1, chrono: 2009, cLabel: '2009', rel: 'essential' },
  { w: 2, film: 'jojo-rabbit-2019', type: 'film', saga: 'd2010', phase: 1, chrono: 2019, cLabel: '2019', rel: 'essential' },
  { w: 3, film: '1917-2019', type: 'film', saga: 'd2010', phase: 1, chrono: 2019, cLabel: '2019', rel: 'essential' },
  { w: 4, film: 'schindler-s-list-1993', type: 'film', saga: 'd1990', phase: 1, chrono: 1993, cLabel: '1993', rel: 'essential' },
  { w: 5, film: 'dunkirk-2017', type: 'film', saga: 'd2010', phase: 1, chrono: 2017, cLabel: '2017', rel: 'essential' },
  { w: 6, film: 'grave-of-the-fireflies-1988', type: 'film', saga: 'd1980', phase: 1, chrono: 1988, cLabel: '1988', rel: 'essential' },
  { w: 7, film: 'pianist-2002', type: 'film', saga: 'd2000', phase: 1, chrono: 2002, cLabel: '2002', rel: 'essential' },
  { w: 8, film: 'saving-private-ryan-1998', type: 'film', saga: 'd1990', phase: 1, chrono: 1998, cLabel: '1998', rel: 'essential' },
  { w: 9, film: 'apocalypse-now-1979', type: 'film', saga: 'd1970', phase: 1, chrono: 1979, cLabel: '1979', rel: 'essential' },
  { w: 10, film: 'zone-of-interest-2023', type: 'film', saga: 'd2020', phase: 1, chrono: 2023, cLabel: '2023', rel: 'essential' },
  { w: 11, film: 'all-quiet-on-the-western-front-2022', type: 'film', saga: 'd2020', phase: 1, chrono: 2022, cLabel: '2022', rel: 'recommended' },
  { w: 12, film: 'full-metal-jacket-1987', type: 'film', saga: 'd1980', phase: 1, chrono: 1987, cLabel: '1987', rel: 'recommended' },
  { w: 13, film: 'pan-s-labyrinth-2006', type: 'film', saga: 'd2000', phase: 1, chrono: 2006, cLabel: '2006', rel: 'recommended' },
  { w: 14, film: 'hacksaw-ridge-2016', type: 'film', saga: 'd2010', phase: 1, chrono: 2016, cLabel: '2016', rel: 'recommended' },
  { w: 15, film: 'imitation-game-2014', type: 'film', saga: 'd2010', phase: 1, chrono: 2014, cLabel: '2014', rel: 'recommended' },
  { w: 16, film: 'come-and-see-1985', type: 'film', saga: 'd1980', phase: 1, chrono: 1985, cLabel: '1985', rel: 'recommended' },
  { w: 17, film: 'incendies-2010', type: 'film', saga: 'd2010', phase: 1, chrono: 2010, cLabel: '2010', rel: 'recommended' },
  { w: 18, film: 'dr-strangelove-or-how-i-learned-to-stop-worrying-and-love-the-bomb-1964', type: 'film', saga: 'd1960', phase: 1, chrono: 1964, cLabel: '1964', rel: 'recommended' },
  { w: 19, film: 'boy-in-the-striped-pyjamas-2008', type: 'film', saga: 'd2000', phase: 1, chrono: 2008, cLabel: '2008', rel: 'recommended' },
  { w: 20, film: 'barry-lyndon-1975', type: 'film', saga: 'd1970', phase: 1, chrono: 1975, cLabel: '1975', rel: 'recommended' },
  { w: 21, film: 'tropic-thunder-2008', type: 'film', saga: 'd2000', phase: 2, chrono: 2008, cLabel: '2008', rel: 'recommended' },
  { w: 22, film: 'fury-2014', type: 'film', saga: 'd2010', phase: 2, chrono: 2014, cLabel: '2014', rel: 'recommended' },
  { w: 23, film: 'lawrence-of-arabia-1962', type: 'film', saga: 'd1960', phase: 2, chrono: 1962, cLabel: '1962', rel: 'recommended' },
  { w: 24, film: 'war-for-the-planet-of-the-apes-2017', type: 'film', saga: 'd2010', phase: 2, chrono: 2017, cLabel: '2017', rel: 'recommended' },
  { w: 25, film: 'braveheart-1995', type: 'film', saga: 'd1990', phase: 2, chrono: 1995, cLabel: '1995', rel: 'recommended' },
  { w: 26, film: 'paths-of-glory-1957', type: 'film', saga: 'd1950', phase: 2, chrono: 1957, cLabel: '1957', rel: 'recommended' },
  { w: 27, film: 'deer-hunter-1978', type: 'film', saga: 'd1970', phase: 2, chrono: 1978, cLabel: '1978', rel: 'recommended' },
  { w: 28, film: 'platoon-1986', type: 'film', saga: 'd1980', phase: 2, chrono: 1986, cLabel: '1986', rel: 'recommended' },
  { w: 29, film: 'gone-with-the-wind-1939', type: 'film', saga: 'd1930', phase: 2, chrono: 1939, cLabel: '1939', rel: 'recommended' },
  { w: 30, film: 'kingdom-of-heaven-2005', type: 'film', saga: 'd2000', phase: 2, chrono: 2005, cLabel: '2005', rel: 'recommended' },
  { w: 31, film: 'thin-red-line-1998', type: 'film', saga: 'd1990', phase: 2, chrono: 1998, cLabel: '1998', rel: 'optional' },
  { w: 32, film: 'hurt-locker-2008', type: 'film', saga: 'd2000', phase: 2, chrono: 2008, cLabel: '2008', rel: 'optional' },
  { w: 33, film: 'last-samurai-2003', type: 'film', saga: 'd2000', phase: 2, chrono: 2003, cLabel: '2003', rel: 'optional' },
  { w: 34, film: 'jarhead-2005', type: 'film', saga: 'd2000', phase: 2, chrono: 2005, cLabel: '2005', rel: 'optional' },
  { w: 35, film: 'black-hawk-down-2001', type: 'film', saga: 'd2000', phase: 2, chrono: 2001, cLabel: '2001', rel: 'optional' },
  { w: 36, film: 'battle-of-algiers-1966', type: 'film', saga: 'd1960', phase: 2, chrono: 1966, cLabel: '1966', rel: 'optional' },
  { w: 37, film: 'great-dictator-1940', type: 'film', saga: 'd1940', phase: 2, chrono: 1940, cLabel: '1940', rel: 'optional' },
  { w: 38, film: 'master-and-commander-the-far-side-of-the-world-2003', type: 'film', saga: 'd2000', phase: 2, chrono: 2003, cLabel: '2003', rel: 'optional' },
  { w: 39, film: 'last-of-the-mohicans-1992', type: 'film', saga: 'd1990', phase: 2, chrono: 1992, cLabel: '1992', rel: 'optional' },
  { w: 40, film: 'woman-king-2022', type: 'film', saga: 'd2020', phase: 2, chrono: 2022, cLabel: '2022', rel: 'optional' },
  { w: 41, film: 'great-escape-1963', type: 'film', saga: 'd1960', phase: 3, chrono: 1963, cLabel: '1963', rel: 'optional' },
  { w: 42, film: 'good-morning-vietnam-1987', type: 'film', saga: 'd1980', phase: 3, chrono: 1987, cLabel: '1987', rel: 'optional' },
  { w: 43, film: 'das-boot-1981', type: 'film', saga: 'd1980', phase: 3, chrono: 1981, cLabel: '1981', rel: 'optional' },
  { w: 44, film: 'downfall-2004', type: 'film', saga: 'd2000', phase: 3, chrono: 2004, cLabel: '2004', rel: 'optional' },
  { w: 45, film: 'empire-of-the-sun-1987', type: 'film', saga: 'd1980', phase: 3, chrono: 1987, cLabel: '1987', rel: 'optional' },
  { w: 46, film: 'human-condition-i-no-greater-love-1959', type: 'film', saga: 'd1950', phase: 3, chrono: 1959, cLabel: '1959', rel: 'optional' },
  { w: 47, film: 'bridge-on-the-river-kwai-1957', type: 'film', saga: 'd1950', phase: 3, chrono: 1957, cLabel: '1957', rel: 'optional' },
  { w: 48, film: 'battleship-potemkin-1925', type: 'film', saga: 'd1920', phase: 3, chrono: 1925, cLabel: '1925', rel: 'optional' },
  { w: 49, film: 'ivan-s-childhood-1962', type: 'film', saga: 'd1960', phase: 3, chrono: 1962, cLabel: '1962', rel: 'optional' },
  { w: 50, film: 'hidden-life-2019', type: 'film', saga: 'd2010', phase: 3, chrono: 2019, cLabel: '2019', rel: 'optional' },
  { w: 51, film: 'general-1926', type: 'film', saga: 'd1920', phase: 3, chrono: 1926, cLabel: '1926', rel: 'optional' },
  { w: 52, film: 'threads-1984', type: 'film', saga: 'd1980', phase: 3, chrono: 1984, cLabel: '1984', rel: 'optional' },
  { w: 53, film: 'hotel-rwanda-2004', type: 'film', saga: 'd2000', phase: 3, chrono: 2004, cLabel: '2004', rel: 'optional' },
  { w: 54, film: 'wind-that-shakes-the-barley-2006', type: 'film', saga: 'd2000', phase: 3, chrono: 2006, cLabel: '2006', rel: 'optional' },
];

const TYPE_META = {
  'film': { label: 'Film', short: 'FILM', color: '#7a7f52' },
};

const REL_META = {
  essential:     { label: 'Top ten',       rank: 0, color: '#7a7f52', blurb: 'Position top ten in this list.' },
  recommended:   { label: 'Next twenty',   rank: 1, color: '#e8913d', blurb: 'Position next twenty in this list.' },
  optional:      { label: 'The rest',      rank: 2, color: '#4ea8f2', blurb: 'Position the rest in this list.' },
  skippable:     { label: 'Skippable',     rank: 3, color: '#6b6b78', blurb: 'Position skippable in this list.' },
};

const SAGA_META = {
  'd1920': { label: '1920s', range: '' },
  'd1930': { label: '1930s', range: '' },
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
  3: { label: '41 – 54',     sub: '' },
};

const WATCH_BLOCKS = [
  { max: 20, phase: 1 },
  { max: 40, phase: 2 },
  { max: 54, phase: 3 },
];

const ERAS = [
  { max: 1930, key: 'd1920', title: '1920s', sub: '' },
  { max: 1940, key: 'd1930', title: '1930s', sub: '' },
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

(window.CATALOGUES ||= {}).war = {
  items: ITEMS,
  posters: POSTERS,
  imgDir: 'assets/img/war/',
  types: TYPE_META,
  rel: REL_META,
  saga: SAGA_META,
  phase: PHASE_META,
  watchBlocks: WATCH_BLOCKS,
  eras: ERAS,
};

})();
