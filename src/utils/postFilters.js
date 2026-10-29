export const DEFAULT_FILTERS = { q: '', status: 'All', platform: 'All', tag: 'All', sort: 'date-desc' };
export const SORTS = [
  ['date-desc', 'Newest first'], ['date-asc', 'Oldest first'], ['views-desc', 'Most views'],
  ['engagement-desc', 'Most engagement'], ['title-asc', 'Title A–Z'],
];
const ts = (p) => (p.date ? new Date(p.date).getTime() : 0);

export function filterPosts(posts, f = DEFAULT_FILTERS) {
  const q = f.q.trim().toLowerCase();
  const out = posts.filter((p) =>
    (f.status === 'All' || p.status === f.status) &&
    (f.platform === 'All' || p.platform === f.platform) &&
    (f.tag === 'All' || p.tags.includes(f.tag)) &&
    (!q || [p.title, p.body, p.platform, ...p.tags].join(' ').toLowerCase().includes(q)));
  const by = {
    'date-desc': (a, b) => ts(b) - ts(a), 'date-asc': (a, b) => ts(a) - ts(b),
    'views-desc': (a, b) => b.metrics.views - a.metrics.views,
    'engagement-desc': (a, b) => b.metrics.engagement - a.metrics.engagement,
    'title-asc': (a, b) => a.title.localeCompare(b.title),
  };
  return out.sort(by[f.sort] || by['date-desc']);
}
export const allTags = (posts) => [...new Set(posts.flatMap((p) => p.tags))].sort();
export const engagementRate = (p) => (p.metrics.views ? (p.metrics.engagement / p.metrics.views) * 100 : 0);
export const compact = (n) => new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(n);
