/* ============================================================
   MONSTERVERSE
   The eight Legendary Godzilla and Kong entries. The 1933, 1976 and 2005
   King Kong films are deliberately not included - they share a character
   but no continuity, and tacking them on the end helped nobody.
   ============================================================ */

(() => {
  const ITEMS = [
    {
      w: 1,
      film: "godzilla-2014",
      type: "film",
      saga: "monsterverse",
      phase: 1,
      chrono: 2014,
      cLabel: "2014",
      rel: "essential",
      note: "The film that starts the MonsterVerse and establishes Monarch.",
    },
    {
      w: 2,
      film: "kong-skull-island-2017",
      type: "film",
      saga: "monsterverse",
      phase: 1,
      chrono: 1973,
      cLabel: "1973",
      rel: "essential",
      note: "A 1970s period piece. Chronologically the earliest MonsterVerse film.",
    },
    {
      w: 3,
      film: "godzilla-king-of-the-monsters-2019",
      type: "film",
      saga: "monsterverse",
      phase: 1,
      chrono: 2019,
      cLabel: "2019",
      rel: "essential",
      note: "Brings in Mothra, Rodan and Ghidorah, and wakes the rest of the Titans.",
    },
    {
      w: 4,
      film: "godzilla-vs-kong-2021",
      type: "film",
      saga: "monsterverse",
      phase: 2,
      chrono: 2024,
      cLabel: "2024",
      rel: "essential",
      note: "The crossover the first three films were building toward. Opens up Hollow Earth.",
    },
    {
      w: 5,
      film: "skull-island-season-1-2023",
      type: "animated",
      saga: "monsterverse",
      phase: 2,
      chrono: 2020,
      cLabel: "2020s",
      rel: "optional",
      note: "An animated series set on the island. Very loosely connected to the films.",
    },
    {
      w: 6,
      film: "monarch-legacy-of-monsters-season-1-2023",
      type: "live",
      saga: "monsterverse",
      phase: 2,
      chrono: 2015,
      cLabel: "1959 and 2015",
      rel: "recommended",
      note: "Cuts between the 1950s founding of Monarch and the aftermath of the 2014 film. The best of the non-film material.",
    },
    {
      w: 7,
      film: "godzilla-x-kong-the-new-empire-2024",
      type: "film",
      saga: "monsterverse",
      phase: 2,
      chrono: 2027,
      cLabel: "2027",
      rel: "recommended",
      note: "Leans fully into Hollow Earth and the Kong side of the universe.",
    },
    {
      w: 8,
      film: "godzilla-x-kong-supernova-2027",
      type: "film",
      saga: "monsterverse",
      phase: 3,
      chrono: 2030,
      cLabel: "2030",
      rel: "essential",
      upcoming: true,
      note: "Announced for March 2027. Runtime here is an estimate.",
    },
  ];

  const TYPE_META = {
    film: { label: "Film", short: "FILM", color: "#8fa82b" },
    live: { label: "Live-Action Series", short: "SERIES", color: "#b5c94e" },
    animated: { label: "Animated Series", short: "ANIMATED", color: "#6b8f1f" },
  };

  const REL_META = {
    essential: {
      label: "Essential",
      rank: 0,
      color: "#8fa82b",
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
    monsterverse: { label: "MonsterVerse", range: "2014 – 2027" },
  };

  const PHASE_META = {
    1: { label: "Monsters Awaken", sub: "Titans revealed · 2014–2019" },
    2: { label: "Titan Wars", sub: "Godzilla and Kong collide · 2021–2024" },
    3: { label: "What Comes Next", sub: "Announced · 2027" },
  };

  /* Contiguous blocks of the watch order, used for its group headers. */
  const WATCH_BLOCKS = [
    { max: 3, phase: 1 },
    { max: 7, phase: 2 },
    { max: 8, phase: 3 },
  ];

  /* In-universe era buckets, keyed by the highest chrono value in each. */
  const ERAS = [
    {
      max: 1950,
      key: "skull",
      title: "Skull Island",
      sub: "1933 · the original expedition",
    },
    {
      max: 2000,
      key: "monarch",
      title: "The Monarch Files",
      sub: "1959–1976 · Monarch in secret",
    },
    { max: 2020, key: "awaken", title: "Titans Emerge", sub: "2014–2019" },
    { max: 9999, key: "empire", title: "The New Empire", sub: "2024 onward" },
  ];

  const POSTERS = {}; // posters live in _films.js

  /* ---------- publish ---------- */

  (window.CATALOGUES ||= {}).monsterverse = {
    items: ITEMS,
    posters: POSTERS,
    imgDir: "assets/img/monsterverse/",
    types: TYPE_META,
    rel: REL_META,
    saga: SAGA_META,
    phase: PHASE_META,
    watchBlocks: WATCH_BLOCKS,
    eras: ERAS,
  };
})();
