/* ============================================================
   THE BOYS UNIVERSE
   The main series season by season, plus the Gen V spin-off and the
   animated anthology. Gen V season 1 sits between The Boys seasons 3 and 4,
   and its finale feeds straight into season 4.
   ============================================================ */

(() => {
  const ITEMS = [
    {
      w: 1,
      film: "boys-season-1-2019",
      type: "season",
      saga: "boys",
      phase: 1,
      chrono: 2019,
      cLabel: "2019",
      rel: "essential",
      note: "Hughie meets Butcher. Establishes Vought, Compound V and exactly how bad Homelander is.",
    },
    {
      w: 2,
      film: "boys-season-2-2020",
      type: "season",
      saga: "boys",
      phase: 1,
      chrono: 2020,
      cLabel: "2020",
      rel: "essential",
      note: "Stormfront arrives and the show sharpens its satire considerably.",
    },
    {
      w: 3,
      film: "boys-season-3-2022",
      type: "season",
      saga: "boys",
      phase: 1,
      chrono: 2022,
      cLabel: "2022",
      rel: "essential",
      note: "Soldier Boy, and the season that pushes Butcher past the point of return.",
    },
    {
      w: 4,
      film: "boys-season-4-2024",
      type: "season",
      saga: "boys",
      phase: 1,
      chrono: 2024,
      cLabel: "2024",
      rel: "essential",
      note: "Follows on directly from the Gen V season 1 finale - watch that first.",
    },
    {
      w: 5,
      film: "boys-season-5-2026",
      type: "season",
      saga: "boys",
      phase: 1,
      chrono: 2026,
      cLabel: "2026",
      rel: "essential",
      note: "The final season. Exact release date was not announced far in advance, so the date here is approximate.",
    },
    {
      w: 6,
      film: "gen-v-season-1-2023",
      type: "season",
      saga: "genv",
      phase: 2,
      chrono: 2023,
      cLabel: "2023",
      rel: "recommended",
      note: "Set at Godolkin University between seasons 3 and 4 of The Boys. Its finale is required setup for season 4.",
    },
    {
      w: 7,
      film: "gen-v-season-2-2025",
      type: "season",
      saga: "genv",
      phase: 2,
      chrono: 2025,
      cLabel: "2025",
      rel: "recommended",
      note: "Runs between The Boys seasons 4 and 5.",
    },
    {
      w: 8,
      film: "boys-presents-diabolical-season-1-2022",
      type: "animated",
      saga: "anim",
      phase: 3,
      chrono: 2021,
      cLabel: "various",
      rel: "optional",
      note: "Animated shorts by different creative teams. One episode is genuine canon backstory for Homelander; the rest are standalone.",
    },
  ];

  const TYPE_META = {
    season: { label: "Season", short: "SEASON", color: "#d92b2b" },
    animated: { label: "Animated", short: "ANIMATED", color: "#f2726b" },
  };

  const REL_META = {
    essential: {
      label: "Essential",
      rank: 0,
      color: "#d92b2b",
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
    boys: { label: "The Boys", range: "2019 – 2026" },
    genv: { label: "Gen V", range: "2023 – 2025" },
    anim: { label: "Diabolical", range: "2022" },
  };

  const PHASE_META = {
    1: { label: "The Boys", sub: "Vought versus the Boys · 5 seasons" },
    2: { label: "Gen V", sub: "Godolkin University · 2 seasons" },
    3: { label: "Diabolical", sub: "Animated anthology · 2022" },
  };

  const WATCH_BLOCKS = [
    { max: 5, phase: 1 },
    { max: 7, phase: 2 },
    { max: 8, phase: 3 },
  ];

  const ERAS = [
    { max: 2023, key: "early", title: "The Early Fights", sub: "2019–2022" },
    { max: 2026, key: "mid", title: "Homelander Unbound", sub: "2023–2024" },
    { max: 9999, key: "end", title: "The Endgame", sub: "2026" },
  ];

  const POSTERS = {}; // posters live in _films.js

  /* ---------- publish ---------- */

  (window.CATALOGUES ||= {}).theboys = {
    items: ITEMS,
    posters: POSTERS,
    imgDir: "assets/img/theboys/",
    types: TYPE_META,
    rel: REL_META,
    saga: SAGA_META,
    phase: PHASE_META,
    watchBlocks: WATCH_BLOCKS,
    eras: ERAS,
  };
})();
