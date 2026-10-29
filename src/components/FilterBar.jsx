import { Search } from 'lucide-react';
import { PLATFORMS, STATUSES } from '../types/index.js';
import { SORTS } from '../utils/postFilters.js';

export default function FilterBar({ filters, onChange, tags, hideStatus }) {
  const set = (k) => (e) => onChange({ ...filters, [k]: e.target.value });
  const Sel = ({ k, label, options }) => (
    <select aria-label={label} className="input !w-auto" value={filters[k]} onChange={set(k)}>
      {options.map((o) =>
        Array.isArray(o) ? (
          <option key={o[0]} value={o[0]}>
            {o[1]}
          </option>
        ) : (
          <option key={o}>{o}</option>
        ),
      )}
    </select>
  );
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[200px] flex-1">
        <Search
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          className="input !pl-9"
          placeholder="Search titles, copy and tags"
          value={filters.q}
          onChange={set('q')}
          aria-label="Search posts"
        />
      </div>
      {!hideStatus && <Sel k="status" label="Status" options={['All', ...STATUSES]} />}
      <Sel k="platform" label="Platform" options={['All', ...PLATFORMS]} />
      <Sel k="tag" label="Tag" options={['All', ...tags]} />
      <Sel k="sort" label="Sort" options={SORTS} />
    </div>
  );
}
