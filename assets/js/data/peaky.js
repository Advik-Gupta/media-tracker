/* ============================================================
   PEAKY BLINDERS
   Six series, 1919 to 1934. Straightforwardly linear - release order and
   in-universe order are the same.
   ============================================================ */

(() => {
  const ITEMS = [
    {
      w: 1,
      film: "peaky-blinders-series-1-2013",
      type: "season",
      saga: "pb",
      phase: 1,
      chrono: 1919,
      cLabel: "1919",
      rel: "essential",
      note: "Birmingham after the First World War. Tommy Shelby versus Inspector Campbell.",
    },
    {
      w: 2,
      film: "peaky-blinders-series-2-2014",
      type: "season",
      saga: "pb",
      phase: 1,
      chrono: 1921,
      cLabel: "1921–22",
      rel: "essential",
      note: "The family expands into London. Introduces Alfie Solomons.",
    },
    {
      w: 3,
      film: "peaky-blinders-series-3-2016",
      type: "season",
      saga: "pb",
      phase: 1,
      chrono: 1924,
      cLabel: "1924",
      rel: "essential",
      note: "Russian aristocrats, stolen jewels and the family at its most exposed.",
    },
    {
      w: 4,
      film: "peaky-blinders-series-4-2017",
      type: "season",
      saga: "pb",
      phase: 2,
      chrono: 1925,
      cLabel: "1925–26",
      rel: "essential",
      note: "The Changretta vendetta. Widely held to be the best series of the six.",
    },
    {
      w: 5,
      film: "peaky-blinders-series-5-2019",
      type: "season",
      saga: "pb",
      phase: 2,
      chrono: 1929,
      cLabel: "1929",
      rel: "essential",
      note: "The Wall Street crash and Oswald Mosley.",
    },
    {
      w: 6,
      film: "peaky-blinders-series-6-2022",
      type: "season",
      saga: "pb",
      phase: 2,
      chrono: 1934,
      cLabel: "1934",
      rel: "essential",
      note: "The final series, reshaped after Helen McCrory's death. A feature film continuation has been announced.",
    },
    {
      w: 7,
      film: "peaky-blinders-the-immortal-man-2026",
      type: "film",
      saga: "pb",
      phase: 2,
      chrono: 1940,
      cLabel: "Second World War",
      rel: "essential",
      note: "The Netflix continuation film, set during the Second World War. Exact date was not published far ahead, so the one here is approximate.",
    },
  ];

  const TYPE_META = {
    film: { label: "Film", short: "FILM", color: "#9eb0bf" },
    season: { label: "Series", short: "SERIES", color: "#7a8a99" },
  };

  const REL_META = {
    essential: {
      label: "Essential",
      rank: 0,
      color: "#7a8a99",
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
    pb: { label: "Peaky Blinders", range: "2013 – 2022" },
  };

  const PHASE_META = {
    1: { label: "The Early Years", sub: "Birmingham, 1919–1924 · series 1–3" },
    2: {
      label: "Going Legitimate",
      sub: "Politics and America, 1925–1934 · series 4–6",
    },
  };

  const WATCH_BLOCKS = [
    { max: 3, phase: 1 },
    { max: 7, phase: 2 },
  ];

  const ERAS = [
    {
      max: 1925,
      key: "a",
      title: "The 1920s",
      sub: "1919–1924 · racecourse wars",
    },
    {
      max: 9999,
      key: "b",
      title: "The 1930s",
      sub: "1925–1934 · politics and fascism",
    },
  ];

  const POSTERS = {}; // posters live in _films.js

  /* ---------- publish ---------- */

  (window.CATALOGUES ||= {}).peaky = {
    items: ITEMS,
    posters: POSTERS,
    imgDir: "assets/img/peaky/",
    types: TYPE_META,
    rel: REL_META,
    saga: SAGA_META,
    phase: PHASE_META,
    watchBlocks: WATCH_BLOCKS,
    eras: ERAS,
  };
})();
