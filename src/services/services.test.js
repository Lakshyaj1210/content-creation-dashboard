import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateIdeas } from './ideaService.js';
import { notifyPublish } from './publishService.js';
import { loadPosts, savePosts, loadSettings, saveSettings, POSTS_KEY } from './storage.js';

const mem = () => {
  let s = {};
  return {
    getItem: (k) => (k in s ? s[k] : null),
    setItem: (k, v) => {
      s[k] = String(v);
    },
    removeItem: (k) => {
      delete s[k];
    },
  };
};
const okFetch = (body) =>
  vi.fn(async () => ({ ok: true, status: 200, text: async () => JSON.stringify(body) }));
const req = { topic: 'ABM', platforms: ['LinkedIn', 'Twitter'], audience: 'CMOs' };

beforeEach(() => {
  globalThis.localStorage = mem();
});

describe('storage', () => {
  it('seeds 10 posts covering all statuses on first load and persists', () => {
    const posts = loadPosts();
    expect(posts).toHaveLength(10);
    expect(new Set(posts.map((p) => p.status))).toEqual(new Set(['Draft', 'Scheduled', 'Published']));
    expect(JSON.parse(localStorage.getItem(POSTS_KEY))).toHaveLength(10);
  });
  it('round-trips edits deterministically', () => {
    const posts = loadPosts();
    posts[0].title = 'Edited';
    savePosts(posts);
    expect(loadPosts()[0].title).toBe('Edited');
  });
  it('recovers from corrupted storage', () => {
    localStorage.setItem(POSTS_KEY, '{bad json');
    expect(loadPosts()).toHaveLength(10);
  });
  it('persists settings', () => {
    saveSettings({ IDEA_GENERATION_WEBHOOK_URL: 'https://x.test/h' });
    expect(loadSettings().IDEA_GENERATION_WEBHOOK_URL).toBe('https://x.test/h');
  });
});

describe('generateIdeas', () => {
  it('uses standalone fallback with empty URL and never calls fetch', async () => {
    const f = vi.fn();
    const r = await generateIdeas(req, { IDEA_GENERATION_WEBHOOK_URL: '' }, { fetchImpl: f });
    expect(r.source).toBe('standalone');
    expect(r.ideas.length).toBe(10);
    expect(f).not.toHaveBeenCalled();
  });
  it('posts { topic, platform, audience } to n8n and normalizes the response', async () => {
    const f = okFetch({ ideas: [{ hook: 'Hook A', angle: 'X', outline: ['1'] }, 'Hook B'] });
    const r = await generateIdeas(
      req,
      { IDEA_GENERATION_WEBHOOK_URL: 'https://n8n.test/webhook/ideas' },
      { fetchImpl: f },
    );
    expect(r.source).toBe('n8n');
    expect(r.ideas).toHaveLength(4);
    expect(JSON.parse(f.mock.calls[0][1].body)).toEqual({
      topic: 'ABM',
      platform: 'LinkedIn',
      audience: 'CMOs',
    });
  });
  it('falls back when n8n is offline', async () => {
    const f = vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    });
    const r = await generateIdeas(
      req,
      { IDEA_GENERATION_WEBHOOK_URL: 'https://n8n.test/h' },
      { fetchImpl: f },
    );
    expect(r.source).toBe('standalone');
    expect(r.ideas.length).toBe(10);
    expect(r.error).toMatch(/fetch/);
  });
  it('falls back on non-2xx and on empty responses', async () => {
    const bad = vi.fn(async () => ({ ok: false, status: 500, text: async () => '' }));
    expect(
      (await generateIdeas(req, { IDEA_GENERATION_WEBHOOK_URL: 'https://n8n.test/h' }, { fetchImpl: bad }))
        .source,
    ).toBe('standalone');
    expect(
      (
        await generateIdeas(
          req,
          { IDEA_GENERATION_WEBHOOK_URL: 'https://n8n.test/h' },
          { fetchImpl: okFetch({}) },
        )
      ).source,
    ).toBe('standalone');
  });
});

describe('notifyPublish', () => {
  const post = { id: '1', title: 'T', status: 'Scheduled' };
  it('is standalone without URL', async () =>
    expect((await notifyPublish(post, {})).source).toBe('standalone'));
  it('sends full post payload with event type', async () => {
    const f = okFetch({});
    const r = await notifyPublish(post, { POST_PUBLISH_WEBHOOK_URL: 'https://n8n.test/p' }, { fetchImpl: f });
    const body = JSON.parse(f.mock.calls[0][1].body);
    expect(r.source).toBe('n8n');
    expect(body).toMatchObject({ event: 'post.scheduled', id: '1', title: 'T' });
  });
  it('degrades gracefully on failure', async () => {
    const f = vi.fn(async () => {
      throw new Error('down');
    });
    expect(
      (await notifyPublish(post, { POST_PUBLISH_WEBHOOK_URL: 'https://n8n.test/p' }, { fetchImpl: f }))
        .source,
    ).toBe('standalone');
  });
});

describe('build-time settings defaults', () => {
  it('reads VITE_* values, and anything saved in the browser wins', async () => {
    vi.resetModules();
    vi.stubEnv('VITE_IDEA_GENERATION_WEBHOOK_URL', 'https://env.test/ideas');
    vi.stubEnv('VITE_POST_PUBLISH_WEBHOOK_URL', '');
    const mod = await import('./storage.js');

    expect(mod.DEFAULT_SETTINGS.IDEA_GENERATION_WEBHOOK_URL).toBe('https://env.test/ideas');
    expect(mod.hasEnvDefaults()).toBe(true);
    expect(mod.loadSettings().IDEA_GENERATION_WEBHOOK_URL).toBe('https://env.test/ideas');

    mod.saveSettings({ POST_PUBLISH_WEBHOOK_URL: 'https://saved.test/p' });
    expect(mod.loadSettings().POST_PUBLISH_WEBHOOK_URL).toBe('https://saved.test/p');

    mod.saveTheme('dark');
    expect(mod.readTheme()).toBe('dark');
    vi.unstubAllEnvs();
  });
});
