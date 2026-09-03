/* ============================================================
   JOHN WICK
   Four films, one spin-off film and a prequel series. Chapters 1 to 4 run
   almost back to back - the whole main saga covers about two weeks.
   ============================================================ */

(() => {
  const ITEMS = [
    {
      w: 1,
      film: "john-wick-2014",
      type: "film",
      saga: "wick",
      phase: 1,
      chrono: 2014,
      cLabel: "day 1",
      rel: "essential",
      note: "The dog. Establishes the Continental, the gold coins and the rules.",
    },
    {
      w: 2,
      film: "john-wick-chapter-2-2017",
      type: "film",
      saga: "wick",
      phase: 1,
      chrono: 2014.1,
      cLabel: "days later",
      rel: "essential",
      note: "Picks up days after the first film. Ends with Wick declared excommunicado.",
    },
    {
      w: 3,
      film: "john-wick-chapter-3-parabellum-2019",
      type: "film",
      saga: "wick",
      phase: 1,
      chrono: 2014.2,
      cLabel: "one hour later",
      rel: "essential",
      note: "Begins literally minutes after Chapter 2 ends.",
    },
    {
      w: 4,
      film: "continental-miniseries-3-parts-2023",
      type: "live",
      saga: "expanded",
      phase: 2,
      chrono: 1975,
      cLabel: "1975",
      rel: "optional",
      note: "A 1970s prequel about Winston taking over the hotel. Self-contained and easy to skip.",
    },
    {
      w: 5,
      film: "john-wick-chapter-4-2023",
      type: "film",
      saga: "wick",
      phase: 2,
      chrono: 2014.3,
      cLabel: "months later",
      rel: "essential",
      note: "The longest and biggest of the films, and the conclusion of the main story.",
    },
    {
      w: 6,
      film: "ballerina-2025",
      type: "film",
      saga: "expanded",
      phase: 2,
      chrono: 2014.25,
      cLabel: "between Chapters 3 and 4",
      rel: "recommended",
      note: "A spin-off set between Chapter 3 and Chapter 4, with Wick appearing. Watch after Chapter 3.",
    },
  ];

  const TYPE_META = {
    film: { label: "Film", short: "FILM", color: "#e83a6f" },
    live: { label: "Series", short: "SERIES", color: "#f2739e" },
  };

  const REL_META = {
    essential: {
      label: "Essential",
      rank: 0,
      color: "#e83a6f",
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
    wick: { label: "The John Wick Films", range: "2014 – 2023" },
    expanded: { label: "Expanded World", range: "2023 – 2025" },
  };

  const PHASE_META = {
    1: { label: "The Baba Yaga", sub: "One man, one dog · 2014–2019" },
    2: { label: "The High Table War", sub: "The world expands · 2023–2025" },
  };

  /* Contiguous blocks of the watch order, used for its group headers. */
  const WATCH_BLOCKS = [
    { max: 3, phase: 1 },
    { max: 6, phase: 2 },
  ];

  /* In-universe era buckets, keyed by the highest chrono value in each. */
  const ERAS = [
    {
      max: 2000,
      key: "past",
      title: "The Continental in 1975",
      sub: "Decades before Wick",
    },
    {
      max: 9999,
      key: "now",
      title: "The Main Saga",
      sub: "Roughly two weeks, across four films",
    },
  ];

  const POSTERS = {}; // posters live in _films.js

  /* ---------- publish ---------- */

  (window.CATALOGUES ||= {}).johnwick = {
    items: ITEMS,
    posters: POSTERS,
    imgDir: "assets/img/johnwick/",
    types: TYPE_META,
    rel: REL_META,
    saga: SAGA_META,
    phase: PHASE_META,
    watchBlocks: WATCH_BLOCKS,
    eras: ERAS,
  };
})();
