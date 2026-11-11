export const FILTERS = ['all', 'project', 'writing', 'event', 'community', 'social'];
export function normalize(value) {
  return String(value ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('en').trim();
}
export function matchesItem(item, kind, query) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  return (kind === 'all' || item.kind === kind) && words.every(word => normalize(item.text).includes(word));
}
export function readFilters(search) {
  const params = new URLSearchParams(search);
  return { kind: FILTERS.includes(params.get('type')) ? params.get('type') : 'all', query: params.get('q') || '' };
}
export function remainingSeconds(deadline, now) {
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}
export function formatTime(seconds) {
  const safe = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
}
