import { useEffect } from 'react';
import { Briefcase, FileText, Mail, MessageCircle, PlayCircle, X } from 'lucide-react';

export const PLATFORM_META = {
  LinkedIn: { icon: Briefcase, cls: 'bg-sky-500/15 text-sky-700 dark:text-sky-300' },
  Twitter: { icon: MessageCircle, cls: 'bg-slate-500/15 text-slate-700 dark:text-slate-300' },
  YouTube: { icon: PlayCircle, cls: 'bg-rose-500/15 text-rose-700 dark:text-rose-300' },
  Blog: { icon: FileText, cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' },
  Newsletter: { icon: Mail, cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' },
};
export const STATUS_CLS = {
  Draft: 'bg-slate-500/15 text-slate-600 dark:text-slate-300',
  Scheduled: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300',
  Published: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
};
export const STATUS_DOT = { Draft: 'bg-slate-400', Scheduled: 'bg-indigo-500', Published: 'bg-emerald-500' };

export function PlatformBadge({ platform }) {
  const m = PLATFORM_META[platform] || PLATFORM_META.Blog; const Icon = m.icon;
  return <span className={`badge ${m.cls}`}><Icon size={12} />{platform === 'Twitter' ? 'Twitter/X' : platform}</span>;
}
export function StatusBadge({ post }) {
  const label = post.status === 'Draft' && post.needsApproval ? 'Pending approval' : post.status;
  return <span className={`badge ${post.status === 'Draft' && post.needsApproval ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300' : STATUS_CLS[post.status]}`}>{label}</span>;
}
export const TagChip = ({ children }) => <span className="badge bg-slate-200/70 text-slate-600 dark:bg-white/10 dark:text-slate-300">#{children}</span>;

export function Modal({ title, onClose, children, wide, footer }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k); document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className={`card pop flex max-h-[94vh] w-full flex-col bg-white/95 dark:bg-slate-900/95 ${wide ? 'max-w-6xl' : 'max-w-lg'} rounded-b-none sm:rounded-b-2xl`}>
        <div className="flex items-center justify-between border-b border-slate-200/70 px-5 py-3 dark:border-white/10">
          <h2 className="text-base font-semibold">{title}</h2>
          <button className="btn-ghost !p-1.5" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200/70 px-5 py-3 dark:border-white/10">{footer}</div>}
      </div>
    </div>
  );
}

export const Empty = ({ icon: Icon, title, hint }) => (
  <div className="flex flex-col items-center justify-center gap-1 px-6 py-12 text-center">
    <Icon size={28} className="text-slate-400" /><p className="font-medium">{title}</p>
    {hint && <p className="max-w-xs text-sm text-slate-500">{hint}</p>}
  </div>
);

export function Toasts({ toasts }) {
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col gap-2" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`pop card pointer-events-auto max-w-xs px-3 py-2 text-sm shadow-lg ${t.tone === 'error' ? '!border-rose-400/50' : t.tone === 'success' ? '!border-emerald-400/50' : ''}`}>{t.msg}</div>
      ))}
    </div>
  );
}
