# portfolio-projects

pnpm + Turborepo monorepo for Michael Seo's portfolio. Every app deploys to its own Vercel project from `main`.

| Path | What | Live |
| --- | --- | --- |
| `apps/portfolio` | Portfolio site (Next.js 16) | https://portfolio-projects-wine.vercel.app |
| `apps/job-copilot` | AI job-search copilot (Next.js 16, Supabase, Drizzle, Gemini) | https://portfolio-projects-xdrt.vercel.app |
| `apps/realtime-board` | Realtime kanban (Next.js 16, Supabase Realtime, dnd-kit) | https://portfolio-projects-j5mr.vercel.app |
| `apps/design-system` | Storybook 10 for `@repo/ui` | https://portfolio-projects-gtds.vercel.app |
| `packages/ui` | Shared design system (tokens + React components) | — |

## Ground rules

- **Next.js 16 differs from older versions.** Read `apps/<app>/AGENTS.md` and `node_modules/next/dist/docs/` before writing Next code.
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
