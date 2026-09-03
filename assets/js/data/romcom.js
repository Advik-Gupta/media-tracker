/* ============================================================
   BEST ROM-COMS
   Fifty romantic comedies in the order given. Position in the list drives the
   relevance tier, so the top of the list is the short version.
   ============================================================ */

(() => {

const ITEMS = [
  { w: 1, film: 'when-harry-met-sally-1989', type: 'film', saga: 'd1980', phase: 1, chrono: 1989, cLabel: '1989', rel: 'essential' },
  { w: 2, film: 'annie-hall-1977', type: 'film', saga: 'd1970', phase: 1, chrono: 1977, cLabel: '1977', rel: 'essential' },
  { w: 3, film: 'am-lie-2001', type: 'film', saga: 'd2000', phase: 1, chrono: 2001, cLabel: '2001', rel: 'essential' },
  { w: 4, film: 'about-time-2013', type: 'film', saga: 'd2010', phase: 1, chrono: 2013, cLabel: '2013', rel: 'essential' },
  { w: 5, film: 'love-actually-2003', type: 'film', saga: 'd2000', phase: 1, chrono: 2003, cLabel: '2003', rel: 'essential' },
  { w: 6, film: '500-days-of-summer-2009', type: 'film', saga: 'd2000', phase: 1, chrono: 2009, cLabel: '2009', rel: 'essential' },
  { w: 7, film: 'crazy-stupid-love-2011', type: 'film', saga: 'd2010', phase: 1, chrono: 2011, cLabel: '2011', rel: 'essential' },
  { w: 8, film: 'notting-hill-1999', type: 'film', saga: 'd1990', phase: 1, chrono: 1999, cLabel: '1999', rel: 'essential' },
  { w: 9, film: 'pretty-woman-1990', type: 'film', saga: 'd1990', phase: 1, chrono: 1990, cLabel: '1990', rel: 'essential' },
  { w: 10, film: 'holiday-2006', type: 'film', saga: 'd2000', phase: 1, chrono: 2006, cLabel: '2006', rel: 'essential' },
  { w: 11, film: '10-things-i-hate-about-you-1999', type: 'film', saga: 'd1990', phase: 1, chrono: 1999, cLabel: '1999', rel: 'recommended' },
  { w: 12, film: 'clueless-1995', type: 'film', saga: 'd1990', phase: 1, chrono: 1995, cLabel: '1995', rel: 'recommended' },
  { w: 13, film: 'bridget-jones-s-diary-2001', type: 'film', saga: 'd2000', phase: 1, chrono: 2001, cLabel: '2001', rel: 'recommended' },
  { w: 14, film: 'sleepless-in-seattle-1993', type: 'film', saga: 'd1990', phase: 1, chrono: 1993, cLabel: '1993', rel: 'recommended' },
  { w: 15, film: 'you-ve-got-mail-1998', type: 'film', saga: 'd1990', phase: 1, chrono: 1998, cLabel: '1998', rel: 'recommended' },
  { w: 16, film: 'forgetting-sarah-marshall-2008', type: 'film', saga: 'd2000', phase: 1, chrono: 2008, cLabel: '2008', rel: 'recommended' },
  { w: 17, film: 'wedding-crashers-2005', type: 'film', saga: 'd2000', phase: 1, chrono: 2005, cLabel: '2005', rel: 'recommended' },
  { w: 18, film: 'hitch-2005', type: 'film', saga: 'd2000', phase: 1, chrono: 2005, cLabel: '2005', rel: 'recommended' },
  { w: 19, film: 'wedding-singer-1998', type: 'film', saga: 'd1990', phase: 1, chrono: 1998, cLabel: '1998', rel: 'recommended' },
  { w: 20, film: 'there-s-something-about-mary-1998', type: 'film', saga: 'd1990', phase: 1, chrono: 1998, cLabel: '1998', rel: 'recommended' },
  { w: 21, film: 'proposal-2009', type: 'film', saga: 'd2000', phase: 2, chrono: 2009, cLabel: '2009', rel: 'recommended' },
  { w: 22, film: '50-first-dates-2004', type: 'film', saga: 'd2000', phase: 2, chrono: 2004, cLabel: '2004', rel: 'recommended' },
  { w: 23, film: 'definitely-maybe-2008', type: 'film', saga: 'd2000', phase: 2, chrono: 2008, cLabel: '2008', rel: 'recommended' },
  { w: 24, film: 'friends-with-benefits-2011', type: 'film', saga: 'd2010', phase: 2, chrono: 2011, cLabel: '2011', rel: 'recommended' },
  { w: 25, film: 'how-to-lose-a-guy-in-10-days-2003', type: 'film', saga: 'd2000', phase: 2, chrono: 2003, cLabel: '2003', rel: 'recommended' },
  { w: 26, film: 'knocked-up-2007', type: 'film', saga: 'd2000', phase: 2, chrono: 2007, cLabel: '2007', rel: 'recommended' },
  { w: 27, film: '13-going-on-30-2004', type: 'film', saga: 'd2000', phase: 2, chrono: 2004, cLabel: '2004', rel: 'recommended' },
  { w: 28, film: 'pretty-in-pink-1986', type: 'film', saga: 'd1980', phase: 2, chrono: 1986, cLabel: '1986', rel: 'recommended' },
  { w: 29, film: 'say-anything-1989', type: 'film', saga: 'd1980', phase: 2, chrono: 1989, cLabel: '1989', rel: 'recommended' },
  { w: 30, film: 'while-you-were-sleeping-1995', type: 'film', saga: 'd1990', phase: 2, chrono: 1995, cLabel: '1995', rel: 'recommended' },
  { w: 31, film: 'meet-the-parents-2000', type: 'film', saga: 'd2000', phase: 2, chrono: 2000, cLabel: '2000', rel: 'optional' },
  { w: 32, film: '40-year-old-virgin-2005', type: 'film', saga: 'd2000', phase: 2, chrono: 2005, cLabel: '2005', rel: 'optional' },
  { w: 33, film: 'about-a-boy-2002', type: 'film', saga: 'd2000', phase: 2, chrono: 2002, cLabel: '2002', rel: 'optional' },
  { w: 34, film: 'music-and-lyrics-2007', type: 'film', saga: 'd2000', phase: 2, chrono: 2007, cLabel: '2007', rel: 'optional' },
  { w: 35, film: 'no-reservations-2007', type: 'film', saga: 'd2000', phase: 2, chrono: 2007, cLabel: '2007', rel: 'optional' },
  { w: 36, film: 'she-s-the-man-2006', type: 'film', saga: 'd2000', phase: 2, chrono: 2006, cLabel: '2006', rel: 'optional' },
  { w: 37, film: 'leap-year-2010', type: 'film', saga: 'd2010', phase: 2, chrono: 2010, cLabel: '2010', rel: 'optional' },
  { w: 38, film: 'i-love-you-man-2009', type: 'film', saga: 'd2000', phase: 2, chrono: 2009, cLabel: '2009', rel: 'optional' },
  { w: 39, film: 'yes-man-2008', type: 'film', saga: 'd2000', phase: 2, chrono: 2008, cLabel: '2008', rel: 'optional' },
  { w: 40, film: 'girl-next-door-2004', type: 'film', saga: 'd2000', phase: 2, chrono: 2004, cLabel: '2004', rel: 'optional' },
  { w: 41, film: 'five-year-engagement-2012', type: 'film', saga: 'd2010', phase: 3, chrono: 2012, cLabel: '2012', rel: 'optional' },
  { w: 42, film: 'no-strings-attached-2011', type: 'film', saga: 'd2010', phase: 3, chrono: 2011, cLabel: '2011', rel: 'optional' },
  { w: 43, film: 'just-go-with-it-2011', type: 'film', saga: 'd2010', phase: 3, chrono: 2011, cLabel: '2011', rel: 'optional' },
  { w: 44, film: '27-dresses-2008', type: 'film', saga: 'd2000', phase: 3, chrono: 2008, cLabel: '2008', rel: 'optional' },
  { w: 45, film: 'life-as-we-know-it-2010', type: 'film', saga: 'd2010', phase: 3, chrono: 2010, cLabel: '2010', rel: 'optional' },
  { w: 46, film: 'it-could-happen-to-you-1994', type: 'film', saga: 'd1990', phase: 3, chrono: 1994, cLabel: '1994', rel: 'optional' },
  { w: 47, film: 'break-up-2006', type: 'film', saga: 'd2000', phase: 3, chrono: 2006, cLabel: '2006', rel: 'optional' },
  { w: 48, film: 'invention-of-lying-2009', type: 'film', saga: 'd2000', phase: 3, chrono: 2009, cLabel: '2009', rel: 'optional' },
  { w: 49, film: 'imagine-me-and-you-2005', type: 'film', saga: 'd2000', phase: 3, chrono: 2005, cLabel: '2005', rel: 'optional' },
  { w: 50, film: 'my-big-fat-greek-wedding-2002', type: 'film', saga: 'd2000', phase: 3, chrono: 2002, cLabel: '2002', rel: 'optional' },
];

const TYPE_META = {
  'film': { label: 'Film', short: 'FILM', color: '#e8709e' },
};

const REL_META = {
  essential:     { label: 'Top ten',       rank: 0, color: '#e8709e', blurb: 'Position top ten in this list.' },
  recommended:   { label: 'Next twenty',   rank: 1, color: '#e8913d', blurb: 'Position next twenty in this list.' },
  optional:      { label: 'The rest',      rank: 2, color: '#4ea8f2', blurb: 'Position the rest in this list.' },
  skippable:     { label: 'Skippable',     rank: 3, color: '#6b6b78', blurb: 'Position skippable in this list.' },
};

const SAGA_META = {
  'd1970': { label: '1970s',                 range: '' },
  'd1980': { label: '1980s',                 range: '' },
  'd1990': { label: '1990s',                 range: '' },
  'd2000': { label: '2000s',                 range: '' },
  'd2010': { label: '2010s',                 range: '' },
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
  { max: 1980, key: 'd1970', title: '1970s', sub: '' },
  { max: 1990, key: 'd1980', title: '1980s', sub: '' },
  { max: 2000, key: 'd1990', title: '1990s', sub: '' },
  { max: 2010, key: 'd2000', title: '2000s', sub: '' },
  { max: 2020, key: 'd2010', title: '2010s', sub: '' },
];

const POSTERS = {};   // posters live in _films.js

/* ---------- publish ---------- */

(window.CATALOGUES ||= {}).romcom = {
  items: ITEMS,
  posters: POSTERS,
  imgDir: 'assets/img/romcom/',
  types: TYPE_META,
  rel: REL_META,
  saga: SAGA_META,
  phase: PHASE_META,
  watchBlocks: WATCH_BLOCKS,
  eras: ERAS,
};

})();
