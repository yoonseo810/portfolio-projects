import { addons } from "storybook/manager-api";
import { create } from "storybook/theming";

addons.setConfig({
  theme: create({
    base: "dark",
    brandTitle: "@repo/ui · Michael Seo",
    brandUrl: "https://portfolio-projects-wine.vercel.app",
    brandTarget: "_blank",
    colorPrimary: "#8b7dff",
    colorSecondary: "#8b7dff",
    appBg: "#0e0e13",
    appContentBg: "#07070a",
    appPreviewBg: "#07070a",
    appBorderColor: "rgba(255,255,255,0.08)",
    barBg: "#0e0e13",
    textColor: "#ededf2",
    textMutedColor: "#9b9bab",
    fontBase: '"Geist Variable", ui-sans-serif, system-ui, sans-serif',
    fontCode: '"Geist Mono Variable", ui-monospace, monospace',
  }),
});
