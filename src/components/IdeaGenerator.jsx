import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle, Copy, PenLine, RotateCcw,
  Sparkles, Square, Zap,
} from 'lucide-react';
import { IDEA_CHANNELS } from '../types/index.js';
import { generateIdeas } from '../services/ideaService.js';
import { NIM_MODEL } from '../services/nim.js';
import { PlatformBadge } from './ui.jsx';
import { SkeletonIdeaCard } from './Skeleton.jsx';
import TiltCard from './TiltCard.jsx';
import HoneycombLoader from './HoneycombLoader.jsx';

const PER_CHANNEL = 5;

/** Maps each angle name to a subtle Apple-gray tint — no rainbow */
const ANGLE_COLOR = {
  'Contrarian Take':    '#ff453a',
  'Step-by-step Playbook': '#30d158',
  'Personal Story':     '#2997ff',
  'Data-driven Insight': '#ffd60a',
  'Myth vs. Reality':   '#bf5af2',
};
const angleColor = (angle) => ANGLE_COLOR[angle] || '#86868b';

export default function IdeaGenerator({ settings, notify, onUseIdea }) {
  const [topic,    setTopic]    = useState('');
  const [audience, setAudience] = useState('B2B marketing leaders');
  const [channels, setChannels] = useState(['LinkedIn', 'Blog']);
  const [ideas,    setIdeas]    = useState([]);
  const [status,   setStatus]   = useState({});
  const [ran,      setRan]      = useState([]);
  const [raw,      setRaw]      = useState('');
  const ctrl = useRef(null);
  useEffect(() => () => ctrl.current?.abort(), []);

  const busy   = Object.values(status).some((s) => s.state === 'loading');
  const canRun = topic.trim() && channels.length && !busy;
  const toggle = (c) => setChannels((cs) => cs.includes(c) ? cs.filter((x) => x !== c) : [...cs, c]);

  const start = async (list, fresh) => {
    if (fresh) {
      ctrl.current?.abort();
      ctrl.current = new AbortController();
      setIdeas([]); setRan(list); setStatus({}); setRaw('');
    } else {
      if (!ctrl.current || ctrl.current.signal.aborted) ctrl.current = new AbortController();
      setIdeas((p) => p.filter((i) => !list.includes(i.platform)));
    }
    const { signal } = ctrl.current;
    setStatus((s) => ({ ...s, ...Object.fromEntries(list.map((p) => [p, { state: 'loading' }])) }));
    const r = await generateIdeas(
      { topic: topic.trim(), platforms: list, audience: audience.trim() },
      settings,
      {
        signal,
        onIdea: (i)    => setIdeas((p) => [...p, i]),
        onToken: (_, t) => setRaw((x) => (x + t).slice(-240)),
        onPlatformDone: (p, err) =>
          setStatus((s) => ({ ...s, [p]: err ? { state: 'error', message: err } : { state: 'done' } })),
      },
    );
    if (signal.aborted) return;
    if (Object.keys(r.errors).length) notify('Some channels failed. Use Retry on the failed channel.', 'error');
    else notify('Ideas ready', 'success');
  };

  const submit   = (e) => { e.preventDefault(); if (canRun) start(channels, true); };
  const stop     = () => ctrl.current?.abort();
  const copy     = async (i) => {
    try { await navigator.clipboard.writeText(i.hook); notify('Hook copied', 'success'); }
    catch { notify('Copy blocked by the browser', 'error'); }
  };
  const viaWebhook = Boolean(settings.IDEA_GENERATION_WEBHOOK_URL?.trim());

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">

      {/* ── Control Panel ─────────────────────────────────────────── */}
      <form
        onSubmit={submit}
        className="card enter h-fit space-y-5 p-5"
        style={{ '--i': 0 }}
      >
        {/* Header */}
        <div className="flex items-center gap-2">
          <Sparkles size={16} color="#2997ff" />
          <span className="text-sm font-semibold text-[#f5f5f7]">AI Idea Engine</span>
        </div>

        {/* Topic */}
        <div>
          <label className="label" htmlFor="topic">Topic or keywords</label>
          <input
            id="topic"
            className="input"
            placeholder="e.g. account-based marketing"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </div>

        {/* Audience */}
        <div>
          <label className="label" htmlFor="aud">Audience</label>
          <input
            id="aud"
            className="input"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
          />
        </div>

        {/* Channel pills */}
        <fieldset>
          <legend className="label">Channels</legend>
          <div className="flex flex-wrap gap-2">
            {IDEA_CHANNELS.map((c) => {
              const active = channels.includes(c);
              return (
                <button
                  type="button"
                  key={c}
                  aria-pressed={active}
                  onClick={() => toggle(c)}
                  className="rounded-full border px-3 py-1 text-xs font-medium"
                  style={{
                    background:   active ? 'rgba(41,151,255,0.15)' : 'rgba(255,255,255,0.04)',
                    borderColor:  active ? 'rgba(41,151,255,0.4)'  : 'rgba(255,255,255,0.08)',
                    color:        active ? '#2997ff'                : '#86868b',
                    transition:   'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  {c === 'Twitter' ? 'Twitter / X' : c}
                </button>
              );
            })}
          </div>
          {!channels.length && <p className="mt-2 text-xs" style={{ color: '#ff453a' }}>Pick at least one channel.</p>}
        </fieldset>

        {/* Action */}
        {busy
          ? (
            <button type="button" className="btn-outline w-full" onClick={stop}>
              <Square size={13} />Stop generating
            </button>
          )
          : (
            <button className="btn-primary w-full" disabled={!canRun}>
              <Sparkles size={14} />Generate ideas
            </button>
          )
        }

        {/* Model badge */}
        <p className="flex items-center gap-2 text-xs" style={{ color: '#86868b' }}>
          <Zap size={11} color="#2997ff" />
          {viaWebhook ? 'Using n8n idea webhook' : `Streaming · ${NIM_MODEL}`}
        </p>
      </form>

      {/* ── Results Area ──────────────────────────────────────────── */}
      <div className="space-y-6">

        {/* Empty state */}
        {!ran.length && (
          <div
            className="card enter grid place-items-center p-14 text-center"
            style={{ '--i': 1 }}
          >
            <div
              className="mb-4 grid h-14 w-14 place-items-center rounded-2xl"
              style={{ background: 'rgba(41,151,255,0.1)', border: '1px solid rgba(41,151,255,0.2)' }}
            >
              <Sparkles size={24} color="#2997ff" />
            </div>
            <p className="text-lg font-semibold text-[#f5f5f7]">Turn a topic into five angles per channel</p>
            <p className="mt-2 max-w-sm text-sm" style={{ color: '#86868b' }}>
              Ideas stream in as the model writes them. Each one comes with a hook and outline
              you can send straight to the editor with one tap.
            </p>
          </div>
        )}

        {/* Live stream token ticker */}
        {busy && !viaWebhook && (
          <div
            className="card p-4"
            aria-live="off"
            style={{ borderColor: 'rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.03)' }}
          >
            <HoneycombLoader label="Synthesizing AI Ideas..." />
            <p className="caret mt-2 h-9 overflow-hidden whitespace-pre-wrap break-all font-mono text-[11px] leading-snug opacity-60 text-center" style={{ color: '#34d399' }}>
              {raw || 'Waiting for the first token…'}
            </p>
          </div>
        )}

        {/* Per-channel sections */}
        {ran.map((c) => {
          const list = ideas.filter((i) => i.platform === c);
          const st   = status[c]?.state;
          return (
            <section key={c} aria-label={`${c} ideas`} className="enter" style={{ '--i': 1 }}>
              {/* Section header */}
              <div className="mb-3 flex items-center gap-3">
                <PlatformBadge platform={c} />
                {st === 'loading' && (
                  <span className="text-xs" style={{ color: '#86868b' }}>
                    {list.length} / {PER_CHANNEL} written
                  </span>
                )}
                {st === 'done' && (
                  <span className="text-xs" style={{ color: '#30d158' }}>
                    ✓ {list.length} ideas ready
                  </span>
                )}
              </div>

              {/* Error state */}
              {st === 'error' && (
                <div
                  className="card mb-3 flex flex-wrap items-center gap-3 p-4"
                  style={{ borderColor: 'rgba(255,69,58,0.3)', background: 'rgba(255,69,58,0.06)' }}
                  role="alert"
                >
                  <AlertTriangle size={17} color="#ff453a" className="shrink-0" />
                  <p className="min-w-0 flex-1 text-sm text-[#f5f5f7]">{status[c].message}</p>
                  <button className="btn-outline !text-xs" onClick={() => start([c], false)}>
                    <RotateCcw size={13} />Retry {c}
                  </button>
                </div>
              )}

              {/* Masonry grid of idea cards */}
              <div className="ideas-masonry">
                {list.map((i, idx) => (
                  <IdeaCard key={i.id} idea={i} idx={idx} onUse={onUseIdea} onCopy={copy} />
                ))}
                {st === 'loading' && Array.from(
                  { length: Math.max(0, Math.min(2, PER_CHANNEL - list.length)) },
                  (_, k) => <SkeletonIdeaCard key={`s${k}`} i={k} />,
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

/** A single Apple-style idea card with specular highlight and spring hover */
function IdeaCard({ idea, idx, onUse, onCopy }) {
  const color = angleColor(idea.angle);
  return (
    <TiltCard
      as="article"
      i={idx % 2}
      className="card flex flex-col p-4"
      style={{ '--i': idx }}
    >
      {/* Angle label */}
      <span
        className="mb-2 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider"
        style={{
          background: `${color}18`,
          color,
          border: `1px solid ${color}30`,
        }}
      >
        {idea.angle}
      </span>

      {/* Hook headline */}
      <p className="text-[15px] font-semibold leading-snug text-[#f5f5f7]">
        {idea.hook}
      </p>

      {/* Outline bullets */}
      {!!idea.outline.length && (
        <ul className="mt-3 space-y-1.5 text-sm" style={{ color: '#86868b' }}>
          {idea.outline.map((o, k) => (
            <li key={k} className="flex items-start gap-2">
              <span
                className="mt-1.5 h-1 w-1 shrink-0 rounded-full"
                style={{ background: color, opacity: 0.6 }}
              />
              {o}
            </li>
          ))}
        </ul>
      )}

      {/* Actions */}
      <div className="mt-4 flex gap-2 pt-0.5">
        <button
          className="btn-primary !px-3 !py-1.5 !text-xs"
          onClick={() => onUse(idea)}
        >
          <PenLine size={12} />Send to Editor
        </button>
        <button
          className="btn-outline !px-3 !py-1.5 !text-xs"
          onClick={() => onCopy(idea)}
        >
          <Copy size={12} />Copy hook
        </button>
      </div>
    </TiltCard>
  );
}
