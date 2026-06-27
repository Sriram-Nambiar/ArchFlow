# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Wire editor home sidebar and dialogs to the real project API

## Current Goal

- Replace mock project data with real server-side fetching and wire all project mutations (create, rename, delete) to backend API routes.

## Completed

- 01-design-system: shadcn/ui installed & configured, dark theme tokens set, cn() utility created, lucide-react installed, 7 component primitives added (Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea)
- Boilerplate stripped (globals.css, SVGs, page.tsx simplified)
- 02-editor: Editor navbar, project sidebar, and dialog pattern for future use.
- 03-auth: Clerk authentication fully wired - `ClerkProvider` wraps root layout with `dark` theme + CSS variable overrides, proxy.ts route protection, two-panel sign-in/sign-up pages, `/` redirects (auth -> /editor, unauth -> /sign-in), `UserButton` in editor navbar.
- 04-project-dialogs: Editor home screen (heading, description, New Project button), create/rename/delete dialogs, sidebar project items with actions (owned only), mobile backdrop scrim, dedicated hook for dialog/form/loading state.
- 05-prisma: Project and collaborator Prisma schema added in `prisma/models/project.prisma`, cached Prisma singleton added in `lib/prisma.ts`, first migration `20260627050001_init_projects` applied, Prisma Client generated, `npm run build` passes.
- 06-project-apis: Backend-only REST routes added for `GET /api/projects`, `POST /api/projects`, `PATCH /api/projects/[projectId]`, and `DELETE /api/projects/[projectId]`; Clerk user ID is used as `ownerId`, create defaults missing names to `Untitled Project`, owner checks return `403`, unauthenticated requests return `401`, `npm run lint` and `npm run build` pass.
- 07-wire-editor-home: Editor home page converted to server component — fetches owned and shared projects server-side via `lib/project-data.ts`. New `useProjectActions` hook in `hooks/use-project-actions.ts` manages dialog state and calls real project API endpoints (`POST /api/projects`, `PATCH /api/projects/[projectId]`, `DELETE /api/projects/[projectId]`). Create dialog shows room ID preview with unique 6-char suffix. Rename pre-fills current name. Delete redirects to `/editor` if deleting active workspace or refreshes otherwise. Components migrated from `MockProject` to shared `ProjectItem` type. `slugify` and `generateSuffix` extracted to `lib/slugify.ts`. `lib/mock-projects.ts` deprecated (kept for reference).

## In Progress

- None.

## Next Up

- Canvas foundation (React Flow + Liveblocks setup)

## Open Questions

- None yet.

## Architecture Decisions

- Dark-only theme: CSS custom properties defined in :root with dark values, .dark class always applied to <html>
- shadcn/ui variables mapped to project design tokens (e.g. --background -> --bg-base, --primary -> --accent-primary)
- Project-specific tokens added for non-shadcn uses: bg-base, bg-surface, text-copy-primary, text-brand, text-copy-faint, text-copy-muted, text-copy-secondary, border-default, border-border-default, bg-subtle, state-error
- shadcn/ui components in components/ui/ remain unmodified after generation (per ai-workflow-rules.md)
- cn() utility in lib/utils.ts using clsx + tailwind-merge
- Clerk `dark` theme as base with appearance variables mapped to project CSS custom properties; no hardcoded colors in auth pages.
- ClerkProvider inside `<body>` with `afterSignOutUrl="/"` for global sign-out redirect.
- proxy.ts at root (not middleware.ts) with public routes `/sign-in` and `/sign-up`; all other routes protected.
- UserButton in editor navbar right section for profile settings and logout.
- Prisma schema uses the Prisma 7 schema directory (`schema = "prisma/"`) with feature models under `prisma/models/`.
- `lib/prisma.ts` exports a single cached Prisma Client instance; `prisma+postgres://` URLs use `accelerateUrl`, other Postgres URLs use `@prisma/adapter-pg`.
- Project API route handlers call Clerk `auth()` directly so API requests can return explicit `401` responses instead of `auth.protect()` fallback behavior.
- Server-side project fetching uses `lib/project-data.ts` which calls `getOwnedProjects()` (owner match) and `getSharedProjects()` (collaborator email match via Clerk `currentUser()`).
- `useProjectActions` hook in `hooks/use-project-actions.ts` uses `useRef` for a stable create suffix, `next/navigation` router for post-mutation navigation/refresh.
- Room ID preview in create dialog shows `{slug}-{6-char-suffix}`; the suffix is generated once when the dialog opens.
- Mock data (`lib/mock-projects.ts`) is retained but unused after wiring; can be removed in a cleanup pass.

## Session Notes

- Next.js 16 + Tailwind v4 + shadcn/ui base-nova style
- lucide-react installed for icon library
- `@clerk/nextjs` v7 + `@clerk/ui` v1 installed
- Clerk `dark` theme used via JS appearance object (no CSS import needed)
- Sign-in/sign-up pages: two-panel layout with feature list on large screens, form-only on small screens
- Auth pages updated: 50/50 left/right split, left panel uses token-only styling with text-only feature lists, right panel uses `bg-base`, all text uses project design tokens (`text-copy-primary`, `text-copy-secondary`, `text-brand`), Geist Sans font applied via CSS variable, product name corrected to "Ghost AI"
- Prisma validation, migration, generation, and production build all completed successfully for 05-prisma.
- Backend project APIs were added without wiring the editor UI; mock project UI remains untouched for a later integration step.
- Feature 07 replaced `useProjectDialogs` with `useProjectActions`; added `lib/slugify.ts`, `lib/types.ts`, `lib/project-data.ts`, `components/editor/editor-home-client.tsx`. The server component `app/editor/page.tsx` delegates to the client wrapper. All components updated from `MockProject` to `ProjectItem`.
