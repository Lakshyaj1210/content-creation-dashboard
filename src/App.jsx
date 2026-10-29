import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  LayoutDashboard,
  Library,
  ListTodo,
  Menu,
  Moon,
  Plus,
  Send,
  Sparkles,
  Sun,
  Webhook,
} from 'lucide-react';
import { usePosts } from './hooks/usePosts.js';
import { loadSettings, readTheme, saveSettings, saveTheme } from './services/storage.js';
import { notifyPublish } from './services/publishService.js';
import { isValidUrl } from './services/http.js';
import { allTags, DEFAULT_FILTERS, filterPosts } from './utils/postFilters.js';
import { Toasts } from './components/ui.jsx';
import Overview from './components/Overview.jsx';
import PostTable from './components/PostTable.jsx';
import FilterBar from './components/FilterBar.jsx';
import KanbanQueue from './components/KanbanQueue.jsx';
import ContentCalendar from './components/ContentCalendar.jsx';
import IdeaGenerator from './components/IdeaGenerator.jsx';
import PostEditor from './components/PostEditor.jsx';
import PostDetail from './components/PostDetail.jsx';
import SettingsModal from './components/SettingsModal.jsx';

const NAV = [
  ['overview', 'Overview', LayoutDashboard, 'Your content at a glance'],
  ['published', 'Published', Send, 'Performance of live posts'],
  ['queue', 'Queue', ListTodo, 'Drafts, approvals and scheduled posts'],
  ['calendar', 'Calendar', CalendarDays, 'Everything on a timeline'],
  ['ideas', 'Idea generator', Sparkles, 'Hooks and angles by channel'],
  ['library', 'All content', Library, 'Search, filter and manage every post'],
];
const VIEW_IDS = new Set(NAV.map(([id]) => id));

/** Views live in the URL hash so a refresh or shared link lands in the same place. */
function viewFromHash() {
  if (typeof window === 'undefined') return 'overview';
  const raw = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  return VIEW_IDS.has(raw) ? raw : 'overview';
}

function useTheme() {
  const [theme, setTheme] = useState(() => {
    const stored = readTheme();
    if (stored === 'dark' || stored === 'light') return stored;
    const prefersDark =
      typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  });
  useEffect(() => {
    if (typeof document !== 'undefined') document.documentElement.classList.toggle('dark', theme === 'dark');
    saveTheme(theme);
  }, [theme]);
  return [theme, () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))];
}

