# Content Studio

React 18 + Vite + Tailwind + Lucide content dashboard with n8n integration.

    npm install
    npm run dev       # http://localhost:5173
    npm test          # 29 tests
    npm run build     # production build -> dist/
    npm run verify    # tests + build

## n8n contract
- IDEA_GENERATION_WEBHOOK_URL: POST { topic, platform, audience } -> { ideas: [{ angle, hook, outline: [] }] } (an array or array of strings also works)
- POST_PUBLISH_WEBHOOK_URL: POST { event: "post.scheduled" | "post.published", sentAt, ...post }
Empty URL or any failure falls back to client-side data with an "Operating in standalone mode" toast.

## Structure
src/components, src/services (http, storage, ideaService, publishService), src/types, src/mockData, src/utils, src/hooks
