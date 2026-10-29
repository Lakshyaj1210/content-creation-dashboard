const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const inline = (s) =>
  esc(s)
    .replace(/`([^`]+)`/g, '<code class="rounded bg-slate-200/70 px-1 dark:bg-white/10">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noreferrer noopener" class="text-indigo-500 underline">$1</a>',
    );

/** Minimal, XSS-safe markdown → HTML (headings, lists, bold, italic, code, links). */
export function renderMarkdown(src = '') {
  const out = [];
  let list = false;
  const close = () => {
    if (list) {
      out.push('</ul>');
      list = false;
    }
  };
  for (const line of src.split('\n')) {
    const h = line.match(/^(#{1,3})\s+(.*)/);
    const li = line.match(/^\s*[-*]\s+(.*)/);
    if (li) {
      if (!list) {
        out.push('<ul class="my-1 list-disc pl-5">');
        list = true;
      }
      out.push(`<li>${inline(li[1])}</li>`);
      continue;
    }
    close();
    if (h) out.push(`<h${h[1].length} class="mt-2 font-semibold">${inline(h[2])}</h${h[1].length}>`);
    else if (!line.trim()) out.push('<div class="h-2"></div>');
    else out.push(`<p>${inline(line)}</p>`);
  }
  close();
  return out.join('');
}

export const stripMarkdown = (s = '') =>
  s
    .replace(/^#{1,3}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^\s*[-*]\s+/gm, '• ');

/** Split text into ≤limit chunks on word boundaries (Twitter/X thread preview). */
export function chunkText(text, limit = 280) {
  const words = text.split(/(\s+)/);
  const chunks = [];
  let cur = '';
  for (const w of words) {
    if ((cur + w).length > limit && cur.trim()) {
      chunks.push(cur.trim());
      cur = '';
    }
    cur += w;
  }
  if (cur.trim()) chunks.push(cur.trim());
  return chunks.length ? chunks : [''];
}
