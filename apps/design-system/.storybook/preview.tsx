import type { Preview } from "@storybook/react-vite";
import { withThemeByClassName } from "@storybook/addon-themes";
import { themes } from "storybook/theming";
import "./preview.css";

// Dark is the system's default theme. Docs pages that render no story (like the
// tokens page) never run the theme decorator, so start dark here too.
document.documentElement.classList.add("dark");

const preview: Preview = {
  parameters: {
    layout: "padded",
    controls: { expanded: true },
    backgrounds: { disable: true },
    docs: { theme: { ...themes.dark, appContentBg: "#07070a", appPreviewBg: "#07070a", fontBase: '"Geist Variable", ui-sans-serif, system-ui, sans-serif' } },
    // Accessibility violations fail the story's test, in the UI and in CI.
    a11y: { test: "error" },
  },
  decorators: [
    withThemeByClassName({
      themes: { dark: "dark", light: "" },
      defaultTheme: "dark",
    }),
  ],
  tags: ["autodocs"],
};

export default preview;
