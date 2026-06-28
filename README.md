# Arch Flow

> Real-time collaborative system design workspace powered by Ghost AI.

Arch Flow lets teams sketch architecture on a shared canvas, collaborate live, import starter templates, generate designs from prompts, and export the finished graph as a Markdown technical spec.

🔗 **Live App:** [arch-flow-nine.vercel.app](https://arch-flow-nine.vercel.app)

---

## Features

- **Multiplayer canvas** — live cursors, presence, and real-time node/edge editing powered by Liveblocks
- **Ghost AI generation** — describe what you need and let the AI build or extend your architecture diagram
- **Starter templates** — jump-start designs with common system design patterns
- **Markdown spec export** — turn any finished canvas into a structured technical document
- **Project workspace** — create, rename, delete, and share projects with role-based access (owner / collaborator)
- **Canvas autosave** — your work is always preserved and restorable

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 + TypeScript |
| UI | React 19, Tailwind CSS 4, shadcn/ui |
| Auth | Clerk |
| Database | Prisma + PostgreSQL |
| Realtime | Liveblocks |
| Background tasks | Trigger.dev |
| Storage | Vercel Blob |
| AI | NVIDIA API (via Trigger.dev tasks) |

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- Accounts / keys for: Clerk, Liveblocks, Trigger.dev, Vercel Blob, NVIDIA API

### 1. Clone and install

```bash
git clone https://github.com/Sriram-Nambiar/ArchFlow.git
cd ArchFlow
npm install
```

### 2. Configure environment

Create a `.env.local` file at the root:

```env
DATABASE_URL=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
LIVEBLOCKS_SECRET_KEY=
TRIGGER_SECRET_KEY=
BLOB_READ_WRITE_TOKEN=
NVIDIA_API_KEY=
```

### 3. Run

```bash
npm run dev
```

App runs at `http://localhost:3000`.

---

## How It Works

```
Sign in → Create project → Open editor
→ Import a template (optional)
→ Edit nodes & edges with your team in real time
→ Ask Ghost AI to generate or extend the design
→ Refine collaboratively
→ Export as a Markdown spec
```

---

## Project Structure

```
app/          # Routes, layouts, API handlers, auth pages, editor screens
components/   # Editor UI, dialogs, canvas primitives
context/      # Product, architecture, UI, and implementation notes
hooks/        # Project actions, canvas autosave, keyboard shortcuts
lib/          # Server utilities: Prisma, auth, access control, storage
prisma/       # Schema, models, migrations
trigger/      # Trigger.dev tasks for AI generation and spec export
types/        # Shared TypeScript types for canvas and task data
```

---

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

## Data & Storage

- **PostgreSQL** — project metadata, collaborators, task run records
- **Vercel Blob** — canvas snapshots and generated Markdown specs
- **Trigger.dev** — all long-running AI work runs here, not inside API handlers

---

## Troubleshooting

| Problem | Check |
|---|---|
| Auth fails | Clerk keys and public sign-in/sign-up URLs |
| Canvas collaboration fails | Liveblocks secret and room authorization flow |
| AI generation fails | `TRIGGER_SECRET_KEY` and `NVIDIA_API_KEY` |
| Spec/canvas download fails | `BLOB_READ_WRITE_TOKEN` |
| Prisma errors | `DATABASE_URL` pointing to a reachable PostgreSQL instance |

---

## Contributing

Pull requests are welcome. For significant changes, open an issue first to discuss what you'd like to change.

---

## License

MIT