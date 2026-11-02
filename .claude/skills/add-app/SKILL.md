---
name: add-app
description: Scaffold a new Next.js app in the monorepo wired to @repo/ui, CI and its own Vercel project, and list it on the portfolio. Use when starting a new portfolio project.
---

# Add a new app

1. **Scaffold** `apps/<name>` with Next.js 16, TypeScript, Tailwind 4 and ESLint, matching `apps/portfolio`:
   - `package.json` has the scripts `dev`, `build`, `lint`, `typecheck` (`next typegen && tsc --noEmit`) and `test` (`vitest run`), plus `"@repo/ui": "workspace:*"`.
   - `next.config.ts` sets `transpilePackages: ["@repo/ui"]`.
   - `globals.css` contains `@import "tailwindcss"; @import "@repo/ui/styles.css";`.
   - The layout inlines `themeScript` in `<head>` and uses `SiteHeader`, with a footer linking back to the portfolio.
   - Keep the generated `AGENTS.md`.
2. **Data (if any)**
   - Use the shared Supabase project with Drizzle.
   - Give the app its own migrations table in `drizzle.config.ts`: `migrations: { table: "__drizzle_migrations_<name>" }`.
   - Enable RLS on every table, and scope every query by `user_id`.
   - Anonymous guest sessions come from `signInAnonymously`, so recruiters never hit a sign-up wall.
3. **Tests**
   - Unit-test the core logic with Vitest.
   - Add the app to the root README table and to CLAUDE.md.
4. **Ship** with the `ship-change` skill. In the PR's **Before merging** section, tell Michael to:
   - Create a Vercel project from this repo with **Root Directory `apps/<name>`**.
   - Add the env vars from `.env.example`. He sets the values himself.
   - Run any SQL (see the `db-migration` skill).
5. **Go live**
   - Add a portfolio card in `apps/portfolio/src/content/projects.ts` with `status: "in-progress"`.
   - Once Michael sends the URL, switch it to `"live"` with `demoUrl`, and update the README and CLAUDE.md links.
