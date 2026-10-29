// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App.jsx';
import { createSeedPosts } from '../mockData/seed.js';
import { createBackup } from '../services/backup.js';
import { DEFAULT_SETTINGS } from '../services/storage.js';
import Overview from './Overview.jsx';
import PostTable from './PostTable.jsx';
import PostDetail from './PostDetail.jsx';
import ContentCalendar from './ContentCalendar.jsx';
import IdeaGenerator from './IdeaGenerator.jsx';
import SettingsModal from './SettingsModal.jsx';

const noop = () => {};
const posts = createSeedPosts(new Date('2026-06-15T12:00:00Z'));
const published = posts.filter((p) => p.status === 'Published');

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, '', '/');
});

describe('App navigation', () => {
  it('renders every section and honours a deep link', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    expect(screen.getByText('Total views')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Queue' }));
    expect(screen.getByRole('heading', { name: 'Drafts' })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Calendar' }));
    expect(screen.getByRole('button', { name: 'Today' })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Idea generator' }));
    expect(screen.getByRole('button', { name: /generate ideas/i })).toBeTruthy();
    unmount();

    window.history.replaceState(null, '', '/#/calendar');
    render(<App />);
    expect(screen.getByRole('button', { name: 'Today' })).toBeTruthy();
  });

  it('creates a post from the editor and toggles the theme', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Toggle theme' }));
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    await user.click(screen.getByRole('button', { name: /new post/i }));
    await user.type(screen.getByLabelText('Title'), 'Fresh launch note');
    await user.click(screen.getByRole('button', { name: 'Save draft' }));
    expect(await screen.findByText('Draft saved')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'All content' }));
    expect(screen.getAllByText('Fresh launch note').length).toBeGreaterThan(0);
  });

  it('saves webhook settings and marks the app connected', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'n8n integration settings' }));
    await user.type(screen.getByLabelText('IDEA_GENERATION_WEBHOOK_URL'), 'https://n8n.test/ideas');
    await user.click(screen.getByRole('button', { name: 'Save settings' }));

    expect(await screen.findByText('n8n settings saved')).toBeTruthy();
    expect(screen.getByText('n8n configured')).toBeTruthy();
  });

  it('opens the editor from a calendar day', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Calendar' }));

    const addButtons = screen.getAllByRole('button', { name: /new post on/i });
    await user.click(addButtons[20]);
    expect(screen.getByRole('dialog', { name: 'New post' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('publishes immediately and reports standalone mode', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /new post/i }));
    const dialog = screen.getByRole('dialog', { name: 'New post' });
    await user.type(screen.getByLabelText('Title'), 'Publish ready');
    await user.click(within(dialog).getByRole('button', { name: /^Published$/ }));
    await user.click(within(dialog).getByRole('button', { name: 'Save and publish' }));

    expect(await screen.findByText('Operating in standalone mode')).toBeTruthy();
  });

  it('imports a backup from the settings modal', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'n8n integration settings' }));
    const imported = { ...posts[0], id: 'imported_1', title: 'Imported post' };
    const file = new File([JSON.stringify(createBackup([imported], {}))], 'backup.json', {
      type: 'application/json',
    });
    await user.upload(screen.getByLabelText('Import backup file'), file);

    expect(await screen.findByText('Imported 1 post')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'All content' }));
    expect(screen.getAllByText('Imported post').length).toBeGreaterThan(0);
  });
});

describe('Overview', () => {
  it('opens a post and jumps to a section from a stat card', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const go = vi.fn();
    render(<Overview posts={posts} onOpen={onOpen} go={go} />);

    await user.click(screen.getByRole('button', { name: /Total views/ }));
    expect(go).toHaveBeenCalledWith('published');

    await user.click(screen.getByRole('button', { name: /Hot take: your case studies/ }));
    expect(onOpen).toHaveBeenCalled();
  });
});

describe('PostTable actions', () => {
  it('opens, edits and deletes from the published view', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    vi.stubGlobal('confirm', () => true);
    const post = published[0];
    render(<PostTable posts={[post]} onOpen={onOpen} onEdit={onEdit} onDelete={onDelete} onPatch={noop} />);

    await user.click(screen.getByRole('button', { name: `View ${post.title}` }));
    expect(onOpen).toHaveBeenCalledWith(post);

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    expect(onEdit).toHaveBeenCalledWith(post);

    await user.click(screen.getByRole('button', { name: `Delete ${post.title}` }));
    expect(onDelete).toHaveBeenCalledWith(post.id);
  });

  it('changes status, renames inline and opens the editor in manage mode', async () => {
    const user = userEvent.setup();
    const onPatch = vi.fn();
    const onEdit = vi.fn();
    const post = posts.find((p) => p.status === 'Draft');
    render(
      <PostTable posts={[post]} manage onOpen={noop} onEdit={onEdit} onDelete={noop} onPatch={onPatch} />,
    );

    await user.selectOptions(screen.getByLabelText('Change status'), 'Scheduled');
    expect(onPatch).toHaveBeenCalledWith(post.id, { status: 'Scheduled', needsApproval: false });

    await user.click(screen.getByRole('button', { name: 'Rename inline' }));
    const input = screen.getByLabelText('Edit title');
    await user.clear(input);
    await user.type(input, 'Renamed post{Enter}');
    expect(onPatch).toHaveBeenCalledWith(post.id, { title: 'Renamed post' });

    await user.click(screen.getByRole('button', { name: 'Open editor' }));
    expect(onEdit).toHaveBeenCalledWith(post);
  });
});

