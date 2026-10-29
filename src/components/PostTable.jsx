import { useState } from 'react';
import { Check, Eye, FileSearch, Pencil, Trash2 } from 'lucide-react';
import { STATUSES } from '../types/index.js';
import { compact, engagementRate } from '../utils/postFilters.js';
import { fmtDateTime } from '../utils/date.js';
import { Empty, PlatformBadge, StatusBadge, TagChip } from './ui.jsx';

export default function PostTable({ posts, onOpen, onEdit, onDelete, onPatch, manage }) {
  const [editing, setEditing] = useState(null); // {id, value}
  const commit = () => {
    if (editing && editing.value.trim()) onPatch(editing.id, { title: editing.value.trim() });
    setEditing(null);
  };
  if (!posts.length) return <Empty icon={FileSearch} title="No posts match these filters" hint="Clear the search or choose a different status, platform or tag." />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead className="text-xs text-slate-500">
          <tr className="border-b border-slate-200/70 dark:border-white/10">
            <th className="px-4 py-3 font-medium">Post</th><th className="px-3 py-3 font-medium">Platform</th>
            <th className="px-3 py-3 font-medium">{manage ? 'Status' : 'Published'}</th>
            {manage && <th className="px-3 py-3 font-medium">Date</th>}
            <th className="px-3 py-3 text-right font-medium">Views</th><th className="px-3 py-3 text-right font-medium">Engagement</th>
            <th className="px-3 py-3"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {posts.map((p) => (
            <tr key={p.id} className="border-b border-slate-200/50 last:border-0 hover:bg-slate-500/5 dark:border-white/5">
              <td className="max-w-[340px] px-4 py-3">
                {editing?.id === p.id ? (
                  <div className="flex items-center gap-1">
                    <input autoFocus className="input !py-1" value={editing.value} onChange={(e) => setEditing({ id: p.id, value: e.target.value })}
                      onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(null); }} aria-label="Edit title" />
                    <button className="btn-ghost !p-1.5" onClick={commit} aria-label="Save title"><Check size={15} /></button>
                  </div>
                ) : (
                  <button className="text-left font-medium hover:text-indigo-600 dark:hover:text-indigo-300" onClick={() => onOpen(p)} onDoubleClick={() => manage && setEditing({ id: p.id, value: p.title })}>{p.title}</button>
                )}
                <div className="mt-1 flex flex-wrap gap-1">{p.tags.slice(0, 3).map((t) => <TagChip key={t}>{t}</TagChip>)}</div>
              </td>
              <td className="px-3 py-3"><PlatformBadge platform={p.platform} /></td>
              <td className="px-3 py-3">
                {manage ? (
                  <select aria-label="Change status" className="input !w-auto !py-1" value={p.status} onChange={(e) => onPatch(p.id, { status: e.target.value, needsApproval: false })}>
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                ) : <span className="whitespace-nowrap text-slate-600 dark:text-slate-300">{fmtDateTime(p.date)}</span>}
                {manage && p.needsApproval && p.status === 'Draft' && <div className="mt-1"><StatusBadge post={p} /></div>}
              </td>
              {manage && <td className="whitespace-nowrap px-3 py-3 text-slate-600 dark:text-slate-300">{fmtDateTime(p.date)}</td>}
              <td className="px-3 py-3 text-right tabular-nums">{p.status === 'Published' ? compact(p.metrics.views) : '—'}</td>
              <td className="px-3 py-3 text-right tabular-nums">
                {p.status === 'Published' ? <>{compact(p.metrics.engagement)} <span className="text-xs text-slate-500">({engagementRate(p).toFixed(1)}%)</span></> : '—'}
              </td>
              <td className="px-3 py-3">
                <div className="flex justify-end gap-0.5">
                  <button className="btn-ghost !p-1.5" onClick={() => onOpen(p)} aria-label={`View ${p.title}`}><Eye size={15} /></button>
                  <button className="btn-ghost !p-1.5" onClick={() => (manage ? setEditing({ id: p.id, value: p.title }) : onEdit(p))} aria-label={manage ? 'Rename inline' : 'Edit'}><Pencil size={15} /></button>
                  {manage && <button className="btn-ghost !p-1.5 text-indigo-600 dark:text-indigo-300" onClick={() => onEdit(p)}>Open editor</button>}
                  <button className="btn-ghost !p-1.5 text-rose-600" onClick={() => window.confirm(`Delete "${p.title}"?`) && onDelete(p.id)} aria-label={`Delete ${p.title}`}><Trash2 size={15} /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
