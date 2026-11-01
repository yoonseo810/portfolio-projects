import { setProjectAnnotations } from "@storybook/react-vite";
import * as a11yAnnotations from "@storybook/addon-a11y/preview";
import { inject } from "vitest";
import * as projectAnnotations from "./preview";

// Each Vitest project runs every story in one theme, so axe checks contrast in both.
setProjectAnnotations([a11yAnnotations, projectAnnotations, { initialGlobals: { theme: inject("theme") } }]);
