/* ============================================================
   FINAL DESTINATION
   Six films. The fifth is secretly a prequel to the first - the in-universe
   sort places it accordingly, which does spoil its ending.
   ============================================================ */

(() => {
  const ITEMS = [
    {
      w: 1,
      film: "final-destination-2000",
      type: "film",
      saga: "original",
      phase: 1,
      chrono: 2000,
      cLabel: "2000",
      rel: "essential",
      note: "Flight 180. Establishes the entire premise - Death's design, and the order of the list.",
    },
    {
      w: 2,
      film: "final-destination-2-2003",
      type: "film",
      saga: "original",
      phase: 1,
      chrono: 2001,
      cLabel: "2001",
      rel: "recommended",
      note: "The highway pile-up, and a direct sequel that ties back to the Flight 180 survivors.",
    },
    {
      w: 3,
      film: "final-destination-3-2006",
      type: "film",
      saga: "original",
      phase: 1,
      chrono: 2005,
      cLabel: "2005",
      rel: "optional",
      note: "The rollercoaster. Largely standalone.",
    },
    {
      w: 4,
      film: "final-destination-2009",
      type: "film",
      saga: "original",
      phase: 2,
      chrono: 2009,
      cLabel: "2009",
      rel: "skippable",
      note: "The weakest entry, built around a 3D gimmick and disconnected from the rest.",
    },
    {
      w: 5,
      film: "final-destination-5-2011",
      type: "film",
      saga: "original",
      phase: 2,
      chrono: 1999,
      cLabel: "1999 · see the ending",
      rel: "essential",
      note: "The bridge collapse - and, in its final minutes, revealed to be a prequel that leads directly into the first film. Watching it in in-universe order gives that twist away.",
    },
    {
      w: 6,
      film: "final-destination-bloodlines-2025",
      type: "film",
      saga: "revival",
      phase: 3,
      chrono: 2025,
      cLabel: "2025",
      rel: "essential",
      note: "A revival that reaches back to the 1960s to explain where the bloodline began.",
    },
  ];

  const TYPE_META = {
    film: { label: "Film", short: "FILM", color: "#3ea89b" },
  };

  const REL_META = {
    essential: {
      label: "Essential",
      rank: 0,
      color: "#3ea89b",
      blurb: "Load-bearing. The story does not work without it.",
    },
    recommended: {
      label: "Recommended",
      rank: 1,
      color: "#e8913d",
      blurb: "Strong connective tissue. You will feel the gap.",
    },
    optional: {
      label: "Optional",
      rank: 2,
      color: "#4ea8f2",
      blurb: "Rewarding, but the main story holds without it.",
    },
    skippable: {
      label: "Skippable",
      rank: 3,
      color: "#6b6b78",
      blurb: "Safe to skip entirely on a first run.",
    },
  };

  const SAGA_META = {
    original: { label: "The Original Run", range: "2000 – 2011" },
    revival: { label: "The Revival", range: "2025" },
  };

  const PHASE_META = {
    1: { label: "The Original Trilogy", sub: "Death by design · 2000–2006" },
    2: { label: "The Later Films", sub: "Sequel and prequel · 2009–2011" },
    3: { label: "The Revival", sub: "Fourteen years later · 2025" },
  };

  /* Contiguous blocks of the watch order, used for its group headers. */
  const WATCH_BLOCKS = [
    { max: 3, phase: 1 },
    { max: 5, phase: 2 },
    { max: 6, phase: 3 },
  ];

  /* In-universe era buckets, keyed by the highest chrono value in each. */
  const ERAS = [
    {
      max: 2000,
      key: "pre",
      title: "Before Flight 180",
      sub: "1999 · the bridge collapse",
    },
    {
      max: 2010,
      key: "run",
      title: "The Original Disasters",
      sub: "2000–2009",
    },
    { max: 9999, key: "new", title: "The New Generation", sub: "2025" },
  ];

  const POSTERS = {}; // posters live in _films.js

  /* ---------- publish ---------- */

  (window.CATALOGUES ||= {}).finaldestination = {
    items: ITEMS,
    posters: POSTERS,
    imgDir: "assets/img/finaldestination/",
    types: TYPE_META,
    rel: REL_META,
    saga: SAGA_META,
    phase: PHASE_META,
    watchBlocks: WATCH_BLOCKS,
    eras: ERAS,
  };
})();
