# GVPS

npm workspace monorepo:

- `apps/web` — Next.js frontend
- `apps/api` — NestJS backend

See `AGENTS.md` for working rules, `FEATURES.md` for scope, `PLAN.md` for
architecture, `TESTS.md` for what gets verified.

## Setup

```
npm install
cp apps/api/.env.example apps/api/.env
```

## Common commands

Run from the repo root; they fan out to whichever workspace(s) apply.

| Command           | Does                                            |
| ----------------- | ----------------------------------------------- |
| `npm run dev`     | Next.js dev server                              |
| `npm run dev:api` | NestJS dev server (watch mode)                  |
| `npm run build`   | Build both apps                                 |
| `npm run check`   | Typecheck, lint, format check, test — both apps |
| `npm test`        | Run all tests                                   |
