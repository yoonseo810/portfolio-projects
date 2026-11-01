import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";

declare module "vitest" {
  export interface ProvidedContext {
    theme: "dark" | "light";
  }
}

// Every story runs as a test in a real Chromium, once per theme: it must render,
// pass its play() interaction checks, and have no axe accessibility violations.
const project = (theme: "dark" | "light") => ({
  extends: true as const,
  plugins: [storybookTest({ configDir: ".storybook" }), tailwindcss()],
  test: {
    name: `storybook-${theme}`,
    provide: { theme },
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: "chromium" as const }],
    },
    setupFiles: [".storybook/vitest.setup.ts"],
  },
});

export default defineConfig({
  test: { projects: [project("dark"), project("light")] },
});
