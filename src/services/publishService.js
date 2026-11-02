import { isValidUrl, postJson } from './http.js';

/** Notifies n8n when a post is scheduled/published. Never throws; reports which mode was used. */
export async function notifyPublish(post, settings, opts = {}) {
  const url = settings?.POST_PUBLISH_WEBHOOK_URL?.trim();
  if (!url || !isValidUrl(url)) return { source: 'standalone' };
  try {
    await postJson(url, {
      event: post.status === 'Published' ? 'post.published' : 'post.scheduled',
      sentAt: new Date().toISOString(), ...post,
    }, opts);
    return { source: 'n8n' };
  } catch (e) {
    return { source: 'standalone', error: e.message };
  }
}
