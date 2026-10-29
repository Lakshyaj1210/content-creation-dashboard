import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { addDays, fmtTime, isSameDay, monthGrid, startOfWeek } from '../utils/date.js';
import { STATUS_DOT } from './ui.jsx';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ContentCalendar({ posts, onOpen, onCreate }) {
  const [mode, setMode] = useState('month');
  const [cursor, setCursor] = useState(() => new Date());
  const today = new Date();
  const days = useMemo(() => (mode === 'month' ? monthGrid(cursor.getFullYear(), cursor.getMonth()) : Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(cursor), i))), [mode, cursor]);
  const dated = useMemo(() => posts.filter((p) => p.date), [posts]);
  const move = (dir) => setCursor((c) => (mode === 'month' ? new Date(c.getFullYear(), c.getMonth() + dir, 1) : addDays(c, dir * 7)));
  const title = mode === 'month'
    ? cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : `${days[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${days[6].toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;

  return (
    <div className="card p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button className="btn-outline !p-2" onClick={() => move(-1)} aria-label="Previous"><ChevronLeft size={16} /></button>
          <button className="btn-outline !p-2" onClick={() => move(1)} aria-label="Next"><ChevronRight size={16} /></button>
          <button className="btn-outline" onClick={() => setCursor(new Date())}>Today</button>
          <h2 className="ml-2 text-lg font-semibold">{title}</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-3 text-xs text-slate-500 sm:flex">
            {Object.entries(STATUS_DOT).map(([s, c]) => <span key={s} className="flex items-center gap-1"><i className={`h-2 w-2 rounded-full ${c}`} />{s}</span>)}
          </div>
          <div className="inline-flex rounded-lg border border-slate-300 p-0.5 dark:border-white/15" role="tablist">
            {['month', 'week'].map((m) => (
              <button key={m} role="tab" aria-selected={mode === m} onClick={() => setMode(m)} className={`rounded-md px-3 py-1 text-sm capitalize ${mode === m ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}>{m}</button>
            ))}
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          <div className="grid grid-cols-7 border-b border-slate-200/70 pb-2 text-xs text-slate-500 dark:border-white/10">
            {DAYS.map((d) => <div key={d} className="px-2">{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {days.map((d) => {
              const items = dated.filter((p) => isSameDay(new Date(p.date), d)).sort((a, b) => new Date(a.date) - new Date(b.date));
              const outside = mode === 'month' && d.getMonth() !== cursor.getMonth();
              const isToday = isSameDay(d, today);
              return (
                <div key={d.toISOString()} className={`group relative border-b border-r border-slate-200/50 p-1.5 dark:border-white/5 ${mode === 'month' ? 'min-h-[104px]' : 'min-h-[320px]'} ${outside ? 'opacity-40' : ''}`}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className={`grid h-6 min-w-6 place-items-center rounded-full px-1 text-xs ${isToday ? 'bg-indigo-600 font-semibold text-white' : 'text-slate-500'}`}>{d.getDate()}</span>
                    <button className="btn-ghost !p-1 opacity-0 focus:opacity-100 group-hover:opacity-100" onClick={() => onCreate(d)} aria-label={`New post on ${d.toDateString()}`}><Plus size={13} /></button>
                  </div>
                  <div className="space-y-1">
                    {items.slice(0, mode === 'month' ? 3 : 20).map((p) => (
                      <button key={p.id} onClick={() => onOpen(p)} title={p.title} className="flex w-full items-center gap-1.5 rounded-md bg-slate-500/10 px-1.5 py-1 text-left text-xs hover:bg-indigo-500/20">
                        <i className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[p.status]}`} />
                        <span className="truncate">{mode === 'week' && <span className="mr-1 text-slate-500">{fmtTime(p.date)}</span>}{p.title}</span>
                      </button>
                    ))}
                    {mode === 'month' && items.length > 3 && <p className="px-1 text-xs text-slate-500">+{items.length - 3} more</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
