/* ============================================================
   BEST CRIME FILMS
   Ninety-eight films spanning mob epics, neo-noir, heist pictures and
   international crime cinema.
   ============================================================ */

(() => {

const ITEMS = [
  { w: 1, film: 'godfather-1972', type: 'film', saga: 'd1970', phase: 1, chrono: 1972, cLabel: '1972', rel: 'essential' },
  { w: 2, film: 'godfather-part-ii-1974', type: 'film', saga: 'd1970', phase: 1, chrono: 1974, cLabel: '1974', rel: 'essential' },
  { w: 3, film: 'goodfellas-1990', type: 'film', saga: 'd1990', phase: 1, chrono: 1990, cLabel: '1990', rel: 'essential' },
  { w: 4, film: 'departed-2006', type: 'film', saga: 'd2000', phase: 1, chrono: 2006, cLabel: '2006', rel: 'essential' },
  { w: 5, film: 'heat-1995', type: 'film', saga: 'd1990', phase: 1, chrono: 1995, cLabel: '1995', rel: 'essential' },
  { w: 6, film: 'pulp-fiction-1994', type: 'film', saga: 'd1990', phase: 1, chrono: 1994, cLabel: '1994', rel: 'essential' },
  { w: 7, film: 'city-of-god-2002', type: 'film', saga: 'd2000', phase: 1, chrono: 2002, cLabel: '2002', rel: 'essential' },
  { w: 8, film: 'memories-of-murder-2003', type: 'film', saga: 'd2000', phase: 1, chrono: 2003, cLabel: '2003', rel: 'essential' },
  { w: 9, film: 'se7en-1995', type: 'film', saga: 'd1990', phase: 1, chrono: 1995, cLabel: '1995', rel: 'essential' },
  { w: 10, film: 'silence-of-the-lambs-1991', type: 'film', saga: 'd1990', phase: 1, chrono: 1991, cLabel: '1991', rel: 'essential' },
  { w: 11, film: 'no-country-for-old-men-2007', type: 'film', saga: 'd2000', phase: 1, chrono: 2007, cLabel: '2007', rel: 'recommended' },
  { w: 12, film: 'fargo-1996', type: 'film', saga: 'd1990', phase: 1, chrono: 1996, cLabel: '1996', rel: 'recommended' },
  { w: 13, film: 'chinatown-1974', type: 'film', saga: 'd1970', phase: 1, chrono: 1974, cLabel: '1974', rel: 'recommended' },
  { w: 14, film: 'dog-day-afternoon-1975', type: 'film', saga: 'd1970', phase: 1, chrono: 1975, cLabel: '1975', rel: 'recommended' },
  { w: 15, film: 'once-upon-a-time-in-america-1984', type: 'film', saga: 'd1980', phase: 1, chrono: 1984, cLabel: '1984', rel: 'recommended' },
  { w: 16, film: 'scarface-1983', type: 'film', saga: 'd1980', phase: 1, chrono: 1983, cLabel: '1983', rel: 'recommended' },
  { w: 17, film: 'casino-1995', type: 'film', saga: 'd1990', phase: 1, chrono: 1995, cLabel: '1995', rel: 'recommended' },
  { w: 18, film: 'reservoir-dogs-1992', type: 'film', saga: 'd1990', phase: 1, chrono: 1992, cLabel: '1992', rel: 'recommended' },
  { w: 19, film: 'l-a-confidential-1997', type: 'film', saga: 'd1990', phase: 1, chrono: 1997, cLabel: '1997', rel: 'recommended' },
  { w: 20, film: 'usual-suspects-1995', type: 'film', saga: 'd1990', phase: 1, chrono: 1995, cLabel: '1995', rel: 'recommended' },
  { w: 21, film: 'donnie-brasco-1997', type: 'film', saga: 'd1990', phase: 2, chrono: 1997, cLabel: '1997', rel: 'recommended' },
  { w: 22, film: 'carlito-s-way-1993', type: 'film', saga: 'd1990', phase: 2, chrono: 1993, cLabel: '1993', rel: 'recommended' },
  { w: 23, film: 'bronx-tale-1993', type: 'film', saga: 'd1990', phase: 2, chrono: 1993, cLabel: '1993', rel: 'recommended' },
  { w: 24, film: 'miller-s-crossing-1990', type: 'film', saga: 'd1990', phase: 2, chrono: 1990, cLabel: '1990', rel: 'recommended' },
  { w: 25, film: 'eastern-promises-2007', type: 'film', saga: 'd2000', phase: 2, chrono: 2007, cLabel: '2007', rel: 'recommended' },
  { w: 26, film: 'road-to-perdition-2002', type: 'film', saga: 'd2000', phase: 2, chrono: 2002, cLabel: '2002', rel: 'recommended' },
  { w: 27, film: 'irishman-2019', type: 'film', saga: 'd2010', phase: 2, chrono: 2019, cLabel: '2019', rel: 'recommended' },
  { w: 28, film: 'mean-streets-1973', type: 'film', saga: 'd1970', phase: 2, chrono: 1973, cLabel: '1973', rel: 'recommended' },
  { w: 29, film: 'long-good-friday-1980', type: 'film', saga: 'd1980', phase: 2, chrono: 1980, cLabel: '1980', rel: 'recommended' },
  { w: 30, film: 'gomorrah-2008', type: 'film', saga: 'd2000', phase: 2, chrono: 2008, cLabel: '2008', rel: 'recommended' },
  { w: 31, film: 'american-gangster-2007', type: 'film', saga: 'd2000', phase: 2, chrono: 2007, cLabel: '2007', rel: 'optional' },
  { w: 32, film: 'public-enemies-2009', type: 'film', saga: 'd2000', phase: 2, chrono: 2009, cLabel: '2009', rel: 'optional' },
  { w: 33, film: 'legend-2015', type: 'film', saga: 'd2010', phase: 2, chrono: 2015, cLabel: '2015', rel: 'optional' },
  { w: 34, film: 'black-mass-2015', type: 'film', saga: 'd2010', phase: 2, chrono: 2015, cLabel: '2015', rel: 'optional' },
  { w: 35, film: 'untouchables-1987', type: 'film', saga: 'd1980', phase: 2, chrono: 1987, cLabel: '1987', rel: 'optional' },
  { w: 36, film: 'drive-2011', type: 'film', saga: 'd2010', phase: 2, chrono: 2011, cLabel: '2011', rel: 'optional' },
  { w: 37, film: 'collateral-2004', type: 'film', saga: 'd2000', phase: 2, chrono: 2004, cLabel: '2004', rel: 'optional' },
  { w: 38, film: 'nightcrawler-2014', type: 'film', saga: 'd2010', phase: 2, chrono: 2014, cLabel: '2014', rel: 'optional' },
  { w: 39, film: 'blue-velvet-1986', type: 'film', saga: 'd1980', phase: 2, chrono: 1986, cLabel: '1986', rel: 'optional' },
  { w: 40, film: 'brick-2005', type: 'film', saga: 'd2000', phase: 2, chrono: 2005, cLabel: '2005', rel: 'optional' },
  { w: 41, film: 'blood-simple-1984', type: 'film', saga: 'd1980', phase: 3, chrono: 1984, cLabel: '1984', rel: 'optional' },
  { w: 42, film: 'bound-1996', type: 'film', saga: 'd1990', phase: 3, chrono: 1996, cLabel: '1996', rel: 'optional' },
  { w: 43, film: 'double-indemnity-1944', type: 'film', saga: 'd1940', phase: 3, chrono: 1944, cLabel: '1944', rel: 'optional' },
  { w: 44, film: 'out-of-the-past-1947', type: 'film', saga: 'd1940', phase: 3, chrono: 1947, cLabel: '1947', rel: 'optional' },
  { w: 45, film: 'kiss-kiss-bang-bang-2005', type: 'film', saga: 'd2000', phase: 3, chrono: 2005, cLabel: '2005', rel: 'optional' },
  { w: 46, film: 'nice-guys-2016', type: 'film', saga: 'd2010', phase: 3, chrono: 2016, cLabel: '2016', rel: 'optional' },
  { w: 47, film: 'in-bruges-2008', type: 'film', saga: 'd2000', phase: 3, chrono: 2008, cLabel: '2008', rel: 'optional' },
  { w: 48, film: 'blow-out-1981', type: 'film', saga: 'd1980', phase: 3, chrono: 1981, cLabel: '1981', rel: 'optional' },
  { w: 49, film: 'body-heat-1981', type: 'film', saga: 'd1980', phase: 3, chrono: 1981, cLabel: '1981', rel: 'optional' },
  { w: 50, film: 'zodiac-2007', type: 'film', saga: 'd2000', phase: 3, chrono: 2007, cLabel: '2007', rel: 'optional' },
  { w: 51, film: 'prisoners-2013', type: 'film', saga: 'd2010', phase: 3, chrono: 2013, cLabel: '2013', rel: 'optional' },
  { w: 52, film: 'mystic-river-2003', type: 'film', saga: 'd2000', phase: 3, chrono: 2003, cLabel: '2003', rel: 'optional' },
  { w: 53, film: 'wind-river-2017', type: 'film', saga: 'd2010', phase: 3, chrono: 2017, cLabel: '2017', rel: 'optional' },
  { w: 54, film: 'conversation-1974', type: 'film', saga: 'd1970', phase: 3, chrono: 1974, cLabel: '1974', rel: 'optional' },
  { w: 55, film: 'french-connection-1971', type: 'film', saga: 'd1970', phase: 3, chrono: 1971, cLabel: '1971', rel: 'optional' },
  { w: 56, film: 'klute-1971', type: 'film', saga: 'd1970', phase: 3, chrono: 1971, cLabel: '1971', rel: 'optional' },
  { w: 57, film: 'gone-baby-gone-2007', type: 'film', saga: 'd2000', phase: 3, chrono: 2007, cLabel: '2007', rel: 'optional' },
  { w: 58, film: 'decision-to-leave-2022', type: 'film', saga: 'd2020', phase: 3, chrono: 2022, cLabel: '2022', rel: 'optional' },
  { w: 59, film: 'rififi-1955', type: 'film', saga: 'd1950', phase: 3, chrono: 1955, cLabel: '1955', rel: 'optional' },
  { w: 60, film: 'killing-1956', type: 'film', saga: 'd1950', phase: 3, chrono: 1956, cLabel: '1956', rel: 'optional' },
  { w: 61, film: 'inside-man-2006', type: 'film', saga: 'd2000', phase: 4, chrono: 2006, cLabel: '2006', rel: 'optional' },
  { w: 62, film: 'town-2010', type: 'film', saga: 'd2010', phase: 4, chrono: 2010, cLabel: '2010', rel: 'optional' },
  { w: 63, film: 'logan-lucky-2017', type: 'film', saga: 'd2010', phase: 4, chrono: 2017, cLabel: '2017', rel: 'optional' },
  { w: 64, film: 'ocean-s-eleven-2001', type: 'film', saga: 'd2000', phase: 4, chrono: 2001, cLabel: '2001', rel: 'optional' },
  { w: 65, film: 'baby-driver-2017', type: 'film', saga: 'd2010', phase: 4, chrono: 2017, cLabel: '2017', rel: 'optional' },
  { w: 66, film: 'thief-1981', type: 'film', saga: 'd1980', phase: 4, chrono: 1981, cLabel: '1981', rel: 'optional' },
  { w: 67, film: 'hell-or-high-water-2016', type: 'film', saga: 'd2010', phase: 4, chrono: 2016, cLabel: '2016', rel: 'optional' },
  { w: 68, film: 'sexy-beast-2000', type: 'film', saga: 'd2000', phase: 4, chrono: 2000, cLabel: '2000', rel: 'optional' },
  { w: 69, film: 'oldboy-2003', type: 'film', saga: 'd2000', phase: 4, chrono: 2003, cLabel: '2003', rel: 'optional' },
  { w: 70, film: 'infernal-affairs-2002', type: 'film', saga: 'd2000', phase: 4, chrono: 2002, cLabel: '2002', rel: 'optional' },
  { w: 71, film: 'hard-boiled-1992', type: 'film', saga: 'd1990', phase: 4, chrono: 1992, cLabel: '1992', rel: 'optional' },
  { w: 72, film: 'bittersweet-life-2005', type: 'film', saga: 'd2000', phase: 4, chrono: 2005, cLabel: '2005', rel: 'optional' },
  { w: 73, film: 'i-saw-the-devil-2010', type: 'film', saga: 'd2010', phase: 4, chrono: 2010, cLabel: '2010', rel: 'optional' },
  { w: 74, film: 'chaser-2008', type: 'film', saga: 'd2000', phase: 4, chrono: 2008, cLabel: '2008', rel: 'optional' },
  { w: 75, film: 'elite-squad-2007', type: 'film', saga: 'd2000', phase: 4, chrono: 2007, cLabel: '2007', rel: 'optional' },
  { w: 76, film: 'elite-squad-the-enemy-within-2010', type: 'film', saga: 'd2010', phase: 4, chrono: 2010, cLabel: '2010', rel: 'optional' },
  { w: 77, film: 'prophet-2009', type: 'film', saga: 'd2000', phase: 4, chrono: 2009, cLabel: '2009', rel: 'optional' },
  { w: 78, film: 'le-samoura-1967', type: 'film', saga: 'd1960', phase: 4, chrono: 1967, cLabel: '1967', rel: 'optional' },
  { w: 79, film: 'le-cercle-rouge-1970', type: 'film', saga: 'd1970', phase: 4, chrono: 1970, cLabel: '1970', rel: 'optional' },
  { w: 80, film: 'mesrine-killer-instinct-2008', type: 'film', saga: 'd2000', phase: 4, chrono: 2008, cLabel: '2008', rel: 'optional' },
  { w: 81, film: 'mesrine-public-enemy-no-1-2008', type: 'film', saga: 'd2000', phase: 5, chrono: 2008, cLabel: '2008', rel: 'optional' },
  { w: 82, film: 'secret-in-their-eyes-2009', type: 'film', saga: 'd2000', phase: 5, chrono: 2009, cLabel: '2009', rel: 'optional' },
  { w: 83, film: 'aaranya-kaandam-2011', type: 'film', saga: 'd2010', phase: 5, chrono: 2011, cLabel: '2011', rel: 'optional' },
  { w: 84, film: 'sicario-2015', type: 'film', saga: 'd2010', phase: 5, chrono: 2015, cLabel: '2015', rel: 'optional' },
  { w: 85, film: 'killing-them-softly-2012', type: 'film', saga: 'd2010', phase: 5, chrono: 2012, cLabel: '2012', rel: 'optional' },
  { w: 86, film: 'widows-2018', type: 'film', saga: 'd2010', phase: 5, chrono: 2018, cLabel: '2018', rel: 'optional' },
  { w: 87, film: 'emily-the-criminal-2022', type: 'film', saga: 'd2020', phase: 5, chrono: 2022, cLabel: '2022', rel: 'optional' },
  { w: 88, film: 'uncut-gems-2019', type: 'film', saga: 'd2010', phase: 5, chrono: 2019, cLabel: '2019', rel: 'optional' },
  { w: 89, film: 'good-time-2017', type: 'film', saga: 'd2010', phase: 5, chrono: 2017, cLabel: '2017', rel: 'optional' },
  { w: 90, film: 'place-beyond-the-pines-2012', type: 'film', saga: 'd2010', phase: 5, chrono: 2012, cLabel: '2012', rel: 'optional' },
  { w: 91, film: 'animal-kingdom-2010', type: 'film', saga: 'd2010', phase: 5, chrono: 2010, cLabel: '2010', rel: 'optional' },
  { w: 92, film: 'drop-2014', type: 'film', saga: 'd2010', phase: 5, chrono: 2014, cLabel: '2014', rel: 'optional' },
  { w: 93, film: 'triple-9-2016', type: 'film', saga: 'd2010', phase: 5, chrono: 2016, cLabel: '2016', rel: 'optional' },
  { w: 94, film: 'snatch-2000', type: 'film', saga: 'd2000', phase: 5, chrono: 2000, cLabel: '2000', rel: 'optional' },
  { w: 95, film: 'lock-stock-and-two-smoking-barrels-1998', type: 'film', saga: 'd1990', phase: 5, chrono: 1998, cLabel: '1998', rel: 'optional' },
  { w: 96, film: 'big-lebowski-1998', type: 'film', saga: 'd1990', phase: 5, chrono: 1998, cLabel: '1998', rel: 'optional' },
  { w: 97, film: 'jackie-brown-1997', type: 'film', saga: 'd1990', phase: 5, chrono: 1997, cLabel: '1997', rel: 'optional' },
  { w: 98, film: 'bonnie-and-clyde-1967', type: 'film', saga: 'd1960', phase: 5, chrono: 1967, cLabel: '1967', rel: 'optional' },
];

const TYPE_META = {
  'film': { label: 'Film', short: 'FILM', color: '#8a8f99' },
};

const REL_META = {
  essential:     { label: 'Top ten',       rank: 0, color: '#8a8f99', blurb: 'Position top ten in this list.' },
  recommended:   { label: 'Next twenty',   rank: 1, color: '#e8913d', blurb: 'Position next twenty in this list.' },
  optional:      { label: 'The rest',      rank: 2, color: '#4ea8f2', blurb: 'Position the rest in this list.' },
  skippable:     { label: 'Skippable',     rank: 3, color: '#6b6b78', blurb: 'Position skippable in this list.' },
};

const SAGA_META = {
  'd1940': { label: '1940s',                 range: '' },
  'd1950': { label: '1950s',                 range: '' },
  'd1960': { label: '1960s',                 range: '' },
  'd1970': { label: '1970s',                 range: '' },
  'd1980': { label: '1980s',                 range: '' },
  'd1990': { label: '1990s',                 range: '' },
  'd2000': { label: '2000s',                 range: '' },
  'd2010': { label: '2010s',                 range: '' },
  'd2020': { label: '2020s',                 range: '' },
};

const PHASE_META = {
  1: { label: '1 – 20',          sub: '' },
  2: { label: '21 – 40',         sub: '' },
  3: { label: '41 – 60',         sub: '' },
  4: { label: '61 – 80',         sub: '' },
  5: { label: '81 – 98',         sub: '' },
};

const WATCH_BLOCKS = [
  { max: 20, phase: 1 },
  { max: 40, phase: 2 },
  { max: 60, phase: 3 },
  { max: 80, phase: 4 },
  { max: 98, phase: 5 },
];

const ERAS = [
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

(window.CATALOGUES ||= {}).crime = {
  items: ITEMS,
  posters: POSTERS,
  imgDir: 'assets/img/crime/',
  types: TYPE_META,
  rel: REL_META,
  saga: SAGA_META,
  phase: PHASE_META,
  watchBlocks: WATCH_BLOCKS,
  eras: ERAS,
};

})();
