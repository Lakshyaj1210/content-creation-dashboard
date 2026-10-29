import { CalendarClock, Eye, FileEdit, TrendingUp } from 'lucide-react';
import { compact, engagementRate } from '../utils/postFilters.js';
import { fmtDateTime } from '../utils/date.js';
import { PlatformBadge } from './ui.jsx';

export default function Overview({ posts, onOpen, go }) {
  const pub = posts.filter((p) => p.status === 'Published');
  const views = pub.reduce((s, p) => s + p.metrics.views, 0);
  const eng = pub.reduce((s, p) => s + p.metrics.engagement, 0);
  const next = posts
    .filter((p) => p.status === 'Scheduled')
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const drafts = posts.filter((p) => p.status === 'Draft');
  const top = [...pub].sort((a, b) => engagementRate(b) - engagementRate(a)).slice(0, 3);
  const stats = [
    [Eye, 'Total views', compact(views), `${pub.length} published posts`, 'published'],
    [
      TrendingUp,
      'Avg. engagement rate',
      `${views ? ((eng / views) * 100).toFixed(1) : '0.0'}%`,
      `${compact(eng)} interactions`,
      'published',
    ],
    [
      CalendarClock,
      'Scheduled',
      next.length,
      next[0] ? `Next: ${fmtDateTime(next[0].date)}` : 'Nothing queued',
      'queue',
    ],
    [
      FileEdit,
      'In draft',
      drafts.length,
      `${drafts.filter((d) => d.needsApproval).length} awaiting approval`,
      'queue',
    ],
  ];
  const List = ({ title, items, empty, extra }) => (
    <section className="card p-4">
      <h3 className="mb-2 font-semibold">{title}</h3>
      {!items.length && <p className="py-6 text-center text-sm text-slate-500">{empty}</p>}
      <ul className="divide-y divide-slate-200/60 dark:divide-white/10">
        {items.map((p) => (
          <li key={p.id}>
            <button
              onClick={() => onOpen(p)}
              className="flex w-full items-center justify-between gap-3 py-2.5 text-left hover:text-indigo-600 dark:hover:text-indigo-300"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{p.title}</span>
                <span className="text-xs text-slate-500">{extra(p)}</span>
              </span>
              <PlatformBadge platform={p.platform} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([I, l, v, s, to]) => (
          <button
            key={l}
            onClick={() => go(to)}
            className="card p-4 text-left transition-colors hover:!border-indigo-400/60"
          >
            <div className="flex items-center justify-between text-sm text-slate-500">
              {l}
              <I size={16} />
            </div>
            <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight">{v}</p>
            <p className="mt-1 text-xs text-slate-500">{s}</p>
          </button>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <List
          title="Coming up"
          items={next.slice(0, 4)}
          empty="No scheduled posts. Create one or approve a draft."
          extra={(p) => fmtDateTime(p.date)}
        />
        <List
          title="Best engagement rate"
          items={top}
          empty="Publish a post to see results."
          extra={(p) => `${engagementRate(p).toFixed(1)}% · ${compact(p.metrics.views)} views`}
        />
      </div>
    </div>
  );
}
