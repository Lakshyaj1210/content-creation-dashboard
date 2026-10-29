// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App.jsx';
import { createSeedPosts } from '../mockData/seed.js';
import { Modal } from './ui.jsx';
import PostTable from './PostTable.jsx';
import PostEditor from './PostEditor.jsx';
import KanbanQueue from './KanbanQueue.jsx';
import SettingsModal from './SettingsModal.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';

const noop = () => {};
const posts = createSeedPosts(new Date('2026-06-15T12:00:00Z'));
const published = posts.filter((p) => p.status === 'Published');
const draft = posts.find((p) => p.status === 'Draft' && !p.needsApproval);

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, '', '/');
});

function ModalHarness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open settings</button>
      {open && (
        <Modal title="Demo dialog" onClose={() => setOpen(false)} footer={<button>Save</button>}>
          <button>Inside</button>
        </Modal>
      )}
    </>
  );
}

describe('Modal focus management', () => {
  it('moves focus in, traps Tab, closes on Escape and restores focus', async () => {
    const user = userEvent.setup();
    render(<ModalHarness />);
    const trigger = screen.getByRole('button', { name: 'Open settings' });
    await user.click(trigger);

    const dialog = screen.getByRole('dialog', { name: 'Demo dialog' });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.contains(document.activeElement)).toBe(true);

    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Save' })).toBe(document.activeElement);

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});

describe('PostEditor', () => {
  it('blocks empty titles and normalises tags on save', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<PostEditor onSave={onSave} onClose={noop} />);

    await user.click(screen.getByRole('button', { name: 'Save draft' }));
    expect(screen.getByRole('alert').textContent).toMatch(/add a title/i);
    expect(onSave).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText('Title'), '  Launch note  ');
    await user.type(screen.getByLabelText('Tags'), 'Big Idea{Enter}');
    expect(screen.getByText('#big-idea')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Save draft' }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0]).toMatchObject({ title: 'Launch note', tags: ['big-idea'] });
  });

  it('supports markdown shortcuts and scheduling', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<PostEditor onSave={onSave} onClose={noop} />);

    await user.type(screen.getByLabelText('Title'), 'Scheduled post');
    await user.click(screen.getByRole('button', { name: /^Scheduled$/ }));
    await user.click(screen.getByRole('button', { name: 'Bold' }));
    expect(screen.getByLabelText('Body (Markdown)').value).toContain('**text**');

    await user.click(screen.getByRole('button', { name: 'Save and schedule' }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'Scheduled', title: 'Scheduled post' }),
    );
    expect(Date.parse(onSave.mock.calls[0][0].date)).toBeGreaterThan(Date.now());
  });
});

describe('KanbanQueue keyboard moves', () => {
  it('offers a select that moves a card between columns', async () => {
    const user = userEvent.setup();
    const onPatch = vi.fn();
    render(<KanbanQueue posts={[draft]} onOpen={noop} onPatch={onPatch} />);

    const select = screen.getByLabelText(`Move ${draft.title} to another column`);
    await user.selectOptions(select, 'scheduled');

    expect(onPatch).toHaveBeenCalledWith(
      draft.id,
      expect.objectContaining({ status: 'Scheduled' }),
      'Moved to scheduled',
    );
  });

  it('runs the approval and publish actions for each column', async () => {
    const user = userEvent.setup();
    const onPatch = vi.fn();
    const pending = posts.find((p) => p.status === 'Draft' && p.needsApproval);
    const scheduledPost = posts.find((p) => p.status === 'Scheduled');
    render(<KanbanQueue posts={[draft, pending, scheduledPost]} onOpen={noop} onPatch={onPatch} />);

    await user.click(screen.getByRole('button', { name: /request approval/i }));
    expect(onPatch).toHaveBeenCalledWith(draft.id, { needsApproval: true }, 'Sent for approval');

    await user.click(screen.getByRole('button', { name: /approve & schedule/i }));
    expect(onPatch).toHaveBeenCalledWith(
      pending.id,
      expect.objectContaining({ status: 'Scheduled', needsApproval: false }),
      'Approved and scheduled',
    );

    await user.click(screen.getByRole('button', { name: /publish now/i }));
    expect(onPatch).toHaveBeenCalledWith(
      scheduledPost.id,
      expect.objectContaining({ status: 'Published' }),
      'Published',
    );
  });
});

describe('PostTable sorting semantics', () => {
  it('exposes aria-sort that follows the active filter', () => {
    const { rerender } = render(
      <PostTable
        posts={published}
        sort="views-desc"
        onOpen={noop}
        onEdit={noop}
        onDelete={noop}
        onPatch={noop}
      />,
    );
    expect(screen.getByRole('columnheader', { name: 'Views' }).getAttribute('aria-sort')).toBe('descending');

    rerender(
      <PostTable
        posts={published}
        sort="date-asc"
        onOpen={noop}
        onEdit={noop}
        onDelete={noop}
        onPatch={noop}
      />,
    );
    expect(screen.getByRole('columnheader', { name: 'Published' }).getAttribute('aria-sort')).toBe(
      'ascending',
    );
  });
});

describe('SettingsModal backup import', () => {
  it('reports malformed files without changing data', async () => {
    const user = userEvent.setup();
    const onImport = vi.fn();
    render(
      <SettingsModal
        settings={{ IDEA_GENERATION_WEBHOOK_URL: '', POST_PUBLISH_WEBHOOK_URL: '' }}
        posts={posts}
        onSave={noop}
        onClose={noop}
        onResetData={noop}
        onImport={onImport}
      />,
    );

    const input = screen.getByLabelText('Import backup file');
    await user.upload(input, new File(['not json'], 'backup.json', { type: 'application/json' }));

    expect(await screen.findByText(/not valid JSON/i)).toBeTruthy();
    expect(onImport).not.toHaveBeenCalled();
  });
});

describe('App', () => {
  it('keeps the view in the URL hash and clears the published filter on the way out', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Calendar' }));
    expect(window.location.hash).toBe('#/calendar');

    await user.click(screen.getByRole('button', { name: 'Published' }));
    expect(window.location.hash).toBe('#/published');

    await user.click(screen.getByRole('button', { name: 'All content' }));
    expect(window.location.hash).toBe('#/library');
    expect(screen.getByLabelText('Status').value).toBe('All');
  });

  it('undoes a delete from the toast', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('confirm', () => true);
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'All content' }));
    const title = posts[0].title;
    expect(screen.getAllByText(title).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: `Delete ${title}` }));
    expect(screen.queryByText(title)).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(screen.getAllByText(title).length).toBeGreaterThan(0);
  });
});

describe('ErrorBoundary', () => {
  it('renders children normally and a recovery screen after a crash', () => {
    const { unmount } = render(
      <ErrorBoundary>
        <p>All good</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText('All good')).toBeTruthy();
    unmount();

    const boundary = new ErrorBoundary({ children: null });
    boundary.state = { error: new Error('kaboom') };
    render(boundary.render());
    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText('kaboom')).toBeTruthy();
  });

  it('derives error state from a thrown child', () => {
    expect(ErrorBoundary.getDerivedStateFromError(new Error('boom'))).toEqual({
      error: expect.any(Error),
    });
  });
});
