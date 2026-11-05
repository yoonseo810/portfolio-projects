# e2e

Browser tests that run against production builds of the apps that need no outside services: the portfolio, the TTC delay explorer and the kiosk. They run in CI as the **e2e + Lighthouse** job.

- **End-to-end** (`tests/*.spec.ts`, desktop and Pixel 7):
  - Portfolio lists every live project.
  - Explorer filters, URL sharing, the virtualized table, and bad URL params.
  - Kiosk check-in online, fully offline (service worker + IndexedDB queue, then sync), and two offline kiosks racing for one seat.
- **Accessibility:** axe with WCAG 2.2 A/AA rules on every app.
- **Lighthouse budgets** (`tests/lighthouse.spec.ts`, desktop preset, runs after the others):
  - performance, best practices and SEO scores of at least 0.9
  - no failing accessibility audits
  - a JavaScript size budget per page
  - The HTML reports land in `lighthouse-report/`, and CI uploads them with the Playwright report.

The kiosk talks to an in-memory Postgres (PGlite over the wire protocol, `scripts/db.mjs`) with its real migration applied, so no database or secrets are needed.

## Run it

```bash
pnpm turbo run build --filter=portfolio --filter=data-explorer --filter=kiosk
pnpm --filter e2e exec playwright install chromium   # once
pnpm --filter e2e e2e                                # starts the servers on 3000, 3003, 3004 and 5544
```

Run one part with `pnpm --filter e2e e2e --project=desktop`, or `--project=lighthouse --no-deps`.
