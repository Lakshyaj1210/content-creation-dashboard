import { useState } from 'react';
import { CheckCircle2, Clock, Send, ShieldCheck } from 'lucide-react';
import { fmtDateTime, tomorrowAt } from '../utils/date.js';
import { Empty, PlatformBadge } from './ui.jsx';

const COLUMNS = [
  {
    id: 'drafts',
    title: 'Drafts',
    hint: 'Work in progress',
    test: (p) => p.status === 'Draft' && !p.needsApproval,
    patch: () => ({ status: 'Draft', needsApproval: false }),
  },
  {
    id: 'pending',
    title: 'Pending approval',
    hint: 'Waiting on a reviewer',
    test: (p) => p.status === 'Draft' && p.needsApproval,
    patch: () => ({ status: 'Draft', needsApproval: true }),
  },
  {
    id: 'scheduled',
    title: 'Scheduled',
    hint: 'Queued to go out',
    test: (p) => p.status === 'Scheduled',
    patch: (p) => ({ status: 'Scheduled', needsApproval: false, date: p.date || tomorrowAt() }),
  },
];

/** Every keyboard-accessible destination, including Published (not a visible column). */
const TARGETS = [
  ...COLUMNS,
  {
    id: 'published',
    title: 'Published',
    test: (p) => p.status === 'Published',
    patch: () => ({ status: 'Published', needsApproval: false, date: new Date().toISOString() }),
  },
];

export default function KanbanQueue({ posts, onOpen, onPatch }) {
  const [over, setOver] = useState(null);

  const move = (post, targetId) => {
    const target = TARGETS.find((c) => c.id === targetId);
    if (!target || target.test(post)) return;
    onPatch(post.id, target.patch(post), `Moved to ${target.title.toLowerCase()}`);
  };

  const drop = (col, e) => {
    e.preventDefault();
    setOver(null);
    const p = posts.find((x) => x.id === e.dataTransfer.getData('text/plain'));
    if (p) move(p, col.id);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {COLUMNS.map((col) => {
        const items = posts
          .filter(col.test)
          .sort((a, b) => (a.date ? +new Date(a.date) : Infinity) - (b.date ? +new Date(b.date) : Infinity));
        return (
          <section
            key={col.id}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(col.id);
            }}
            onDragLeave={() => setOver(null)}
            onDrop={(e) => drop(col, e)}
            className={`card flex min-h-[260px] flex-col p-3 transition-colors ${over === col.id ? '!border-indigo-400' : ''}`}
            aria-label={col.title}
          >
            <header className="mb-3 flex items-baseline justify-between px-1">
              <div>
                <h3 className="font-semibold">{col.title}</h3>
                <p className="text-xs text-slate-500">{col.hint}</p>
              </div>
              <span className="badge bg-slate-500/15 tabular-nums">{items.length}</span>
            </header>
            <div className="flex flex-1 flex-col gap-2">
              {!items.length && (
                <Empty icon={Clock} title="Nothing here" hint="Drag a card in, or create a post." />
              )}
              {items.map((p) => (
                <article
                  key={p.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', p.id)}
                  className="group cursor-grab rounded-xl border border-slate-200/80 bg-white/80 p-3 active:cursor-grabbing dark:border-white/10 dark:bg-slate-800/60"
                >
                  <button
                    className="text-left text-sm font-medium hover:text-indigo-600 dark:hover:text-indigo-300"
                    onClick={() => onOpen(p)}
                  >
                    {p.title}
                  </button>
                  <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-500">
                    <PlatformBadge platform={p.platform} />
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {p.date ? fmtDateTime(p.date) : 'No date'}
                    </span>
                  </div>
                  <div className="mt-2 flex gap-1">
                    {col.id === 'drafts' && (
                      <button
                        className="btn-outline !px-2 !py-1 text-xs"
                        onClick={() => onPatch(p.id, { needsApproval: true }, 'Sent for approval')}
                      >
                        <ShieldCheck size={13} />
                        Request approval
                      </button>
                    )}
                    {col.id === 'pending' && (
                      <button
                        className="btn-primary !px-2 !py-1 text-xs"
                        onClick={() =>
                          onPatch(
                            p.id,
                            { status: 'Scheduled', needsApproval: false, date: p.date || tomorrowAt() },
                            'Approved and scheduled',
                          )
                        }
                      >
                        <CheckCircle2 size={13} />
                        Approve & schedule
                      </button>
                    )}
                    {col.id === 'scheduled' && (
                      <button
                        className="btn-outline !px-2 !py-1 text-xs"
                        onClick={() =>
                          onPatch(p.id, { status: 'Published', date: new Date().toISOString() }, 'Published')
                        }
                      >
                        <Send size={13} />
                        Publish now
                      </button>
                    )}
                  </div>
                  <label className="mt-2 block">
                    <span className="sr-only">Move {p.title} to another column</span>
                    <select
                      value={col.id}
                      onChange={(e) => move(p, e.target.value)}
                      className="input !w-full !py-1 text-xs opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100"
                    >
                      {TARGETS.map((t) => (
                        <option key={t.id} value={t.id}>
                          Move to {t.title}
                        </option>
                      ))}
                    </select>
                  </label>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
