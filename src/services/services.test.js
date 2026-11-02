import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateIdeas, normalizeIdeas, buildMessages, SYSTEM_PROMPT } from './ideaService.js';
import { streamChatCompletion } from './nim.js';
import { notifyPublish } from './publishService.js';
import { loadPosts, savePosts, loadSettings, saveSettings, POSTS_KEY } from './storage.js';

const mem = () => { let s = {}; return { getItem: (k) => (k in s ? s[k] : null), setItem: (k, v) => { s[k] = String(v); }, removeItem: (k) => { delete s[k]; } }; };
const okFetch = (body) => vi.fn(async () => ({ ok: true, status: 200, text: async () => JSON.stringify(body) }));
beforeEach(() => { globalThis.localStorage = mem(); });

/** Builds an SSE Response whose bytes are cut into awkward 13-byte network chunks. */
function sse(content, { status = 200, contentType = 'text/event-stream' } = {}) {
  const events = content.match(/[\s\S]{1,7}/g).map((c) => `data: ${JSON.stringify({ choices: [{ delta: { content: c } }] })}\n\n`);
  const bytes = new TextEncoder().encode(events.join('') + 'data: [DONE]\n\n');
  const stream = new ReadableStream({ start(c) { for (let i = 0; i < bytes.length; i += 13) c.enqueue(bytes.slice(i, i + 13)); c.close(); } });
  return new Response(stream, { status, headers: { 'content-type': contentType } });
}
const modelJson = (n, tag = '') => JSON.stringify({ ideas: Array.from({ length: n }, (_, i) => ({ angle: `Angle ${i}`, hook: `Hook ${tag}${i} with "quotes", {braces} and \\ slashes`, outline: ['a', 'b', 'Call to action'] })) });
const req = { topic: 'ABM', platforms: ['LinkedIn', 'Twitter'], audience: 'CMOs' };
const NIM = { IDEA_GENERATION_WEBHOOK_URL: '' };

describe('storage', () => {
  it('seeds 10 posts covering all statuses and persists', () => {
    const posts = loadPosts();
    expect(posts).toHaveLength(10);
    expect(new Set(posts.map((p) => p.status))).toEqual(new Set(['Draft', 'Scheduled', 'Published']));
    expect(JSON.parse(localStorage.getItem(POSTS_KEY))).toHaveLength(10);
  });
  it('round-trips edits and survives corruption', () => {
    const posts = loadPosts(); posts[0].title = 'Edited'; savePosts(posts);
    expect(loadPosts()[0].title).toBe('Edited');
    localStorage.setItem(POSTS_KEY, '{bad'); expect(loadPosts()).toHaveLength(10);
  });
  it('persists settings', () => { saveSettings({ IDEA_GENERATION_WEBHOOK_URL: 'https://x.test/h' }); expect(loadSettings().IDEA_GENERATION_WEBHOOK_URL).toBe('https://x.test/h'); });
});

describe('NIM streaming client', () => {
  it('reassembles deltas across split SSE chunks', async () => {
    let out = ''; for await (const d of streamChatCompletion({ messages: [], fetchImpl: async () => sse('Hello, streaming world!') })) out += d;
    expect(out).toBe('Hello, streaming world!');
  });
  it('sends an OpenAI-compatible streaming request for the Llama 3.3 70B model', async () => {
    const f = vi.fn(async () => sse('x'));
    for await (const _ of streamChatCompletion({ messages: [{ role: 'user', content: 'hi' }], fetchImpl: f })); // eslint-disable-line no-unused-vars
    const body = JSON.parse(f.mock.calls[0][1].body);
    expect(body).toMatchObject({ model: 'meta/llama-3.3-70b-instruct', stream: true });
    expect(f.mock.calls[0][1].headers.Authorization).toBeUndefined(); // key is injected by the proxy, never in the browser
  });
  it('maps 401 to an actionable key error', async () => {
    await expect((async () => { for await (const _ of streamChatCompletion({ messages: [], fetchImpl: async () => new Response('no', { status: 401 }) })); })()).rejects.toThrow(/API key/); // eslint-disable-line no-unused-vars
  });
  it('detects a missing proxy (HTML fallback)', async () => {
    await expect((async () => { for await (const _ of streamChatCompletion({ messages: [], fetchImpl: async () => new Response('<html>', { status: 200, headers: { 'content-type': 'text/html' } }) })); })()).rejects.toThrow(/proxy/); // eslint-disable-line no-unused-vars
  });
});

