import { useState } from 'react';
import { RotateCcw, Webhook } from 'lucide-react';
import { SETTINGS_KEYS } from '../types/index.js';
import { isValidUrl } from '../services/http.js';
import { Modal } from './ui.jsx';

const FIELDS = [
  { key: SETTINGS_KEYS.idea, hint: 'Receives POST { topic, platform, audience }. Respond with { ideas: [{ angle, hook, outline[] }] }.' },
  { key: SETTINGS_KEYS.publish, hint: 'Receives the full post payload (plus event and sentAt) when a post is scheduled or published.' },
];

export default function SettingsModal({ settings, onSave, onClose, onResetData }) {
  const [vals, setVals] = useState(settings);
  const bad = (k) => vals[k]?.trim() && !isValidUrl(vals[k].trim());
  const invalid = FIELDS.some((f) => bad(f.key));
  return (
    <Modal title="n8n integration settings" onClose={onClose} footer={<>
      <button className="btn-ghost mr-auto" onClick={() => window.confirm('Replace all posts with the demo data?') && onResetData()}><RotateCcw size={15} />Reset demo data</button>
      <button className="btn-ghost" onClick={onClose}>Cancel</button>
      <button className="btn-primary" disabled={invalid} onClick={() => onSave(Object.fromEntries(Object.entries(vals).map(([k, v]) => [k, v.trim()])))}>Save settings</button></>}>
      <p className="mb-4 flex gap-2 text-sm text-slate-600 dark:text-slate-400"><Webhook size={18} className="shrink-0 text-indigo-500" />Leave a URL empty to work in standalone mode. If a webhook is offline, the app falls back to built-in sample data automatically.</p>
      <div className="space-y-4">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label className="label font-mono" htmlFor={f.key}>{f.key}</label>
            <input id={f.key} className={`input ${bad(f.key) ? '!border-rose-500' : ''}`} placeholder="https://your-n8n.example.com/webhook/…" value={vals[f.key] || ''} onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })} />
            <p className={`mt-1 text-xs ${bad(f.key) ? 'text-rose-500' : 'text-slate-500'}`}>{bad(f.key) ? 'Enter a full URL starting with http:// or https://' : f.hint}</p>
          </div>
        ))}
      </div>
    </Modal>
  );
}
