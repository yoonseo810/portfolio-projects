---
name: add-ui-component
description: Add or change a component in the shared @repo/ui design system with a Storybook story, interaction tests and axe checks in both themes. Use for any new reusable UI piece.
---

# Add a UI component

## 1. Build it in `packages/ui/src/<name>.tsx`

- One file per component. Kebab-case filename, imported as `@repo/ui/<name>`.
- Use the semantic tokens only: `bg-surface`, `text-muted`, `border-line`, `text-accent`, `text-danger` and so on. No hex colors, no `dark:` variants.
- Add `"use client"` only if it uses state, effects or event handlers.
- **Accessibility first:**
  - Prefer native elements (`<button>`, `<dialog>`, `<details>`, `<input type="checkbox">`).
  - Otherwise follow the WAI-ARIA pattern for the widget, with roles, states, keyboard support and focus management.
  - Every control needs an accessible name.
- Write a short JSDoc that says when to use the component, and when to use something else instead.

## 2. Write a story in `apps/design-system/src/stories/`

- Group it under a title: `Components/`, `Forms/`, `Feedback/` or `Display/`.
- Add a `play` function for every behavior that matters, such as keyboard paths, focus moving and returning, ARIA state changes and callbacks (`fn()`).
- Query by role and name (`getByRole("switch", { name: "…" })`), never by class names.
- `userEvent` is synthetic. Native browser behavior, like Escape closing a `<dialog>`, won't fire from it, so handle those keys in the component too.

## 3. Verify

```bash
cd apps/design-system && pnpm typecheck && pnpm lint && pnpm test
```

- Tests run every story in the dark and light themes.
- An axe violation fails the test. Fix the cause: a token contrast problem is fixed in `packages/ui/src/styles.css`, never by turning off the rule.
- Run any new interaction test several times to catch flakiness. Async events, like a dialog's `close`, can race.

## 4. Document it

- Add the component to the list in `packages/ui/README.md`.
- If it adds new behavior coverage, mention it in `apps/design-system/README.md`.
