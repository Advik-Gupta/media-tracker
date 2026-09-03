/* ============================================================
   VINLAND SAGA
   Two seasons, adapted from Makoto Yukimura's manga. Entirely linear -
   season two picks up directly where season one ends, though it changes
   register completely.
   ============================================================ */

(() => {
  const ITEMS = [
    {
      w: 1,
      film: "vinland-saga-season-1-2019",
      type: "season",
      saga: "vs",
      phase: 1,
      chrono: 1013,
      cLabel: "1013",
      rel: "essential",
      note: "Eleventh-century Vikings, and one of the best-animated series of its decade.",
    },
    {
      w: 2,
      film: "vinland-saga-season-2-2023",
      type: "season",
      saga: "vs",
      phase: 2,
      chrono: 1018,
      cLabel: "1018",
      rel: "essential",
      note: "A near-total change of tone - almost no fighting, and better for it. Do not skip it because of that.",
    },
  ];

  const TYPE_META = {
    season: { label: "Season", short: "SEASON", color: "#8a9e6b" },
  };

  const REL_META = {
    essential: {
      label: "Essential",
      rank: 0,
      color: "#8a9e6b",
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
    vs: { label: "Vinland Saga", range: "2019 – 2023" },
  };

  const PHASE_META = {
    1: { label: "War Arc", sub: "Season 1 · revenge" },
    2: { label: "Farmland Saga", sub: "Season 2 · after revenge" },
  };

  const WATCH_BLOCKS = [
    { max: 1, phase: 1 },
    { max: 2, phase: 2 },
  ];

  const ERAS = [
    {
      max: 1015,
      key: "a",
      title: "The War Arc",
      sub: "1013 · Thorfinn and Askeladd",
    },
    { max: 9999, key: "b", title: "The Farmland Saga", sub: "1018 · the turn" },
  ];

  const POSTERS = {}; // posters live in _films.js

  /* ---------- publish ---------- */

  (window.CATALOGUES ||= {}).vinland = {
    items: ITEMS,
    posters: POSTERS,
    imgDir: "assets/img/vinland/",
    types: TYPE_META,
    rel: REL_META,
    saga: SAGA_META,
    phase: PHASE_META,
    watchBlocks: WATCH_BLOCKS,
    eras: ERAS,
  };
})();
