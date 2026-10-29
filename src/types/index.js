/**
 * @typedef {'Draft'|'Scheduled'|'Published'} PostStatus
 * @typedef {'LinkedIn'|'Twitter'|'YouTube'|'Blog'|'Newsletter'} Platform
 * @typedef {{ views: number, engagement: number }} PostMetrics
 * @typedef {Object} Post
 * @property {string} id
 * @property {string} title
 * @property {string} body            Markdown
 * @property {string[]} tags
 * @property {Platform} platform
 * @property {PostStatus} status
 * @property {string|null} date       ISO – scheduled time, or publish time when Published
 * @property {boolean} needsApproval  Only meaningful for Drafts
 * @property {PostMetrics} metrics
 * @property {string} createdAt
 * @property {string} updatedAt
 *
 * @typedef {Object} Idea
 * @property {string} id
 * @property {string} angle
 * @property {string} hook
 * @property {string[]} outline
 * @property {Platform} platform
 */

export const STATUSES = ['Draft', 'Scheduled', 'Published'];
export const PLATFORMS = ['LinkedIn', 'Twitter', 'YouTube', 'Blog', 'Newsletter'];
export const IDEA_CHANNELS = ['LinkedIn', 'Twitter', 'Blog', 'Newsletter'];
export const SETTINGS_KEYS = {
  idea: 'IDEA_GENERATION_WEBHOOK_URL',
  publish: 'POST_PUBLISH_WEBHOOK_URL',
};
