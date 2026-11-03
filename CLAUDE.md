# portfolio-projects

pnpm + Turborepo monorepo for Michael Seo's portfolio. Every app deploys to its own Vercel project from `main`.

| Path | What | Live |
| --- | --- | --- |
| `apps/portfolio` | Portfolio site (Next.js 16) | https://portfolio-projects-wine.vercel.app |
| `apps/job-copilot` | AI job-search copilot (Next.js 16, Supabase, Drizzle, Gemini) | https://portfolio-projects-wine.vercel.app/copilot (zone; deployment: portfolio-projects-xdrt) |
| `apps/realtime-board` | Realtime kanban (Next.js 16, Supabase Realtime, dnd-kit) | https://portfolio-projects-wine.vercel.app/board (zone; deployment: portfolio-projects-j5mr) |
| `apps/data-explorer` | TTC subway delay explorer (Next.js 16, Web Worker, TanStack Virtual); no database | https://portfolio-projects-wine.vercel.app/explorer (zone; Vercel project `data-explorer`, wired via `EXPLORER_URL`) |
| `apps/kiosk` | Airline check-in kiosk (Next.js 16, touch-first, EN/FR, offline-first planned); no database yet | https://portfolio-projects-wine.vercel.app/kiosk (zone; wired via `KIOSK_URL`, not deployed yet) |
| `apps/design-system` | Storybook 10 for `@repo/ui` | https://portfolio-projects-gtds.vercel.app |
| `packages/ui` | Shared design system (tokens + React components) | — |

## Ground rules

- **Copilot, board, explorer and kiosk are multi-zones** under the portfolio domain (`basePath` `/copilot`, `/board`, `/explorer`, `/kiosk`; rewrites in `apps/portfolio/next.config.ts`). Links between zones use `<a>`, not `<Link>`. `redirect()` in Route Handlers does not add `basePath`. Auth (guest + optional GitHub/email sign-in) lives in each zone's `src/app/auth/`.
- **Next.js 16 differs from older versions.** Read `apps/<app>/AGENTS.md` and `node_modules/next/dist/docs/` before writing Next code.
- **Build-time env vars must be listed in `turbo.json` (`tasks.build.env`).** Turborepo 2 drops undeclared vars, so the build never sees them.
- **Michael holds every secret.** Never ask for keys. He sets Vercel env vars and runs SQL in the Supabase SQL editor himself.
- **Commit as** `yoonseo810 <85579849+yoonseo810@users.noreply.github.com>`. Vercel blocks previews for other authors.
- **Michael merges PRs.** Open them, keep CI green, never merge.
- **Accessibility is a requirement.** Every `@repo/ui` story runs axe in both themes and must pass.
- Kill dev servers by port (`lsof -t -i:PORT | xargs -r kill`), never `pkill -f next`.

## Checks (same as CI)

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

Storybook tests need Chromium: `pnpm --filter design-system exec playwright install chromium`, or set `PLAYWRIGHT_BROWSERS_PATH` if a browser is preinstalled.

## Skills and agents

- Skills in `.claude/skills/`: `ship-change`, `add-ui-component`, `add-app`, `db-migration`.
- Agents in `.claude/agents/`: `a11y-reviewer`, `release-checker`.
