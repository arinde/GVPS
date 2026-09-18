import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier/flat";

// One config for the whole workspace: apps/web and apps/api are scoped by
// `files` rather than split into per-package configs, so a single
// `npm run lint` / lint-staged invocation from the repo root covers both.
// Section numbers refer to AGENTS.md. The 400-line hard cap and the
// components/ui edit guard (§6) are not expressible as lint rules; they live
// in scripts/precommit-checks.mjs instead.
const sizeRules = {
  "max-lines": ["warn", { max: 250, skipBlankLines: true, skipComments: true }],
  "max-lines-per-function": ["warn", { max: 100, skipBlankLines: true, skipComments: true }],
};

// §8 TypeScript and patterns — applies to both apps per AGENTS.md §0.
const typeScriptRules = {
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/no-non-null-assertion": "warn",
  "@typescript-eslint/ban-ts-comment": [
    "error",
    {
      "ts-ignore": true,
      "ts-nocheck": true,
      "ts-expect-error": "allow-with-description",
    },
  ],
  "no-restricted-imports": [
    "error",
    {
      patterns: [
        {
          group: ["../../**"],
          message: "Use the @/ alias instead of climbing directories (AGENTS.md §8).",
        },
      ],
    },
  ],
};

const eslintConfig = defineConfig([
  // ---- apps/web (Next.js / React) ----
  {
    name: "gvps/web",
    files: ["apps/web/**/*.{ts,tsx,js,jsx,mjs,cjs}"],
    extends: [nextVitals, nextTs],
    rules: {
      ...sizeRules,
      ...typeScriptRules,
      // §2 React discipline. A wrong dep array is a stale-closure bug, not a style issue.
      "react-hooks/exhaustive-deps": "error",
      // App Router only — this project has no pages/ directory to check, and
      // the rule's cwd-relative lookup only ever resolves against the repo
      // root in this monorepo, not apps/web.
      "@next/next/no-html-link-for-pages": "off",
      // Toasts go through lib/notify.ts, never the library directly, so tone,
      // timing and error wording stay consistent and the library can be
      // swapped in one file.
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["../../**"], message: "Use the @/ alias instead of climbing directories (AGENTS.md §8)." },
          ],
          paths: [{ name: "sonner", message: "Use notify from @/lib/notify instead of importing sonner directly." }],
        },
      ],
    },
  },

  // The two files allowed to import sonner: the wrapper, and shadcn's
  // generated Toaster.
  {
    name: "gvps/web-notify",
    files: ["apps/web/src/lib/notify.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["../../**"], message: "Use the @/ alias instead of climbing directories (AGENTS.md §8)." },
          ],
        },
      ],
    },
  },

  // §6 shadcn output is generated and never edited, so it is not held to our
  // size or import rules — it just must not fail the build.
  {
    name: "gvps/web-shadcn-generated",
    files: ["apps/web/src/components/ui/**"],
    rules: {
      "max-lines": "off",
      "max-lines-per-function": "off",
      "no-restricted-imports": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  // §4 Column definitions are data, and §9 describe blocks are long by nature.
  {
    name: "gvps/web-data-and-tests",
    files: ["apps/web/**/columns.tsx", "apps/web/**/*.test.{ts,tsx}", "apps/web/**/*.spec.{ts,tsx}"],
    rules: { "max-lines": "off", "max-lines-per-function": "off" },
  },

  // ---- apps/api (NestJS) ----
  {
    name: "gvps/api",
    files: ["apps/api/**/*.ts"],
    extends: [tseslint.configs.recommended],
    rules: {
      ...sizeRules,
      ...typeScriptRules,
    },
  },

  // §9 describe/it blocks are long by nature.
  {
    name: "gvps/api-tests",
    files: ["apps/api/**/*.spec.ts", "apps/api/**/*.e2e-spec.ts"],
    rules: { "max-lines": "off", "max-lines-per-function": "off" },
  },

  // Must come after the app configs: turns off stylistic rules Prettier owns.
  prettier,

  globalIgnores(["apps/web/.next/**", "apps/web/out/**", "apps/web/next-env.d.ts", "apps/api/dist/**", "**/build/**"]),
]);

export default eslintConfig;
