/* ============================================================
   SAW
   Ten films. The series is built on flashbacks and overlapping timelines -
   Saw IV runs concurrently with Saw III, and Saw X sits between I and II.
   ============================================================ */

(() => {
  const ITEMS = [
    {
      w: 1,
      film: "saw-2004",
      type: "film",
      saga: "original",
      phase: 1,
      chrono: 2004,
      cLabel: "2004",
      rel: "essential",
      note: "The original, and still the best. Made for barely over a million dollars.",
    },
    {
      w: 2,
      film: "saw-ii-2005",
      type: "film",
      saga: "original",
      phase: 1,
      chrono: 2005,
      cLabel: "2005",
      rel: "essential",
      note: "Introduces Amanda as an apprentice and the multi-victim house format.",
    },
    {
      w: 3,
      film: "saw-iii-2006",
      type: "film",
      saga: "original",
      phase: 1,
      chrono: 2006,
      cLabel: "2006",
      rel: "essential",
      note: "Ends John Kramer's story - except the series then keeps going through flashbacks.",
    },
    {
      w: 4,
      film: "saw-iv-2007",
      type: "film",
      saga: "original",
      phase: 1,
      chrono: 2006.5,
      cLabel: "2006 · concurrent with III",
      rel: "recommended",
      note: "Runs at the same time as Saw III. The two films only make sense together.",
    },
    {
      w: 5,
      film: "saw-v-2008",
      type: "film",
      saga: "original",
      phase: 1,
      chrono: 2007,
      cLabel: "2007",
      rel: "optional",
      note: "Hoffman's backstory. The point where the continuity starts collapsing under itself.",
    },
    {
      w: 6,
      film: "saw-vi-2009",
      type: "film",
      saga: "original",
      phase: 1,
      chrono: 2007.5,
      cLabel: "2007",
      rel: "recommended",
      note: "The strongest of the later originals, with an actual point to make about health insurance.",
    },
    {
      w: 7,
      film: "saw-3d-final-chapter-2010",
      type: "film",
      saga: "original",
      phase: 1,
      chrono: 2008,
      cLabel: "2008",
      rel: "optional",
      note: "Intended as the finale. Brings back a character from the first film.",
    },
    {
      w: 8,
      film: "jigsaw-2017",
      type: "film",
      saga: "revival",
      phase: 2,
      chrono: 2017,
      cLabel: "2017",
      rel: "optional",
      note: "A seven-year-later revival with a timeline trick of its own.",
    },
    {
      w: 9,
      film: "spiral-2021",
      sub: "From the Book of Saw",
      type: "film",
      saga: "revival",
      phase: 2,
      chrono: 2021,
      cLabel: "2021",
      rel: "skippable",
      note: "A standalone with Chris Rock and Samuel L. Jackson. Barely connected - skippable.",
    },
    {
      w: 10,
      film: "saw-x-2023",
      type: "film",
      saga: "revival",
      phase: 2,
      chrono: 2005.5,
      cLabel: "2005 · between I and II",
      rel: "essential",
      note: "Set between the first two films, with John Kramer as the lead. The best-reviewed entry since the original.",
    },
  ];

  const TYPE_META = {
    film: { label: "Film", short: "FILM", color: "#7a4a2b" },
  };

  const REL_META = {
    essential: {
      label: "Essential",
      rank: 0,
      color: "#7a4a2b",
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
    original: { label: "The Original Run", range: "2004 – 2010" },
    revival: { label: "The Revivals", range: "2017 – 2023" },
  };

  const PHASE_META = {
    1: {
      label: "The Original Run",
      sub: "One a year, every Halloween · 2004–2010",
    },
    2: { label: "The Revivals", sub: "Reboots and returns · 2017–2023" },
  };

  /* Contiguous blocks of the watch order, used for its group headers. */
  const WATCH_BLOCKS = [
    { max: 7, phase: 1 },
    { max: 10, phase: 2 },
  ];

  /* In-universe era buckets, keyed by the highest chrono value in each. */
  const ERAS = [
    { max: 2005.4, key: "start", title: "The First Games", sub: "2004–2005" },
    {
      max: 2007,
      key: "mid",
      title: "The Hoffman Years",
      sub: "2006 · III and IV run concurrently",
    },
    { max: 2010, key: "late", title: "The Legacy Games", sub: "2007–2008" },
    { max: 9999, key: "rev", title: "The Revivals", sub: "2017–2021" },
  ];

  const POSTERS = {}; // posters live in _films.js

  /* ---------- publish ---------- */

  (window.CATALOGUES ||= {}).saw = {
    items: ITEMS,
    posters: POSTERS,
    imgDir: "assets/img/saw/",
    types: TYPE_META,
    rel: REL_META,
    saga: SAGA_META,
    phase: PHASE_META,
    watchBlocks: WATCH_BLOCKS,
    eras: ERAS,
  };
})();
