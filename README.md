# portfolio-projects

Monorepo for my portfolio site and portfolio projects.

**Live site:** https://portfolio-projects-wine.vercel.app

| App | What it is | Status |
| --- | --- | --- |
| [`apps/portfolio`](apps/portfolio) | Personal portfolio site | [Live](https://portfolio-projects-wine.vercel.app) |
| [`apps/job-copilot`](apps/job-copilot) | AI job-search copilot: parses postings, scores fit, drafts tailored bullets | [Live](https://portfolio-projects-wine.vercel.app/copilot) |
| [`apps/realtime-board`](apps/realtime-board) | Real-time collaborative kanban board with presence, live cursors and drag and drop | [Live](https://portfolio-projects-wine.vercel.app/board) |
| [`apps/data-explorer`](apps/data-explorer) | TTC subway delay explorer: Web Worker queries, virtualized table, URL-synced filters, SVG charts | [Live](https://portfolio-projects-wine.vercel.app/explorer) |
| [`apps/kiosk`](apps/kiosk) | Offline-first airline check-in kiosk: service worker, IndexedDB outbox, idempotent sync, seat map, QR boarding passes, English/French | In progress |
| [`apps/design-system`](apps/design-system) | Storybook docs for `packages/ui`; every story is a browser test with axe in both themes | [Live](https://portfolio-projects-gtds.vercel.app) |
| [`packages/ui`](packages/ui) | Shared design system (tokens, components) used by every app | — |

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Storybook 10 · Vitest + Testing Library · pnpm workspaces + Turborepo · GitHub Actions · Vercel

## One domain, one sign-in

The apps are [multi-zones](https://nextjs.org/docs/app/guides/multi-zones): each deploys on its own, and the portfolio rewrites `/copilot/*`, `/board/*`, `/explorer/*` and `/kiosk/*` to them, so visitors see a single site. Sharing one host means sharing one Supabase session cookie:

- Visitors can still try everything as guests (anonymous Supabase users).
- Signing in with GitHub or an email link from the account menu in either app links that identity to the guest user, so their work is kept and shows up in both apps.
- Storybook stays a separate public site.

Locally, run `pnpm dev` and open http://localhost:3000/copilot or http://localhost:3000/board (the apps listen on 3001 and 3002).

## Getting started

```bash
pnpm install
pnpm dev          # run all apps
pnpm --filter portfolio dev
```

Checks (same as CI):

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```
