export class WebhookError extends Error {
  constructor(message) {
    super(message);
    this.name = 'WebhookError';
  }
}

export const isValidUrl = (u) => {
  try {
    const x = new URL(u);
    return x.protocol === 'http:' || x.protocol === 'https:';
  } catch {
    return false;
  }
};

/** POST JSON with timeout. Always rejects with WebhookError so callers can fall back cleanly. */
export async function postJson(url, payload, { timeout = 8000, fetchImpl = globalThis.fetch } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new WebhookError(`Webhook responded with ${res.status}`);
    const text = await res.text();
    try {
      return text ? JSON.parse(text) : {};
    } catch {
      return {};
    }
  } catch (e) {
    if (e instanceof WebhookError) throw e;
    throw new WebhookError(e?.name === 'AbortError' ? 'Webhook timed out' : e?.message || 'Network error');
  } finally {
    clearTimeout(timer);
  }
}
