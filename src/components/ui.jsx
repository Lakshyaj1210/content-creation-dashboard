import { useEffect } from 'react';
import { Briefcase, FileText, Mail, MessageCircle, PlayCircle, X } from 'lucide-react';

/* ─── Platform colour tokens ─────────────────────────────────────────────── */
export const PLATFORM_META = {
  LinkedIn:   { icon: Briefcase,     bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.35)',  color: '#34d399' },
  Twitter:    { icon: MessageCircle, bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.25)', color: '#94a3b8' },
  YouTube:    { icon: PlayCircle,    bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.35)',   color: '#f87171' },
  Blog:       { icon: FileText,      bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.25)',  color: '#6ee7b7' },
  Newsletter: { icon: Mail,          bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.35)',  color: '#fbbf24' },
};

export const STATUS_META = {
  Draft:     { bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.3)', color: '#94a3b8', dot: '#64748b' },
  Scheduled: { bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)',  color: '#fbbf24', dot: '#f59e0b' },
  Published: { bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.3)',  color: '#34d399', dot: '#10b981' },
};

export const STATUS_DOT = {
  Draft:     'bg-[#64748b]',
  Scheduled: 'bg-[#f59e0b]',
  Published: 'bg-[#10b981]',
};

export function PlatformBadge({ platform }) {
  const m = PLATFORM_META[platform] || PLATFORM_META.Blog;
  const Icon = m.icon;
  return (
    <span
      className="badge"
      style={{ background: m.bg, borderColor: m.border, color: m.color, boxShadow: `0 0 8px ${m.border}` }}
    >
      <Icon size={11} />
      {platform === 'Twitter' ? 'Twitter / X' : platform}
    </span>
  );
}

export function StatusBadge({ post }) {
  const pending = post.status === 'Draft' && post.needsApproval;
  const m = pending
    ? { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.35)', color: '#fbbf24', dot: '#f59e0b' }
    : STATUS_META[post.status] || STATUS_META.Draft;
  const dotCls = pending ? 'pdot-warn' : { Draft: 'pdot-soft', Scheduled: 'pdot-live', Published: 'pdot-glow' }[post.status];

  return (
    <span
      className="badge"
      style={{ background: m.bg, borderColor: m.border, color: m.color, boxShadow: `0 0 8px ${m.border}` }}
    >
      <i className={`pdot ${dotCls}`} style={{ color: m.dot }} />
      {pending ? 'Pending approval' : post.status}
    </span>
  );
}

export const TagChip = ({ children }) => (
  <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.08)', color: '#64748b' }}>
    #{children}
  </span>
);

/* ─── Modal ─────────────────────────────────────────────────────────────── */
export function Modal({ title, onClose, children, wide, footer }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)' }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`modal-glass pop flex max-h-[94vh] w-full flex-col rounded-b-none sm:rounded-b-[18px] ${wide ? 'max-w-6xl' : 'max-w-lg'}`}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 className="text-base font-semibold" style={{ color: '#f1f5f9' }}>{title}</h2>
          <button className="btn-ghost !p-1.5" onClick={onClose} aria-label="Close"><X size={17} /></button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 px-5 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Empty State ───────────────────────────────────────────────────────── */
export const Empty = ({ icon: Icon, title, hint }) => (
  <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
    <Icon size={26} color="#374151" />
    <p className="font-medium" style={{ color: '#94a3b8' }}>{title}</p>
    {hint && <p className="max-w-xs text-sm" style={{ color: '#475569' }}>{hint}</p>}
  </div>
);

/* ─── Toasts ────────────────────────────────────────────────────────────── */
export function Toasts({ toasts }) {
  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[60] flex flex-col gap-2" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pop pointer-events-auto max-w-xs rounded-2xl px-4 py-2.5 text-sm font-medium shadow-2xl"
          style={{
            background: 'rgba(10,13,18,0.95)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${
              t.tone === 'error'   ? 'rgba(244,63,94,0.4)'  :
              t.tone === 'success' ? 'rgba(16,185,129,0.4)' :
                                     'rgba(255,255,255,0.08)'
            }`,
            boxShadow: t.tone === 'success' ? '0 0 16px rgba(16,185,129,0.2)' : t.tone === 'error' ? '0 0 16px rgba(244,63,94,0.2)' : 'none',
            color: '#f1f5f9',
          }}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}
