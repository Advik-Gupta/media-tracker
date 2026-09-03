/* ============================================================
   THE LORD OF THE RINGS
   Jackson's two trilogies plus the animated Rohirrim film. Watch order is
   release order - The Hobbit is a prequel, but it was made to be seen
   second and leans on your knowing the original trilogy.
   ============================================================ */

(() => {
  const ITEMS = [
    {
      w: 1,
      film: "fellowship-of-the-ring-2001",
      type: "film",
      saga: "lotr",
      phase: 1,
      chrono: 3018,
      cLabel: "TA 3018",
      rel: "essential",
      note: "The extended edition adds about half an hour and is the version to watch.",
    },
    {
      w: 2,
      film: "two-towers-2002",
      type: "film",
      saga: "lotr",
      phase: 1,
      chrono: 3019,
      cLabel: "TA 3019",
      rel: "essential",
      note: "Helm's Deep, and the introduction of Gollum as a full character.",
    },
    {
      w: 3,
      film: "return-of-the-king-2003",
      type: "film",
      saga: "lotr",
      phase: 1,
      chrono: 3019.5,
      cLabel: "TA 3019",
      rel: "essential",
      note: "Won all eleven Oscars it was nominated for, including Best Picture.",
    },
    {
      w: 4,
      film: "hobbit-an-unexpected-journey-2012",
      type: "film",
      saga: "hobbit",
      phase: 2,
      chrono: 2941,
      cLabel: "TA 2941",
      rel: "recommended",
      note: "Sixty years before Fellowship. Stretching one short novel across three films shows.",
    },
    {
      w: 5,
      film: "hobbit-the-desolation-of-smaug-2013",
      type: "film",
      saga: "hobbit",
      phase: 2,
      chrono: 2941.3,
      cLabel: "TA 2941",
      rel: "recommended",
      note: "The best of the three, largely because of Smaug himself.",
    },
    {
      w: 6,
      film: "hobbit-the-battle-of-the-five-armies-2014",
      type: "film",
      saga: "hobbit",
      phase: 2,
      chrono: 2941.6,
      cLabel: "TA 2941",
      rel: "optional",
      note: "Essentially one long battle sequence.",
    },
    {
      w: 7,
      film: "war-of-the-rohirrim-2024",
      type: "animated",
      saga: "new",
      phase: 3,
      chrono: 2758,
      cLabel: "TA 2758–59",
      rel: "optional",
      note: "Anime-style film set almost two centuries before the trilogy, telling the story behind Helm's Deep.",
    },
    {
      w: 8,
      film: "hunt-for-gollum-2027",
      type: "film",
      saga: "new",
      phase: 3,
      chrono: 3009,
      cLabel: "TA 3009–17",
      rel: "recommended",
      upcoming: true,
      note: "Announced for December 2027, with Andy Serkis directing and starring. Runtime here is an estimate.",
    },
  ];

  const TYPE_META = {
    film: { label: "Film", short: "FILM", color: "#c9a227" },
    animated: { label: "Animated", short: "ANIMATED", color: "#e0c05e" },
  };

  const REL_META = {
    essential: {
      label: "Essential",
      rank: 0,
      color: "#c9a227",
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
    lotr: { label: "The Lord of the Rings", range: "2001 – 2003" },
    hobbit: { label: "The Hobbit", range: "2012 – 2014" },
    new: { label: "New Films", range: "2024 – " },
  };

  const PHASE_META = {
    1: {
      label: "The Lord of the Rings",
      sub: "The original trilogy · 2001–2003",
    },
    2: { label: "The Hobbit", sub: "The prequel trilogy · 2012–2014" },
    3: {
      label: "Middle-earth Continues",
      sub: "Animated and announced · 2024–2027",
    },
  };

  const WATCH_BLOCKS = [
    { max: 3, phase: 1 },
    { max: 6, phase: 2 },
    { max: 8, phase: 3 },
  ];

  const ERAS = [
    {
      max: 2800,
      key: "a",
      title: "The Third Age - Early",
      sub: "TA 2758–2799 · the Rohirrim",
    },
    {
      max: 2950,
      key: "b",
      title: "The Quest for Erebor",
      sub: "TA 2941 · The Hobbit",
    },
    {
      max: 9999,
      key: "c",
      title: "The War of the Ring",
      sub: "TA 3018–3019 · The Lord of the Rings",
    },
  ];

  const POSTERS = {}; // posters live in _films.js

  /* ---------- publish ---------- */

  (window.CATALOGUES ||= {}).lotr = {
    items: ITEMS,
    posters: POSTERS,
    imgDir: "assets/img/lotr/",
    types: TYPE_META,
    rel: REL_META,
    saga: SAGA_META,
    phase: PHASE_META,
    watchBlocks: WATCH_BLOCKS,
    eras: ERAS,
  };
})();
