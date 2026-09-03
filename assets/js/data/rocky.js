/* ============================================================
   ROCKY & CREED
   Six Rocky films then three Creed films, in one continuous line. Release
   order and in-universe order are identical - the series has always moved
   forward in real time.
   ============================================================ */

(() => {
  const ITEMS = [
    {
      w: 1,
      film: "rocky-1976",
      type: "film",
      saga: "rocky",
      phase: 1,
      chrono: 1976,
      cLabel: "1976",
      rel: "essential",
      note: "Won Best Picture. Stallone wrote it in three days and refused to sell it unless he could star.",
    },
    {
      w: 2,
      film: "rocky-ii-1979",
      type: "film",
      saga: "rocky",
      phase: 1,
      chrono: 1979,
      cLabel: "1979",
      rel: "recommended",
      note: "Picks up immediately after the first film.",
    },
    {
      w: 3,
      film: "rocky-iii-1982",
      type: "film",
      saga: "rocky",
      phase: 1,
      chrono: 1982,
      cLabel: "1982",
      rel: "recommended",
      note: 'Clubber Lang and "Eye of the Tiger". Where the series turns into a crowd-pleaser.',
    },
    {
      w: 4,
      film: "rocky-iv-1985",
      type: "film",
      saga: "rocky",
      phase: 1,
      chrono: 1985,
      cLabel: "1985",
      rel: "recommended",
      note: "Drago, and the most eighties film ever made. The 2021 director's cut is a noticeably different, better film.",
    },
    {
      w: 5,
      film: "rocky-v-1990",
      type: "film",
      saga: "rocky",
      phase: 1,
      chrono: 1990,
      cLabel: "1990",
      rel: "skippable",
      note: "Widely disliked, and later effectively ignored by Rocky Balboa.",
    },
    {
      w: 6,
      film: "rocky-balboa-2006",
      type: "film",
      saga: "rocky",
      phase: 1,
      chrono: 2006,
      cLabel: "2006",
      rel: "essential",
      note: "Sixteen years after Rocky V, and a genuine return to form. Sets up everything Creed does.",
    },
    {
      w: 7,
      film: "creed-2015",
      type: "film",
      saga: "creed",
      phase: 2,
      chrono: 2015,
      cLabel: "2015",
      rel: "essential",
      note: "Ryan Coogler's soft reboot, following Apollo's son. Earned Stallone an Oscar nomination.",
    },
    {
      w: 8,
      film: "creed-ii-2018",
      type: "film",
      saga: "creed",
      phase: 2,
      chrono: 2018,
      cLabel: "2018",
      rel: "recommended",
      note: "Brings back the Drago family, so watch Rocky IV first.",
    },
    {
      w: 9,
      film: "creed-iii-2023",
      type: "film",
      saga: "creed",
      phase: 2,
      chrono: 2023,
      cLabel: "2023",
      rel: "recommended",
      note: "The first film in the series without Stallone, and Michael B. Jordan's directorial debut.",
    },
  ];

  const TYPE_META = {
    film: { label: "Film", short: "FILM", color: "#b5893d" },
  };

  const REL_META = {
    essential: {
      label: "Essential",
      rank: 0,
      color: "#b5893d",
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
    rocky: { label: "Rocky", range: "1976 – 2006" },
    creed: { label: "Creed", range: "2015 – " },
  };

  const PHASE_META = {
    1: { label: "The Rocky Films", sub: "Balboa · 1976–2006" },
    2: { label: "The Creed Films", sub: "Adonis · 2015 onward" },
  };

  const WATCH_BLOCKS = [
    { max: 6, phase: 1 },
    { max: 9, phase: 2 },
  ];

  const ERAS = [
    { max: 1990, key: "a", title: "The Original Run", sub: "1976–1985" },
    { max: 2010, key: "b", title: "The Later Rocky Films", sub: "1990–2006" },
    { max: 9999, key: "c", title: "The Creed Era", sub: "2015 onward" },
  ];

  const POSTERS = {}; // posters live in _films.js

  /* ---------- publish ---------- */

  (window.CATALOGUES ||= {}).rocky = {
    items: ITEMS,
    posters: POSTERS,
    imgDir: "assets/img/rocky/",
    types: TYPE_META,
    rel: REL_META,
    saga: SAGA_META,
    phase: PHASE_META,
    watchBlocks: WATCH_BLOCKS,
    eras: ERAS,
  };
})();
