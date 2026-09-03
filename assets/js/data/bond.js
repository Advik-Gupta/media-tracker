/* ============================================================
   JAMES BOND - THE DANIEL CRAIG ERA
   The five Craig films only. Unlike the rest of the series these form one
   continuous story with a real beginning and end, so they stand alone
   without any of the earlier eras.
   ============================================================ */

(() => {
  const ITEMS = [
    {
      w: 1,
      film: "casino-royale-2006",
      sub: "2006",
      type: "film",
      saga: "craig",
      phase: 1,
      chrono: 2006,
      cLabel: "2006",
      rel: "essential",
      note: "A full reboot - Bond's first mission. The Craig films are one continuous story from here.",
    },
    {
      w: 2,
      film: "quantum-of-solace-2008",
      type: "film",
      saga: "craig",
      phase: 1,
      chrono: 2008,
      cLabel: "2008",
      rel: "recommended",
      note: "Begins minutes after Casino Royale ends. The only direct continuation in the series.",
    },
    {
      w: 3,
      film: "skyfall-2012",
      type: "film",
      saga: "craig",
      phase: 1,
      chrono: 2012,
      cLabel: "2012",
      rel: "essential",
      note: "The fiftieth-anniversary film, and the highest-grossing in the series.",
    },
    {
      w: 4,
      film: "spectre-2015",
      type: "film",
      saga: "craig",
      phase: 1,
      chrono: 2015,
      cLabel: "2015",
      rel: "recommended",
      note: "Retroactively links the previous three Craig films into one arc.",
    },
    {
      w: 5,
      film: "no-time-to-die-2021",
      type: "film",
      saga: "craig",
      phase: 1,
      chrono: 2021,
      cLabel: "2021",
      rel: "essential",
      note: "Craig's final film, and it closes his continuity definitively.",
    },
  ];

  const TYPE_META = {
    film: { label: "Film", short: "FILM", color: "#b09b3e" },
  };

  const REL_META = {
    essential: {
      label: "Essential",
      rank: 0,
      color: "#b09b3e",
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
    craig: { label: "Daniel Craig", range: "2006 – 2021" },
  };

  const PHASE_META = {
    1: { label: "The Craig Era", sub: "One continuous story · 2006–2021" },
  };

  /* Contiguous blocks of the watch order, used for its group headers. */
  const WATCH_BLOCKS = [{ max: 5, phase: 1 }];

  /* In-universe era buckets, keyed by the highest chrono value in each. */
  const ERAS = [
    {
      max: 2010,
      key: "rise",
      title: "Becoming Bond",
      sub: "2006–2008 · Casino Royale and its direct sequel",
    },
    {
      max: 9999,
      key: "late",
      title: "The Long Goodbye",
      sub: "2012–2021 · Skyfall through No Time to Die",
    },
  ];

  const POSTERS = {}; // posters live in _films.js

  /* ---------- publish ---------- */

  (window.CATALOGUES ||= {}).bond = {
    items: ITEMS,
    posters: POSTERS,
    imgDir: "assets/img/bond/",
    types: TYPE_META,
    rel: REL_META,
    saga: SAGA_META,
    phase: PHASE_META,
    watchBlocks: WATCH_BLOCKS,
    eras: ERAS,
  };
})();
