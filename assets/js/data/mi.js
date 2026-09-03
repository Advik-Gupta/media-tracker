/* ============================================================
   MISSION: IMPOSSIBLE
   Eight films. Each is standalone enough to watch cold, but the run from
   Ghost Protocol onward is one continuous story.
   ============================================================ */

(() => {

const ITEMS = [
  { w: 1, film: 'mission-impossible-1996', type: 'film', saga: 'early', phase: 1, chrono: 1996, cLabel: '1996', rel: 'essential',
    note: 'De Palma\'s original. The Langley break-in still defines the series.' },
  { w: 2, film: 'mission-impossible-2-2000', type: 'film', saga: 'early', phase: 1, chrono: 2000, cLabel: '2000', rel: 'optional',
    note: 'John Woo takes over, and it tonally shares almost nothing with the rest of the series.' },
  { w: 3, film: 'mission-impossible-iii-2006', type: 'film', saga: 'early', phase: 1, chrono: 2006, cLabel: '2006', rel: 'essential',
    note: 'J. J. Abrams reboots the tone and introduces Julia, who matters right through to the finale.' },
  { w: 4, film: 'mission-impossible-ghost-protocol-2011', type: 'film', saga: 'saga', phase: 2, chrono: 2011, cLabel: '2011', rel: 'essential',
    note: 'The Burj Khalifa. Brings in Brandt and starts the continuous run.' },
  { w: 5, film: 'mission-impossible-rogue-nation-2015', type: 'film', saga: 'saga', phase: 2, chrono: 2015, cLabel: '2015', rel: 'essential',
    note: 'Introduces Ilsa Faust and the Syndicate.' },
  { w: 6, film: 'mission-impossible-fallout-2018', type: 'film', saga: 'saga', phase: 2, chrono: 2018, cLabel: '2018', rel: 'essential',
    note: 'A direct sequel to Rogue Nation, and widely held to be the best in the series.' },
  { w: 7, film: 'mission-impossible-dead-reckoning-2023', type: 'film', saga: 'saga', phase: 3, chrono: 2023, cLabel: '2023', rel: 'essential',
    note: 'Part one of the two-part finale. Introduces the Entity.' },
  { w: 8, film: 'mission-impossible-the-final-reckoning-2025', type: 'film', saga: 'saga', phase: 3, chrono: 2025, cLabel: '2025', rel: 'essential',
    note: 'The conclusion, and it reaches back to the 1996 film to close the loop.' },
];

const TYPE_META = {
  'film':      { label: 'Film',                short: 'FILM',      color: '#e0672b' },
};

const REL_META = {
  essential:     { label: 'Essential',    rank: 0, color: '#e0672b', blurb: 'Load-bearing. The story does not work without it.' },
  recommended:   { label: 'Recommended',  rank: 1, color: '#e8913d', blurb: 'Strong connective tissue. You will feel the gap.' },
  optional:      { label: 'Optional',     rank: 2, color: '#4ea8f2', blurb: 'Rewarding, but the main story holds without it.' },
  skippable:     { label: 'Skippable',    rank: 3, color: '#6b6b78', blurb: 'Safe to skip entirely on a first run.' },
};

const SAGA_META = {
  'early':       { label: 'The Early Missions',      range: '1996 – 2006' },
  'saga':        { label: 'The Continuous Saga',     range: '2011 – 2025' },
};

const PHASE_META = {
  1: { label: 'The Early Missions',        sub: 'A director per film · 1996–2006' },
  2: { label: 'The Ethan Hunt Saga',       sub: 'One continuous story · 2011–2018' },
  3: { label: 'The Final Reckoning',       sub: 'The two-part finale · 2023–2025' },
};

/* Contiguous blocks of the watch order, used for its group headers. */
const WATCH_BLOCKS = [
  { max: 3, phase: 1 },
  { max: 6, phase: 2 },
  { max: 8, phase: 3 },
];

/* In-universe era buckets, keyed by the highest chrono value in each. */
const ERAS = [
  { max: 2010, key: 'early',   title: 'The Early Missions',          sub: '1996–2006' },
  { max: 2020, key: 'syndicate', title: 'The Syndicate Years',         sub: '2011–2018' },
  { max: 9999, key: 'entity',  title: 'The Entity',                  sub: '2023–2025' },
];

const POSTERS = {};   // posters live in _films.js

/* ---------- publish ---------- */

(window.CATALOGUES ||= {}).mi = {
  items: ITEMS,
  posters: POSTERS,
  imgDir: 'assets/img/mi/',
  types: TYPE_META,
  rel: REL_META,
  saga: SAGA_META,
  phase: PHASE_META,
  watchBlocks: WATCH_BLOCKS,
  eras: ERAS,
};

})();
