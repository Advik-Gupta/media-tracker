/* ============================================================
   GAME OF THRONES
   All eight seasons of the original series, plus House of the Dragon -
   a prequel set roughly 170 years earlier, which is why watch order and
   in-universe order disagree completely.
   ============================================================ */

(() => {
  const ITEMS = [
    {
      w: 1,
      film: "game-of-thrones-season-1-2011",
      type: "season",
      saga: "got",
      phase: 1,
      chrono: 298,
      cLabel: "298 AC",
      rel: "essential",
      note: "Adapts the first novel almost beat for beat. Still the best season the show made.",
    },
    {
      w: 2,
      film: "game-of-thrones-season-2-2012",
      type: "season",
      saga: "got",
      phase: 1,
      chrono: 299,
      cLabel: "299 AC",
      rel: "essential",
      note: "The War of the Five Kings, ending at the Battle of the Blackwater.",
    },
    {
      w: 3,
      film: "game-of-thrones-season-3-2013",
      type: "season",
      saga: "got",
      phase: 1,
      chrono: 300,
      cLabel: "300 AC",
      rel: "essential",
      note: "The Red Wedding.",
    },
    {
      w: 4,
      film: "game-of-thrones-season-4-2014",
      type: "season",
      saga: "got",
      phase: 1,
      chrono: 300.5,
      cLabel: "300 AC",
      rel: "essential",
      note: "The peak of the show for many - the trial, the Viper, and the Wall.",
    },
    {
      w: 5,
      film: "game-of-thrones-season-5-2015",
      type: "season",
      saga: "got",
      phase: 1,
      chrono: 301,
      cLabel: "301 AC",
      rel: "recommended",
      note: "The point the show runs past the published books and starts to wobble.",
    },
    {
      w: 6,
      film: "game-of-thrones-season-6-2016",
      type: "season",
      saga: "got",
      phase: 1,
      chrono: 302,
      cLabel: "302 AC",
      rel: "essential",
      note: '"Battle of the Bastards" and "The Winds of Winter" - a strong recovery.',
    },
    {
      w: 7,
      film: "game-of-thrones-season-7-2017",
      type: "season",
      saga: "got",
      phase: 1,
      chrono: 303,
      cLabel: "303 AC",
      rel: "recommended",
      note: "Shorter, faster, and where the plotting starts taking shortcuts.",
    },
    {
      w: 8,
      film: "game-of-thrones-season-8-2019",
      type: "season",
      saga: "got",
      phase: 1,
      chrono: 305,
      cLabel: "305 AC",
      rel: "recommended",
      note: "The divisive finale. Six episodes to close eight seasons, and it shows.",
    },
    {
      w: 9,
      film: "house-of-the-dragon-season-1-2022",
      type: "season",
      saga: "hotd",
      phase: 2,
      chrono: 112,
      cLabel: "112–129 AC",
      rel: "essential",
      note: "Set about 170 years before Game of Thrones. Watchable cold, but far richer after the original.",
    },
    {
      w: 10,
      film: "house-of-the-dragon-season-2-2024",
      type: "season",
      saga: "hotd",
      phase: 2,
      chrono: 130,
      cLabel: "130 AC",
      rel: "essential",
      note: "The Dance of the Dragons proper.",
    },
    {
      w: 11,
      film: "knight-of-the-seven-kingdoms-season-1-2026",
      type: "season",
      saga: "knight",
      phase: 3,
      chrono: 209,
      cLabel: "209 AC",
      rel: "recommended",
      note: "The Dunk and Egg stories, about ninety years before Game of Thrones. Much smaller in scale than either of the other two shows, and entirely watchable on its own.",
    },
  ];

  const TYPE_META = {
    season: { label: "Season", short: "SEASON", color: "#b5892b" },
  };

  const REL_META = {
    essential: {
      label: "Essential",
      rank: 0,
      color: "#b5892b",
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
    got: { label: "Game of Thrones", range: "2011 – 2019" },
    hotd: { label: "House of the Dragon", range: "2022 – " },
    knight: { label: "A Knight of the Seven Kingdoms", range: "2026 – " },
  };

  const PHASE_META = {
    1: {
      label: "Game of Thrones",
      sub: "The War of the Five Kings and after · 8 seasons",
    },
    2: {
      label: "House of the Dragon",
      sub: "The Dance of the Dragons · prequel",
    },
    3: {
      label: "A Knight of the Seven Kingdoms",
      sub: "Dunk and Egg · ninety years before",
    },
  };

  const WATCH_BLOCKS = [
    { max: 8, phase: 1 },
    { max: 10, phase: 2 },
    { max: 11, phase: 3 },
  ];

  const ERAS = [
    {
      max: 200,
      key: "dance",
      title: "The Dance of the Dragons",
      sub: "c. 130 AC · House of the Dragon",
    },
    {
      max: 250,
      key: "hedge",
      title: "The Hedge Knight Era",
      sub: "c. 209 AC · Dunk and Egg",
    },
    {
      max: 9999,
      key: "main",
      title: "The War of the Five Kings",
      sub: "c. 298–305 AC · Game of Thrones",
    },
  ];

  const POSTERS = {}; // posters live in _films.js

  /* ---------- publish ---------- */

  (window.CATALOGUES ||= {}).got = {
    items: ITEMS,
    posters: POSTERS,
    imgDir: "assets/img/got/",
    types: TYPE_META,
    rel: REL_META,
    saga: SAGA_META,
    phase: PHASE_META,
    watchBlocks: WATCH_BLOCKS,
    eras: ERAS,
  };
})();
