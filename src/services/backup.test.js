import { describe, expect, it } from 'vitest';
import { BACKUP_VERSION, createBackup, isValidPost, parseBackup } from './backup.js';
import { createSeedPosts } from '../mockData/seed.js';

const posts = createSeedPosts(new Date('2026-06-15T12:00:00Z'));

describe('createBackup', () => {
  it('wraps posts and settings in a versioned envelope', () => {
    const b = createBackup(posts, { POST_PUBLISH_WEBHOOK_URL: '' }, new Date('2026-06-15T12:00:00Z'));
    expect(b).toMatchObject({
      app: 'content-studio',
      version: BACKUP_VERSION,
      exportedAt: '2026-06-15T12:00:00.000Z',
      settings: { POST_PUBLISH_WEBHOOK_URL: '' },
    });
    expect(b.posts).toHaveLength(10);
  });
});

describe('parseBackup', () => {
  it('round-trips an exported snapshot', () => {
    const parsed = parseBackup(JSON.stringify(createBackup(posts, { a: 'b' })));
    expect(parsed.posts).toHaveLength(10);
    expect(parsed.settings).toEqual({ a: 'b' });
  });

  it('accepts a bare posts array', () => {
    expect(parseBackup(JSON.stringify(posts)).posts).toHaveLength(10);
  });

  it('rejects invalid JSON, missing arrays and empty files', () => {
    expect(() => parseBackup('{nope')).toThrow(/not valid JSON/i);
    expect(() => parseBackup('{"posts":42}')).toThrow(/no posts array/i);
    expect(() => parseBackup('{"posts":[]}')).toThrow(/contains no posts/i);
  });

  it('rejects the whole file when any record is malformed', () => {
    const bad = [...posts, { id: 'x', title: '' }];
    expect(() => parseBackup(JSON.stringify(bad))).toThrow(/1 of 11 records are malformed/i);
  });
});

describe('isValidPost', () => {
  it('accepts seed records and rejects missing fields / unknown platforms', () => {
    expect(posts.every(isValidPost)).toBe(true);
    expect(isValidPost({ ...posts[0], platform: 'TikTok' })).toBe(false);
    expect(isValidPost({ ...posts[0], status: 'Archived' })).toBe(false);
    expect(isValidPost({ ...posts[0], tags: 'nope' })).toBe(false);
    expect(isValidPost({ ...posts[0], metrics: { views: 'many', engagement: 1 } })).toBe(false);
    expect(isValidPost(null)).toBeFalsy();
  });
});
