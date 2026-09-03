/* ============================================================
   NARUTO
   The two core series plus Boruto, season-by-season would run to over a
   thousand episodes, so each series is one entry with its episode count.
   Only the two canon films are included - the rest are side stories that
   sit outside the manga entirely.
   ============================================================ */

(() => {
  const ITEMS = [
    {
      w: 1,
      film: "naruto-220-episodes-2002",
      type: "series",
      saga: "naruto",
      phase: 1,
      chrono: 2002,
      cLabel: "Part I",
      rel: "essential",
      note: "Part I of the manga. Heavy on filler from around episode 136 - most guides recommend a filler list.",
    },
    {
      w: 2,
      film: "naruto-shippuden-500-episodes-2007",
      type: "series",
      saga: "naruto",
      phase: 2,
      chrono: 2007,
      cLabel: "Part II",
      rel: "essential",
      note: "Part II, after a two-and-a-half year time skip. Roughly forty per cent filler; a filler guide is close to essential here.",
    },
    {
      w: 3,
      film: "last-naruto-the-movie-2014",
      type: "film",
      saga: "naruto",
      phase: 2,
      chrono: 2014.9,
      cLabel: "between Shippuden and Boruto",
      rel: "recommended",
      note: "The only Naruto film that is properly canon. Sits between the end of Shippuden and the Boruto era.",
    },
    {
      w: 4,
      film: "boruto-naruto-the-movie-2015",
      type: "film",
      saga: "boruto",
      phase: 3,
      chrono: 2015,
      cLabel: "Boruto era",
      rel: "recommended",
      note: "Canon, and later retold across the Boruto series - watch it here or skip to the series arc that covers it.",
    },
    {
      w: 5,
      film: "boruto-naruto-next-generations-293-episodes-2017",
      type: "series",
      saga: "boruto",
      phase: 3,
      chrono: 2017,
      cLabel: "next generation",
      rel: "optional",
      note: "Slow to start and largely filler for its first fifty episodes. Picks up considerably once the manga arcs begin.",
    },
  ];

  const TYPE_META = {
    series: { label: "Series", short: "SERIES", color: "#e8823d" },
    film: { label: "Film", short: "FILM", color: "#f2a76b" },
  };

  const REL_META = {
    essential: {
      label: "Essential",
      rank: 0,
      color: "#e8823d",
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
    naruto: { label: "Naruto", range: "2002 – 2017" },
    boruto: { label: "Boruto", range: "2017 – " },
  };

  const PHASE_META = {
    1: { label: "Naruto", sub: "Part I · the Academy years" },
    2: {
      label: "Naruto Shippuden",
      sub: "Part II · the Fourth Great Ninja War",
    },
    3: { label: "Boruto", sub: "The next generation" },
  };

  const WATCH_BLOCKS = [
    { max: 1, phase: 1 },
    { max: 3, phase: 2 },
    { max: 5, phase: 3 },
  ];

  const ERAS = [
    { max: 2010, key: "a", title: "Part I", sub: "Naruto as a genin" },
    { max: 2016, key: "b", title: "Part II", sub: "Shippuden and the war" },
    { max: 9999, key: "c", title: "The Next Generation", sub: "Boruto" },
  ];

  const POSTERS = {}; // posters live in _films.js

  /* ---------- publish ---------- */

  (window.CATALOGUES ||= {}).naruto = {
    items: ITEMS,
    posters: POSTERS,
    imgDir: "assets/img/naruto/",
    types: TYPE_META,
    rel: REL_META,
    saga: SAGA_META,
    phase: PHASE_META,
    watchBlocks: WATCH_BLOCKS,
    eras: ERAS,
  };
})();
