import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

// Rules below enforce AGENTS.md. Section numbers refer to that file.
// The 400-line hard cap and the components/ui edit guard are not expressible
// as lint rules; they live in scripts/precommit-checks.mjs instead.
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // Must come after the Next configs: turns off stylistic rules Prettier owns.
  prettier,

  {
    name: "gvps/rules",
    rules: {
      // §7 Size. Soft cap only — 400 is enforced at commit time.
      "max-lines": ["warn", { max: 250, skipBlankLines: true, skipComments: true }],
      "max-lines-per-function": ["warn", { max: 100, skipBlankLines: true, skipComments: true }],

      // §2 React discipline. A wrong dep array is a stale-closure bug, not a style issue.
      "react-hooks/exhaustive-deps": "error",

      // §8 TypeScript and patterns.
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
    },
  },

  // §6 shadcn output is generated and never edited, so it is not held to our
  // size or import rules — it just must not fail the build.
  {
    name: "gvps/shadcn-generated",
    files: ["src/components/ui/**"],
    rules: {
      "max-lines": "off",
      "max-lines-per-function": "off",
      "no-restricted-imports": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  // §4 Column definitions are data, and §9 describe blocks are long by nature.
  // Neither is a sign that a file holds more than one idea.
  {
    name: "gvps/data-and-tests",
    files: ["**/columns.tsx", "**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
    rules: {
      "max-lines": "off",
      "max-lines-per-function": "off",
    },
  },

  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
