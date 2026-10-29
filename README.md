# Content Studio

A content marketing dashboard for planning, writing, reviewing and publishing across LinkedIn, Twitter/X,
YouTube, blogs and newsletters. React 18 + Vite + Tailwind + Lucide, with optional n8n automation.

Runs entirely in the browser: posts live in `localStorage`, and every workflow is optional. With no
webhooks configured it runs in standalone mode using realistic sample data.

## Features

- **Overview** — totals, engagement rate, scheduled posts and drafts awaiting approval
- **Published** — performance table with views, engagement, sorting and filtering
- **Queue** — drag-and-drop kanban for drafts, approvals and scheduled posts (plus a keyboard-accessible
  "Move to" control on every card)
- **Calendar** — month/week views, create a post on any day
- **Idea generator** — per-channel angles, hooks and outlines, one click into the editor
- **All content** — search, filter, inline rename, status changes, delete with undo
- **Editor** — markdown toolbar, tag chips, live LinkedIn and Twitter/X thread previews
- **Dark mode**, responsive layout, reduced-motion support, keyboard-trapped modals
- **JSON backup/restore** so you can move data between browsers

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
```

| Script                  | What it does                                           |
| ----------------------- | ------------------------------------------------------ |
| `npm run dev`           | Vite dev server                                        |
| `npm run build`         | Production build to `dist/`                            |
| `npm run preview`       | Serve the production build                             |
| `npm test`              | Vitest (unit + component + interaction tests)          |
| `npm run test:coverage` | Tests with coverage report and enforced thresholds     |
| `npm run lint`          | ESLint (flat config, React + hooks rules)              |
| `npm run format`        | Prettier write                                         |
| `npm run format:check`  | Prettier check (used by CI)                            |
| `npm run verify`        | lint + format check + coverage + build — the full gate |
| `npm run ci`            | `npm ci` followed by `verify`                          |

## Configuration

Webhook URLs can be set in two places:

1. **Settings modal** (recommended) — stored per browser in `localStorage`, takes precedence.
2. **Build-time defaults** — copy `.env.example` to `.env.local`:

   ```bash
   VITE_IDEA_GENERATION_WEBHOOK_URL=https://your-n8n.example.com/webhook/ideas
   VITE_POST_PUBLISH_WEBHOOK_URL=https://your-n8n.example.com/webhook/publish
   VITE_APP_VERSION=1.0.0
   ```

`VITE_*` values are compiled into the public bundle. They are convenient defaults, not secrets — never put
credentials in them. `.env` and `.env.local` are git-ignored; only `.env.example` is committed.

Views are stored in the URL hash (`#/calendar`, `#/library`, …), so refreshes and shared links keep their
place.

## n8n contract

**Idea generation** — `POST` JSON:

```json
{ "topic": "account-based marketing", "platform": "LinkedIn", "audience": "CMOs" }
```

Accepted responses (any of these shapes):

```json
{ "ideas": [{ "angle": "Contrarian take", "hook": "…", "outline": ["…"] }] }
{ "data":  [{ "title": "…" }] }
["A plain string hook", "Another hook"]
```

**Publish notifications** — sent whenever a post moves to Scheduled or Published:

```json
{ "event": "post.scheduled | post.published", "sentAt": "2026-01-01T09:00:00.000Z", "...post": "…" }
```

If a URL is empty, invalid, offline, times out (8 s) or returns a non-2xx response, the app falls back to
local data and shows a toast. Nothing ever throws into the UI.

### Browser CORS

Webhooks are called **directly from the browser**, so the n8n webhook must allow your app's origin:

- Allow `POST` with `Content-Type: application/json` (this triggers a `OPTIONS` preflight).
- Respond to the preflight with `Access-Control-Allow-Origin: https://your-app.example` (or `*` for local
  experiments) and `Access-Control-Allow-Headers: content-type`.
- In n8n, enable **Allowed Origins (CORS)** on the Webhook node, or put the webhook behind a small proxy.

If you cannot configure CORS, keep the app in standalone mode and post to n8n from a server-side job.

## Data & backups

- Posts are seeded on first run and stored under `ccm.posts.v1`; settings under `ccm.settings.v1`.
- Corrupt or missing storage is recovered automatically with the seed set.
- **Settings → Backup & restore → Export JSON** writes a versioned snapshot
  (`{ app, version, exportedAt, settings, posts }`). Import validates every record and refuses the whole
  file if any record is malformed, so a bad file can't half-overwrite your data.
- Deleting a post shows an **Undo** action in the toast.

## Architecture

```
src/
  App.jsx              shell: hash routing, theme, settings, toasts, sync
  components/          presentational + interaction components
  hooks/usePosts.js    single source of truth, persisted to localStorage
  services/            http (timeout/abort), storage, ideaService, publishService, backup
  utils/               filters, markdown (XSS-safe), dates
  mockData/            deterministic seed posts and fallback ideas
  types/index.js       JSDoc typedefs + shared constants
```

Design notes:

- `postJson` accepts an injected `fetchImpl`, so services are unit-testable without network access.
- Markdown is escaped before inline rules run, and only `http(s)` links are linkified.
- A `Modal` traps Tab, closes on Escape and restores focus to the trigger.
- `ErrorBoundary` keeps a bad record from blanking the dashboard.

## Quality gates

`npm run verify` must pass before merging. CI (`.github/workflows/ci.yml`) runs lint, format check,
coverage and build on every push and pull request. Coverage thresholds are enforced in `vite.config.js`.

## Deployment

Static output — any host works. `public/_redirects` is included for Netlify SPA fallbacks. Because routing
uses the hash, hard refreshes work without server rewrites.

## Known limitations

- Browser-only storage: no accounts, multi-device sync or server-side collaboration.
- Metrics are demo values; there is no analytics ingestion. Update them via a publish webhook response or
  imported backups.
- No real publishing connector — scheduling is a state change plus an optional n8n notification.
- Tests cover components, services and key interactions, but there is no browser E2E suite.
