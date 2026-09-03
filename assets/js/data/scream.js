/* ============================================================
   SCREAM
   Six films, one continuous story. Release order and in-universe order
   are the same - the series always moves forward.
   ============================================================ */

(() => {
  const ITEMS = [
    {
      w: 1,
      film: "scream-1996",
      type: "film",
      saga: "original",
      phase: 1,
      chrono: 1996,
      cLabel: "1996",
      rel: "essential",
      note: "Wes Craven's meta-slasher. Every later film is in conversation with this one.",
    },
    {
      w: 2,
      film: "scream-2-1997",
      type: "film",
      saga: "original",
      phase: 1,
      chrono: 1998,
      cLabel: "1998",
      rel: "essential",
      note: "One of the strongest horror sequels ever made, and it takes the rules of sequels as its subject.",
    },
    {
      w: 3,
      film: "scream-3-2000",
      type: "film",
      saga: "original",
      phase: 1,
      chrono: 2000,
      cLabel: "2000",
      rel: "optional",
      note: "Closes the original trilogy and rewrites Sidney's family history.",
    },
    {
      w: 4,
      film: "scream-4-2011",
      type: "film",
      saga: "original",
      phase: 2,
      chrono: 2011,
      cLabel: "2011",
      rel: "recommended",
      note: "Craven's final film. Sets up the generational handover the 2022 film pays off.",
    },
    {
      w: 5,
      film: "scream-2022",
      sub: "2022",
      type: "film",
      saga: "requel",
      phase: 3,
      chrono: 2022,
      cLabel: "2022",
      rel: "essential",
      note: "A direct sequel that shares its title with the original. Introduces the new core cast.",
    },
    {
      w: 6,
      film: "scream-vi-2023",
      type: "film",
      saga: "requel",
      phase: 3,
      chrono: 2023,
      cLabel: "2023",
      rel: "recommended",
      note: "Moves the series to New York. Follows straight on from the 2022 film.",
    },
    {
      w: 7,
      film: "scream-7-2026",
      type: "film",
      saga: "requel",
      phase: 3,
      chrono: 2026,
      cLabel: "2026",
      rel: "essential",
      note: "Neve Campbell returns as Sidney Prescott, with Kevin Williamson directing for the first time.",
    },
  ];

  const TYPE_META = {
    film: { label: "Film", short: "FILM", color: "#b81d3c" },
  };

  const REL_META = {
    essential: {
      label: "Essential",
      rank: 0,
      color: "#b81d3c",
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
    original: { label: "The Craven Films", range: "1996 – 2011" },
    requel: { label: "The Requel Era", range: "2022 – 2023" },
  };

  const PHASE_META = {
    1: {
      label: "The Original Trilogy",
      sub: "Woodsboro and after · 1996–2000",
    },
    2: { label: "The Return", sub: "A decade later · 2011" },
    3: { label: "The Requel Era", sub: "A new generation · 2022–2023" },
  };

  /* Contiguous blocks of the watch order, used for its group headers. */
  const WATCH_BLOCKS = [
    { max: 3, phase: 1 },
    { max: 4, phase: 2 },
    { max: 7, phase: 3 },
  ];

  /* In-universe era buckets, keyed by the highest chrono value in each. */
  const ERAS = [
    { max: 2001, key: "90s", title: "The Woodsboro Years", sub: "1996–2000" },
    { max: 2015, key: "back", title: "The Return", sub: "2011" },
    { max: 9999, key: "new", title: "The New Core Four", sub: "2022–2023" },
  ];

  const POSTERS = {}; // posters live in _films.js

  /* ---------- publish ---------- */

  (window.CATALOGUES ||= {}).scream = {
    items: ITEMS,
    posters: POSTERS,
    imgDir: "assets/img/scream/",
    types: TYPE_META,
    rel: REL_META,
    saga: SAGA_META,
    phase: PHASE_META,
    watchBlocks: WATCH_BLOCKS,
    eras: ERAS,
  };
})();
