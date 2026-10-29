import { beforeAll, describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { createSeedPosts } from '../mockData/seed.js';
import { DEFAULT_SETTINGS } from '../services/storage.js';
import Overview from './Overview.jsx';
import PostTable from './PostTable.jsx';
import KanbanQueue from './KanbanQueue.jsx';
import ContentCalendar from './ContentCalendar.jsx';
import IdeaGenerator from './IdeaGenerator.jsx';
import PostEditor from './PostEditor.jsx';
import PostDetail from './PostDetail.jsx';
import SettingsModal from './SettingsModal.jsx';
import PlatformPreview from './PlatformPreview.jsx';
import App from '../App.jsx';

const posts = createSeedPosts();
const noop = () => {};

beforeAll(() => {
  const s = {};
  globalThis.localStorage = {
    getItem: (k) => s[k] ?? null,
    setItem: (k, v) => {
      s[k] = String(v);
    },
  };
  globalThis.matchMedia = () => ({ matches: false });
  globalThis.document = { documentElement: { classList: { toggle: noop } }, body: { style: {} } };
});

describe('components render without runtime errors', () => {
  it('Overview', () =>
    expect(renderToString(<Overview posts={posts} onOpen={noop} go={noop} />)).toContain('Total views'));
  it('PostTable (published + manage)', () => {
    expect(
      renderToString(
        <PostTable
          posts={posts.filter((p) => p.status === 'Published')}
          onOpen={noop}
          onEdit={noop}
          onDelete={noop}
          onPatch={noop}
        />,
      ),
    ).toContain('Hot take');
    expect(
      renderToString(
        <PostTable posts={posts} manage onOpen={noop} onEdit={noop} onDelete={noop} onPatch={noop} />,
      ),
    ).toContain('Pending approval');
  });
  it('PostTable empty state', () =>
    expect(renderToString(<PostTable posts={[]} onOpen={noop} />)).toContain('No posts match'));
  it('KanbanQueue shows three columns', () => {
    const h = renderToString(<KanbanQueue posts={posts} onOpen={noop} onPatch={noop} />);
    ['Drafts', 'Pending approval', 'Scheduled'].forEach((c) => expect(h).toContain(c));
  });
  it('ContentCalendar', () =>
    expect(renderToString(<ContentCalendar posts={posts} onOpen={noop} onCreate={noop} />)).toContain(
      'Today',
    ));
  it('IdeaGenerator', () =>
    expect(
      renderToString(<IdeaGenerator settings={DEFAULT_SETTINGS} notify={noop} onUseIdea={noop} />),
    ).toContain('Generate ideas'));
  it('PostEditor with live previews', () => {
    expect(renderToString(<PostEditor post={posts[0]} onSave={noop} onClose={noop} />)).toContain(
      'Live preview',
    );
    expect(renderToString(<PlatformPreview post={{ ...posts[2] }} />)).toContain('/280');
  });
  it('PostDetail + SettingsModal', () => {
    expect(
      renderToString(<PostDetail post={posts[0]} onClose={noop} onEdit={noop} onDelete={noop} />),
    ).toContain('Engagement rate');
    expect(
      renderToString(
        <SettingsModal settings={DEFAULT_SETTINGS} onSave={noop} onClose={noop} onResetData={noop} />,
      ),
    ).toContain('IDEA_GENERATION_WEBHOOK_URL');
  });
  it('App shell', () => expect(renderToString(<App />)).toContain('Content Studio'));
});
