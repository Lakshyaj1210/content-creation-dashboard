import { useState } from 'react';
import { Check, Eye, FileSearch, Pencil, Trash2 } from 'lucide-react';
import { STATUSES } from '../types/index.js';
import { compact, engagementRate } from '../utils/postFilters.js';
import { fmtDateTime } from '../utils/date.js';
import { Empty, PlatformBadge, StatusBadge, TagChip } from './ui.jsx';

export default function PostTable({ posts, onOpen, onEdit, onDelete, onPatch, manage }) {
  const [editing, setEditing] = useState(null);
  const commit = () => {
    if (editing?.value.trim()) onPatch(editing.id, { title: editing.value.trim() });
    setEditing(null);
  };

  if (!posts.length) return <Empty icon={FileSearch} title="No posts match these filters" hint="Clear the search or choose a different status, platform or tag." />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {['Post', 'Platform', manage ? 'Status' : 'Published', manage && 'Date', 'Views', 'Engagement', ''].filter(Boolean).map((h, i) => (
              <th
                key={i}
                className={`px-4 py-3 text-xs font-medium ${i >= (manage ? 4 : 3) ? 'text-right' : ''}`}
                style={{ color: '#475569' }}
              >
                {h || <span className="sr-only">Actions</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {posts.map((p, idx) => (
            <tr
              key={p.id}
              style={{ '--i': Math.min(idx, 12) }}
              className="enter enter-fast table-row-hover"
            >
              {/* Title + tags */}
              <td className="max-w-[340px] px-4 py-3">
                {editing?.id === p.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      autoFocus
                      className="input !py-1"
                      value={editing.value}
                      onChange={(e) => setEditing({ id: p.id, value: e.target.value })}
                      onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(null); }}
                      aria-label="Edit title"
                    />
                    <button className="btn-ghost !p-1.5" onClick={commit} aria-label="Save"><Check size={14} /></button>
                  </div>
                ) : (
                  <button
                    className="text-left font-medium"
                    style={{ color: '#e2e8f0', transition: 'color 0.2s ease' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#10b981'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#e2e8f0'}
                    onClick={() => onOpen(p)}
                    onDoubleClick={() => manage && setEditing({ id: p.id, value: p.title })}
                  >
                    {p.title}
                  </button>
                )}
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {p.tags.slice(0, 3).map((t) => <TagChip key={t}>{t}</TagChip>)}
                </div>
              </td>

              {/* Platform + Status stacked */}
              <td className="px-3 py-3">
                <div className="flex flex-col items-start gap-1.5">
                  <PlatformBadge platform={p.platform} />
                  <StatusBadge post={p} />
                </div>
              </td>

              {/* Status select or date */}
              <td className="px-3 py-3">
                {manage ? (
                  <select
                    aria-label="Change status"
                    className="input !w-auto !py-1 text-xs"
                    value={p.status}
                    onChange={(e) => onPatch(p.id, { status: e.target.value, needsApproval: false })}
                  >
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                ) : (
                  <span className="whitespace-nowrap text-xs" style={{ color: '#64748b' }}>{fmtDateTime(p.date)}</span>
                )}
              </td>

              {manage && (
                <td className="whitespace-nowrap px-3 py-3 text-xs" style={{ color: '#64748b' }}>
                  {fmtDateTime(p.date)}
                </td>
              )}

              {/* Views */}
              <td className="px-3 py-3 text-right tabular-nums text-sm" style={{ color: '#94a3b8' }}>
                {p.status === 'Published' ? compact(p.metrics.views) : <span style={{ color: '#374151' }}>—</span>}
              </td>

              {/* Engagement */}
              <td className="px-3 py-3 text-right tabular-nums text-sm" style={{ color: '#94a3b8' }}>
                {p.status === 'Published' ? (
                  <>
                    {compact(p.metrics.engagement)}{' '}
                    <span className="text-xs" style={{ color: '#475569' }}>({engagementRate(p).toFixed(1)}%)</span>
                  </>
                ) : <span style={{ color: '#374151' }}>—</span>}
              </td>

              {/* Actions */}
              <td className="px-3 py-3">
                <div className="flex justify-end gap-0.5">
                  <button className="btn-ghost !p-1.5" onClick={() => onOpen(p)} aria-label={`View ${p.title}`}><Eye size={14} /></button>
                  <button
                    className="btn-ghost !p-1.5"
                    onClick={() => manage ? setEditing({ id: p.id, value: p.title }) : onEdit(p)}
                    aria-label={manage ? 'Rename' : 'Edit'}
                  >
                    <Pencil size={14} />
                  </button>
                  {manage && (
                    <button
                      className="btn-ghost !px-2 !py-1 text-xs"
                      style={{ color: '#10b981' }}
                      onClick={() => onEdit(p)}
                    >
                      Open editor
                    </button>
                  )}
                  <button
                    className="btn-ghost !p-1.5"
                    style={{ color: '#f43f5e' }}
                    onClick={() => window.confirm(`Delete "${p.title}"?`) && onDelete(p.id)}
                    aria-label={`Delete ${p.title}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
