# Job-Search Copilot

**Live demo:** https://portfolio-projects-wine.vercel.app/copilot (no sign-up)

Paste a job posting, get a fit score against your resume, a ranked gap list and tailored resume bullets, then track the application's status.

## How it works

1. **Extract.** Gemini reads the posting and returns each requirement as structured data, marked must-have or nice-to-have.
2. **Match.** A second call checks each requirement against the resume and returns a verdict (strong, partial, missing) with the resume text that supports it, plus up to 5 tailored bullets.
3. **Score in code.** [`src/lib/score.ts`](src/lib/score.ts) turns the verdicts into a 0-100 score with fixed weights (must-have 3, nice-to-have 1, partial = half credit).

## Design decisions

- **The model judges, code scores.** Asking a model for a number directly gives unstable, unexplainable scores. Here the same verdicts always give the same score, and the UI shows the evidence behind each one.
- **Model output is validated.** Both calls use the AI SDK's structured output with the Zod schemas in [`src/lib/schemas.ts`](src/lib/schemas.ts). If the matcher drops or renames a requirement, [`reconcile()`](src/lib/analyze.ts) counts it as missing rather than letting the score drift up.
- **User text is treated as data.** The posting and resume are wrapped in tags and the system prompt says not to follow instructions inside them.
- **Guest sessions.** Visitors start a Supabase anonymous session with one click, so the demo needs no sign-up. Each guest is limited to 10 analyses a day to stay within the Gemini free tier.
- **Data access.** The server talks to Postgres through Drizzle and scopes every query by user id. Row-level security is enabled with no policies, which closes the tables to Supabase's public data API.
- **Measured, not guessed.** Each analysis stores input/output tokens and latency, shown under the results.

## Stack

Next.js 16 (App Router, Server Actions, Partial Prerendering) · TypeScript · Supabase (Postgres + anonymous auth) · Drizzle ORM · Vercel AI SDK + Gemini · Zod · Vitest

## Local setup

```bash
cp .env.example .env.local   # fill in Supabase and Gemini values
pnpm install
pnpm --filter job-copilot db:migrate
pnpm --filter job-copilot dev
```

Tests use the AI SDK's mock model, so they need no API key: `pnpm --filter job-copilot test`.
