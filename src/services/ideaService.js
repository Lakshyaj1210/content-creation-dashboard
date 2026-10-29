import { generateMockIdeas } from '../mockData/ideas.js';
import { isValidUrl, postJson, WebhookError } from './http.js';
import { uid } from './storage.js';

/** Accepts [{...}], ["hook"], {ideas:[...]} or {data:[...]} from n8n. */
export function normalizeIdeas(raw, platform) {
  const list = Array.isArray(raw) ? raw : raw?.ideas ?? raw?.data ?? [];
  return list
    .map((it, i) => typeof it === 'string'
      ? { id: uid(), angle: `Angle ${i + 1}`, hook: it, outline: [], platform }
      : {
          id: it.id ?? uid(), angle: it.angle ?? `Angle ${i + 1}`,
          hook: it.hook ?? it.title ?? it.idea ?? '',
          outline: Array.isArray(it.outline) ? it.outline : [], platform: it.platform ?? platform,
        })
    .filter((i) => i.hook);
}

/**
 * Calls n8n per selected channel. Falls back to realistic mock ideas if the URL is empty,
 * invalid, offline, errors, or returns nothing.
 * @returns {Promise<{ideas: import('../types').Idea[], source: 'n8n'|'standalone', error?: string}>}
 */
export async function generateIdeas({ topic, platforms, audience }, settings, opts = {}) {
  const url = settings?.IDEA_GENERATION_WEBHOOK_URL?.trim();
  const fallback = () => platforms.flatMap((platform) => generateMockIdeas({ topic, platform, audience }));
  if (!url || !isValidUrl(url)) return { ideas: fallback(), source: 'standalone' };
  try {
    const results = await Promise.all(
      platforms.map(async (platform) =>
        normalizeIdeas(await postJson(url, { topic, platform, audience }, opts), platform)),
    );
    const ideas = results.flat();
    if (!ideas.length) throw new WebhookError('Webhook returned no ideas');
    return { ideas, source: 'n8n' };
  } catch (e) {
    return { ideas: fallback(), source: 'standalone', error: e.message };
  }
}
