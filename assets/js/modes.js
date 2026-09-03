/* ============================================================
   MODES - Media Vault holds more than one library. Clicking the
   logo opens a switcher between them.

   The chosen mode is remembered so the logo takes you back to
   whichever library you were last in.
   ============================================================ */

(() => {
  const KEY = "mediavault.mode";
  const MODES = [
    {
      id: "movie",
      name: "Movies",
      tagline: "Films, lists & franchises",
      href: "index.html",
      icon: "🎬",
      blurb: "Franchises, curated lists, countries and your own watchlist.",
    },
    {
      id: "show",
      name: "Shows",
      tagline: "Television",
      href: "pages/shows.html",
      icon: "📺",
      blurb:
        "Series tracked season by season, from Breaking Bad to Attack on Titan.",
    },
    { id: 'anime', name: 'Anime', tagline: 'Animation', href: 'pages/anime.html', icon: '🌸',
      blurb: 'Every series episode by episode, with ratings season by season.' },
  ];

  const current = () => document.body.dataset.mode || "movie";
  const remember = (id) => {
    try {
      localStorage.setItem(KEY, id);
    } catch {}
  };

  const backdrop = document.createElement("div");
  backdrop.className = "mode-backdrop";
  backdrop.hidden = true;

  const modal = document.createElement("aside");
  modal.className = "mode-modal";
  modal.hidden = true;
  modal.setAttribute("aria-label", "Switch library");
  modal.innerHTML = `
    <div class="mode-head">
      <h3>Media Vault</h3>
      <button class="mode-close" aria-label="Close">✕</button>
    </div>
    <p class="mode-sub">Pick a library.</p>
    <div class="mode-grid">
      ${MODES.map(
        (m) => `
        <a class="mode-card${m.id === current() ? " active" : ""}" href="${m.href}" data-mode="${m.id}">
          <span class="mode-icon">${m.icon}</span>
          <b>${m.name}</b>
          <span class="mode-tagline">${m.tagline}</span>
          <span class="mode-blurb">${m.blurb}</span>
          ${m.id === current() ? '<span class="mode-badge">You are here</span>' : ""}
        </a>`,
      ).join("")}
    </div>`;

  document.body.append(backdrop, modal);

  const open = () => {
    backdrop.hidden = modal.hidden = false;
    requestAnimationFrame(() => {
      backdrop.classList.add("show");
      modal.classList.add("show");
    });
  };
  const close = () => {
    backdrop.classList.remove("show");
    modal.classList.remove("show");
    setTimeout(() => {
      backdrop.hidden = modal.hidden = true;
    }, 320);
  };

  backdrop.addEventListener("click", close);
  modal.querySelector(".mode-close").addEventListener("click", close);
  modal
    .querySelectorAll(".mode-card")
    .forEach((a) =>
      a.addEventListener("click", () => remember(a.dataset.mode)),
    );
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) close();
  });

  /* The logo stays an ordinary link home - on a list page that IS the way back,
     so it must not be hijacked. The switcher gets its own control beside it. */
  document.querySelectorAll(".brand").forEach((brand) => {
    const home = MODES.find((x) => x.id === current());
    if (home) brand.setAttribute("href", home.href);
    brand.setAttribute("title", `Back to ${home ? home.name : "home"}`);

    if (brand.parentElement.querySelector(".mode-switch")) return;
    const btn = document.createElement("button");
    btn.className = "mode-switch";
    btn.type = "button";
    btn.title = "Switch library";
    btn.setAttribute("aria-label", "Switch library");
    btn.innerHTML = `<span>${(home && home.icon) || "🎬"}</span><i>▾</i>`;
    btn.addEventListener("click", open);
    brand.insertAdjacentElement("afterend", btn);
  });
})();
