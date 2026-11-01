import { defineConfig, globalIgnores } from "eslint/config";
import storybook from "eslint-plugin-storybook";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores(["storybook-static/**"]),
  ...tseslint.configs.recommended,
  ...storybook.configs["flat/recommended"],
]);