export default function App() {
  const { posts, upsert, patch, remove, reset, replace } = usePosts();
  const [settings, setSettings] = useState(loadSettings);
  const [view, setView] = useState(viewFromHash);
  const [editor, setEditor] = useState(null); // { post?, defaults? }
  const [detail, setDetail] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [theme, toggleTheme] = useTheme();

  const notify = useCallback((msg, tone = 'info', action = null) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setToasts((t) => [...t, { id, msg, tone, action }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), action ? 6500 : 3500);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const sync = () => setView(viewFromHash());
    window.addEventListener('hashchange', sync);
    if (!window.location.hash) window.history.replaceState(null, '', '#/overview');
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  /** Single path for every status-changing write so n8n always hears about scheduled/published posts. */
  const sync = useCallback(
    async (post) => {
      if (post.status === 'Draft') return;
      const r = await notifyPublish(post, settings);
      if (r.source === 'n8n') return notify('Sent to n8n', 'success');
      if (r.error) return notify(`n8n unavailable: ${r.error}`, 'error');
      notify('Operating in standalone mode', 'info');
    },
    [settings, notify],
  );

  const savePost = (draft) => {
    const saved = { ...draft, updatedAt: new Date().toISOString() };
    upsert(saved);
    setEditor(null);
    setDetail(null);
    notify(
      saved.status === 'Published' ? 'Published' : saved.status === 'Scheduled' ? 'Scheduled' : 'Draft saved',
      'success',
    );
    sync(saved);
  };
  const patchPost = (id, changes, message) => {
    const prev = posts.find((p) => p.id === id);
    if (!prev) return;
    let next = { ...prev, ...changes };
    if (changes.status === 'Published' && !changes.date && (!prev.date || new Date(prev.date) > new Date())) {
      next = { ...next, date: new Date().toISOString() };
      changes = { ...changes, date: next.date };
    }
    if (changes.status === 'Scheduled' && !next.date) {
      next = { ...next, date: new Date(Date.now() + 864e5).toISOString() };
      changes = { ...changes, date: next.date };
    }
    patch(id, changes);
    if (message) notify(message, 'success');
    if (changes.status && changes.status !== prev.status) sync(next);
  };
  const deletePost = (id) => {
    const post = posts.find((p) => p.id === id);
    remove(id);
    setDetail(null);
    notify('Post deleted', 'info', post ? { label: 'Undo', onClick: () => upsert(post) } : null);
  };
  const edit = (post) => {
    setDetail(null);
    setEditor({ post });
  };
  const useIdea = (i) =>
    setEditor({
      defaults: {
        title: i.hook,
        platform: i.platform,
        body: i.outline.map((o) => `- ${o}`).join('\n'),
        tags: [],
      },
    });
  const connected = [settings.IDEA_GENERATION_WEBHOOK_URL, settings.POST_PUBLISH_WEBHOOK_URL].some((u) =>
    isValidUrl(String(u || '').trim()),
  );

  const tags = useMemo(() => allTags(posts), [posts]);
  const visible = useMemo(
    () => filterPosts(posts, view === 'published' ? { ...filters, status: 'Published' } : filters),
    [posts, filters, view],
  );
  const [, title, , subtitle] = NAV.find((n) => n[0] === view);

  const go = (v) => {
    if (!VIEW_IDS.has(v)) return;
    setView(v);
    setNavOpen(false);
    if (typeof window !== 'undefined') {
      const target = `#/${v}`;
      if (window.location.hash !== target) window.location.hash = target;
    }
    setFilters((f) =>
      v === 'published'
        ? { ...DEFAULT_FILTERS, sort: 'date-desc' }
        : f.status === 'Published'
          ? { ...f, status: 'All' }
          : f,
    );
  };

  const createOn = (d) => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (new Date(d).setHours(0, 0, 0, 0) < startOfToday.getTime()) {
      return setEditor({ defaults: { status: 'Draft', date: null } });
    }
    const at = new Date(d);
    at.setHours(9, 0, 0, 0);
    if (at <= now) at.setTime(now.getTime() + 36e5);
    setEditor({ defaults: { date: at.toISOString(), status: 'Scheduled' } });
  };

  const importBackup = (data) => {
    replace(data.posts);
    if (data.settings) {
      const next = { ...settings, ...data.settings };
      setSettings(next);
      saveSettings(next);
    }
    setShowSettings(false);
    notify(`Imported ${data.posts.length} ${data.posts.length === 1 ? 'post' : 'posts'}`, 'success');
  };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[232px_1fr]">
      {navOpen && (
        <div className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden" onClick={() => setNavOpen(false)} />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 border-r border-slate-200/70 bg-white/85 p-4 backdrop-blur-xl transition-transform dark:border-white/10 dark:bg-slate-900/85 lg:static lg:w-auto lg:translate-x-0 ${navOpen ? '' : '-translate-x-full'}`}
      >
        <div className="mb-6 flex items-center gap-2.5 px-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-white">
            <Library size={17} />
          </div>
          <span className="font-semibold tracking-tight">Content Studio</span>
        </div>
        <nav className="space-y-0.5" aria-label="Main">
          {NAV.map(([id, label, I]) => (
            <button
              key={id}
              onClick={() => go(id)}
              aria-current={view === id ? 'page' : undefined}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${view === id ? 'bg-indigo-600 font-medium text-white' : 'text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-white/10'}`}
            >
              <I size={17} />
              {label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-slate-200/70 bg-slate-100/80 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80 sm:px-6">
          <button
            className="btn-ghost !p-2 lg:hidden"
            onClick={() => setNavOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
            <p className="hidden truncate text-xs text-slate-500 sm:block">{subtitle}</p>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className={`badge hidden !px-2.5 !py-1 sm:inline-flex ${connected ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-slate-500/15 text-slate-600 dark:text-slate-300'}`}
          >
            <i className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            {connected ? 'n8n configured' : 'Standalone mode'}
          </button>
          <button
            className="btn-ghost !p-2"
            onClick={() => setShowSettings(true)}
            aria-label="n8n integration settings"
            title="n8n integration settings"
          >
            <Webhook size={18} />
          </button>
          <button className="btn-ghost !p-2" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="btn-primary" onClick={() => setEditor({})}>
            <Plus size={16} />
            <span className="hidden sm:inline">New post</span>
          </button>
        </header>

        <main className="space-y-4 p-4 sm:p-6">
          {view === 'overview' && <Overview posts={posts} onOpen={setDetail} go={go} />}
          {view === 'queue' && <KanbanQueue posts={posts} onOpen={setDetail} onPatch={patchPost} />}
          {view === 'calendar' && <ContentCalendar posts={posts} onOpen={setDetail} onCreate={createOn} />}
          {view === 'ideas' && <IdeaGenerator settings={settings} notify={notify} onUseIdea={useIdea} />}
          {(view === 'published' || view === 'library') && (
            <>
              <FilterBar
                filters={filters}
                onChange={setFilters}
                tags={tags}
                hideStatus={view === 'published'}
              />
              <div className="card overflow-hidden">
                <PostTable
                  posts={visible}
                  manage={view === 'library'}
                  sort={filters.sort}
                  onOpen={setDetail}
                  onEdit={edit}
                  onDelete={deletePost}
                  onPatch={patchPost}
                />
              </div>
              <p className="text-xs text-slate-500">
                {visible.length} {visible.length === 1 ? 'post' : 'posts'}
                {view === 'library' &&
                  ' · Double-click a title to rename it inline. Changes save automatically.'}
              </p>
            </>
          )}
        </main>
      </div>

      {detail && (
        <PostDetail
          post={posts.find((p) => p.id === detail.id) || detail}
          onClose={() => setDetail(null)}
          onEdit={edit}
          onDelete={deletePost}
        />
      )}
      {editor && (
        <PostEditor
          post={editor.post}
          defaults={editor.defaults}
          onSave={savePost}
          onClose={() => setEditor(null)}
        />
      )}
      {showSettings && (
        <SettingsModal
          settings={settings}
          posts={posts}
          onClose={() => setShowSettings(false)}
          onImport={importBackup}
          onResetData={() => {
            reset();
            setShowSettings(false);
            notify('Demo data restored', 'success');
          }}
          onSave={(s) => {
            setSettings(s);
            saveSettings(s);
            setShowSettings(false);
            notify(
              Object.values(s).some(Boolean)
                ? 'n8n settings saved'
                : 'Settings cleared. Using standalone mode',
              'success',
            );
          }}
        />
      )}
      <Toasts toasts={toasts} />
    </div>
  );
}
