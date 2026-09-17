import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

const here = import.meta.dirname;

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    // Threads, not the default forks pool. On Windows a forked process per
    // test file costs ~12s of startup and the pool times out waiting for
    // workers, so most files never run at all.
    pool: "threads",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      // Coverage targets come from TESTS.md §1 and are per-area, not global.
      // Generated and presentational files are excluded rather than padded.
      exclude: ["src/components/ui/**", "src/test/**", "**/*.d.ts", "**/columns.tsx"],
    },
  },
  resolve: {
    alias: { "@": resolve(here, "./src") },
  },
});
