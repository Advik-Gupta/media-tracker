/* ============================================================
   POSTER LIGHTBOX - click any poster, anywhere, to see it full
   size. Works on the timeline, the compact rows, My List and the
   random pick, so it is wired by delegation rather than by each
   view remembering to opt in.

   Poster clicks are swallowed here: on a tracker row the click
   would otherwise fall through and open the detail sheet behind
   the lightbox.
   ============================================================ */

(() => {
  const SELECTOR = ".tl-poster, .row-poster, .rnd-poster, .wl-sugg-thumb";

  let backdrop = null;
  let figure = null;
  let imgEl = null;
  let capEl = null;
  let subEl = null;
  let siblings = [];
  let index = -1;
  let lastFocus = null;

  /* ---------- the shell, built once on first use ---------- */

  function build() {
    if (backdrop) return;

    backdrop = document.createElement("div");
    backdrop.className = "lb-backdrop";
    backdrop.hidden = true;

    figure = document.createElement("div");
    figure.className = "lb";
    figure.hidden = true;
    figure.setAttribute("role", "dialog");
    figure.setAttribute("aria-modal", "true");
    figure.setAttribute("aria-label", "Poster");
    figure.innerHTML = `
      <button class="lb-close" aria-label="Close">✕</button>
      <button class="lb-nav lb-prev" aria-label="Previous poster">‹</button>
      <button class="lb-nav lb-next" aria-label="Next poster">›</button>
      <div class="lb-frame"><img alt="" /></div>
      <div class="lb-cap"><b></b><span></span></div>`;

    document.body.append(backdrop, figure);

    imgEl = figure.querySelector("img");
    capEl = figure.querySelector(".lb-cap b");
    subEl = figure.querySelector(".lb-cap span");

    backdrop.addEventListener("click", close);
    figure.querySelector(".lb-close").addEventListener("click", close);
    figure.querySelector(".lb-prev").addEventListener("click", () => step(-1));
    figure.querySelector(".lb-next").addEventListener("click", () => step(1));
    /* clicking the surround closes; clicking the poster itself does not */
    figure.addEventListener("click", (e) => {
      if (e.target === figure || e.target.classList.contains("lb-frame"))
        close();
    });
  }

  /* ---------- what a poster is called ---------- */

  function labelFor(holder) {
    const row =
      holder.closest(".tl-item, .row, .rnd-body, .wl-sugg") ||
      holder.parentElement;
    const title =
      row &&
      row.querySelector(".tl-title, .r-title, .rnd-info h2, .wl-sugg-title");
    if (title) return title.textContent.trim();

    const img = holder.querySelector("img");
    const alt = img && img.getAttribute("alt");
    return alt ? alt.replace(/^Poster for\s*/i, "") : "Poster";
  }

  function subtitleFor(holder) {
    const row =
      holder.closest(".tl-item, .row, .rnd-body, .wl-sugg") ||
      holder.parentElement;
    const sub =
      row && row.querySelector(".tl-sub, .r-sub, .rnd-uni, .wl-sugg-sub");
    return sub ? sub.textContent.trim() : "";
  }

  /* ---------- open / close / navigate ---------- */

  function show(holder) {
    const img = holder.querySelector("img");
    if (!img || !img.getAttribute("src")) return; /* placeholder tile */

    build();
    imgEl.src = img.currentSrc || img.src;
    imgEl.alt = labelFor(holder);
    capEl.textContent = labelFor(holder);
    subEl.textContent = subtitleFor(holder);

    const many = siblings.length > 1;
    figure.querySelector(".lb-prev").hidden = !many;
    figure.querySelector(".lb-next").hidden = !many;

    backdrop.hidden = figure.hidden = false;
    requestAnimationFrame(() => {
      backdrop.classList.add("show");
      figure.classList.add("show");
    });
  }

  function open(holder) {
    /* Only posters that actually have an image can be stepped through, so a
       run of placeholders never strands the arrows on a blank frame. */
    siblings = [...document.querySelectorAll(SELECTOR)].filter((el) =>
      el.querySelector("img[src]"),
    );
    index = siblings.indexOf(holder);
    lastFocus = document.activeElement;
    show(holder);
    if (figure) figure.querySelector(".lb-close").focus();
  }

  function step(dir) {
    if (index < 0 || siblings.length < 2) return;
    index = (index + dir + siblings.length) % siblings.length;
    show(siblings[index]);
  }

  function close() {
    if (!figure || figure.hidden) return;
    backdrop.classList.remove("show");
    figure.classList.remove("show");
    setTimeout(() => {
      backdrop.hidden = figure.hidden = true;
      imgEl.removeAttribute("src");
    }, 200);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* ---------- wiring ---------- */

  document.addEventListener(
    "click",
    (e) => {
      const holder = e.target.closest(SELECTOR);
      if (!holder || !holder.querySelector("img[src]")) return;
      e.preventDefault();
      e.stopPropagation();
      open(holder);
    },
    true,
  ); /* capture, so the row's own handler never runs */

  document.addEventListener(
    "keydown",
    (e) => {
      if (!figure || figure.hidden) return;
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
      } else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowRight") step(1);
    },
    true,
  );
})();
