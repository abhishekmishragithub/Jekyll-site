import { mountCoffee } from "./coffee-motion.mjs";
import { matchesItem, readFilters } from "./portfolio-core.mjs";

const search = document.querySelector("#index-search");
if (search) {
  const rows = [...document.querySelectorAll(".index-row")];
  const buttons = [...document.querySelectorAll("[data-filter]")];
  const empty = document.querySelector("#index-empty");
  const count = document.querySelector("#index-count");
  let { kind, query } = readFilters(location.search);
  search.value = query;
  function render(updateURL = false) {
    let visible = 0;
    for (const row of rows) {
      row.hidden = !matchesItem(
        { kind: row.dataset.kind, text: row.dataset.search },
        kind,
        search.value,
      );
      if (!row.hidden) visible++;
    }
    for (const button of buttons)
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.filter === kind),
      );
    count.textContent = `${visible} ${visible === 1 ? "thing" : "things"} in the collection`;
    empty.hidden = visible !== 0;
    if (updateURL) {
      const url = new URL(location.href);
      kind === "all"
        ? url.searchParams.delete("type")
        : url.searchParams.set("type", kind);
      search.value.trim()
        ? url.searchParams.set("q", search.value.trim())
        : url.searchParams.delete("q");
      history.replaceState(null, "", url);
    }
  }
  for (const button of buttons)
    button.addEventListener("click", () => {
      kind = button.dataset.filter;
      render(true);
    });
  search.addEventListener("input", () => render(true));
  document.querySelector("#index-reset").addEventListener("click", () => {
    kind = "all";
    search.value = "";
    render(true);
    search.focus();
  });
  window.addEventListener("popstate", () => {
    const state = readFilters(location.search);
    kind = state.kind;
    search.value = state.query;
    render();
  });
  document.querySelector("#index-tools").hidden = false;
  render();
}

const coffee = document.querySelector("#coffee");
if (coffee) mountCoffee(coffee, {
  motion: matchMedia("(prefers-reduced-motion: reduce)"),
  requestFrame: requestAnimationFrame,
  cancelFrame: cancelAnimationFrame,
});
