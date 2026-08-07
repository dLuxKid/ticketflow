import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

/**
 * Unit/component test runner. Playwright already covers whole user journeys end to end;
 * this layer exists for logic that is expensive to reach through a browser - rendering
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
    coverage: {
      provider: "v8",
      // `text` for the terminal, `lcov` for badge/reporting services, `json-summary` so a
      // script can read the totals without parsing human output.
      reporter: ["text", "lcov", "json-summary"],
      reportsDirectory: "coverage",
      // Deliberately NO thresholds. A minimum set before the baseline is known either sits
      // so low it asserts nothing, or fails the build on day one - neither tells you
      // anything. Measure first, then set the floor just under the real number.
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.{test,spec}.{ts,tsx}",
        // Type declarations and static data carry no logic to exercise; counting them
        // would depress the number without indicating any real risk.
        "src/types/**",
        "src/assets/**",
        "src/**/layout.tsx",
      ],
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
