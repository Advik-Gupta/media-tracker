/* ============================================================
   EVIL DEAD
   Raimi's original trilogy, the 2013 remake, the Ash vs Evil Dead series and
   the two recent films. The remake and Rise share the Necronomicon but not the
   characters - only the trilogy and the TV series form one continuous story.
   ============================================================ */

(() => {
  const ITEMS = [
    {
      w: 1,
      film: "evil-dead-1981",
      type: "film",
      saga: "ash",
      phase: 1,
      chrono: 1981,
      cLabel: "1981",
      rel: "essential",
      note: "Raimi's debut, shot for around 375,000 dollars. Straight horror, before the series discovered comedy.",
    },
    {
      w: 2,
      film: "evil-dead-ii-1987",
      type: "film",
      saga: "ash",
      phase: 1,
      chrono: 1987,
      cLabel: "1987",
      rel: "essential",
      note: "Half remake, half sequel, and the film that invented the tone the franchise is known for. The best entry by most reckonings.",
    },
    {
      w: 3,
      film: "army-of-darkness-1992",
      type: "film",
      saga: "ash",
      phase: 1,
      chrono: 1300,
      cLabel: "1300 AD",
      rel: "recommended",
      note: "Picks up from the Evil Dead II ending, throwing Ash into the fourteenth century. Far more comedy than horror.",
    },
    {
      w: 4,
      film: "ash-vs-evil-dead-3-seasons-2015",
      type: "live",
      saga: "ash",
      phase: 2,
      chrono: 2015,
      cLabel: "2015–2018",
      rel: "recommended",
      note: "A direct continuation of the trilogy thirty years on, with Bruce Campbell returning. The proper ending to his story.",
    },
    {
      w: 5,
      film: "evil-dead-2013",
      sub: "2013 remake",
      type: "film",
      saga: "modern",
      phase: 3,
      chrono: 2013,
      cLabel: "2013",
      rel: "recommended",
      note: "A straight-faced remake with no Ash. Its post-credits scene ties it loosely to the original.",
    },
    {
      w: 6,
      film: "evil-dead-rise-2023",
      type: "film",
      saga: "modern",
      phase: 3,
      chrono: 2023,
      cLabel: "2023",
      rel: "essential",
      note: "Moves the whole thing out of the woods and into a Los Angeles tower block. The best-reviewed entry since Evil Dead II.",
    },
    {
      w: 7,
      film: "evil-dead-burn-2026",
      type: "film",
      saga: "modern",
      phase: 3,
      chrono: 2026,
      cLabel: "2026",
      rel: "recommended",
      note: "Sébastien Vaniček directing, announced for July 2026. Runtime here is an estimate.",
    },
  ];

  const TYPE_META = {
    film: { label: "Film", short: "FILM", color: "#a83232" },
    live: { label: "Series", short: "SERIES", color: "#c96b6b" },
  };

  const REL_META = {
    essential: {
      label: "Essential",
      rank: 0,
      color: "#a83232",
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
    ash: { label: "The Ash Williams Story", range: "1981 – 2018" },
    modern: { label: "The Modern Films", range: "2013 – 2026" },
  };

  const PHASE_META = {
    1: { label: "The Raimi Trilogy", sub: "Ash and the cabin · 1981–1992" },
    2: { label: "Ash vs Evil Dead", sub: "The series · 2015–2018" },
    3: { label: "The Modern Films", sub: "New casts, same book · 2013–2026" },
  };

  const WATCH_BLOCKS = [
    { max: 3, phase: 1 },
    { max: 4, phase: 2 },
    { max: 7, phase: 3 },
  ];

  const ERAS = [
    {
      max: 1995,
      key: "a",
      title: "The Cabin Years",
      sub: "1981–1992 · Ash and the Necronomicon",
    },
    { max: 2015, key: "b", title: "The Remake", sub: "2013 · a new cabin" },
    { max: 9999, key: "c", title: "The Modern Films", sub: "2015 onward" },
  ];

  const POSTERS = {}; // posters live in _films.js

  /* ---------- publish ---------- */

  (window.CATALOGUES ||= {}).evildead = {
    items: ITEMS,
    posters: POSTERS,
    imgDir: "assets/img/evildead/",
    types: TYPE_META,
    rel: REL_META,
    saga: SAGA_META,
    phase: PHASE_META,
    watchBlocks: WATCH_BLOCKS,
    eras: ERAS,
  };
})();
