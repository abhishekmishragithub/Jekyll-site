import { matchesItem, readFilters, remainingSeconds, formatTime } from './portfolio-core.mjs';

const search = document.querySelector('#index-search');
if (search) {
  const rows = [...document.querySelectorAll('.index-row')];
  const buttons = [...document.querySelectorAll('[data-filter]')];
  const empty = document.querySelector('#index-empty');
  const count = document.querySelector('#index-count');
  let { kind, query } = readFilters(location.search);
  search.value = query;
  function render(updateURL = false) {
    let visible = 0;
    for (const row of rows) {
      row.hidden = !matchesItem({ kind: row.dataset.kind, text: row.dataset.search }, kind, search.value);
      if (!row.hidden) visible++;
    }
    for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.filter === kind));
    count.textContent = `${visible} ${visible === 1 ? 'thing' : 'things'} in the collection`;
    empty.hidden = visible !== 0;
    if (updateURL) {
      const url = new URL(location.href);
      kind === 'all' ? url.searchParams.delete('type') : url.searchParams.set('type', kind);
      search.value.trim() ? url.searchParams.set('q', search.value.trim()) : url.searchParams.delete('q');
      history.replaceState(null, '', url);
    }
  }
  for (const button of buttons) button.addEventListener('click', () => { kind = button.dataset.filter; render(true); });
  search.addEventListener('input', () => render(true));
  document.querySelector('#index-reset').addEventListener('click', () => { kind = 'all'; search.value = ''; render(true); search.focus(); });
  window.addEventListener('popstate', () => { const state = readFilters(location.search); kind = state.kind; search.value = state.query; render(); });
  document.querySelector('#index-tools').hidden = false;
  render();
}

const rebuild = document.querySelector('#bricks-play');
if (rebuild) {
  let arrangement = 0;
  rebuild.hidden = false;
  rebuild.addEventListener('click', () => {
    arrangement = (arrangement + 1) % 3;
    document.querySelector('.desk').dataset.arrangement = String(arrangement);
    document.querySelector('#brick-status').textContent = ['Back to the original stack.', 'A little room to experiment.', 'Another way to put the pieces together.'][arrangement];
  });
}

const dialog = document.querySelector('#brew-dialog');
if (dialog && typeof dialog.showModal === 'function') {
  const open = document.querySelector('#brew-open');
  const toggle = document.querySelector('#brew-toggle');
  const output = document.querySelector('#brew-time');
  const status = document.querySelector('#brew-status');
  let remaining = 120;
  let deadline = null;
  let interval = null;
  function stop() { clearInterval(interval); interval = null; deadline = null; }
  function tick() {
    if (deadline === null) return;
    remaining = remainingSeconds(deadline, Date.now());
    output.textContent = formatTime(remaining);
    if (remaining === 0) {
      stop();
      toggle.textContent = 'Start again';
      status.textContent = 'Two minutes, just for you. Enjoy your pause.';
    }
  }
  function pause() {
    if (deadline === null) return;
    tick();
    if (remaining > 0) { stop(); toggle.textContent = 'Resume'; status.textContent = 'Paused. Take your time.'; }
  }
  open.hidden = false;
  open.addEventListener('click', () => dialog.showModal());
  document.querySelector('.close-dialog').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { pause(); open.focus(); });
  toggle.addEventListener('click', () => {
    if (deadline !== null) { pause(); return; }
    if (remaining === 0) remaining = 120;
    deadline = Date.now() + remaining * 1000;
    toggle.textContent = 'Pause';
    status.textContent = 'Breathe. Let it brew.';
    tick();
    interval = setInterval(tick, 250);
  });
  document.querySelector('#brew-reset').addEventListener('click', () => {
    stop(); remaining = 120; output.textContent = '02:00'; toggle.textContent = 'Start timer'; status.textContent = 'Ready when you are.';
  });
  document.addEventListener('visibilitychange', tick);
}
