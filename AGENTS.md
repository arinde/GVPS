<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# GVPS — working rules

`FEATURES.md` is the source of truth for scope, `PLAN.md` for architecture and
the decisions that are expensive to reverse, `TESTS.md` for what gets verified.
Where this file disagrees with those three, they win.

These rules are strict. If following one makes a task impossible or absurd, say
so and stop — do not quietly work around it. Sections 7–9 apply to the NestJS
backend as well; the rest is frontend.

---

## 1. Reusability is the default

Every other rule here serves this one. A component written for one screen and
usable only on that screen is a defect, not a shortcut.

- **Presentational components take props and nothing else.** No store reads, no
  query hooks, no `useRouter`, no hardcoded copy or data. They render what they
  are handed.
- **Container components wire data.** They read RTK Query and Zustand, then pass
  plain props downward. Only a container knows where data came from.
- A component that cannot be rendered in a test from props alone is not
  finished.
- Before writing a component, look for an existing one. Extend it with props or
  composition rather than copying it.
- Copying a component to change two lines is forbidden. Extract the difference
  into a prop.
- Nothing in `components/common/` contains a feature-specific string, id, or
  endpoint.

**Where things live**

```
components/ui/        shadcn — generated, never edited (§6)
components/common/    reusable across features — fields, DataTable, EmptyState
components/<feature>/ feature containers and their parts
```

A component moves from `<feature>/` into `common/` the second time it is
needed, not the third.

---

## 2. React discipline

`useState` and `useEffect` are for what nothing else covers. Most uses of them
are a fetch, a derived value, or a sync between two pieces of state — and all
three have better answers.

**Never**
- `useEffect` to fetch data. RTK Query only.
- `useState` holding server data. The RTK Query cache is the single source of
  truth; copying out of it creates two versions of the same fact, which drift.
- `useState` for anything derivable from props or other state. Compute it during
  render.
- `useEffect` that sets state the same component reads on the same pass.
- `useEffect` to reset state when a prop changes. Use a `key` instead.

**Allowed, each with a comment naming the external system**
- Subscribing to something outside React — browser APIs, `navigator.onLine`, a
  websocket, IndexedDB, a non-React library.
- Imperative DOM work with no declarative equivalent.
- Anything with a genuine cleanup function.

Every `useEffect` carries a one-line comment saying what it synchronises with.
If that sentence cannot be written, the effect is wrong.

**Prefer** event handlers over effects, derived values over stored ones, and
`useMemo` only where a measurement justified it.

---

## 3. State

Three homes, no overlap.

| Layer | Owns | Location |
|---|---|---|
| RTK Query | All server data — fetching, caching, invalidation | `store/api/` |
| RTK slices | Cross-cutting domain state, offline sync queue | `store/slices/` |
| Zustand | Ephemeral UI — modals, filters, selections, wizard steps | `stores/ui/` |

- **Server data is never copied into a slice or a Zustand store.** Read it from
  the RTK Query hook at the point of use.
- One API file per domain (`store/api/students.ts`), with tags declared for
  invalidation. No manual refetch where a tag would do.
- Zustand is consumed through selectors — `useUiStore(s => s.sheetOpen)`, never
  `useUiStore()`. Subscribing to a whole store re-renders on every unrelated
  change to it.
- The Redux store is created inside a client provider via `makeStore()`, never
  as a module-scope singleton — a shared singleton leaks state between requests
  during SSR.
- Server components never read the store. `'use client'` goes as low in the tree
  as it can; a page stays a server component until something forces otherwise.

---

## 4. Tables

All tabular data goes through TanStack Table. No hand-rolled `<table>` with
`.map()`.

- One reusable `DataTable` in `components/common/` owns the shell: header, body,
  empty state, loading, pagination.
- Column definitions live in their own `columns.tsx` beside the feature. They
  are data, and they are what makes table files long.
- Sorting, filtering and pagination use the library's state, never a parallel
  `useState`.