describe('PostDetail', () => {
  it('edits and confirms deletion', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    vi.stubGlobal('confirm', () => true);
    const post = published[0];
    render(<PostDetail post={post} onClose={noop} onEdit={onEdit} onDelete={onDelete} />);

    expect(screen.getByText('Engagement rate')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Edit post' }));
    expect(onEdit).toHaveBeenCalledWith(post);

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onDelete).toHaveBeenCalledWith(post.id);
  });
});

describe('ContentCalendar', () => {
  it('switches to week view, pages and creates/opens posts', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    const onOpen = vi.fn();
    const scheduled = { ...posts[4], date: new Date().toISOString() };
    render(<ContentCalendar posts={[scheduled]} onCreate={onCreate} onOpen={onOpen} />);

    await user.click(screen.getByRole('button', { name: /The 5-minute security questionnaire/ }));
    expect(onOpen).toHaveBeenCalledWith(scheduled);

    await user.click(screen.getByRole('tab', { name: 'week' }));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(screen.getAllByRole('button', { name: /new post on/i })[0]);
    expect(onCreate).toHaveBeenCalled();
  });
});

describe('IdeaGenerator', () => {
  it('generates standalone ideas and hands one to the editor', async () => {
    const user = userEvent.setup();
    const notify = vi.fn();
    const onUseIdea = vi.fn();
    render(<IdeaGenerator settings={DEFAULT_SETTINGS} notify={notify} onUseIdea={onUseIdea} />);

    expect(screen.getByRole('button', { name: /generate ideas/i }).disabled).toBe(true);

    await user.type(screen.getByLabelText('Topic or keywords'), 'ABM');
    await user.click(screen.getByRole('button', { name: /generate ideas/i }));

    await waitFor(() => expect(screen.getAllByRole('button', { name: 'Draft this' })).toHaveLength(10));
    expect(notify).toHaveBeenCalledWith('Operating in standalone mode', 'info');

    await user.click(screen.getAllByRole('button', { name: 'Draft this' })[0]);
    expect(onUseIdea).toHaveBeenCalledWith(
      expect.objectContaining({ hook: expect.any(String), outline: expect.any(Array) }),
    );
  });
});

describe('SettingsModal', () => {
  it('validates URLs before saving', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <SettingsModal
        settings={DEFAULT_SETTINGS}
        posts={posts}
        onSave={onSave}
        onClose={noop}
        onResetData={noop}
      />,
    );
    const input = screen.getByLabelText('POST_PUBLISH_WEBHOOK_URL');
    await user.type(input, 'not-a-url');
    expect(screen.getByRole('button', { name: 'Save settings' }).disabled).toBe(true);

    await user.clear(input);
    await user.type(input, '  https://n8n.test/publish  ');
    await user.click(screen.getByRole('button', { name: 'Save settings' }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ POST_PUBLISH_WEBHOOK_URL: 'https://n8n.test/publish' }),
    );
  });

  it('imports a valid backup', async () => {
    const user = userEvent.setup();
    const onImport = vi.fn();
    render(
      <SettingsModal
        settings={DEFAULT_SETTINGS}
        posts={posts}
        onSave={noop}
        onClose={noop}
        onResetData={noop}
        onImport={onImport}
      />,
    );
    const file = new File([JSON.stringify(createBackup(posts, {}))], 'backup.json', {
      type: 'application/json',
    });
    await user.upload(screen.getByLabelText('Import backup file'), file);
    await waitFor(() => expect(onImport).toHaveBeenCalledTimes(1));
    expect(onImport.mock.calls[0][0].posts).toHaveLength(10);
  });

  it('exports a JSON snapshot', async () => {
    const user = userEvent.setup();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:test') });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
    render(
      <SettingsModal
        settings={DEFAULT_SETTINGS}
        posts={posts}
        onSave={noop}
        onClose={noop}
        onResetData={noop}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Export JSON' }));
    expect(screen.getByText('Exported 10 posts.')).toBeTruthy();
  });
});
