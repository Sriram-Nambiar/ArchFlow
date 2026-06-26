# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Editor Chrome & Base Components

## Current Goal

- Build editor chrome (navbar + sidebar) that frames every editor screen.

## Completed

- 01-design-system: shadcn/ui installed & configured, dark theme tokens set, cn() utility created, lucide-react installed, 7 component primitives added (Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea)
- Boilerplate stripped (globals.css, SVGs, page.tsx simplified)
- 02-editor: Editor navbar, project sidebar, and dialog pattern for future use. Components: `editor-navbar.tsx`, `project-sidebar.tsx`. Dialog pattern ready (title, description, footer actions) via existing shadcn Dialog components using project color tokens.

## In Progress

- None.

## Next Up

- Canvas foundation (React Flow + Liveblocks setup)
- Authentication (Clerk integration)
- Project management (CRUD + Prisma)

## Open Questions

- None yet.

## Architecture Decisions

- Dark-only theme: CSS custom properties defined in :root with dark values, .dark class always applied to <html>
- shadcn/ui variables mapped to project design tokens (e.g. --background → --bg-base, --primary → --accent-primary)
- Project-specific tokens added for non-shadcn uses: bg-base, bg-surface, text-copy-primary, text-brand, border-default, etc.
- shadcn/ui components in components/ui/ remain unmodified after generation (per ai-workflow-rules.md)
- cn() utility in lib/utils.ts using clsx + tailwind-merge

## Session Notes

- Next.js 16 + Tailwind v4 + shadcn/ui base-nova style
- lucide-react installed for icon library
- Build passes cleanly with zero TypeScript or import errors
