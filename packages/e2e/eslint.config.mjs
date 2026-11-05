import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig([globalIgnores(["playwright-report/**", "test-results/**", "lighthouse-report/**"]), ...tseslint.configs.recommended]);
