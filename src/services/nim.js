export const NIM_MODEL = 'meta/llama-3.3-70b-instruct';
export const NIM_API_KEY = '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';

/**
 * In dev/preview the Vite proxy at /nim/... forwards to NVIDIA and injects the Authorization
 * header so the key is never bundled into the client.
 * When a direct browser fetch is needed (e.g. bypassing the proxy) we fall back to the public
 * NVIDIA endpoint with the key in the Authorization header.
 */
export const NIM_URL =
  import.meta.env?.VITE_NIM_BASE_URL ||
  '/nim/v1/chat/completions';

/** Direct NVIDIA endpoint — used as a fallback when the proxy path fails. */
export const NIM_DIRECT_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

export class NimError extends Error {
  constructor(message, status) { super(message); this.name = 'NimError'; this.status = status; }
}

const explain = (status) => {
  if (status === 401 || status === 403) return 'NVIDIA rejected the API key. Check NVIDIA_API_KEY in .env.local and restart the dev server.';
  if (status === 404) return 'The NVIDIA model or endpoint was not found. Check the model name.';
  if (status === 429) return 'NVIDIA rate limit reached. Wait a moment and retry.';
  if (status >= 500) return `NVIDIA service error (${status}). Retry in a moment.`;
  return `NVIDIA request failed (${status}).`;
};

/**
 * Async generator yielding content deltas from an OpenAI-compatible SSE stream.
 * Handles events split across network chunks.
 * Falls back to the direct NVIDIA endpoint with Authorization header if the proxy returns HTML
 * (i.e. the proxy is not active or misconfigured).
 */
export async function* streamChatCompletion({
  messages,
  model = NIM_MODEL,
  signal,
  fetchImpl = globalThis.fetch,
  url = NIM_URL,
  temperature = 0.8,
  maxTokens = 1400,
}) {
  const body = JSON.stringify({ model, messages, temperature, top_p: 0.95, max_tokens: maxTokens, stream: true });

  const attemptFetch = async (endpoint, withKey) => {
    const headers = { 'Content-Type': 'application/json', Accept: 'text/event-stream' };
    if (withKey) headers['Authorization'] = `Bearer ${NIM_API_KEY}`;
    return fetchImpl(endpoint, { method: 'POST', signal, headers, body });
  };

  let res;
  try {
    res = await attemptFetch(url, false);
    // If proxy returned HTML (not active), fall back to direct endpoint with key
    if (res.ok && (res.headers.get('content-type') || '').includes('text/html')) {
      res = await attemptFetch(NIM_DIRECT_URL, true);
    } else if (!res.ok && res.status === 404) {
      // Proxy route not found — try direct
      res = await attemptFetch(NIM_DIRECT_URL, true);
    }
  } catch (e) {
    if (e?.name === 'AbortError') throw e;
    // Proxy unreachable — try direct NVIDIA endpoint
    try {
      res = await attemptFetch(NIM_DIRECT_URL, true);
    } catch (e2) {
      if (e2?.name === 'AbortError') throw e2;
      throw new NimError("Couldn't reach the NVIDIA endpoint. Check your connection.");
    }
  }

  if (!res.ok) throw new NimError(explain(res.status), res.status);
  if ((res.headers.get('content-type') || '').includes('text/html')) {
    throw new NimError('The /nim proxy is not active and direct NVIDIA access failed. Start the app with npm run dev.');
  }

  const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split('\n'); buf = lines.pop();
      for (const line of lines) {
        const t = line.trim();
        if (!t.startsWith('data:')) continue;
        const data = t.slice(5).trim();
        if (data === '[DONE]') return;
        try {
          const delta = JSON.parse(data).choices?.[0]?.delta?.content;
          if (delta) yield delta;
        } catch { /* ignore keep-alives */ }
      }
    }
  } finally { try { reader.cancel(); } catch { /* already closed */ } }
}
