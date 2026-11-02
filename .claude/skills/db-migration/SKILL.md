---
name: db-migration
description: Change a Drizzle schema safely in an app backed by the shared Supabase database, so production never runs code ahead of its tables. Use for any schema change.
---

# Database migration

Michael runs all SQL himself in the Supabase SQL editor. Never ask for the database URL or keys.

1. **Edit `src/db/schema.ts`.**
   - Prefer **additive** changes: new nullable columns, new tables, new indexes.
   - Avoid renames and drops in the same PR as the code that stops using them.
2. **Generate the SQL.** No database is needed:
   ```bash
   DATABASE_URL=postgres://x pnpm --filter <app> db:generate --name <what_changed>
   ```
   Commit `drizzle/NNNN_*.sql` together with the `meta/` snapshot and journal.
3. **Enable RLS on new tables** in the same migration (`ALTER TABLE … ENABLE ROW LEVEL SECURITY;`).
   - The app connects as the owner and filters by `user_id`.
   - RLS with no policies blocks the public data API.
4. **Order matters.** Vercel deploys on merge, so the SQL must run **before** the merge.
   - Put the exact SQL in the PR's **Before merging** section.
   - Use idempotent forms such as `ADD COLUMN IF NOT EXISTS` and `CREATE TABLE IF NOT EXISTS`, so running it twice is safe.
   - Remind Michael once more after the merge, in case he skipped it.
5. **Prefer soft deletes when a row backs a quota or audit.** For example, `jobs.deleted_at` in the copilot keeps the daily analysis limit honest. Filter `isNull(deletedAt)` in every read.
