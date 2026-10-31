# Job-Search Copilot

Paste a job posting, get a fit score against your resume, a ranked gap list and tailored resume bullets, then track the application on a board.

**Status:** foundation (schema, scoring, validation). AI extraction, auth and UI are next.

## Design decisions

- **The model judges, code scores.** The model extracts requirements and gives each one a verdict (strong, partial, missing) with evidence quoted from the resume. The 0-100 score is computed from those verdicts in [`src/lib/score.ts`](src/lib/score.ts) with fixed weights (must-have 3, nice-to-have 1; partial = half credit). Asking a model for a number directly gives unstable, unexplainable scores.
- **Structured output is validated.** Every model response is parsed with the Zod schemas in [`src/lib/schemas.ts`](src/lib/schemas.ts) before it touches the database.
- **Cost and latency are recorded per analysis** (`input_tokens`, `output_tokens`, `latency_ms`, `cost_usd` on `analyses`), so the README can report measured numbers.

## Stack

Next.js 16 · TypeScript · Supabase (Postgres + Auth) · Drizzle ORM · Zod · Vitest

## Local setup

```bash
cp .env.example .env.local   # fill in Supabase and Anthropic values
pnpm install
pnpm --filter job-copilot db:migrate
pnpm --filter job-copilot dev
```
