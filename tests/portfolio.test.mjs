import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalize, matchesItem, readFilters, remainingSeconds, formatTime } from '../assets/js/portfolio-core.mjs';
const work = JSON.parse(readFileSync(new URL('../_data/work.json', import.meta.url)));
test('every curated entry has a unique identity and a secure, real destination', () => {
  assert.equal(new Set(work.map(item => item.id)).size, work.length);
  const kinds = ['project', 'writing', 'event', 'community', 'social'];
  for (const item of work) {
    assert.ok(item.title && item.description && item.context && item.source);
    assert.ok(kinds.includes(item.kind));
    assert.equal(new URL(item.url, 'https://abhishekmishra.dev').protocol, 'https:');
  }
});
test('index combines category with case-insensitive AND search terms', () => {
  const item = { kind: 'writing', text: 'Python: real-time voice AI on DEV' };
  assert.equal(matchesItem(item, 'writing', 'PYTHON voice'), true);
  assert.equal(matchesItem(item, 'project', 'python'), false);
  assert.equal(matchesItem(item, 'all', 'python missing'), false);
  assert.equal(matchesItem(item, 'all', '   '), true);
  assert.equal(normalize(' Résumé '), 'resume');
});
test('deep links retain queries, with invalid categories falling back to everything', () => {
  assert.deepEqual(readFilters('?type=social&q=hackathon'), { kind: 'social', query: 'hackathon' });
  assert.deepEqual(readFilters('?type=invalid&q=%3Cscript%3E'), { kind: 'all', query: '<script>' });
  assert.deepEqual(readFilters(''), { kind: 'all', query: '' });
});
test('real content filters show distinct project, social, and empty-result sets', () => {
  const find = (kind, query) => work.filter(item => matchesItem({kind:item.kind, text:`${item.title} ${item.description} ${item.context} ${item.source}`},kind,query));
  assert.equal(find('project', 'cliplinks').length, 1);
  assert.equal(find('social', 'hackathon').length, 2);
  assert.equal(find('writing', 'not-a-real-term').length, 0);
  assert.equal(find('all', '').length, work.length);
});
test('coffee timer uses wall-clock time after delayed/background ticks and never goes negative', () => {
  assert.equal(remainingSeconds(121000, 1000), 120);
  assert.equal(remainingSeconds(121000, 61500), 60);
  assert.equal(remainingSeconds(121000, 122000), 0);
  assert.equal(formatTime(120), '02:00');
  assert.equal(formatTime(59), '00:59');
  assert.equal(formatTime(0), '00:00');
  assert.equal(formatTime(-2), '00:00');
});
