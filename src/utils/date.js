const p = (n) => String(n).padStart(2, '0');
export const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
export const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
export const startOfWeek = (d) => addDays(new Date(d.getFullYear(), d.getMonth(), d.getDate()), -d.getDay());
/** 6x7 grid of dates covering a month (Sunday first). */
export function monthGrid(year, month) {
  const first = new Date(year, month, 1);
  const start = addDays(first, -first.getDay());
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}
const fmt = (iso, o) => (iso ? new Date(iso).toLocaleString(undefined, o) : '—');
export const fmtDate = (iso) => fmt(iso, { month: 'short', day: 'numeric', year: 'numeric' });
export const fmtTime = (iso) => fmt(iso, { hour: 'numeric', minute: '2-digit' });
export const fmtDateTime = (iso) =>
  fmt(iso, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
export const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
export const fromLocalInput = (v) => (v ? new Date(v).toISOString() : null);
export const tomorrowAt = (h = 9) => {
  const d = addDays(new Date(), 1);
  d.setHours(h, 0, 0, 0);
  return d.toISOString();
};
