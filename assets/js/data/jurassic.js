/* ============================================================
   JURASSIC PARK / JURASSIC WORLD
   Six films, two animated series and one short. Watch order is release
   order, except that Camp Cretaceous runs concurrently with Jurassic World.
   ============================================================ */

(() => {
  const ITEMS = [
    {
      w: 1,
      film: "jurassic-park-1993",
      type: "film",
      saga: "park",
      phase: 1,
      chrono: 1993,
      cLabel: "1993",
      rel: "essential",
      note: "Spielberg's original. Everything in the franchise is measured against it.",
    },
    {
      w: 2,
      film: "lost-world-jurassic-park-1997",
      type: "film",
      saga: "park",
      phase: 1,
      chrono: 1997,
      cLabel: "1997",
      rel: "recommended",
      note: 'Moves to Isla Sorna, the "Site B" breeding island that later films keep returning to.',
    },
    {
      w: 3,
      film: "jurassic-park-iii-2001",
      type: "film",
      saga: "park",
      phase: 1,
      chrono: 2001,
      cLabel: "2001",
      rel: "optional",
      note: "The shortest and slightest of the films, though Alan Grant returns and it matters again in Dominion.",
    },
    {
      w: 4,
      film: "jurassic-world-2015",
      type: "film",
      saga: "world",
      phase: 2,
      chrono: 2015,
      cLabel: "2015",
      rel: "essential",
      note: "Twenty-two years on, the park finally opens. Reboots the series for a new trilogy.",
    },
    {
      w: 5,
      film: "jurassic-world-fallen-kingdom-2018",
      type: "film",
      saga: "world",
      phase: 2,
      chrono: 2018,
      cLabel: "2018",
      rel: "essential",
      note: "Ends with dinosaurs loose on the mainland - the premise the rest of the franchise runs on.",
    },
    {
      w: 6,
      film: "battle-at-big-rock-2019",
      type: "short",
      saga: "world",
      phase: 2,
      chrono: 2018.5,
      cLabel: "2019",
      rel: "optional",
      note: "An eight-minute short bridging Fallen Kingdom and Dominion. Free to watch and genuinely good.",
    },
    {
      w: 7,
      film: "jurassic-world-camp-cretaceous-5-seasons-2020",
      type: "tv",
      saga: "world",
      phase: 2,
      chrono: 2015.5,
      cLabel: "2015–2016",
      rel: "optional",
      note: "Season 1 runs concurrently with Jurassic World, on the far side of the same island. Better than it has any right to be.",
    },
    {
      w: 8,
      film: "jurassic-world-dominion-2022",
      type: "film",
      saga: "world",
      phase: 2,
      chrono: 2022,
      cLabel: "2022",
      rel: "essential",
      note: "Reunites the original trilogy cast with the Jurassic World leads.",
    },
    {
      w: 9,
      film: "jurassic-world-chaos-theory-2-seasons-2024",
      type: "tv",
      saga: "world",
      phase: 3,
      chrono: 2022.5,
      cLabel: "2022 onward",
      rel: "optional",
      note: "Direct sequel to Camp Cretaceous, following the same characters as adults.",
    },
    {
      w: 10,
      film: "jurassic-world-rebirth-2025",
      type: "film",
      saga: "world",
      phase: 3,
      chrono: 2027,
      cLabel: "2027",
      rel: "essential",
      note: "A soft reboot with an entirely new cast, set five years after Dominion.",
    },
  ];

  const TYPE_META = {
    film: { label: "Film", short: "FILM", color: "#4ea86b" },
    tv: { label: "Animated Series", short: "SERIES", color: "#6bbf8a" },
    short: { label: "Short", short: "SHORT", color: "#a8c94e" },
  };

  const REL_META = {
    essential: {
      label: "Essential",
      rank: 0,
      color: "#4ea86b",
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
    park: { label: "Jurassic Park Trilogy", range: "1993 – 2001" },
    world: { label: "Jurassic World Era", range: "2015 – 2025" },
  };

  const PHASE_META = {
    1: { label: "The Park Trilogy", sub: "Spielberg and after · 1993–2001" },
    2: {
      label: "The Jurassic World Trilogy",
      sub: "The park reopens · 2015–2022",
    },
    3: { label: "A New Era", sub: "After Dominion · 2024–2025" },
  };

  /* Contiguous blocks of the watch order, used for its group headers. */
  const WATCH_BLOCKS = [
    { max: 3, phase: 1 },
    { max: 8, phase: 2 },
    { max: 10, phase: 3 },
  ];

  /* In-universe era buckets, keyed by the highest chrono value in each. */
  const ERAS = [
    {
      max: 2010,
      key: "park",
      title: "The Park Era",
      sub: "1993–2001 · Isla Nublar and Isla Sorna",
    },
    {
      max: 2020,
      key: "world",
      title: "The Jurassic World Era",
      sub: "2015–2018 · the park reopens, then falls",
    },
    {
      max: 9999,
      key: "open",
      title: "The Open World",
      sub: "2022 onward · dinosaurs off the island",
    },
  ];

  const POSTERS = {}; // posters live in _films.js

  /* ---------- publish ---------- */

  (window.CATALOGUES ||= {}).jurassic = {
    items: ITEMS,
    posters: POSTERS,
    imgDir: "assets/img/jurassic/",
    types: TYPE_META,
    rel: REL_META,
    saga: SAGA_META,
    phase: PHASE_META,
    watchBlocks: WATCH_BLOCKS,
    eras: ERAS,
  };
})();
