import { isValidUrl, postJson } from './http.js';
import { streamChatCompletion } from './nim.js';
import { uid } from './storage.js';
import { IdeaStreamParser, parseLoose } from '../utils/streamJson.js';

export class IdeaError extends Error { constructor(m) { super(m); this.name = 'IdeaError'; } }

const PLATFORM_GUIDE = {
  LinkedIn: 'Professional, story- or insight-led. Hook under 150 characters. No hashtags in the hook.',
  Twitter: 'Punchy, opinionated. Hook under 200 characters so it fits one post.',
  Blog: 'SEO-aware headline under 70 characters that promises a concrete outcome.',
  Newsletter: 'Subject-line style, under 60 characters, curiosity-driven.',
  YouTube: 'Title under 70 characters, benefit-led.',
};

export const SYSTEM_PROMPT = `You are a senior B2B content strategist. Given a topic, a target channel and an audience, produce exactly 5 content ideas, each with a clearly different angle (for example: Contrarian Take, Step-by-step Playbook, Personal Story, Data-driven Insight, Myth vs. Reality).

Respond with ONLY valid JSON. No markdown fences, no commentary, no trailing text. Use exactly this shape:
{"ideas":[{"angle":"Contrarian Take","hook":"Attention-grabbing headline written for the channel","outline":["Step 1 / key insight","Step 2 / data point","Call to action"]}]}

Rules: each outline has 3 to 4 short strings, ending with a call to action. Hooks must be specific to the topic and audience, never generic.`;

export const buildMessages = ({ topic, platform, audience }) => [
  { role: 'system', content: SYSTEM_PROMPT },
  { role: 'user', content: `Topic: ${topic}\nChannel: ${platform}\nChannel guidance: ${PLATFORM_GUIDE[platform] || 'Write for the channel.'}\nAudience: ${audience || 'B2B decision makers'}\n\nReturn the JSON now.` },
];

const str = (v) => (typeof v === 'string' ? v.trim() : '');
export function normalizeIdea(raw, platform, n = 0) {
  if (typeof raw === 'string') raw = { hook: raw };
  const hook = str(raw?.hook) || str(raw?.title) || str(raw?.idea);
  if (!hook) return null;
  return {
    id: str(raw.id) || uid(), angle: str(raw.angle) || `Angle ${n + 1}`, hook,
    outline: Array.isArray(raw.outline) ? raw.outline.map(String).filter(Boolean).slice(0, 5) : [], platform: raw.platform || platform,
  };
}
/** Accepts [{...}], ["hook"], {ideas:[...]} or {data:[...]} from an n8n webhook. */
export const normalizeIdeas = (raw, platform) => {
  const list = Array.isArray(raw) ? raw : raw?.ideas ?? raw?.data ?? [];
  return list.map((r, i) => normalizeIdea(r, platform, i)).filter(Boolean);
};

async function viaNim(req, { push, signal, onToken, fetchImpl }) {
  const parser = new IdeaStreamParser(); let full = ''; let count = 0;
  const emit = (raw) => { const idea = normalizeIdea(raw, req.platform, count); if (idea) { count++; push(idea); } };
  for await (const delta of streamChatCompletion({ messages: buildMessages(req), signal, fetchImpl })) {
    full += delta; onToken(req.platform, delta);
    parser.push(delta).forEach(emit);
  }
  if (!count) parseLoose(full).forEach(emit);
  if (!count) throw new IdeaError('The model returned no usable ideas. Try again or make the topic more specific.');
}

async function viaWebhook(url, req, { push, fetchImpl }) {
  const ideas = normalizeIdeas(await postJson(url, { topic: req.topic, platform: req.platform, audience: req.audience }, { fetchImpl }), req.platform);
  if (!ideas.length) throw new IdeaError('The n8n webhook returned no ideas.');
  ideas.forEach(push);
}

/**
 * Streams ideas live from NVIDIA NIM, one concurrent stream per channel. Each idea is delivered via
 * onIdea the moment its JSON object completes. If IDEA_GENERATION_WEBHOOK_URL is set it is used instead.
 * There is deliberately no mock fallback: failures are reported per channel so the UI can offer a retry.
 * @returns {Promise<{ideas: object[], errors: Record<string,string>, source: 'nim'|'n8n'}>}
 */
export async function generateIdeas({ topic, platforms, audience }, settings, opts = {}) {
  const { signal, onIdea = () => {}, onToken = () => {}, onPlatformDone = () => {}, fetchImpl } = opts;
  const hook = settings?.IDEA_GENERATION_WEBHOOK_URL?.trim();
  const useWebhook = Boolean(hook && isValidUrl(hook));
  const ideas = []; const errors = {};
  await Promise.all(platforms.map(async (platform) => {
    const push = (i) => { ideas.push(i); onIdea(i); };
    const req = { topic, platform, audience };
    try {
      if (useWebhook) await viaWebhook(hook, req, { push, fetchImpl });
      else await viaNim(req, { push, signal, onToken, fetchImpl });
      onPlatformDone(platform, null);
    } catch (e) {
      if (signal?.aborted || e?.name === 'AbortError') return onPlatformDone(platform, null);
      errors[platform] = e.message || 'Generation failed';
      onPlatformDone(platform, errors[platform]);
    }
  }));
  return { ideas, errors, source: useWebhook ? 'n8n' : 'nim' };
}
