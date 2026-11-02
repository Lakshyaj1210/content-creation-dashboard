import { CalendarClock, Eye, FileEdit, TrendingUp } from 'lucide-react';
import { compact, engagementRate } from '../utils/postFilters.js';
import { fmtDateTime } from '../utils/date.js';
import { PlatformBadge } from './ui.jsx';
import TiltCard from './TiltCard.jsx';

export default function Overview({ posts, onOpen, go }) {
  const pub    = posts.filter((p) => p.status === 'Published');
  const views  = pub.reduce((s, p) => s + p.metrics.views, 0);
  const eng    = pub.reduce((s, p) => s + p.metrics.engagement, 0);
  const next   = posts.filter((p) => p.status === 'Scheduled').sort((a, b) => new Date(a.date) - new Date(b.date));
  const drafts = posts.filter((p) => p.status === 'Draft');
  const top    = [...pub].sort((a, b) => engagementRate(b) - engagementRate(a)).slice(0, 3);

  const stats = [
    [Eye,         'Total views',         compact(views),   `${pub.length} published posts`,                          'published', '#10b981'],
    [TrendingUp,  'Avg. engagement',     `${views ? ((eng / views) * 100).toFixed(1) : '0.0'}%`, `${compact(eng)} interactions`, 'published', '#34d399'],
    [CalendarClock,'Scheduled',          next.length,      next[0] ? `Next: ${fmtDateTime(next[0].date)}` : 'Nothing queued', 'queue', '#f59e0b'],
    [FileEdit,    'In draft',            drafts.length,    `${drafts.filter((d) => d.needsApproval).length} awaiting approval`, 'queue', '#fbbf24'],
  ];

  const List = ({ title, items, empty, extra, i, accentColor }) => (
    <section className="card enter p-4" style={{ '--i': i }}>
      <h3 className="mb-3 text-sm font-semibold" style={{ color: '#e2e8f0' }}>{title}</h3>
      {!items.length && <p className="py-6 text-center text-sm" style={{ color: '#374151' }}>{empty}</p>}
      <ul>
        {items.map((p) => (
          <li key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <button
              onClick={() => onOpen(p)}
              className="flex w-full items-center justify-between gap-3 py-2.5 text-left"
              style={{ color: '#94a3b8', transition: 'all 0.2s ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = accentColor; e.currentTarget.style.transform = 'translateX(2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.transform = ''; }}
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium" style={{ color: '#e2e8f0' }}>{p.title}</span>
                <span className="text-xs" style={{ color: '#475569' }}>{extra(p)}</span>
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
      {/* Stat cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([I, l, v, s, to, color], idx) => (
          <TiltCard as="button" key={l} i={idx} onClick={() => go(to)} className="card p-5 text-left">
            <div className="flex items-center justify-between text-xs mb-3" style={{ color: '#475569' }}>
              {l}
              <span
                className="grid h-7 w-7 place-items-center rounded-lg"
                style={{ background: `${color}18`, border: `1px solid ${color}30` }}
              >
                <I size={14} style={{ color }} />
              </span>
            </div>
            <p className="text-3xl font-bold tabular-nums tracking-tight" style={{ color: '#f1f5f9' }}>{v}</p>
            <p className="mt-1 text-xs" style={{ color: '#374151' }}>{s}</p>
          </TiltCard>
        ))}
      </div>

      {/* Lists */}
      <div className="grid gap-5 lg:grid-cols-2">
        <List i={4} title="Coming up" accentColor="#f59e0b" items={next.slice(0, 4)} empty="No scheduled posts. Create one or approve a draft." extra={(p) => fmtDateTime(p.date)} />
        <List i={5} title="Best engagement" accentColor="#10b981" items={top} empty="Publish a post to see results." extra={(p) => `${engagementRate(p).toFixed(1)}% · ${compact(p.metrics.views)} views`} />
      </div>
    </div>
  );
}
