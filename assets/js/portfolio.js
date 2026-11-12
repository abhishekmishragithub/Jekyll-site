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
  let timers = [];
  let frame = 0;
  const poses = [
    ["Brew with me ↓", "An illustrated coffee break."],
    ["Finish the press →", "A little patience for the press."],
    ["Pick up the cup →", "Coffee’s ready. Time for a sip."],
    ["Another cup? ↻", "That’s better. Enjoy your cup."],
  ];
  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }
  function showFrame(next) {
    frame = next;
    coffee.dataset.frame = String(frame);
  }
  function showStill(next) {
    showFrame(next);
    coffee.dataset.state = frame === 3 ? "done" : frame === 0 ? "ready" : "stepping";
    button.disabled = false;
    [button.textContent, status.textContent] = poses[frame];
  }
  function finish() {
    clearTimers();
    showStill(3);
  }
  showStill(0);
  button.hidden = false;
  button.addEventListener("click", () => {
    if (coffee.dataset.state === "brewing") return;
    clearTimers();
    if (motion.matches) {
      // No automatic movement: every activation selects a different still.
      // In particular, replay returns to the first pose instead of the same cup.
      showStill((frame + 1) % poses.length);
      return;
    }
    showFrame(0);
    coffee.dataset.state = "brewing";
    button.disabled = true;
    button.textContent = "Easy does it…";
    status.textContent = "A little patience for the press.";
    timers = [
      setTimeout(() => showFrame(1), 1456),
      setTimeout(() => showFrame(2), 3224),
      setTimeout(finish, 5200),
    ];
  });
  motion.addEventListener("change", () => {
    if (motion.matches && coffee.dataset.state === "brewing") {
      clearTimers();
      showStill(frame);
    }
  });
}
