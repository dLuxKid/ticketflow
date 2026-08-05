import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

/**
 * Unit/component test runner. Playwright already covers whole user journeys end to end;
 * this layer exists for logic that is expensive to reach through a browser — rendering
 * branches, form validation, and regressions we want pinned cheaply.
 *
 * `e2e/` is excluded because Playwright owns those specs and its `test` export would
 * otherwise collide with Vitest's.
 */
export default defineConfig({
  plugins: [react()],
  // Next's tsconfig sets `jsx: "preserve"` for its own compiler, which leaves esbuild
  // emitting classic-runtime JSX here and failing with "React is not defined". Opt the test
  // transform into the automatic runtime instead of importing React into every test file.
  esbuild: { jsx: "automatic", jsxImportSource: "react" },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.tsx"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["e2e/**", "node_modules/**", ".next/**"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
