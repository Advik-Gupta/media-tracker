(() => {
  const holder = document.getElementById("mapHolder");
  if (!holder) return;

  const listed = Object.entries(COUNTRIES).filter(([, c]) => c.list);
  const liveCodes = listed.map(([code]) => code);

  const listEl = document.getElementById("countryList");
  const entries = Object.entries(COUNTRIES).sort((a, b) =>
    a[1].name.localeCompare(b[1].name),
  );
  listEl.innerHTML = entries
    .map(
      ([code, c]) => `
    <li class="ctry-item${c.list ? "" : " off"}">
      ${
        c.list
          ? `<a href="${pagePath('list', c.list)}"><b>${c.name}</b>${c.note ? `<small>${c.note}</small>` : ""}</a>`
          : `<span><b>${c.name}</b><small>No list yet</small></span>`
      }
    </li>`,
    )
    .join("");
  const count = document.getElementById("ctryCount");
  if (count)
    count.textContent = `${listed.length} of ${entries.length} have a list`;

  function progressFor(id) {
    const cat = window.CATALOGUES && window.CATALOGUES[id];
    if (!cat) return null;
    const items =
      typeof resolvedItems === "function" ? resolvedItems(cat) : cat.items;
    const done = items.filter((it) => Store.has(...progressRef(id, it))).length;
    return { done, total: items.length };
  }

  let map = null;

  function paint() {
    if (!map) return;
    document.querySelectorAll("#worldMap path[data-code]").forEach((p) => {
      const c = COUNTRIES[p.dataset.code];
      const live = !!(c && c.list);
      p.classList.toggle("has-list", live);
      p.style.cursor = live ? "pointer" : "default";
    });
  }

  const css = getComputedStyle(document.documentElement);
  const tone = (n, fb) => (css.getPropertyValue(n) || fb).trim();
  const LAND = tone("--line", "#2B303D");
  const EDGE = tone("--fog", "#8C90A0");

  function draw() {
    if (typeof jsVectorMap === "undefined") {
      holder.innerHTML =
        '<p class="map-fail">The map library did not load. The country list below still works.</p>';
      return;
    }
    holder.innerHTML = '<div id="worldMap" class="worldmap"></div>';

    map = new jsVectorMap({
      selector: "#worldMap",
      map: "world",
      backgroundColor: "transparent",
      zoomButtons: true,
      zoomOnScroll: false,
      zoomMax: 6,
      draggable: true,
      regionStyle: {
        initial: {
          fill: LAND,
          stroke: EDGE,
          strokeWidth: 0.4,
          fillOpacity: 1,
          strokeOpacity: 0.35,
        },
        hover: { fillOpacity: 0.75 },
      },
      regionsSelectable: false,
      onRegionTooltipShow(event, tooltip, code) {
        const c = COUNTRIES[code];
        if (!c) {
          event.preventDefault();
          return;
        }
        const p = c.list ? progressFor(c.list) : null;
        tooltip.text(
          `<div class="map-tip${c.list ? " has-list" : ""}">
             <b>${c.name}</b>
             ${c.note ? `<span>${c.note}</span>` : ""}
             ${p ? `<span class="tip-data">${p.done} / ${p.total} watched</span>` : ""}
             <em>${c.list ? "Click to open" : "No list yet"}</em>
           </div>`,
          true,
        );
      },
      onRegionClick(event, code) {
        const c = COUNTRIES[code];
        if (c && c.list) location.href = pagePath("list", c.list);
      },
    });

    paint();
    resize();
  }

  function resize() {
    if (!map) return;
    try {
      map.updateSize();
    } catch (e) {}
    paint();
  }

  if (document.readyState === "complete") draw();
  else window.addEventListener("load", draw, { once: true });

  window.addEventListener("resize", resize);
  window.addEventListener("load", () => {
    resize();
    setTimeout(resize, 250);
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(resize);
})();
