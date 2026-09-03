/* ============================================================
   THE CONJURING UNIVERSE
   Ten films across four sub-series. Watch order is release order; the
   in-universe sort untangles them into the actual 1950s-to-1980s timeline.
   ============================================================ */

(() => {
  const ITEMS = [
    {
      w: 1,
      film: "conjuring-2013",
      type: "film",
      saga: "conjuring",
      phase: 1,
      chrono: 1971,
      cLabel: "1971",
      rel: "essential",
      note: "The film the whole universe is built on. Ed and Lorraine Warren and the Perron family.",
    },
    {
      w: 2,
      film: "annabelle-2014",
      type: "film",
      saga: "annabelle",
      phase: 1,
      chrono: 1967,
      cLabel: "1967",
      rel: "optional",
      note: "The first spin-off, and the weakest. Its own prequel, Creation, is far better.",
    },
    {
      w: 3,
      film: "conjuring-2-2016",
      type: "film",
      saga: "conjuring",
      phase: 1,
      chrono: 1977,
      cLabel: "1977",
      rel: "essential",
      note: "The Enfield case. Introduces Valak, the demon nun who spun off her own trilogy.",
    },
    {
      w: 4,
      film: "annabelle-creation-2017",
      type: "film",
      saga: "annabelle",
      phase: 2,
      chrono: 1955,
      cLabel: "1955",
      rel: "recommended",
      note: "A prequel to Annabelle that retroactively makes that film work. Chronologically the earliest doll story.",
    },
    {
      w: 5,
      film: "nun-2018",
      type: "film",
      saga: "nun",
      phase: 2,
      chrono: 1952,
      cLabel: "1952",
      rel: "recommended",
      note: "Chronologically the earliest film in the universe. Explains the Valak haunting from The Conjuring 2.",
    },
    {
      w: 6,
      film: "curse-of-la-llorona-2019",
      type: "film",
      saga: "standalone",
      phase: 2,
      chrono: 1973,
      cLabel: "1973",
      rel: "skippable",
      note: "Connected only by a single character cameo. Its canon status has been argued both ways - safe to skip.",
    },
    {
      w: 7,
      film: "annabelle-comes-home-2019",
      type: "film",
      saga: "annabelle",
      phase: 2,
      chrono: 1972,
      cLabel: "1972",
      rel: "optional",
      note: "Set in the Warrens' artifact room, and the most fun of the Annabelle films.",
    },
    {
      w: 8,
      film: "conjuring-the-devil-made-me-do-it-2021",
      type: "film",
      saga: "conjuring",
      phase: 3,
      chrono: 1981,
      cLabel: "1981",
      rel: "essential",
      note: "The Arne Johnson trial - the first US case to claim demonic possession as a defence.",
    },
    {
      w: 9,
      film: "nun-ii-2023",
      type: "film",
      saga: "nun",
      phase: 3,
      chrono: 1956,
      cLabel: "1956",
      rel: "optional",
      note: "Four years after The Nun, and it ties back into the Conjuring films more directly.",
    },
    {
      w: 10,
      film: "conjuring-last-rites-2025",
      type: "film",
      saga: "conjuring",
      phase: 3,
      chrono: 1986,
      cLabel: "1986",
      rel: "essential",
      note: "Billed as the final Warren case and the end of the main series.",
    },
  ];

  const TYPE_META = {
    film: { label: "Film", short: "FILM", color: "#a83e5c" },
  };

  const REL_META = {
    essential: {
      label: "Essential",
      rank: 0,
      color: "#a83e5c",
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
    conjuring: { label: "The Conjuring", range: "2013 – 2025" },
    annabelle: { label: "Annabelle", range: "2014 – 2019" },
    nun: { label: "The Nun", range: "2018 – 2023" },
    standalone: { label: "Standalone", range: "2019" },
  };

  const PHASE_META = {
    1: { label: "The First Wave", sub: "Establishing the Warrens · 2013–2016" },
    2: {
      label: "Expanding the Universe",
      sub: "Spin-offs and prequels · 2017–2019",
    },
    3: { label: "Recent Chapters", sub: "Closing the case files · 2021–2025" },
  };

  /* Contiguous blocks of the watch order, used for its group headers. */
  const WATCH_BLOCKS = [
    { max: 3, phase: 1 },
    { max: 7, phase: 2 },
    { max: 10, phase: 3 },
  ];

  /* In-universe era buckets, keyed by the highest chrono value in each. */
  const ERAS = [
    {
      max: 1960,
      key: "50s",
      title: "The 1950s",
      sub: "Where the hauntings begin",
    },
    {
      max: 1970,
      key: "60s",
      title: "The 1960s",
      sub: "Before the Warrens were famous",
    },
    {
      max: 1980,
      key: "70s",
      title: "The 1970s",
      sub: "The Warrens at their peak",
    },
    { max: 9999, key: "80s", title: "The 1980s", sub: "The final case files" },
  ];

  const POSTERS = {}; // posters live in _films.js

  /* ---------- publish ---------- */

  (window.CATALOGUES ||= {}).conjuring = {
    items: ITEMS,
    posters: POSTERS,
    imgDir: "assets/img/conjuring/",
    types: TYPE_META,
    rel: REL_META,
    saga: SAGA_META,
    phase: PHASE_META,
    watchBlocks: WATCH_BLOCKS,
    eras: ERAS,
  };
})();
