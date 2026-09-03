/* ============================================================
   QUENTIN TARANTINO - COMPLETE FILMOGRAPHY
   His ten official features in release order, plus the two collaborations he
   only partly directed or wrote.
   ============================================================ */

(() => {
  const ITEMS = [
    {
      w: 1,
      film: "reservoir-dogs-1992",
      type: "film",
      saga: "solo",
      phase: 1,
      chrono: 1992.001,
      cLabel: "1992",
      rel: "essential",
      note: "The debut. Made for just over a million dollars and it changed independent film.",
    },
    {
      w: 2,
      film: "pulp-fiction-1994",
      type: "film",
      saga: "solo",
      phase: 1,
      chrono: 1994.002,
      cLabel: "1994",
      rel: "essential",
      note: "Palme d'Or and an Original Screenplay Oscar. Still the defining Tarantino film.",
    },
    {
      w: 3,
      film: "jackie-brown-1997",
      type: "film",
      saga: "solo",
      phase: 1,
      chrono: 1997.003,
      cLabel: "1997",
      rel: "essential",
      note: "His only adaptation, from an Elmore Leonard novel. The most restrained thing he has made.",
    },
    {
      w: 4,
      film: "kill-bill-vol-1-2003",
      type: "film",
      saga: "solo",
      phase: 2,
      chrono: 2003.004,
      cLabel: "2003",
      rel: "essential",
      note: "Conceived as one film and split in two. Watch both together if you can.",
    },
    {
      w: 5,
      film: "kill-bill-vol-2-2004",
      type: "film",
      saga: "solo",
      phase: 2,
      chrono: 2004.005,
      cLabel: "2004",
      rel: "essential",
      note: "The second half, and tonally a completely different film from the first.",
    },
    {
      w: 6,
      film: "death-proof-2007",
      type: "film",
      saga: "solo",
      phase: 2,
      chrono: 2007.006,
      cLabel: "2007",
      rel: "essential",
      note: "Originally half of the Grindhouse double feature with Rodriguez. His own least favourite.",
    },
    {
      w: 7,
      film: "inglourious-basterds-2009",
      type: "film",
      saga: "solo",
      phase: 3,
      chrono: 2009.007,
      cLabel: "2009",
      rel: "essential",
      note: "The first of the revisionist histories, and the film that won Christoph Waltz his Oscar.",
    },
    {
      w: 8,
      film: "django-unchained-2012",
      type: "film",
      saga: "solo",
      phase: 3,
      chrono: 2012.008,
      cLabel: "2012",
      rel: "essential",
      note: "His highest-grossing film, and a second Original Screenplay Oscar.",
    },
    {
      w: 9,
      film: "hateful-eight-2015",
      type: "film",
      saga: "solo",
      phase: 3,
      chrono: 2015.009,
      cLabel: "2015",
      rel: "essential",
      note: "Shot in 70mm Ultra Panavision, almost entirely inside one room.",
    },
    {
      w: 10,
      film: "once-upon-a-time-in-hollywood-2019",
      type: "film",
      saga: "solo",
      phase: 3,
      chrono: 2019.01,
      cLabel: "2019",
      rel: "essential",
      note: "His ninth film, and the one he has described as closest to his own life.",
    },
    {
      w: 11,
      film: "four-rooms-1995",
      sub: "His segment only",
      type: "collab",
      saga: "collab",
      phase: 4,
      chrono: 1995.011,
      cLabel: "1995",
      rel: "optional",
      note: 'An anthology of four segments by four directors. Only "The Man from Hollywood" is his.',
    },
    {
      w: 12,
      film: "from-dusk-till-dawn-1996",
      sub: "Written by, not directed",
      type: "collab",
      saga: "collab",
      phase: 4,
      chrono: 1996.012,
      cLabel: "1996",
      rel: "optional",
      note: "Written by Tarantino and directed by Robert Rodriguez. He also co-stars.",
    },
  ];

  const TYPE_META = {
    film: { label: "Film", short: "FILM", color: "#c9873f" },
    collab: { label: "Collaboration", short: "COLLAB", color: "#8a8a95" },
  };

  const REL_META = {
    essential: {
      label: "Essential",
      rank: 0,
      color: "#c9873f",
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
    solo: { label: "Official Features", range: "1992 – 2019" },
    collab: { label: "Collaborations", range: "1995 – 1996" },
  };

  const PHASE_META = {
    1: { label: "The Nineties", sub: "Video store to Palme d'Or · 1992–1997" },
    2: { label: "The Kill Bill Era", sub: "Genre homage · 2003–2007" },
    3: {
      label: "The Revisionist Histories",
      sub: "Rewriting the past · 2009–2019",
    },
    4: { label: "Collaborations", sub: "Partly his · 1995–1996" },
  };

  const WATCH_BLOCKS = [
    { max: 3, phase: 1 },
    { max: 6, phase: 2 },
    { max: 10, phase: 3 },
    { max: 12, phase: 4 },
  ];

  /* These are career retrospectives, so the in-universe sort simply follows
   the release timeline grouped into career periods. */
  const ERAS = [
    { max: 2000, key: "a", title: "The Nineties", sub: "1992–1997" },
    { max: 2008, key: "b", title: "The Kill Bill Era", sub: "2003–2007" },
    {
      max: 9999,
      key: "c",
      title: "The Revisionist Histories",
      sub: "2009–2019",
    },
  ];

  const POSTERS = {}; // posters live in _films.js

  /* ---------- publish ---------- */

  (window.CATALOGUES ||= {}).tarantino = {
    items: ITEMS,
    posters: POSTERS,
    imgDir: "assets/img/tarantino/",
    types: TYPE_META,
    rel: REL_META,
    saga: SAGA_META,
    phase: PHASE_META,
    watchBlocks: WATCH_BLOCKS,
    eras: ERAS,
  };
})();
