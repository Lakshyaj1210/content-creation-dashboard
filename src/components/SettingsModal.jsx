import { useRef, useState } from 'react';
import { Download, RotateCcw, Upload, Webhook } from 'lucide-react';
import { SETTINGS_KEYS } from '../types/index.js';
import { isValidUrl } from '../services/http.js';
import { createBackup, parseBackup } from '../services/backup.js';
import { hasEnvDefaults } from '../services/storage.js';
import { Modal } from './ui.jsx';

const FIELDS = [
  {
    key: SETTINGS_KEYS.idea,
    hint: 'Receives POST { topic, platform, audience }. Respond with { ideas: [{ angle, hook, outline[] }] }.',
  },
  {
    key: SETTINGS_KEYS.publish,
    hint: 'Receives the full post payload (plus event and sentAt) when a post is scheduled or published.',
  },
];

const VERSION = (() => {
  try {
    return import.meta.env?.VITE_APP_VERSION || '1.0.0';
  } catch {
    return '1.0.0';
  }
})();

/** Blob.text() is missing in some older browsers and test environments. */
const readText = (file) =>
  typeof file.text === 'function'
    ? file.text()
    : new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error || new Error('Could not read that file.'));
        reader.readAsText(file);
      });

export default function SettingsModal({ settings, posts = [], onSave, onClose, onResetData, onImport }) {
  const [vals, setVals] = useState(settings);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const fileRef = useRef(null);
  const bad = (k) => vals[k]?.trim() && !isValidUrl(vals[k].trim());
  const invalid = FIELDS.some((f) => bad(f.key));

  const exportData = () => {
    const json = JSON.stringify(createBackup(posts, settings), null, 2);
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `content-studio-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setError('');
    setNotice(`Exported ${posts.length} ${posts.length === 1 ? 'post' : 'posts'}.`);
  };

  const importData = async (file) => {
    if (!file) return;
    setError('');
    setNotice('');
    try {
      const parsed = parseBackup(await readText(file));
      onImport?.(parsed);
    } catch (e) {
      setError(e.message);
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <Modal
      title="Settings & data"
      onClose={onClose}
      footer={
        <>
          <button
            className="btn-ghost mr-auto"
            onClick={() => window.confirm('Replace all posts with the demo data?') && onResetData()}
          >
            <RotateCcw size={15} />
            Reset demo data
          </button>
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            disabled={invalid}
            onClick={() =>
              onSave(Object.fromEntries(Object.entries(vals).map(([k, v]) => [k, String(v ?? '').trim()])))
            }
          >
            Save settings
          </button>
        </>
      }
    >
      <div className="mb-4 flex gap-2 text-sm text-slate-600 dark:text-slate-400">
        <Webhook size={18} className="shrink-0 text-indigo-500" />
        <p>
          Leave a URL empty to work in standalone mode. If a webhook is offline, the app falls back to
          built-in sample data automatically.
        </p>
      </div>

      <div className="space-y-4">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label className="label font-mono" htmlFor={f.key}>
              {f.key}
            </label>
            <input
              id={f.key}
              className={`input ${bad(f.key) ? '!border-rose-500' : ''}`}
              placeholder="https://your-n8n.example.com/webhook/…"
              value={vals[f.key] || ''}
              onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })}
              aria-invalid={Boolean(bad(f.key))}
            />
            <p className={`mt-1 text-xs ${bad(f.key) ? 'text-rose-500' : 'text-slate-500'}`}>
              {bad(f.key) ? 'Enter a full URL starting with http:// or https://' : f.hint}
            </p>
          </div>
        ))}
        {hasEnvDefaults() && (
          <p className="rounded-lg bg-indigo-500/10 px-3 py-2 text-xs text-indigo-700 dark:text-indigo-300">
            Build-time defaults from <code>.env</code> are in use. Saved values below take precedence. See the
            README for the browser CORS requirement.
          </p>
        )}
      </div>

      <section
        className="mt-6 border-t border-slate-200/70 pt-4 dark:border-white/10"
        aria-labelledby="data-heading"
      >
        <h3 id="data-heading" className="text-sm font-semibold">
          Backup & restore
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Posts live only in this browser. Export a JSON snapshot before switching machines or clearing site
          data.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="btn-outline" onClick={exportData} disabled={!posts.length}>
            <Download size={15} />
            Export JSON
          </button>
          <button className="btn-outline" onClick={() => fileRef.current?.click()}>
            <Upload size={15} />
            Import JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            aria-label="Import backup file"
            onChange={(e) => importData(e.target.files?.[0])}
          />
        </div>
        <p className="mt-2 min-h-[1rem] text-xs" aria-live="polite">
          {error ? (
            <span className="text-rose-500">{error}</span>
          ) : (
            notice && <span className="text-emerald-600">{notice}</span>
          )}
        </p>
      </section>

      <p className="mt-4 text-right text-[11px] text-slate-400">Content Studio v{VERSION}</p>
    </Modal>
  );
}
