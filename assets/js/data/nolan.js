/* ============================================================
   CHRISTOPHER NOLAN - COMPLETE FILMOGRAPHY
   All thirteen features in release order. Nolan's filmography is short enough
   that there is nothing here worth skipping.
   ============================================================ */

(() => {
  const ITEMS = [
    {
      w: 1,
      film: "following-1998",
      type: "film",
      saga: "early",
      phase: 1,
      chrono: 1998.001,
      cLabel: "1998",
      rel: "essential",
      note: "Shot on weekends for about six thousand dollars. The non-linear structure he never let go of is already here.",
    },
    {
      w: 2,
      film: "memento-2000",
      type: "film",
      saga: "early",
      phase: 1,
      chrono: 2000.002,
      cLabel: "2000",
      rel: "essential",
      note: "The film that made his name. Two timelines running in opposite directions.",
    },
    {
      w: 3,
      film: "insomnia-2002",
      type: "film",
      saga: "early",
      phase: 1,
      chrono: 2002.003,
      cLabel: "2002",
      rel: "essential",
      note: "His only remake, and the only film he did not write. Pacino and Robin Williams.",
    },
    {
      w: 4,
      film: "batman-begins-2005",
      type: "film",
      saga: "batman",
      phase: 2,
      chrono: 2005.004,
      cLabel: "2005",
      rel: "essential",
      note: "Reboots Batman as something grounded, and reboots the superhero film with it.",
    },
    {
      w: 5,
      film: "prestige-2006",
      type: "film",
      saga: "batman",
      phase: 2,
      chrono: 2006.005,
      cLabel: "2006",
      rel: "essential",
      note: "Made between Batman films and arguably the most tightly constructed thing he has done.",
    },
    {
      w: 6,
      film: "dark-knight-2008",
      type: "film",
      saga: "batman",
      phase: 2,
      chrono: 2008.006,
      cLabel: "2008",
      rel: "essential",
      note: "The high point of the trilogy, and of the genre for a long stretch afterward.",
    },
    {
      w: 7,
      film: "inception-2010",
      type: "film",
      saga: "batman",
      phase: 2,
      chrono: 2010.007,
      cLabel: "2010",
      rel: "essential",
      note: "The original screenplay he sat on for a decade until he had the clout to make it.",
    },
    {
      w: 8,
      film: "dark-knight-rises-2012",
      type: "film",
      saga: "batman",
      phase: 2,
      chrono: 2012.008,
      cLabel: "2012",
      rel: "essential",
      note: "Closes the trilogy eight years after The Dark Knight, in-story and in production.",
    },
    {
      w: 9,
      film: "interstellar-2014",
      type: "film",
      saga: "epic",
      phase: 3,
      chrono: 2014.009,
      cLabel: "2014",
      rel: "essential",
      note: "His most emotional film, and the one that started the Hoyte van Hoytema partnership.",
    },
    {
      w: 10,
      film: "dunkirk-2017",
      type: "film",
      saga: "epic",
      phase: 3,
      chrono: 2017.01,
      cLabel: "2017",
      rel: "essential",
      note: "Three timelines at three different speeds - land, sea and air - converging at the end.",
    },
    {
      w: 11,
      film: "tenet-2020",
      type: "film",
      saga: "epic",
      phase: 3,
      chrono: 2020.011,
      cLabel: "2020",
      rel: "essential",
      note: "The most mechanically complex of his films. Rewards a second viewing more than any other.",
    },
    {
      w: 12,
      film: "oppenheimer-2023",
      type: "film",
      saga: "epic",
      phase: 3,
      chrono: 2023.012,
      cLabel: "2023",
      rel: "essential",
      note: "Won Best Picture and Best Director. Three hours, largely of people talking in rooms.",
    },
    {
      w: 13,
      film: "odyssey-2026",
      type: "film",
      saga: "epic",
      phase: 3,
      chrono: 2026.013,
      cLabel: "2026",
      rel: "essential",
      note: "His Homer adaptation, shot on IMAX film. Runtime here is an estimate.",
    },
  ];

  const TYPE_META = {
    film: { label: "Film", short: "FILM", color: "#5b7fb5" },
  };

  const REL_META = {
    essential: {
      label: "Essential",
      rank: 0,
      color: "#5b7fb5",
      blurb: "The short list. Start here.",
    },
    recommended: {
      label: "Recommended",
      rank: 1,
      color: "#e8913d",
      blurb: "Strong work, worth your time.",
    },
    optional: {
      label: "Optional",
      rank: 2,
      color: "#4ea8f2",
      blurb: "For completists and fans.",
    },
    skippable: {
      label: "Skippable",
      rank: 3,
      color: "#6b6b78",
      blurb: "Safe to skip entirely.",
    },
  };

  const SAGA_META = {
    early: { label: "Early Work", range: "1998 – 2002" },
    batman: { label: "The Dark Knight Trilogy", range: "2005 – 2012" },
    epic: { label: "The Epics", range: "2014 – 2026" },
  };

  const PHASE_META = {
    1: { label: "Early Work", sub: "Low budget, high concept · 1998–2002" },
    2: {
      label: "The Dark Knight Era",
      sub: "Batman and the magicians · 2005–2012",
    },
    3: { label: "The Epics", sub: "Scale and spectacle · 2014–2026" },
  };

  const WATCH_BLOCKS = [
    { max: 3, phase: 1 },
    { max: 8, phase: 2 },
    { max: 13, phase: 3 },
  ];

  /* These are career retrospectives, so the in-universe sort simply follows
   the release timeline grouped into career periods. */
  const ERAS = [
    { max: 2003, key: "a", title: "1998 – 2002", sub: "The early films" },
    {
      max: 2013,
      key: "b",
      title: "2005 – 2012",
      sub: "Batman and the magicians",
    },
    { max: 9999, key: "c", title: "2014 – 2026", sub: "The epics" },
  ];

  const POSTERS = {}; // posters live in _films.js

  /* ---------- publish ---------- */

  (window.CATALOGUES ||= {}).nolan = {
    items: ITEMS,
    posters: POSTERS,
    imgDir: "assets/img/nolan/",
    types: TYPE_META,
    rel: REL_META,
    saga: SAGA_META,
    phase: PHASE_META,
    watchBlocks: WATCH_BLOCKS,
    eras: ERAS,
  };
})();
