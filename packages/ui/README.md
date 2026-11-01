# @repo/ui

Shared design system for every app in this monorepo: dark-first, hairline borders, indigo→violet accent with soft glow.

- `styles.css`: color tokens (light and dark), Tailwind `@theme` mapping and utilities (`text-gradient`, `bg-grid`, `glow-hover`, `surface-sheen`). Import it right after Tailwind in each app's `globals.css`.
- Components: `Button`/`buttonClass`, `Card`, `Badge`, `Eyebrow`, `Backdrop`, `SiteHeader`, `ThemeToggle` + `themeScript`, `ExternalLink`, `Tabs`, `Dialog`, `fieldClass`, `cn`.
- Forms: `TextField`, `TextAreaField`, `SelectField` (label, hint and error wired with ARIA), `Checkbox`, `Switch`.
- Feedback: `Alert`, `ToastProvider` + `useToast`, `Spinner`, `Skeleton`.
- Display: `Accordion` (native `<details>`), `Avatar` (initials fallback), `Tooltip`.
- Docs and tests live in [`apps/design-system`](../../apps/design-system) (Storybook).

Apps consume the TypeScript source directly (`transpilePackages: ["@repo/ui"]`), so there is no build step.
