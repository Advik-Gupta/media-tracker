(() => {
  const API = "/api/books";
  const DEBOUNCE = 1200;
  const STARS = "★★★★★";

  const esc = (s) =>
    String(s == null ? "" : s).replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
    );

  /* ---------- stats + hero ---------- */

  function paintStats() {
    const s = UserBooks.stats();
    const set = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.textContent = v;
    };
    set("bsTotal", s.total);
    set("bsWant", s.want);
    set("bsReading", s.reading);
    set("bsRead", s.read);
    set("bsPages", s.pages.toLocaleString());
  }

  /* ---------- add-book modal ---------- */

  const backdrop = document.createElement("div");
  backdrop.className = "rnd-backdrop";
  backdrop.hidden = true;
  const modal = document.createElement("aside");
  modal.className = "rnd-modal add-modal";
  modal.hidden = true;
  modal.innerHTML = `
    <div class="rnd-head">
      <h3>Add a book</h3>
      <button class="rnd-close" aria-label="Close">✕</button>
    </div>
    <div class="wl-search">
      <input id="bookInput" type="text" autocomplete="off" spellcheck="false"
             placeholder="Book title or author…" aria-label="Search books" />
    </div>
    <p class="add-hint" id="bookHint">Type a title - results appear once you stop typing.</p>
    <div id="bookResults"></div>`;
  document.body.append(backdrop, modal);

  const input = modal.querySelector("#bookInput");
  const hint = modal.querySelector("#bookHint");
  const results = modal.querySelector("#bookResults");

  const open = () => {
    backdrop.hidden = modal.hidden = false;
    requestAnimationFrame(() => {
      backdrop.classList.add("show");
      modal.classList.add("show");
      input.focus();
    });
  };
  const close = () => {
    backdrop.classList.remove("show");
    modal.classList.remove("show");
    setTimeout(() => (backdrop.hidden = modal.hidden = true), 220);
  };
  document.getElementById("addBook")?.addEventListener("click", open);
  backdrop.addEventListener("click", close);
  modal.querySelector(".rnd-close").addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) close();
  });

  let timer = null;
  let lastQuery = "";
  let hits = [];

  input.addEventListener("input", () => {
    clearTimeout(timer);
    const q = input.value.trim();
    if (q.length < 2) {
      results.innerHTML = "";
      hint.textContent = "Type a title - results appear once you stop typing.";
      return;
    }
    hint.textContent = "Waiting for you to finish…";
    timer = setTimeout(() => search(q), DEBOUNCE);
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      clearTimeout(timer);
      const q = input.value.trim();
      if (q.length >= 2) search(q);
    }
  });

  async function search(q) {
    if (q === lastQuery && results.children.length) return;
    lastQuery = q;
    hint.textContent = "Searching…";
    results.innerHTML = "";

    let data = null;
    try {
      const r = await fetch(`${API}/search?q=${encodeURIComponent(q)}`);
      if (r.ok) data = await r.json();
    } catch (e) {}

    if (!data) {
      hint.textContent = "Search is unavailable right now - try again shortly.";
      return;
    }

    hits = (data.docs || []).filter((d) => d.title);
    if (!hits.length) {
      hint.textContent = `Nothing found for "${esc(q)}".`;
      return;
    }
    hint.textContent = "Pick one to add it.";
    results.innerHTML = hits
      .map((d, i) => {
        const key = String(d.key || "").replace(/^\/works\//, "");
        const owned = UserBooks.has(key);
        const author = (d.author_name || []).slice(0, 2).join(", ");
        const cover = UserBooks.coverUrl(d.cover_i, "S");
        return `
          <button class="wl-sugg" data-i="${i}" ${owned ? "disabled" : ""}>
            <span class="wl-sugg-thumb${cover ? "" : " ph"}">
              ${cover ? `<img src="${cover}" alt="" loading="lazy">` : ""}
            </span>
            <span class="wl-sugg-main">
              <b class="wl-sugg-title">${esc(d.title)}</b>
              <span class="wl-sugg-sub">${esc(author)}${d.first_publish_year ? ` · ${d.first_publish_year}` : ""}</span>
            </span>
            <span class="wl-sugg-cta">${owned ? "Already here" : "Add"}</span>
          </button>`;
      })
      .join("");

    results.querySelectorAll("[data-i]").forEach((b) =>
      b.addEventListener("click", () => {
        const hit = hits[Number(b.dataset.i)];
        UserBooks.add(hit, "want");
        if (typeof toast === "function") toast(`Added ${hit.title}`);
        b.disabled = true;
        b.querySelector(".wl-sugg-cta").textContent = "Already here";
        paintStats();
        paintGrid();
        paintGroups();
      }),
    );
  }

  /* ---------- main grid ---------- */

  let activeShelf = "all";
  let activeAuthor = null;
  let activeCategory = null;
  let activeView = localStorage.getItem("mediavault.bookview") || "grid";

  const grid = document.getElementById("bookGrid");
  const empty = document.getElementById("bookEmpty");
  const shelfChips = document.querySelectorAll("[data-shelf]");
  const viewChips = document.querySelectorAll("[data-view]");

  shelfChips.forEach((b) =>
    b.addEventListener("click", () => {
      activeShelf = b.dataset.shelf;
      activeAuthor = null;
      activeCategory = null;
      shelfChips.forEach((x) => x.classList.toggle("active", x === b));
      paintGrid();
    }),
  );

  viewChips.forEach((b) =>
    b.addEventListener("click", () => {
      activeView = b.dataset.view;
      viewChips.forEach((x) => x.classList.toggle("active", x === b));
      try {
        localStorage.setItem("mediavault.bookview", activeView);
      } catch {}
      paintGrid();
    }),
  );
  viewChips.forEach((b) => b.classList.toggle("active", b.dataset.view === activeView));

  function starRow(book) {
    return `<span class="book-stars" data-key="${esc(book.key)}">
      ${[1, 2, 3, 4, 5]
        .map((n) => `<button class="book-star${n <= book.myRating ? " on" : ""}" data-star="${n}" aria-label="Rate ${n}">★</button>`)
        .join("")}
    </span>`;
  }

  function bookCard(book) {
    const el = document.createElement("article");
    el.className = "wish-card book-card reveal in";
    el.dataset.key = book.key;
    const cover = UserBooks.coverUrl(book.cover, "M");
    const authors = book.authors.map((a) => esc(a.name)).join(", ") || "Unknown author";
    el.innerHTML = `
      <div class="wish-cover book-cover">
        ${cover ? `<img src="${cover}" alt="" loading="lazy" decoding="async" onerror="this.remove();">` : ""}
      </div>
      <div class="wish-body">
        <h3>${esc(book.title)}</h3>
        <p class="wish-year">${authors}${book.year ? ` · ${book.year}` : ""}${book.pages ? ` · ${book.pages}p` : ""}</p>
        ${starRow(book)}
        <div class="book-shelf-pick">
          ${UserBooks.SHELVES.map(
            (s) => `<button class="book-shelf-opt${book.shelf === s ? " on" : ""}" data-set-shelf="${s}">${UserBooks.SHELF_LABEL[s]}</button>`,
          ).join("")}
        </div>
      </div>
      <button type="button" class="uni-remove" title="Remove ${esc(book.title)}" aria-label="Remove ${esc(book.title)}">✕</button>`;

    el.querySelector(".uni-remove").addEventListener("click", (e) => {
      e.stopPropagation();
      UserBooks.remove(book.key);
      if (typeof toast === "function") toast(`Removed ${book.title}`);
      paintStats();
      paintGrid();
      paintGroups();
    });

    el.querySelectorAll("[data-set-shelf]").forEach((btn) =>
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        UserBooks.setShelf(book.key, btn.dataset.setShelf);
        paintStats();
        paintGrid();
      }),
    );

    el.querySelectorAll("[data-star]").forEach((btn) =>
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const n = Number(btn.dataset.star);
        UserBooks.setRating(book.key, book.myRating === n ? 0 : n);
        paintGrid();
      }),
    );

    el.addEventListener("click", () => openDetail(book));
    return el;
  }

  function paintGrid() {
    let list = UserBooks.byShelf(activeShelf);
    if (activeAuthor) list = list.filter((b) => b.authors.some((a) => (a.key || a.name) === activeAuthor));
    if (activeCategory) list = list.filter((b) => (b.subjects || []).includes(activeCategory));

    grid.classList.toggle("list-view", activeView === "list");
    grid.innerHTML = "";
    list.forEach((b) => grid.appendChild(activeView === "list" ? bookRow(b) : bookCard(b)));
    if (empty) empty.hidden = list.length > 0;
  }

  function bookRow(book) {
    const el = document.createElement("article");
    el.className = "book-row reveal in";
    el.dataset.key = book.key;
    const cover = UserBooks.coverUrl(book.cover, "S");
    const authors = book.authors.map((a) => esc(a.name)).join(", ") || "Unknown author";
    el.innerHTML = `
      <span class="book-row-thumb${cover ? "" : " ph"}">
        ${cover ? `<img src="${cover}" alt="" loading="lazy" decoding="async">` : ""}
      </span>
      <span class="book-row-main">
        <b class="book-row-title">${esc(book.title)}</b>
        <span class="book-row-sub">${authors}${book.year ? ` · ${book.year}` : ""}</span>
      </span>
      <span class="book-row-shelf">${UserBooks.SHELF_LABEL[book.shelf]}</span>
      ${starRow(book)}
      <button type="button" class="uni-remove book-row-remove" title="Remove ${esc(book.title)}" aria-label="Remove ${esc(book.title)}">✕</button>`;

    el.querySelector(".book-row-remove").addEventListener("click", (e) => {
      e.stopPropagation();
      UserBooks.remove(book.key);
      if (typeof toast === "function") toast(`Removed ${book.title}`);
      paintStats();
      paintGrid();
      paintGroups();
    });
    el.querySelectorAll("[data-star]").forEach((btn) =>
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const n = Number(btn.dataset.star);
        UserBooks.setRating(book.key, book.myRating === n ? 0 : n);
        paintGrid();
      }),
    );
    el.addEventListener("click", () => openDetail(book));
    return el;
  }

  /* ---------- authors / categories ---------- */

  const authorGrid = document.getElementById("authorGrid");
  const categoryGrid = document.getElementById("categoryGrid");

  function groupCard(name, count, onClick) {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "book-group-card";
    el.innerHTML = `<b>${esc(name)}</b><span>${count} book${count === 1 ? "" : "s"}</span>`;
    el.addEventListener("click", onClick);
    return el;
  }

  function paintGroups() {
    if (authorGrid) {
      const authors = UserBooks.byAuthor();
      authorGrid.innerHTML = "";
      authors.slice(0, 24).forEach((a) =>
        authorGrid.appendChild(
          groupCard(a.name, a.books.length, () => {
            activeAuthor = activeAuthor === (a.key || a.name) ? null : a.key || a.name;
            activeCategory = null;
            activeShelf = "all";
            shelfChips.forEach((x) => x.classList.toggle("active", x.dataset.shelf === "all"));
            paintGrid();
            grid.scrollIntoView({ behavior: "smooth", block: "start" });
          }),
        ),
      );
      const authorEmpty = document.getElementById("authorEmpty");
      if (authorEmpty) authorEmpty.hidden = authors.length > 0;
    }

    if (categoryGrid) {
      const cats = UserBooks.byCategory();
      categoryGrid.innerHTML = "";
      cats.slice(0, 24).forEach((c) =>
        categoryGrid.appendChild(
          groupCard(c.name, c.books.length, () => {
            activeCategory = activeCategory === c.name ? null : c.name;
            activeAuthor = null;
            activeShelf = "all";
            shelfChips.forEach((x) => x.classList.toggle("active", x.dataset.shelf === "all"));
            paintGrid();
            grid.scrollIntoView({ behavior: "smooth", block: "start" });
          }),
        ),
      );
      const catEmpty = document.getElementById("categoryEmpty");
      if (catEmpty) catEmpty.hidden = cats.length > 0;
    }
  }

  /* ---------- detail sheet ---------- */

  const sheetBackdrop = document.createElement("div");
  sheetBackdrop.className = "rnd-backdrop";
  sheetBackdrop.hidden = true;
  const sheet = document.createElement("aside");
  sheet.className = "rnd-modal book-sheet";
  sheet.hidden = true;
  document.body.append(sheetBackdrop, sheet);

  function closeSheet() {
    sheetBackdrop.classList.remove("show");
    sheet.classList.remove("show");
    setTimeout(() => (sheetBackdrop.hidden = sheet.hidden = true), 220);
  }
  sheetBackdrop.addEventListener("click", closeSheet);

  async function openDetail(book) {
    sheet.className = "rnd-modal book-sheet";
    const cover = UserBooks.coverUrl(book.cover, "L");
    sheet.innerHTML = `
      <div class="rnd-head">
        <h3>${esc(book.title)}</h3>
        <button class="rnd-close" aria-label="Close">✕</button>
      </div>
      <div class="rnd-card">
        <div class="rnd-poster${cover ? "" : " ph"}">
          ${cover ? `<img src="${cover}" alt="">` : `<span class="ph-init">${esc(book.title[0] || "?")}</span>`}
        </div>
        <div class="rnd-info">
          <p class="rnd-sub">${book.authors.map((a) => esc(a.name)).join(", ") || "Unknown author"}${book.year ? ` · ${book.year}` : ""}${book.pages ? ` · ${book.pages} pages` : ""}</p>
          ${book.olRating ? `<p class="rnd-note">Open Library rating: ${book.olRating.toFixed(1)} / 5</p>` : ""}
          <div class="rnd-badges">
            ${(book.subjects || []).slice(0, 6).map((s) => `<span class="badge plain">${esc(s)}</span>`).join("")}
          </div>
          <p class="rnd-note" id="bookDesc">Loading description…</p>
        </div>
      </div>`;
    sheet.querySelector(".rnd-close").addEventListener("click", closeSheet);
    sheetBackdrop.hidden = sheet.hidden = false;
    requestAnimationFrame(() => {
      sheetBackdrop.classList.add("show");
      sheet.classList.add("show");
    });

    try {
      const r = await fetch(`https://openlibrary.org/works/${book.key}.json`);
      if (r.ok) {
        const w = await r.json();
        const desc = typeof w.description === "string" ? w.description : w.description?.value;
        const el = sheet.querySelector("#bookDesc");
        if (el) el.textContent = desc || "No description available for this book.";
      }
    } catch (e) {
      const el = sheet.querySelector("#bookDesc");
      if (el) el.textContent = "Could not load a description right now.";
    }
  }

  /* ---------- collections (curated, built-in) ---------- */

  const collectionGrid = document.getElementById("collectionGrid");

  function paintCollections() {
    if (!collectionGrid) return;
    const all = window.BOOK_COLLECTIONS || {};
    collectionGrid.innerHTML = "";
    Object.entries(all).forEach(([id, col]) => {
      const cover = col.books.find((b) => b.cover);
      const el = document.createElement("button");
      el.type = "button";
      el.className = "uni-card reveal in";
      el.innerHTML = `
        <div class="uni-cover">
          ${cover ? `<img src="${UserBooks.coverUrl(cover.cover, "M")}" alt="" loading="lazy" decoding="async">` : ""}
        </div>
        <div class="uni-content">
          <h3>${esc(col.name)}</h3>
          <p class="uni-tagline">${esc(col.tagline || "")}</p>
          <div class="uni-foot-row">
            <span><b>${col.books.length}</b> books</span>
            <span class="uni-arrow">→</span>
          </div>
        </div>`;
      el.addEventListener("click", () => openCollection(id, col));
      collectionGrid.appendChild(el);
    });
  }

  function openCollection(id, col) {
    sheet.className = "rnd-modal book-sheet collection-sheet";
    sheet.innerHTML = `
      <div class="rnd-head">
        <h3>${esc(col.name)}</h3>
        <button class="rnd-close" aria-label="Close">✕</button>
      </div>
      <p class="add-hint">${esc(col.tagline || "")}${col.author ? ` · ${esc(col.author)}` : ""}</p>
      <div class="collection-list" id="collectionList"></div>`;
    sheet.querySelector(".rnd-close").addEventListener("click", closeSheet);

    const list = sheet.querySelector("#collectionList");
    col.books.forEach((b) => {
      const owned = b.key && UserBooks.has(b.key);
      const cover = UserBooks.coverUrl(b.cover, "S");
      const row = document.createElement("div");
      row.className = "wl-sugg collection-row";
      row.innerHTML = `
        <span class="wl-sugg-thumb${cover ? "" : " ph"}">
          ${cover ? `<img src="${cover}" alt="" loading="lazy">` : ""}
        </span>
        <span class="wl-sugg-main">
          <b class="wl-sugg-title">${esc(b.title)}</b>
          <span class="wl-sugg-sub">${esc(b.author || "")}${b.year ? ` · ${b.year}` : ""}</span>
        </span>
        <button class="btn sm" data-add-collection ${owned || !b.key ? "disabled" : ""}>
          ${!b.key ? "Unavailable" : owned ? "Added" : "+ Add"}
        </button>`;
      row.querySelector("[data-add-collection]").addEventListener("click", () => {
        if (!b.key) return;
        UserBooks.add(
          { key: `/works/${b.key}`, title: b.title, author_name: b.author ? [b.author] : [], cover_i: b.cover, first_publish_year: b.year, subject: [col.name] },
          "want",
        );
        if (typeof toast === "function") toast(`Added ${b.title}`);
        const btn = row.querySelector("[data-add-collection]");
        btn.disabled = true;
        btn.textContent = "Added";
        paintStats();
        paintGrid();
        paintGroups();
      });
      list.appendChild(row);
    });

    sheetBackdrop.hidden = sheet.hidden = false;
    requestAnimationFrame(() => {
      sheetBackdrop.classList.add("show");
      sheet.classList.add("show");
    });
  }

  paintStats();
  paintGrid();
  paintGroups();
  paintCollections();
})();
