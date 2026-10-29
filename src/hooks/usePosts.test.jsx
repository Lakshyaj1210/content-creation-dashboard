// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { usePosts } from './usePosts.js';
import { loadPosts } from '../services/storage.js';

beforeEach(() => localStorage.clear());

describe('usePosts', () => {
  it('starts from storage and persists every mutation', () => {
    const { result } = renderHook(() => usePosts());
    expect(result.current.posts).toHaveLength(10);

    const first = result.current.posts[0];
    act(() => result.current.patch(first.id, { title: 'Patched' }));
    expect(result.current.posts.find((p) => p.id === first.id).title).toBe('Patched');
    expect(loadPosts().find((p) => p.id === first.id).title).toBe('Patched');
  });

  it('inserts new posts, replaces the collection and removes ids', () => {
    const { result } = renderHook(() => usePosts());
    const now = new Date().toISOString();
    const fresh = {
      id: 'new_1',
      title: 'Fresh',
      body: '',
      tags: [],
      platform: 'Blog',
      status: 'Draft',
      date: null,
      needsApproval: false,
      metrics: { views: 0, engagement: 0 },
      createdAt: now,
      updatedAt: now,
    };

    act(() => result.current.upsert(fresh));
    expect(result.current.posts[0].id).toBe('new_1');

    act(() => result.current.upsert({ ...fresh, title: 'Fresh v2' }));
    expect(result.current.posts[0].title).toBe('Fresh v2');
    expect(result.current.posts.filter((p) => p.id === 'new_1')).toHaveLength(1);

    act(() => result.current.remove('new_1'));
    expect(result.current.posts.some((p) => p.id === 'new_1')).toBe(false);

    act(() => result.current.replace([fresh]));
    expect(result.current.posts).toHaveLength(1);

    act(() => result.current.replace(null));
    expect(result.current.posts).toHaveLength(0);

    act(() => result.current.reset());
    expect(result.current.posts).toHaveLength(10);
  });
});