describe('generateIdeas (live NIM, no mocks)', () => {
  it('system prompt demands strict JSON in the ideas/angle/hook/outline shape', () => {
    expect(SYSTEM_PROMPT).toMatch(/ONLY valid JSON/); ['"ideas"', '"angle"', '"hook"', '"outline"'].forEach((k) => expect(SYSTEM_PROMPT).toContain(k));
    expect(buildMessages({ topic: 'T', platform: 'Blog', audience: 'A' })[1].content).toMatch(/Channel: Blog/);
  });
  it('emits each idea progressively as its JSON object completes, tagged by platform', async () => {
    const seen = []; const tokens = [];
    const f = vi.fn(async (_u, o) => sse(modelJson(5, JSON.parse(o.body).messages[1].content.includes('Twitter') ? 'T' : 'L')));
    const r = await generateIdeas(req, NIM, { fetchImpl: f, onIdea: (i) => seen.push(i), onToken: (p) => tokens.push(p) });
    expect(f).toHaveBeenCalledTimes(2);
    expect(r.source).toBe('nim'); expect(r.errors).toEqual({}); expect(seen).toHaveLength(10);
    expect(seen.filter((i) => i.platform === 'LinkedIn')).toHaveLength(5);
    expect(seen[0].hook).toContain('{braces}'); expect(seen[0].outline).toHaveLength(3); expect(tokens.length).toBeGreaterThan(10);
  });
  it('accepts fenced / wrapped JSON via the loose fallback parser', async () => {
    const f = async () => sse('Sure! ```json\n[{"angle":"A","hook":"Bare array hook","outline":["x"]}]\n```');
    const r = await generateIdeas({ ...req, platforms: ['Blog'] }, NIM, { fetchImpl: f });
    expect(r.ideas.map((i) => i.hook)).toEqual(['Bare array hook']);
  });
  it('reports per-channel failures without hiding successes, and never fabricates ideas', async () => {
    const f = vi.fn(async (_u, o) => (JSON.parse(o.body).messages[1].content.includes('Twitter') ? new Response('x', { status: 429 }) : sse(modelJson(2))));
    const done = vi.fn();
    const r = await generateIdeas(req, NIM, { fetchImpl: f, onPlatformDone: done });
    expect(r.ideas).toHaveLength(2); expect(r.errors.Twitter).toMatch(/rate limit/i); expect(r.errors.LinkedIn).toBeUndefined();
    expect(done).toHaveBeenCalledWith('Twitter', expect.stringMatching(/rate limit/i));
  });
  it('returns zero ideas and an error when the model output is unusable', async () => {
    const r = await generateIdeas({ ...req, platforms: ['Blog'] }, NIM, { fetchImpl: async () => sse('I cannot help with that.') });
    expect(r.ideas).toHaveLength(0); expect(r.errors.Blog).toMatch(/no usable ideas/);
  });
  it('stays quiet when aborted', async () => {
    const ctrl = new AbortController(); ctrl.abort();
    const f = async () => { const e = new Error('aborted'); e.name = 'AbortError'; throw e; };
    const r = await generateIdeas(req, NIM, { fetchImpl: f, signal: ctrl.signal });
    expect(r.errors).toEqual({});
  });
  it('routes through the n8n webhook when configured', async () => {
    const f = okFetch({ ideas: [{ hook: 'Hook A', angle: 'X', outline: ['1'] }, 'Hook B'] });
    const r = await generateIdeas({ ...req, platforms: ['LinkedIn'] }, { IDEA_GENERATION_WEBHOOK_URL: 'https://n8n.test/h' }, { fetchImpl: f });
    expect(r.source).toBe('n8n'); expect(r.ideas).toHaveLength(2);
    expect(JSON.parse(f.mock.calls[0][1].body)).toEqual({ topic: 'ABM', platform: 'LinkedIn', audience: 'CMOs' });
  });
  it('normalizes loose shapes', () => expect(normalizeIdeas(['a', { title: 'b' }, {}], 'Blog').map((i) => i.hook)).toEqual(['a', 'b']));
});

describe('notifyPublish', () => {
  const post = { id: '1', title: 'T', status: 'Scheduled' };
  it('is standalone without URL', async () => expect((await notifyPublish(post, {})).source).toBe('standalone'));
  it('sends full post payload with event type', async () => {
    const f = okFetch({}); const r = await notifyPublish(post, { POST_PUBLISH_WEBHOOK_URL: 'https://n8n.test/p' }, { fetchImpl: f });
    expect(r.source).toBe('n8n'); expect(JSON.parse(f.mock.calls[0][1].body)).toMatchObject({ event: 'post.scheduled', id: '1', title: 'T' });
  });
  it('degrades gracefully on failure', async () => {
    const f = vi.fn(async () => { throw new Error('down'); });
    expect((await notifyPublish(post, { POST_PUBLISH_WEBHOOK_URL: 'https://n8n.test/p' }, { fetchImpl: f })).source).toBe('standalone');
  });
});
