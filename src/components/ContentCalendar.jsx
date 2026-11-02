import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { addDays, fmtTime, isSameDay, monthGrid, startOfWeek } from '../utils/date.js';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STATUS_STRIPE = {
  Draft:     { bg: 'rgba(100,116,139,0.15)', border: 'rgba(100,116,139,0.3)', dot: '#64748b', text: '#94a3b8' },
  Scheduled: { bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.35)', dot: '#f59e0b', text: '#fbbf24' },
  Published: { bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.35)', dot: '#10b981', text: '#34d399' },
};

export default function ContentCalendar({ posts, onOpen, onCreate }) {
  const [mode, setMode]     = useState('month');
  const [cursor, setCursor] = useState(() => new Date());
  const today               = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);

  const days = useMemo(() =>
    mode === 'month'
      ? monthGrid(cursor.getFullYear(), cursor.getMonth())
      : Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(cursor), i)),
    [mode, cursor],
  );
  const dated = useMemo(() => posts.filter((p) => p.date), [posts]);

  const move = (dir) =>
    setCursor((c) =>
      mode === 'month'
        ? new Date(c.getFullYear(), c.getMonth() + dir, 1)
        : addDays(c, dir * 7),
    );

  const title = mode === 'month'
    ? cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : `${days[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${days[6].toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;

  /** Classify a day for visual styling */
  const classify = (d) => {
    const norm = new Date(d); norm.setHours(0,0,0,0);
    if (norm < today) return 'past';
    if (norm.getTime() === today.getTime()) return 'today';
    return 'future';
  };

  return (
    <div className="card p-4">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button className="btn-outline !p-2" onClick={() => move(-1)} aria-label="Previous"><ChevronLeft size={15} /></button>
          <button className="btn-outline !p-2" onClick={() => move(1)}  aria-label="Next"><ChevronRight size={15} /></button>
          <button className="btn-outline !px-3 !py-1.5 text-xs" onClick={() => setCursor(new Date())}>Today</button>
          <h2 className="ml-1 text-base font-semibold" style={{ color: '#f1f5f9' }}>{title}</h2>
        </div>

        <div className="flex items-center gap-4">
          {/* Legend */}
          <div className="hidden items-center gap-4 text-xs sm:flex" style={{ color: '#475569' }}>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full opacity-40" style={{ background: '#94a3b8' }} />Past
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: '#10b981', boxShadow: '0 0 6px rgba(16,185,129,0.6)' }} />Today
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: '#f59e0b' }} />Scheduled
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: '#10b981' }} />Published
            </span>
          </div>

          {/* Month / Week toggle */}
          <div
            className="inline-flex rounded-xl p-0.5 gap-0.5"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            role="tablist"
          >
            {['month', 'week'].map((m) => (
              <button
                key={m}
                role="tab"
                aria-selected={mode === m}
                onClick={() => setMode(m)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium capitalize"
                style={{
                  background: mode === m ? 'rgba(16,185,129,0.15)' : 'transparent',
                  color:      mode === m ? '#34d399'                : '#475569',
                  border:     mode === m ? '1px solid rgba(16,185,129,0.25)' : '1px solid transparent',
                  transition: 'all 0.2s ease',
                }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Day-of-week headers */}
          <div
            className="grid grid-cols-7 pb-2 text-xs font-medium"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#475569' }}
          >
            {DAYS.map((d) => <div key={d} className="px-2 py-1">{d}</div>)}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {days.map((d, idx) => {
              const kind    = classify(d);
              const outside = mode === 'month' && d.getMonth() !== cursor.getMonth();
              const items   = dated
                .filter((p) => isSameDay(new Date(p.date), d))
                .sort((a, b) => new Date(a.date) - new Date(b.date));

              /* cell background shading by era */
              const cellStyle = {
                borderRight:  '1px solid rgba(255,255,255,0.04)',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                opacity:      outside ? 0.22 : 1,
                position:     'relative',
                ...(kind === 'past'  && { background: 'rgba(0,0,0,0.18)' }),
                ...(kind === 'today' && { background: 'rgba(16,185,129,0.04)', boxShadow: 'inset 0 0 0 1px rgba(16,185,129,0.22)' }),
                ...(kind === 'future' && { background: 'transparent' }),
              };

              return (
                <div
                  key={d.toISOString()}
                  style={{ '--i': (idx % 7) + Math.floor(idx / 7), ...cellStyle }}
                  className={`enter enter-fast group ${mode === 'month' ? 'min-h-[108px]' : 'min-h-[300px]'} p-1.5`}
                >
                  {/* Date number */}
                  <div className="mb-1.5 flex items-center justify-between">
                    <span
                      className="grid h-6 min-w-[24px] place-items-center rounded-full px-1 text-xs font-medium"
                      style={
                        kind === 'today'
                          ? { background: '#10b981', color: '#000', fontWeight: 700, boxShadow: '0 0 10px rgba(16,185,129,0.5)' }
                          : kind === 'past'
                          ? { color: '#374151' }
                          : { color: '#64748b' }
                      }
                    >
                      {d.getDate()}
                    </span>

                    {/* "Can schedule" indicator on future cells */}
                    {kind === 'future' && !outside && (
                      <button
                        className="btn-ghost !p-1 opacity-0 focus:opacity-100 group-hover:opacity-100"
                        onClick={() => onCreate(d)}
                        aria-label={`New post on ${d.toDateString()}`}
                        style={{ transition: 'opacity 0.2s ease' }}
                      >
                        <Plus size={12} color="#10b981" />
                      </button>
                    )}
                    {kind === 'today' && (
                      <button
                        className="btn-ghost !p-1 opacity-0 focus:opacity-100 group-hover:opacity-100"
                        onClick={() => onCreate(d)}
                        aria-label={`New post on ${d.toDateString()}`}
                      >
                        <Plus size={12} color="#10b981" />
                      </button>
                    )}
                  </div>

                  {/* "Past" strikethrough overlay label */}
                  {kind === 'past' && !outside && !items.length && (
                    <div
                      className="absolute inset-x-0 bottom-1 flex justify-center text-[9px] uppercase tracking-widest font-medium select-none pointer-events-none"
                      style={{ color: '#1f2937' }}
                    >
                      past
                    </div>
                  )}

                  {/* Post chips */}
                  <div className="space-y-1">
                    {items.slice(0, mode === 'month' ? 3 : 20).map((p) => {
                      const s = STATUS_STRIPE[p.status] || STATUS_STRIPE.Draft;
                      return (
                        <button
                          key={p.id}
                          onClick={() => onOpen(p)}
                          title={p.title}
                          className="flex w-full items-center gap-1.5 rounded-lg px-1.5 py-1 text-left text-xs"
                          style={{
                            background:  s.bg,
                            border:      `1px solid ${s.border}`,
                            color:       s.text,
                            transition:  'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.15)'; e.currentTarget.style.transform = 'translateX(2px)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.filter = ''; e.currentTarget.style.transform = ''; }}
                        >
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: s.dot }} />
                          <span className="truncate">
                            {mode === 'week' && <span className="mr-1 opacity-60">{fmtTime(p.date)}</span>}
                            {p.title}
                          </span>
                        </button>
                      );
                    })}
                    {mode === 'month' && items.length > 3 && (
                      <p className="px-1 text-[10px]" style={{ color: '#475569' }}>+{items.length - 3} more</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend footer */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs" style={{ color: '#374151', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.04)' }} />
          <span style={{ color: '#374151' }}>Past — read only, cannot schedule</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }} />
          <span style={{ color: '#34d399' }}>Today — schedulable</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded" style={{ border: '1px solid rgba(255,255,255,0.06)' }} />
          <span style={{ color: '#64748b' }}>Future — click + to schedule</span>
        </span>
      </div>
    </div>
  );
}
