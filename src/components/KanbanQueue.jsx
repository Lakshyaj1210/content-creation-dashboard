import { useState } from 'react';
import { CheckCircle2, Clock, Send, ShieldCheck } from 'lucide-react';
import { fmtDateTime, tomorrowAt } from '../utils/date.js';
import { Empty, PlatformBadge } from './ui.jsx';
import TiltCard from './TiltCard.jsx';

const COLUMNS = [
  {
    id: 'drafts', title: 'Drafts', hint: 'Work in progress',
    test: (p) => p.status === 'Draft' && !p.needsApproval,
    patch: () => ({ status: 'Draft', needsApproval: false }),
    accent: 'rgba(100,116,139,0.35)', glow: 'rgba(100,116,139,0.12)',
  },
  {
    id: 'pending', title: 'Pending Approval', hint: 'Waiting on a reviewer',
    test: (p) => p.status === 'Draft' && p.needsApproval,
    patch: () => ({ status: 'Draft', needsApproval: true }),
    accent: 'rgba(245,158,11,0.45)', glow: 'rgba(245,158,11,0.08)',
  },
  {
    id: 'scheduled', title: 'Scheduled', hint: 'Queued to go out',
    test: (p) => p.status === 'Scheduled',
    patch: (p) => ({ status: 'Scheduled', needsApproval: false, date: p.date || tomorrowAt() }),
    accent: 'rgba(16,185,129,0.45)', glow: 'rgba(16,185,129,0.06)',
  },
];

const COL_HEADER = {
  drafts:    { color: '#94a3b8', countBg: 'rgba(100,116,139,0.15)', countBorder: 'rgba(100,116,139,0.3)' },
  pending:   { color: '#fbbf24', countBg: 'rgba(245,158,11,0.12)',  countBorder: 'rgba(245,158,11,0.3)' },
  scheduled: { color: '#34d399', countBg: 'rgba(16,185,129,0.12)',  countBorder: 'rgba(16,185,129,0.3)' },
};

export default function KanbanQueue({ posts, onOpen, onPatch }) {
  const [over, setOver] = useState(null);

  const drop = (col, e) => {
    e.preventDefault(); setOver(null);
    const p = posts.find((x) => x.id === e.dataTransfer.getData('text/plain'));
    if (p && !col.test(p)) onPatch(p.id, col.patch(p), `Moved to ${col.title.toLowerCase()}`);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {COLUMNS.map((col, ci) => {
        const items = posts.filter(col.test).sort((a, b) =>
          (a.date ? +new Date(a.date) : Infinity) - (b.date ? +new Date(b.date) : Infinity),
        );
        const h = COL_HEADER[col.id];
        const isOver = over === col.id;

        return (
          <section
            key={col.id}
            style={{ '--i': ci }}
            onDragOver={(e) => { e.preventDefault(); setOver(col.id); }}
            onDragLeave={() => setOver(null)}
            onDrop={(e) => drop(col, e)}
            className="card enter flex min-h-[280px] flex-col p-3"
            style={{
              '--i': ci,
              borderColor: isOver ? col.accent : 'rgba(255,255,255,0.08)',
              background:  isOver ? col.glow   : 'rgba(16,20,28,0.65)',
              transition:  'all 0.25s ease',
              boxShadow:   isOver ? `0 0 24px ${col.glow}, 0 1px 3px rgba(0,0,0,0.4)` : undefined,
            }}
            aria-label={col.title}
          >
            {/* Column header */}
            <header className="mb-3 flex items-center justify-between px-1">
              <div>
                <h3 className="font-semibold text-sm" style={{ color: h.color }}>{col.title}</h3>
                <p className="text-xs mt-0.5" style={{ color: '#374151' }}>{col.hint}</p>
              </div>
              <span
                className="badge text-xs tabular-nums"
                style={{ background: h.countBg, borderColor: h.countBorder, color: h.color }}
              >
                {items.length}
              </span>
            </header>

            {/* Cards */}
            <div className="flex flex-1 flex-col gap-2">
              {!items.length && <Empty icon={Clock} title="Nothing here" hint="Drag a card in, or create a post." />}
              {items.map((p, idx) => (
                <TiltCard
                  as="article"
                  key={p.id}
                  i={ci * 2 + idx + 1}
                  max={5}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', p.id)}
                  className="cursor-grab rounded-xl p-3 active:cursor-grabbing"
                  style={{
                    background: 'rgba(255,255,255,0.025)',
                    border:     '1px solid rgba(255,255,255,0.07)',
                    transition: 'all 0.25s ease',
                  }}
                >
                  <button
                    className="text-left text-sm font-medium"
                    style={{ color: '#e2e8f0', transition: 'color 0.2s ease' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#10b981'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#e2e8f0'}
                    onClick={() => onOpen(p)}
                  >
                    {p.title}
                  </button>

                  <div className="mt-2 flex items-center justify-between gap-2 text-xs" style={{ color: '#475569' }}>
                    <PlatformBadge platform={p.platform} />
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {p.date ? fmtDateTime(p.date) : 'No date'}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="mt-2 flex gap-1.5">
                    {col.id === 'drafts' && (
                      <button
                        className="btn-outline !px-2.5 !py-1 text-xs"
                        onClick={() => onPatch(p.id, { needsApproval: true }, 'Sent for approval')}
                      >
                        <ShieldCheck size={12} />Request approval
                      </button>
                    )}
                    {col.id === 'pending' && (
                      <button
                        className="btn-primary !px-2.5 !py-1 text-xs"
                        onClick={() => onPatch(p.id, { status: 'Scheduled', needsApproval: false, date: p.date || tomorrowAt() }, 'Approved & scheduled')}
                      >
                        <CheckCircle2 size={12} />Approve & schedule
                      </button>
                    )}
                    {col.id === 'scheduled' && (
                      <button
                        className="btn-outline !px-2.5 !py-1 text-xs"
                        style={{ borderColor: 'rgba(16,185,129,0.3)', color: '#34d399' }}
                        onClick={() => onPatch(p.id, { status: 'Published', date: new Date().toISOString() }, 'Published')}
                      >
                        <Send size={12} />Publish now
                      </button>
                    )}
                  </div>
                </TiltCard>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
