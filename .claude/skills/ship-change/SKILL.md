---
name: ship-change
description: Branch, verify, commit and open a PR for any change in this monorepo, following the repo's commit identity, checks and deploy conventions. Use whenever work is ready to go up for review.
---

# Ship a change

1. **Branch from fresh main**
   `git fetch origin main && git checkout -B <type>/<short-name> origin/main`. Types: `feat`, `fix`, `chore`, `docs`.
2. **Run the checks that CI runs.** Stop and fix anything red.
   ```bash
   pnpm lint && pnpm typecheck && pnpm test && pnpm build
   ```
   - Apps that read Supabase at build time need dummy public env vars for a local build:
     `NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=x DATABASE_URL=postgres://u:p@127.0.0.1:1/db`.
   - Storybook tests need Chromium (see CLAUDE.md).
3. **Look at UI changes.** Build and serve the app, then take Playwright screenshots of the changed screens in **both themes**. Pages that need the database can't render locally; use a temporary `zz-preview` route and delete it before committing.
4. **Commit as Michael's noreply identity.**
   ```bash
   git -c user.name=yoonseo810 -c user.email=85579849+yoonseo810@users.noreply.github.com commit -m "<type>(<scope>): <summary>"
   ```
   Then push with `git push -u origin <branch>`.
5. **Open the PR.**
   - Body sections: **What changed**, **Before merging** (only if Michael has to do something, such as SQL or env vars), **Checks** (what you ran and the result).
   - Name anything Michael must do by hand, in order, with copy-paste SQL or exact Vercel settings.
6. **Watch CI until it's green.** Never merge. Michael merges.
7. **After merge:** if the change adds a live URL, update the portfolio card (`apps/portfolio/src/content/projects.ts`), the root README table and CLAUDE.md.
