import { useRef, useState } from 'react';
import { Bold, Heading, Italic, Link2, List, X } from 'lucide-react';
import { PLATFORMS, STATUSES } from '../types/index.js';
import { uid } from '../services/storage.js';
import { fromLocalInput, tomorrowAt, toLocalInput } from '../utils/date.js';
import { Modal } from './ui.jsx';
import PlatformPreview from './PlatformPreview.jsx';

const blank = (defaults = {}) => {
  const now = new Date().toISOString();
  return { id: uid(), title: '', body: '', tags: [], platform: 'LinkedIn', status: 'Draft', date: null, needsApproval: false, metrics: { views: 0, engagement: 0 }, createdAt: now, updatedAt: now, ...defaults };
};

export default function PostEditor({ post, defaults, onSave, onClose }) {
  const [form, setForm] = useState(() => post ? { ...post } : blank(defaults));
  const [tagText, setTagText] = useState('');
  const [error, setError] = useState('');
  const ta = useRef(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const isNew = !post;

  const setStatus = (s) => setForm((f) => ({ ...f, status: s, needsApproval: s === 'Draft' ? f.needsApproval : false, date: s === 'Scheduled' && !f.date ? tomorrowAt() : s === 'Published' && (!f.date || new Date(f.date) > new Date()) ? new Date().toISOString() : f.date }));
  const addTags = (raw) => {
    const t = raw.split(',').map((x) => x.trim().toLowerCase().replace(/^#/, '').replace(/\s+/g, '-')).filter(Boolean);
    if (t.length) setForm((f) => ({ ...f, tags: [...new Set([...f.tags, ...t])] })); setTagText('');
  };
  const wrap = (before, after = before, placeholder = 'text') => {
    const el = ta.current; const { selectionStart: s, selectionEnd: e } = el;
    const sel = form.body.slice(s, e) || placeholder;
    set('body', form.body.slice(0, s) + before + sel + after + form.body.slice(e));
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(s + before.length, s + before.length + sel.length); });
  };
  const submit = () => {
    if (!form.title.trim()) return setError('Add a title so you can find this post later.');
    if (form.status === 'Scheduled' && !form.date) return setError('Choose a date and time to schedule this post.');
    if (form.status === 'Scheduled' && new Date(form.date) < new Date() && isNew) return setError('Scheduled time is in the past. Pick a future time or publish now.');
    onSave({ ...form, title: form.title.trim(), tags: tagText.trim() ? [...new Set([...form.tags, tagText.trim().toLowerCase()])] : form.tags });
  };
  const tools = [[Bold, 'Bold', () => wrap('**')], [Italic, 'Italic', () => wrap('*')], [Heading, 'Heading', () => wrap('## ', '', 'Heading')], [List, 'List', () => wrap('- ', '', 'List item')], [Link2, 'Link', () => wrap('[', '](https://)', 'link text')]];

  return (
    <Modal wide title={isNew ? 'New post' : 'Edit post'} onClose={onClose}
      footer={<>{error && <p role="alert" className="mr-auto text-sm text-rose-500">{error}</p>}
        <button className="btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={submit}>{form.status === 'Published' ? 'Save and publish' : form.status === 'Scheduled' ? 'Save and schedule' : 'Save draft'}</button></>}>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div><label className="label" htmlFor="pt">Title</label><input id="pt" className="input" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Working title" autoFocus /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label" htmlFor="pp">Platform</label><select id="pp" className="input" value={form.platform} onChange={(e) => set('platform', e.target.value)}>{PLATFORMS.map((p) => <option key={p}>{p}</option>)}</select></div>
            <div><label className="label" htmlFor="pd">{form.status === 'Published' ? 'Published at' : 'Schedule date & time'}</label><input id="pd" type="datetime-local" className="input" value={toLocalInput(form.date)} onChange={(e) => set('date', fromLocalInput(e.target.value))} /></div>
          </div>
          <fieldset><legend className="label">Status</legend>
            <div className="inline-flex rounded-lg border border-slate-300 p-0.5 dark:border-white/15">
              {STATUSES.map((s) => <button type="button" key={s} aria-pressed={form.status === s} onClick={() => setStatus(s)} className={`rounded-md px-3 py-1 text-sm ${form.status === s ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}>{s}</button>)}
            </div>
            {form.status === 'Draft' && <label className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={form.needsApproval} onChange={(e) => set('needsApproval', e.target.checked)} />Needs approval before scheduling</label>}
          </fieldset>
          <div>
            <div className="mb-1 flex items-end justify-between"><label className="label !mb-0" htmlFor="pb">Body (Markdown)</label>
              <div className="flex gap-0.5">{tools.map(([I, l, fn]) => <button key={l} type="button" className="btn-ghost !p-1.5" onClick={fn} aria-label={l} title={l}><I size={15} /></button>)}</div></div>
            <textarea id="pb" ref={ta} rows={11} className="input font-mono text-[13px] leading-relaxed" value={form.body} onChange={(e) => set('body', e.target.value)} placeholder="Write your post. Markdown is supported." />
            <p className="mt-1 text-right text-xs text-slate-500">{form.body.length} characters</p>
          </div>
          <div><label className="label" htmlFor="ptag">Tags</label>
            <div className="input flex flex-wrap items-center gap-1.5 !py-1.5">
              {form.tags.map((t) => <span key={t} className="badge bg-indigo-500/15 text-indigo-700 dark:text-indigo-300">#{t}<button type="button" onClick={() => set('tags', form.tags.filter((x) => x !== t))} aria-label={`Remove ${t}`}><X size={12} /></button></span>)}
              <input id="ptag" className="min-w-[100px] flex-1 bg-transparent py-0.5 text-sm outline-none" value={tagText} placeholder="Add tag, press Enter" onChange={(e) => setTagText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTags(tagText); } if (e.key === 'Backspace' && !tagText) set('tags', form.tags.slice(0, -1)); }} onBlur={() => addTags(tagText)} />
            </div>
          </div>
        </div>
        <div className="lg:sticky lg:top-0">
          <p className="label">Live preview</p>
          <PlatformPreview post={form} />
        </div>
      </div>
    </Modal>
  );
}