- Server-side pagination for any list that can exceed one page. `TESTS.md` §12
  asserts no list endpoint returns unpaginated.

---

## 5. Icons

`lucide-react` is the only icon source. No inline SVG, no second icon pack.
Size and colour through `className`, never hardcoded `width`/`height`.

---

## 6. shadcn/ui

**Never edit a file in `components/ui/`.** Those are generated. Re-running
`npx shadcn add <component>` must produce no diff.

To change one:
- **Appearance** — pass `className`, merged with `cn()`.
- **A new variant** — wrap it in `components/common/` and extend with `cva`
  there.
- **Behaviour** — compose around it. Wrap it, never fork it.

Editing the base file works until the next upgrade, which then either loses the
change or blocks the upgrade.

---

## 7. Size

| Limit | Value |
|---|---|
| Line length | 120 |
| File length | 250 warn, 400 error |
| Function length | 100 warn |

A file at the warning threshold is saying it holds more than one idea. Split it
by responsibility — extract the columns, the hook, the schema, the
sub-component — never by line count alone.

---

## 8. TypeScript and patterns

- `strict: true`. No `any` — use `unknown` and narrow. No `@ts-ignore`.
- No non-null `!` without a comment saying why it holds.
- Named exports everywhere except Next's required defaults for `page`, `layout`,
  `error` and `loading`.
- Files `kebab-case.tsx`, components `PascalCase`, hooks `use-thing.ts`.
- Absolute imports through `@/`. Never `../../..`.
- Validate every API boundary with a zod schema and derive the TypeScript type
  from it rather than declaring both.
- **Money is integer kobo everywhere** (`PLAN.md` §4.4). Format only in the
  presentation layer. No floats, no `parseFloat` on an amount.
- Dates are ISO strings across the wire, `Date` only at the edges.

---

## 9. Tests

Written in the same commit as the code, never afterwards.

**Needs a test**
- Every pure function, reducer, slice and selector.
- Every custom hook.
- Every component with conditional rendering, interaction, or a branch.
- Every permission or scoping decision (`TESTS.md` §6).

**Does not**
- Generated `components/ui/` files.
- Presentational components that render props with no logic.

**How**
- Frontend: Vitest + React Testing Library. Backend: Jest (`TESTS.md` §2).
- Test behaviour through the accessible surface — role, label, text. Reach for
  `data-testid` only when nothing else identifies the element.
- Never assert on internal state or a store's shape. Assert what a user sees.
- Coverage targets come from `TESTS.md` §1, not a blanket percentage.

---

## 10. Enforcement

These are lint rules, not preferences.

**ESLint** — `eslint.config.mjs`. Warnings: `max-lines` 250,
`max-lines-per-function` 100. Errors: `no-explicit-any`, `ban-ts-comment`,
`react-hooks/exhaustive-deps`, and `no-restricted-imports` against `../../`
climbing. Generated `components/ui/`, `columns.tsx` and test files are exempt
from the size rules — they are long because they hold data, not because they
hold two ideas.

**Prettier** — `.prettierrc.json`, `printWidth: 120`. The four spec documents
are in `.prettierignore` so their hand-wrapping survives.

**Pre-commit** — `.githooks/pre-commit` runs lint-staged, then
`scripts/precommit-checks.mjs` for the two rules ESLint cannot express: the
400-line hard cap (§7) and the ban on editing a generated file in
`components/ui/` (§6). Adding a newly generated component there is allowed;
modifying or deleting one is blocked. Importing from `components/ui/` is always
fine — the rule is about editing those files, not using them.

Hooks are wired by `npm run prepare`, which git runs on install.
`npm run check` runs typecheck, lint and format check together.

A rule in this file that is not yet wired into config still applies.

---

## 11. Before writing code

Next in this repo is version 16 and differs from training data — read the
relevant guide in `node_modules/next/dist/docs/` first, as the block at the top
of this file instructs.

Then: schema before code, one module at a time, finished before the next
(`PLAN.md` §6).
