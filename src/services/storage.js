import { createSeedPosts } from '../mockData/seed.js';

export const POSTS_KEY = 'ccm.posts.v1';
export const SETTINGS_KEY = 'ccm.settings.v1';
export const THEME_KEY = 'ccm.theme';

export const uid = () => `p_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

const read = (key) => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
};
const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};

/** Reads a build-time Vite variable without crashing outside a browser bundle. */
const env = (key) => {
  try {
    return String(import.meta.env?.[key] ?? '').trim();
  } catch {
    return '';
  }
};

/** Loads posts; seeds 10 realistic records on first run (or if storage is corrupted). */
export function loadPosts() {
  const stored = read(POSTS_KEY);
  if (Array.isArray(stored)) return stored;
  const seeded = createSeedPosts();
  write(POSTS_KEY, seeded);
  return seeded;
}
export const savePosts = (posts) => write(POSTS_KEY, posts);
export function resetPosts() {
  const s = createSeedPosts();
  write(POSTS_KEY, s);
  return s;
}

/**
 * `.env` values are build-time defaults only. Anything saved from the settings
 * modal wins, so a user can point one browser at a different workflow.
 */
export const DEFAULT_SETTINGS = Object.freeze({
  IDEA_GENERATION_WEBHOOK_URL: env('VITE_IDEA_GENERATION_WEBHOOK_URL'),
  POST_PUBLISH_WEBHOOK_URL: env('VITE_POST_PUBLISH_WEBHOOK_URL'),
});

export const hasEnvDefaults = () =>
  Boolean(DEFAULT_SETTINGS.IDEA_GENERATION_WEBHOOK_URL || DEFAULT_SETTINGS.POST_PUBLISH_WEBHOOK_URL);

export const loadSettings = () => ({ ...DEFAULT_SETTINGS, ...(read(SETTINGS_KEY) || {}) });
export const saveSettings = (s) => write(SETTINGS_KEY, s);

export const readTheme = () => {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
};
export const saveTheme = (theme) => {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* storage can be full or blocked; the UI still works for this session */
  }
};
