import { describe, expect, it } from 'vitest';
import { createSeedPosts } from '../mockData/seed.js';
import { generateMockIdeas } from '../mockData/ideas.js';
import { filterPosts, DEFAULT_FILTERS, allTags } from './postFilters.js';
import { renderMarkdown, chunkText, stripMarkdown } from './markdown.js';
import { monthGrid, isSameDay } from './date.js';

const posts = createSeedPosts(new Date('2026-06-15T12:00:00Z'));

describe('filterPosts', () => {
  it('filters by status, platform and tag', () => {
    expect(filterPosts(posts, { ...DEFAULT_FILTERS, status: 'Published' })).toHaveLength(4);
    expect(filterPosts(posts, { ...DEFAULT_FILTERS, platform: 'Twitter' }).every((p) => p.platform === 'Twitter')).toBe(true);
    expect(filterPosts(posts, { ...DEFAULT_FILTERS, tag: 'abm' })).toHaveLength(1);
  });
  it('searches title, body and tags', () => {
    expect(filterPosts(posts, { ...DEFAULT_FILTERS, q: 'halden' })).toHaveLength(1);
    expect(filterPosts(posts, { ...DEFAULT_FILTERS, q: 'pricing' }).length).toBeGreaterThan(0);
  });
  it('sorts by views desc and title asc', () => {
    const v = filterPosts(posts, { ...DEFAULT_FILTERS, sort: 'views-desc' });
    expect(v[0].metrics.views).toBeGreaterThanOrEqual(v[1].metrics.views);
    const t = filterPosts(posts, { ...DEFAULT_FILTERS, sort: 'title-asc' });
    expect(t[0].title.localeCompare(t[1].title)).toBeLessThanOrEqual(0);
  });
  it('collects unique sorted tags', () => { const t = allTags(posts); expect(t).toEqual([...new Set(t)].sort()); });
});

describe('markdown', () => {
  it('escapes HTML and renders basics', () => {
    const h = renderMarkdown('# Hi\n**b** <script>alert(1)</script>\n- one\n- two');
    expect(h).not.toContain('<script>'); expect(h).toContain('<strong>b</strong>'); expect(h).toContain('<li>two</li>');
  });
  it('only links http(s)', () => expect(renderMarkdown('[x](javascript:alert(1))')).not.toContain('<a '));
  it('chunks long text under the limit and strips markdown', () => {
    const c = chunkText('word '.repeat(200), 280); expect(c.length).toBeGreaterThan(1); expect(c.every((x) => x.length <= 280)).toBe(true);
    expect(stripMarkdown('**a** [b](https://c.d)')).toBe('a b');
  });
});

describe('calendar + ideas', () => {
  it('builds a 42-day grid starting on Sunday', () => {
    const g = monthGrid(2026, 5); expect(g).toHaveLength(42); expect(g[0].getDay()).toBe(0);
    expect(g.some((d) => isSameDay(d, new Date(2026, 5, 15)))).toBe(true);
  });
  it('mock ideas are multi-angle and topic-aware', () => {
    const i = generateMockIdeas({ topic: 'SEO', platform: 'Blog' });
    expect(new Set(i.map((x) => x.angle)).size).toBe(5); expect(i.every((x) => x.hook.includes('SEO'))).toBe(true);
  });
});
