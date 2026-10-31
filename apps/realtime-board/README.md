# Realtime Board

A shareable kanban board with live cursors, presence, and drag and drop. Create a board, send the invite link, and everyone on it sees cards and cursors move in real time. Guests join anonymously, with no sign-up.

**Live demo:** https://portfolio-projects-j5mr.vercel.app (no sign-up)

## How it works

- **Server is the source of truth.** Cards live in Postgres (Supabase) and are written through Next.js server actions with Drizzle. Each write is validated with Zod and only applied if it is newer than the stored row (`ON CONFLICT … WHERE updated_at < excluded.updated_at`).
- **Realtime is the fast path.** Clients broadcast card changes and cursor positions over a Supabase Realtime channel per board, and track who is online with Presence. Cursor updates are throttled to 50 ms.
- **Conflict handling.** A pure reducer (`src/lib/board.ts`) applies events with last-write-wins per card and keeps tombstones, so a late "move" can't resurrect a deleted card. Ordering uses fractional positions, so a move touches one row.
- **Optimistic UI.** Moves apply locally first and roll back if the server rejects them.
- **Accessible drag and drop.** dnd-kit with pointer, touch and keyboard sensors.
- **Security.** RLS is on with no policies, so the browser can't read tables through the Supabase data API. Every server action checks the verified session first.

## Stack

Next.js 16 (App Router, server actions), React 19, TypeScript, Tailwind CSS 4, Supabase (Postgres, anonymous auth, Realtime), Drizzle ORM, dnd-kit, Vitest.

## Run locally

```bash
cp .env.example .env.local   # fill in the three values
pnpm install
pnpm --filter realtime-board dev
```

Apply `drizzle/0000_init.sql` and `drizzle/0001_enable_rls.sql` in the Supabase SQL editor (or run `pnpm db:migrate`). Anonymous sign-ins must be enabled in Supabase Auth.

## Scripts

`pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm db:generate`.
