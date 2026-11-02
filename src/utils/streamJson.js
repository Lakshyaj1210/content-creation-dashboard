/**
 * Incrementally extracts completed objects from the `"ideas": [ ... ]` array of a streaming JSON
 * response. String/escape aware, so braces inside text never confuse it, and tolerant of
 * markdown fences or preamble before the JSON.
 */
export class IdeaStreamParser {
  constructor() { this.buf = ''; this.i = 0; this.started = false; this.done = false; this.depth = 0; this.inStr = false; this.esc = false; this.objStart = -1; }
  push(chunk) {
    const out = [];
    if (this.done) return out;
    this.buf += chunk;
    if (!this.started) {
      const m = /"ideas"\s*:\s*\[/.exec(this.buf);
      if (!m) return out;
      this.started = true; this.i = m.index + m[0].length;
    }
    for (; this.i < this.buf.length; this.i++) {
      const c = this.buf[this.i];
      if (this.inStr) { if (this.esc) this.esc = false; else if (c === '\\') this.esc = true; else if (c === '"') this.inStr = false; continue; }
      if (c === '"') { this.inStr = true; continue; }
      if (c === '{') { if (this.depth === 0) this.objStart = this.i; this.depth++; }
      else if (c === '}' && this.depth > 0) {
        this.depth--;
        if (this.depth === 0 && this.objStart >= 0) {
          try { out.push(JSON.parse(this.buf.slice(this.objStart, this.i + 1))); } catch { /* skip malformed object */ }
          this.objStart = -1;
        }
      } else if (c === ']' && this.depth === 0) { this.done = true; this.i++; break; }
    }
    return out;
  }
}

/** Last-resort parse of a complete response (fenced, wrapped in prose, or a bare array). */
export function parseLoose(text) {
  const clean = text.replace(/```(?:json)?/gi, '').trim();
  const tryParse = (s) => { try { return JSON.parse(s); } catch { return null; } };
  const slice = (open, close) => { const a = clean.indexOf(open); const b = clean.lastIndexOf(close); return a >= 0 && b > a ? clean.slice(a, b + 1) : ''; };
  const toList = (v) => (Array.isArray(v) ? v : Array.isArray(v?.ideas) ? v.ideas : []);
  for (const candidate of [clean, slice('[', ']'), slice('{', '}')]) {
    const list = candidate ? toList(tryParse(candidate)) : [];
    if (list.length) return list;
  }
  return [];
}
