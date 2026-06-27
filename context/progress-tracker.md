# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Canvas foundation

## Current Goal

- Set up the React Flow + Liveblocks canvas foundation.

## Completed

- 01-design-system: shadcn/ui installed & configured, dark theme tokens set, cn() utility created, lucide-react installed, 7 component primitives added (Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea)
- Boilerplate stripped (globals.css, SVGs, page.tsx simplified)
- 02-editor: Editor navbar, project sidebar, and dialog pattern for future use.
- 03-auth: Clerk authentication fully wired — `ClerkProvider` wraps root layout with `dark` theme + CSS variable overrides, proxy.ts route protection, two-panel sign-in/sign-up pages, `/` redirects (auth → /editor, unauth → /sign-in), `UserButton` in editor navbar.
- 04-project-dialogs: Editor home screen (heading, description, New Project button), create/rename/delete dialogs, sidebar project items with actions (owned only), mobile backdrop scrim, dedicated hook for dialog/form/loading state.

## In Progress

- None.

## Next Up

- Canvas foundation (React Flow + Liveblocks setup)
- Project management (CRUD + Prisma)

## Open Questions

- None yet.

## Architecture Decisions

- Dark-only theme: CSS custom properties defined in :root with dark values, .dark class always applied to <html>
- shadcn/ui variables mapped to project design tokens (e.g. --background → --bg-base, --primary → --accent-primary)
- Project-specific tokens added for non-shadcn uses: bg-base, bg-surface, text-copy-primary, text-brand, border-default, etc.
- shadcn/ui components in components/ui/ remain unmodified after generation (per ai-workflow-rules.md)
- cn() utility in lib/utils.ts using clsx + tailwind-merge
- Clerk `dark` theme as base with appearance variables mapped to project CSS custom properties; no hardcoded colors in auth pages.
- ClerkProvider inside `<body>` with `afterSignOutUrl="/"` for global sign-out redirect.
- proxy.ts at root (not middleware.ts) with public routes `/sign-in` and `/sign-up`; all other routes protected.
- UserButton in editor navbar right section for profile settings and logout.

## Session Notes

- Next.js 16 + Tailwind v4 + shadcn/ui base-nova style
- lucide-react installed for icon library
- `@clerk/nextjs` v7 + `@clerk/ui` v1 installed
- Clerk `dark` theme used via JS appearance object (no CSS import needed)
- Sign-in/sign-up pages: two-panel layout with feature list on large screens, form-only on small screens
- Auth pages updated: 50/50 left/right split, left panel uses token-only styling with text-only feature lists, right panel uses `bg-base`, all text uses project design tokens (`text-copy-primary`, `text-copy-secondary`, `text-brand`), Geist Sans font applied via CSS variable, product name corrected to "Ghost AI"
