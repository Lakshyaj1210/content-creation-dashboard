import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays, LayoutDashboard, Library, ListTodo,
  Menu, Plus, Send, Settings, Sparkles, Webhook,
} from 'lucide-react';
import { usePosts } from './hooks/usePosts.js';
import { loadSettings, saveSettings, THEME_KEY } from './services/storage.js';
import { notifyPublish } from './services/publishService.js';
import { allTags, DEFAULT_FILTERS, filterPosts } from './utils/postFilters.js';
import { Toasts } from './components/ui.jsx';
import { ViewSkeleton } from './components/Skeleton.jsx';
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
  ['overview',  'Overview',       LayoutDashboard, 'Your content at a glance'],
  ['published', 'Published',      Send,            'Performance of live posts'],
  ['queue',     'Queue',          ListTodo,        'Drafts, approvals and scheduled posts'],
  ['calendar',  'Calendar',       CalendarDays,    'Everything on a timeline'],
  ['ideas',     'Idea Generator', Sparkles,        'Hooks and angles by channel'],
  ['library',   'All Content',    Library,         'Search, filter and manage every post'],
];

function useTheme() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem(THEME_KEY, 'dark');
  }, []);
}

export default function App() {
  const { posts, upsert, patch, remove, reset } = usePosts();
  const [settings, setSettings]         = useState(loadSettings);
  const [view, setView]                 = useState('overview');
  const [editor, setEditor]             = useState(null);
  const [detail, setDetail]             = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [navOpen, setNavOpen]           = useState(false);
  const [toasts, setToasts]             = useState([]);
  const [filters, setFilters]           = useState(DEFAULT_FILTERS);
  const [busy, setBusy]                 = useState(false);
  useTheme();

  const notify = useCallback((msg, tone = 'info') => {
    const id = Math.random();
    setToasts((t) => [...t, { id, msg, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  const sync = useCallback(async (post) => {
    if (post.status === 'Draft') return;
    const r = await notifyPublish(post, settings);
    notify(r.source === 'n8n' ? 'Sent to n8n' : 'Standalone mode', r.source === 'n8n' ? 'success' : 'info');
  }, [settings, notify]);

  const savePost = (draft) => {
    const saved = { ...draft, updatedAt: new Date().toISOString() };
    upsert(saved); setEditor(null); setDetail(null);
    notify(
      saved.status === 'Published' ? 'Published ✓' :
      saved.status === 'Scheduled' ? 'Scheduled ✓' : 'Draft saved',
      'success',
    );
    sync(saved);
  };

  const patchPost = (id, changes, message) => {
    const prev = posts.find((p) => p.id === id); if (!prev) return;
    const next = { ...prev, ...changes };
    if (changes.status === 'Published' && !changes.date && (!prev.date || new Date(prev.date) > new Date())) {
      changes = { ...changes, date: new Date().toISOString() }; next.date = changes.date;
    }
    if (changes.status === 'Scheduled' && !next.date) {
      changes = { ...changes, date: new Date(Date.now() + 864e5).toISOString() }; next.date = changes.date;
    }
    patch(id, changes); if (message) notify(message, 'success');
    if (changes.status && changes.status !== prev.status) sync(next);
  };

  const deletePost = (id) => { remove(id); setDetail(null); notify('Post deleted'); };
  const edit       = (post) => { setDetail(null); setEditor({ post }); };
  const useIdea    = (i) => setEditor({ defaults: { title: i.hook, platform: i.platform, body: i.outline.map((o) => `- ${o}`).join('\n'), tags: [] } });

  const tags    = useMemo(() => allTags(posts), [posts]);
  const visible = useMemo(() => filterPosts(posts, view === 'published' ? { ...filters, status: 'Published' } : filters), [posts, filters, view]);
  const [, title, , subtitle] = NAV.find((n) => n[0] === view);

  const go = (v) => {
    if (v !== view) { setBusy(true); setTimeout(() => setBusy(false), 280); }
    setView(v); setNavOpen(false);
    if (v === 'published') setFilters({ ...DEFAULT_FILTERS, sort: 'date-desc' });
  };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[220px_1fr]" style={{ background: '#07080b' }}>
      {/* Ambient emerald mesh */}
      <div className="aurora" aria-hidden="true"><i /><i /><i /></div>

      {/* Mobile overlay */}
      {navOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
          onClick={() => setNavOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[220px] glass-side flex flex-col p-4 lg:static lg:translate-x-0 ${navOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {/* Brand */}
        <div className="mb-7 flex items-center gap-3 px-1 pt-1">
          <div className="logo-glow"><Library size={15} color="#10b981" /></div>
          <span className="brand-text text-[15px]">Content Studio</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5" aria-label="Main">
          {NAV.map(([id, label, I]) => {
            const active = view === id;
            return (
              <button
                key={id}
                onClick={() => go(id)}
                aria-current={active ? 'page' : undefined}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${active ? 'nav-active font-medium' : 'text-[#475569] hover:bg-white/[0.04] hover:text-[#94a3b8]'}`}
                style={{ transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }}
              >
                <I size={15} />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Settings */}
        <button
          onClick={() => setShowSettings(true)}
          className="mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#475569] hover:bg-white/[0.04] hover:text-[#94a3b8]"
          style={{ transition: 'all 0.25s ease' }}
        >
          <Settings size={15} /><span>Settings</span>
        </button>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────── */}
      <div className="min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="topbar">
          <button className="btn-ghost !p-2 lg:hidden" onClick={() => setNavOpen(true)} aria-label="Open menu">
            <Menu size={18} />
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[15px] font-semibold tracking-tight" style={{ color: '#f1f5f9' }}>{title}</h1>
            <p className="hidden truncate text-xs sm:block" style={{ color: '#475569' }}>{subtitle}</p>
          </div>

          {/* Live AI indicator */}
          <span
            className="hidden sm:inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium"
            style={{ background: 'rgba(16,185,129,0.07)', borderColor: 'rgba(16,185,129,0.2)', color: '#34d399' }}
          >
            <i className="pdot pdot-live" style={{ color: '#10b981' }} />
            {settings.IDEA_GENERATION_WEBHOOK_URL ? 'Ideas via n8n' : 'Live AI · Llama 3.3 70B'}
          </span>

          <button
            className="btn-ghost !p-2"
            onClick={() => setShowSettings(true)}
            aria-label="Integration settings"
          >
            <Webhook size={16} />
          </button>

          {/* Magnetic New Post button */}
          <button className="btn-primary" onClick={() => setEditor({})}>
            <Plus size={15} />
            <span className="hidden sm:inline">New Post</span>
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 space-y-4 p-4 sm:p-6">
          {busy ? <ViewSkeleton view={view} /> : (
            <>
              {view === 'overview' && <Overview posts={posts} onOpen={setDetail} go={go} />}
              {view === 'queue'    && <KanbanQueue posts={posts} onOpen={setDetail} onPatch={patchPost} />}
              {view === 'calendar' && (
                <ContentCalendar
                  posts={posts}
                  onOpen={setDetail}
                  onCreate={(d) => {
                    d = new Date(d); d.setHours(9, 0, 0, 0);
                    setEditor({ defaults: { date: d.toISOString(), status: d > new Date() ? 'Scheduled' : 'Draft' } });
                  }}
                />
              )}
              {view === 'ideas' && (
                <IdeaGenerator settings={settings} notify={notify} onUseIdea={useIdea} />
              )}
              {(view === 'published' || view === 'library') && (
                <>
                  <FilterBar filters={filters} onChange={setFilters} tags={tags} hideStatus={view === 'published'} />
                  <div className="card overflow-hidden">
                    <PostTable
                      posts={visible}
                      manage={view === 'library'}
                      onOpen={setDetail}
                      onEdit={edit}
                      onDelete={deletePost}
                      onPatch={patchPost}
                    />
                  </div>
                  <p className="text-xs" style={{ color: '#475569' }}>
                    {visible.length} {visible.length === 1 ? 'post' : 'posts'}
                    {view === 'library' && ' · Double-click a title to rename it inline.'}
                  </p>
                </>
              )}
            </>
          )}
        </main>
      </div>

      {/* Overlays */}
      {detail && <PostDetail post={posts.find((p) => p.id === detail.id) || detail} onClose={() => setDetail(null)} onEdit={edit} onDelete={deletePost} />}
      {editor && <PostEditor post={editor.post} defaults={editor.defaults} onSave={savePost} onClose={() => setEditor(null)} />}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onClose={() => setShowSettings(false)}
          onResetData={() => { reset(); setShowSettings(false); notify('Demo data restored', 'success'); }}
          onSave={(s) => {
            setSettings(s); saveSettings(s); setShowSettings(false);
            notify(Object.values(s).some(Boolean) ? 'Settings saved' : 'Standalone mode active', 'success');
          }}
        />
      )}
      <Toasts toasts={toasts} />
    </div>
  );
}
