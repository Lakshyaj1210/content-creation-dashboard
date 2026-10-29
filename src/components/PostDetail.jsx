import { Eye, Pencil, Trash2, TrendingUp } from 'lucide-react';
import { compact, engagementRate } from '../utils/postFilters.js';
import { fmtDateTime } from '../utils/date.js';
import { renderMarkdown } from '../utils/markdown.js';
import { Modal, PlatformBadge, StatusBadge, TagChip } from './ui.jsx';

export default function PostDetail({ post, onClose, onEdit, onDelete }) {
  return (
    <Modal
      title="Post details"
      onClose={onClose}
      footer={
        <>
          <button
            className="btn-ghost text-rose-600"
            onClick={() => window.confirm(`Delete "${post.title}"?`) && onDelete(post.id)}
          >
            <Trash2 size={15} />
            Delete
          </button>
          <button className="btn-primary" onClick={() => onEdit(post)}>
            <Pencil size={15} />
            Edit post
          </button>
        </>
      }
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <PlatformBadge platform={post.platform} />
        <StatusBadge post={post} />
        <span className="text-sm text-slate-500">{post.date ? fmtDateTime(post.date) : 'No date set'}</span>
      </div>
      <h3 className="text-xl font-semibold leading-snug">{post.title}</h3>
      {post.status === 'Published' && (
        <div className="my-4 grid grid-cols-3 gap-2 text-center">
          {[
            [Eye, 'Views', compact(post.metrics.views)],
            [TrendingUp, 'Engagements', compact(post.metrics.engagement)],
            [TrendingUp, 'Engagement rate', `${engagementRate(post).toFixed(1)}%`],
          ].map(([I, l, v]) => (
            <div key={l} className="rounded-xl bg-slate-500/10 p-3">
              <I size={14} className="mx-auto mb-1 text-slate-400" />
              <p className="text-xl font-semibold tabular-nums">{v}</p>
              <p className="text-xs text-slate-500">{l}</p>
            </div>
          ))}
        </div>
      )}
      <div
        className="mt-3 text-sm leading-relaxed"
        dangerouslySetInnerHTML={{
          __html: renderMarkdown(post.body) || '<p class="text-slate-500">No body yet.</p>',
        }}
      />
      <div className="mt-4 flex flex-wrap gap-1">
        {post.tags.map((t) => (
          <TagChip key={t}>{t}</TagChip>
        ))}
      </div>
    </Modal>
  );
}
