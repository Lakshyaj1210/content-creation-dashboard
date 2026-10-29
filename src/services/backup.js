import { PLATFORMS, STATUSES } from '../types/index.js';

export const BACKUP_VERSION = 1;

/** Pure, serialisable snapshot so a user can move data between browsers. */
export function createBackup(posts, settings, now = new Date()) {
  return {
    app: 'content-studio',
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    settings: settings || {},
    posts,
  };
}

const isString = (v) => typeof v === 'string';

/** Structural check — enough to reject junk without silently dropping fields. */
export function isValidPost(p) {
  return (
    p &&
    typeof p === 'object' &&
    isString(p.id) &&
    isString(p.title) &&
    p.title.trim().length > 0 &&
    isString(p.body) &&
    Array.isArray(p.tags) &&
    p.tags.every(isString) &&
    PLATFORMS.includes(p.platform) &&
    STATUSES.includes(p.status) &&
    (p.date === null || isString(p.date)) &&
    (p.metrics === undefined ||
      (typeof p.metrics === 'object' &&
        Number.isFinite(p.metrics.views) &&
        Number.isFinite(p.metrics.engagement)))
  );
}

/**
 * Accepts either a full backup object or a bare array of posts.
 * @returns {{posts: import('../types').Post[], settings: object|null}}
 */
export function parseBackup(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON.');
  }
  const posts = Array.isArray(data) ? data : data?.posts;
  if (!Array.isArray(posts)) throw new Error('The backup file has no posts array.');
  if (!posts.length) throw new Error('The backup file contains no posts.');

  const invalid = posts.filter((p) => !isValidPost(p));
  if (invalid.length) {
    throw new Error(`${invalid.length} of ${posts.length} records are malformed. Nothing was imported.`);
  }
  return {
    posts,
    settings: data?.settings && typeof data.settings === 'object' ? data.settings : null,
  };
}
