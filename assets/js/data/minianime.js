/* ============================================================
   BEST SHORT ANIME - a curated list, in the same shape as
   Best Mini Series and Top Rated Shows. Entries point at the
   film registry, and any that is tracked as a series in its own
   right is matched back to it by TMDB id.
   ============================================================ */

(() => {

const ITEMS = [
  { w: 1, film: 'death-note-2006', type: 'show', saga: 'd2000', phase: 1, chrono: 2006, cLabel: '2006', rel: 'essential' },
  { w: 2, film: 'steins-gate-2011', type: 'show', saga: 'd2010', phase: 1, chrono: 2011, cLabel: '2011', rel: 'essential' },
  { w: 3, film: 'oddtaxi-2021', type: 'show', saga: 'd2020', phase: 1, chrono: 2021, cLabel: '2021', rel: 'essential' },
  { w: 4, film: 'code-geass-lelouch-of-the-rebellion-2006', type: 'show', saga: 'd2000', phase: 1, chrono: 2006, cLabel: '2006', rel: 'essential' },
  { w: 5, film: 'cowboy-bebop-1998', type: 'show', saga: 'd1990', phase: 1, chrono: 1998, cLabel: '1998', rel: 'essential' },
  { w: 6, film: 'neon-genesis-evangelion-1995', type: 'show', saga: 'd1990', phase: 1, chrono: 1995, cLabel: '1995', rel: 'essential' },
  { w: 7, film: 'puella-magi-madoka-magica-2011', type: 'show', saga: 'd2010', phase: 1, chrono: 2011, cLabel: '2011', rel: 'essential' },
  { w: 8, film: 'mob-psycho-100-2016', type: 'show', saga: 'd2010', phase: 1, chrono: 2016, cLabel: '2016', rel: 'essential' },
  { w: 9, film: 'one-punch-man-2015', type: 'show', saga: 'd2010', phase: 1, chrono: 2015, cLabel: '2015', rel: 'essential' },
  { w: 10, film: 'parasyte-the-maxim-2014', type: 'show', saga: 'd2010', phase: 1, chrono: 2014, cLabel: '2014', rel: 'essential' },
  { w: 11, film: 'place-further-than-the-universe-2018', type: 'show', saga: 'd2010', phase: 1, chrono: 2018, cLabel: '2018', rel: 'recommended' },
  { w: 12, film: 'terror-in-resonance-2014', type: 'show', saga: 'd2010', phase: 1, chrono: 2014, cLabel: '2014', rel: 'recommended' },
  { w: 13, film: 'violet-evergarden-2018', type: 'show', saga: 'd2010', phase: 1, chrono: 2018, cLabel: '2018', rel: 'recommended' },
  { w: 14, film: 'summer-time-rendering-2022', type: 'show', saga: 'd2020', phase: 1, chrono: 2022, cLabel: '2022', rel: 'recommended' },
  { w: 15, film: 'erased-2016', type: 'show', saga: 'd2010', phase: 1, chrono: 2016, cLabel: '2016', rel: 'recommended' },
  { w: 16, film: '86-eighty-six-2021', type: 'show', saga: 'd2020', phase: 1, chrono: 2021, cLabel: '2021', rel: 'recommended' },
  { w: 17, film: 'cyberpunk-edgerunners-2022', type: 'show', saga: 'd2020', phase: 1, chrono: 2022, cLabel: '2022', rel: 'recommended' },
  { w: 18, film: 'sonny-boy-2021', type: 'show', saga: 'd2020', phase: 1, chrono: 2021, cLabel: '2021', rel: 'recommended' },
  { w: 19, film: 'keep-your-hands-off-eizouken-2020', type: 'show', saga: 'd2020', phase: 1, chrono: 2020, cLabel: '2020', rel: 'recommended' },
  { w: 20, film: 'vivy-fluorite-eye-s-song-2021', type: 'show', saga: 'd2020', phase: 1, chrono: 2021, cLabel: '2021', rel: 'recommended' },
  { w: 21, film: 'baccano-2007', type: 'show', saga: 'd2000', phase: 1, chrono: 2007, cLabel: '2007', rel: 'recommended' },
  { w: 22, film: 'flcl-2000', type: 'show', saga: 'd2000', phase: 1, chrono: 2000, cLabel: '2000', rel: 'recommended' },
  { w: 23, film: 'paranoia-agent-2004', type: 'show', saga: 'd2000', phase: 1, chrono: 2004, cLabel: '2004', rel: 'recommended' },
  { w: 24, film: 'hellsing-ultimate-2006', type: 'show', saga: 'd2000', phase: 1, chrono: 2006, cLabel: '2006', rel: 'recommended' },
  { w: 25, film: 'another-2012', type: 'show', saga: 'd2010', phase: 1, chrono: 2012, cLabel: '2012', rel: 'recommended' },
  { w: 26, film: 'haibane-renmei-2002', type: 'show', saga: 'd2000', phase: 2, chrono: 2002, cLabel: '2002', rel: 'recommended' },
  { w: 27, film: 'banana-fish-2018', type: 'show', saga: 'd2010', phase: 2, chrono: 2018, cLabel: '2018', rel: 'recommended' },
  { w: 28, film: 'ergo-proxy-2006', type: 'show', saga: 'd2000', phase: 2, chrono: 2006, cLabel: '2006', rel: 'recommended' },
  { w: 29, film: 'gankutsuou-2004', type: 'show', saga: 'd2000', phase: 2, chrono: 2004, cLabel: '2004', rel: 'recommended' },
  { w: 30, film: 'shiki-2010', type: 'show', saga: 'd2010', phase: 2, chrono: 2010, cLabel: '2010', rel: 'recommended' },
  { w: 31, film: 'black-lagoon-2006', type: 'show', saga: 'd2000', phase: 2, chrono: 2006, cLabel: '2006', rel: 'optional' },
  { w: 32, film: 'monster-2004', type: 'show', saga: 'd2000', phase: 2, chrono: 2004, cLabel: '2004', rel: 'optional' },
  { w: 33, film: 'fate-zero-2011', type: 'show', saga: 'd2010', phase: 2, chrono: 2011, cLabel: '2011', rel: 'optional' },
  { w: 34, film: 'rurouni-kenshin-trust-and-betrayal-1999', type: 'show', saga: 'd1990', phase: 2, chrono: 1999, cLabel: '1999', rel: 'optional' },
  { w: 35, film: 'clannad-2007', type: 'show', saga: 'd2000', phase: 2, chrono: 2007, cLabel: '2007', rel: 'optional' },
  { w: 36, film: 'rainbow-2010', type: 'show', saga: 'd2010', phase: 2, chrono: 2010, cLabel: '2010', rel: 'optional' },
  { w: 37, film: 'elfen-lied-2004', type: 'show', saga: 'd2000', phase: 2, chrono: 2004, cLabel: '2004', rel: 'optional' },
  { w: 38, film: 'darker-than-black-2007', type: 'show', saga: 'd2000', phase: 2, chrono: 2007, cLabel: '2007', rel: 'optional' },
  { w: 39, film: 'gungrave-2003', type: 'show', saga: 'd2000', phase: 2, chrono: 2003, cLabel: '2003', rel: 'optional' },
  { w: 40, film: 'katanagatari-2010', type: 'show', saga: 'd2010', phase: 2, chrono: 2010, cLabel: '2010', rel: 'optional' },
  { w: 41, film: 'ping-pong-the-animation-2014', type: 'show', saga: 'd2010', phase: 2, chrono: 2014, cLabel: '2014', rel: 'optional' },
  { w: 42, film: 'land-of-the-lustrous-2017', type: 'show', saga: 'd2010', phase: 2, chrono: 2017, cLabel: '2017', rel: 'optional' },
  { w: 43, film: 'made-in-abyss-2017', type: 'show', saga: 'd2010', phase: 2, chrono: 2017, cLabel: '2017', rel: 'optional' },
  { w: 44, film: 'hyouka-2012', type: 'show', saga: 'd2010', phase: 2, chrono: 2012, cLabel: '2012', rel: 'optional' },
  { w: 45, film: 'tokyo-magnitude-8-0-2009', type: 'show', saga: 'd2000', phase: 2, chrono: 2009, cLabel: '2009', rel: 'optional' },
  { w: 46, film: 're-creators-2017', type: 'show', saga: 'd2010', phase: 2, chrono: 2017, cLabel: '2017', rel: 'optional' },
  { w: 47, film: 'plastic-memories-2015', type: 'show', saga: 'd2010', phase: 2, chrono: 2015, cLabel: '2015', rel: 'optional' },
  { w: 48, film: 'deca-dence-2020', type: 'show', saga: 'd2020', phase: 2, chrono: 2020, cLabel: '2020', rel: 'optional' },
  { w: 49, film: 'tengoku-daimakyo-2023', type: 'show', saga: 'd2020', phase: 2, chrono: 2023, cLabel: '2023', rel: 'optional' },
];

const TYPE_META = {
  'show': { label: 'Series', short: 'SERIES', color: '#c98a4e' },
};

const REL_META = {
  essential:   { label: 'Top tier',    rank: 0, color: '#e3a83b', blurb: 'The short version of this list.' },
  recommended: { label: 'Recommended', rank: 1, color: '#c98a4e', blurb: 'Worth your time.' },
  optional:    { label: 'Also here',   rank: 2, color: '#4ea8f2', blurb: 'Rounds the list out.' },
};

const SAGA_META = {
  d1990: { label: '1990s', range: '' },
  d2000: { label: '2000s', range: '' },
  d2010: { label: '2010s', range: '' },
  d2020: { label: '2020s', range: '' },
  dna: { label: 'Undated', range: '' },
};

const PHASE_META = {
  1: { label: '1 – 25', sub: '' },
  2: { label: '26 – 49', sub: '' },
};

const WATCH_BLOCKS = [
  { max: 25, phase: 1 },
  { max: 49, phase: 2 },
];

const ERAS = [
  { max: 2000, key: 'd1990', title: '1990s', sub: '' },
  { max: 2010, key: 'd2000', title: '2000s', sub: '' },
  { max: 2020, key: 'd2010', title: '2010s', sub: '' },
  { max: 2030, key: 'd2020', title: '2020s', sub: '' },
  { max: 9999, key: 'dna', title: 'Undated', sub: '' },
];

const POSTERS = {};

(window.CATALOGUES ||= {}).minianime = {
  items: ITEMS,
  posters: POSTERS,
  imgDir: 'assets/img/minianime/',
  types: TYPE_META,
  rel: REL_META,
  saga: SAGA_META,
  phase: PHASE_META,
  watchBlocks: WATCH_BLOCKS,
  eras: ERAS,
};

})();
