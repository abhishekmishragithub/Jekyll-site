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
if (coffee) {
  const button = document.querySelector("#brew-button");
  const status = document.querySelector("#brew-status");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  let timeout;
  function finish() {
    clearTimeout(timeout);
    coffee.dataset.state = "done";
    button.disabled = false;
    button.textContent = "One more? ↻";
    status.textContent = "Coffee’s ready. Enjoy!";
  }
  button.hidden = false;
  button.addEventListener("click", () => {
    if (coffee.dataset.state === "brewing") return;
    coffee.dataset.state = "ready";
    // Commit the reset before replaying the finite CSS animation.
    void coffee.offsetWidth;
    coffee.dataset.state = "brewing";
    button.disabled = true;
    button.textContent = "Brewing…";
    status.textContent = "Pressing your coffee.";
    if (motion.matches) finish();
    else timeout = setTimeout(finish, 5200);
  });
  motion.addEventListener("change", () => {
    if (motion.matches && coffee.dataset.state === "brewing") finish();
  });
}
