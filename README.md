# portfolio-projects

Monorepo for my portfolio site and portfolio projects.

**Live site:** https://portfolio-projects-wine.vercel.app

| App | What it is | Status |
| --- | --- | --- |
| [`apps/portfolio`](apps/portfolio) | Personal portfolio site | [Live](https://portfolio-projects-wine.vercel.app) |
| [`apps/job-copilot`](apps/job-copilot) | AI job-search copilot: parses postings, scores fit, drafts tailored bullets | [Live](https://portfolio-projects-xdrt.vercel.app) |
| [`apps/realtime-board`](apps/realtime-board) | Real-time collaborative kanban board with presence, live cursors and drag and drop | [Live](https://portfolio-projects-j5mr.vercel.app) |
| [`apps/design-system`](apps/design-system) | Storybook docs for `packages/ui`; every story is a browser test with axe in both themes | [Live](https://portfolio-projects-gtds.vercel.app) |
| [`packages/ui`](packages/ui) | Shared design system (tokens, components) used by every app | — |

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Storybook 10 · Vitest + Testing Library · pnpm workspaces + Turborepo · GitHub Actions · Vercel

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
