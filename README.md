# Content Studio Dashboard

A luxury dark-mode content management dashboard built with **React + Vite + Tailwind CSS**, featuring a Linear/Vercel-inspired aesthetic with Emerald & Amber accents.

## ✨ Features

- **Apple-grade glassmorphism** — frosted slate surfaces with hairline borders and emerald glow on hover
- **Magnetic Emerald CTA buttons** — gradient pill buttons with animated box-shadow glow
- **Honeycomb AI loader** — custom animated loader during idea generation
- **Interactive calendar** — past/today/future date differentiation with colour-coded scheduling zones
- **Kanban queue** — drag-and-drop columns with per-column emerald/amber glow on drag-over
- **Glass-strip table rows** — subtle `translateX` slide + emerald title hover
- **Live AI idea generation** — streams from NVIDIA NIM (Llama 3.3 70B) via Vite proxy
- **n8n webhook integration** — optional publish and idea-generation webhooks

## 🚀 Getting Started

```bash
npm install
cp .env.example .env.local   # fill in your NVIDIA_API_KEY
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## 🔑 Environment Variables

Copy `.env.example` → `.env.local` and fill in:

| Variable | Description |
|---|---|
| `NVIDIA_API_KEY` | Your NVIDIA NIM API key — injected server-side by the Vite proxy, never bundled |

## 🏗️ Tech Stack

| Layer | Tool |
|---|---|
| Framework | React 18 |
| Build | Vite 5 |
| Styling | Tailwind CSS 3 |
| Icons | Lucide React |
| AI | NVIDIA NIM — Llama 3.3 70B Instruct |
| Fonts | Inter Variable, Space Grotesk |

## 📁 Project Structure

```
src/
├── components/        # UI components
│   ├── ContentCalendar.jsx   # Calendar with past/today/future zones
│   ├── HoneycombLoader.jsx   # AI loading animation
│   ├── IdeaGenerator.jsx     # AI idea generation UI
│   ├── KanbanQueue.jsx       # Drag-and-drop queue
│   ├── Overview.jsx          # Stats dashboard
│   ├── PostTable.jsx         # Interactive content table
│   └── ...
├── services/
│   ├── ideaService.js        # AI idea generation logic
│   └── nim.js                # NVIDIA NIM streaming client
├── hooks/
│   └── usePosts.js           # Post state management
└── utils/                    # Date, filtering, markdown utilities
```

## 📜 Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server with NVIDIA proxy |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm test` | Run tests (Vitest) |
