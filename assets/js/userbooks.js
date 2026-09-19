/* Your personal reading list - shelves, categories, authors - kept in
   this browser (or synced via an account), the same way the shows and
   anime vaults are. Nothing here is shared or baked into the site. */

const UserBooks = (() => {
  const KEY = "mediavault.mybooks";
  const SHELVES = ["want", "reading", "read"];
  const SHELF_LABEL = { want: "Want to read", reading: "Reading", read: "Read" };
  const COVER = "https://covers.openlibrary.org/b";

  const read = () => {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  };
  const write = (list) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(list));
      if (typeof Store !== "undefined") Store.touch();
      return true;
    } catch {
      return false;
    }
  };

  const coverUrl = (coverId, size) =>
    coverId ? `${COVER}/id/${coverId}-${size || "M"}.jpg` : "";

  return {
    SHELVES,
    SHELF_LABEL,
    coverUrl,

    list() {
      return read();
    },

    byShelf(shelf) {
      return read().filter((b) => !shelf || shelf === "all" || b.shelf === shelf);
    },

    has(key) {
      return read().some((b) => b.key === key);
    },

    get(key) {
      return read().find((b) => b.key === key) || null;
    },

    /** `hit` is one OpenLibrary search doc. */
    add(hit, shelf) {
      const list = read();
      const key = String(hit.key || "").replace(/^\/works\//, "");
      if (!key || list.some((b) => b.key === key)) return false;
      list.unshift({
        key,
        title: hit.title || "Untitled",
        authors: (hit.author_name || []).map((name, i) => ({
          name,
          key: (hit.author_key || [])[i] || null,
        })),
        cover: hit.cover_i || null,
        year: hit.first_publish_year || null,
        subjects: (hit.subject || []).slice(0, 8),
        pages: hit.number_of_pages_median || null,
        olRating: typeof hit.ratings_average === "number" ? hit.ratings_average : null,
        shelf: SHELVES.includes(shelf) ? shelf : "want",
        myRating: 0,
        addedAt: Date.now(),
      });
      return write(list);
    },

    remove(key) {
      return write(read().filter((b) => b.key !== key));
    },

    setShelf(key, shelf) {
      if (!SHELVES.includes(shelf)) return false;
      const list = read();
      const b = list.find((x) => x.key === key);
      if (!b) return false;
      b.shelf = shelf;
      if (shelf === "read" && !b.finishedAt) b.finishedAt = Date.now();
      return write(list);
    },

    setRating(key, stars) {
      const list = read();
      const b = list.find((x) => x.key === key);
      if (!b) return false;
      b.myRating = Math.max(0, Math.min(5, Number(stars) || 0));
      return write(list);
    },

    /** Authors, grouped from what you've actually added, most books first. */
    byAuthor() {
      const map = new Map();
      read().forEach((b) => {
        (b.authors.length ? b.authors : [{ name: "Unknown", key: null }]).forEach((a) => {
          const k = a.key || a.name;
          if (!map.has(k)) map.set(k, { name: a.name, key: a.key, books: [] });
          map.get(k).books.push(b);
        });
      });
      return [...map.values()].sort((a, b) => b.books.length - a.books.length);
    },

    /** Subjects, grouped the same way. */
    byCategory() {
      const map = new Map();
      read().forEach((b) => {
        (b.subjects.length ? b.subjects : ["Uncategorized"]).forEach((s) => {
          if (!map.has(s)) map.set(s, []);
          map.get(s).push(b);
        });
      });
      return [...map.entries()]
        .map(([name, books]) => ({ name, books }))
        .sort((a, b) => b.books.length - a.books.length);
    },

    stats() {
      const all = read();
      const by = (s) => all.filter((b) => b.shelf === s).length;
      const pages = all
        .filter((b) => b.shelf === "read")
        .reduce((sum, b) => sum + (b.pages || 0), 0);
      return {
        total: all.length,
        want: by("want"),
        reading: by("reading"),
        read: by("read"),
        pages,
      };
    },
  };
})();
