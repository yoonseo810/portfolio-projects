# Design System (Storybook)

Documentation and tests for [`@repo/ui`](../../packages/ui), the shared design system used by every app in this monorepo.

## What's here

- **Introduction** and **Color tokens** pages. The swatches read the live CSS variables, so they follow the theme toolbar.
- A story for every component, with controls and auto-generated prop tables.
- **Interaction tests** (`play` functions) for behavior that matters: keyboard navigation in `Tabs`, focus trapping, Escape and focus return in `Dialog`, and the theme toggle.

## Tests

`pnpm test` runs every story as a Vitest test in headless Chromium (via `@storybook/addon-vitest`), **once in the dark theme and once in the light theme**. A story fails if it:

1. throws while rendering,
2. fails its `play` assertions, or
3. has any [axe](https://github.com/dequelabs/axe-core) accessibility violation (`a11y.test: "error"`), including color contrast.

These checks have already caught two real bugs in `@repo/ui`:

- The light-theme `--warning` color measured 4.24:1 on a warning badge, below WCAG AA (4.5:1). It's now `#92400e`.
- `Dialog` could close itself right after reopening, because the native `close` event fires asynchronously. Stale close events are now ignored.

## Run it

```bash
pnpm --filter design-system dev     # http://localhost:6006
pnpm --filter design-system test    # needs Chromium: pnpm --filter design-system exec playwright install chromium
pnpm --filter design-system build   # static site in storybook-static/
```

## Deploy

Static site on Vercel: a project with root directory `apps/design-system`. `vercel.json` sets the build command and the `storybook-static` output.
