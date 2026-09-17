# WIP

Working state, so a session can be picked up cold. Update it at the end of a
work block, not continuously.

**Last updated:** 2026-09-17

---

## 1. Where the build stands

**Student registration is live.** The form is at `/students/new`, admission
numbers allocate automatically, and the database is seeded with the structure
registration needs.

Phase 1 of `PLAN.md` §5, item by item:

| Item                                             | State                      |
| ------------------------------------------------ | -------------------------- |
| Auth, roles, permission guards, audit log        | Done                       |
| Privilege separation (superadmin-only grants)    | Done                       |
| Sessions, terms, sections, levels, arms, streams | API done, seeded, no UI    |
| Student registry, guardians, enrolments          | **Done — API, form, list** |
| Admission number format and generator            | **Done**                   |
| Subjects, offerings, teacher assignments         | Not started                |
| Bulk entry grid                                  | Not started                |
| School profile and branding                      | Not started                |
| Backup and restore                               | Not started                |

Tests: **127 passing** — 64 API (Jest, 8 suites), 63 web (Vitest, 10 files).

Database: Neon Postgres, three migrations applied. Seeded with school "GVPS",
one superadmin, 12 class levels each with arm A, session 2026/2027 and its
three terms, with First Term current.

---

## 2. Running things

Both apps, two terminals:

```
npm run dev          # web  → http://localhost:3000
npm run dev:api      # api  → http://localhost:3001
```

Registration form: **http://localhost:3000/students/new**

**Signing in.** One account exists: `superadmin@example.com`. Passwords are
argon2-hashed and cannot be read back, so if it is lost the only way in is:

```
npm run db:reset-password -w apps/api -- superadmin@example.com
```

It prints a temporary password once, forces a change at next login, and
revokes existing sessions. This is the only recovery path for the bootstrap
account — registration is closed (`FEATURES.md` §1.6) and
`/auth/staff/:id/reset-password` itself needs a superadmin session.

**Do not run `npm run check` casually** — it runs every workspace and takes
minutes. Check only what was touched:

```
npm run test -w apps/api          # Jest
npm run typecheck -w apps/api
npx jest src/students             # one module, from apps/api
npm run test -w apps/web          # Vitest
npx prettier --write <paths>      # before committing
```

Seeds, both idempotent:

```
npm run db:seed -w apps/api            # school + first superadmin
npm run db:seed:academic -w apps/api   # levels, arms, session, terms
```

---

## 3. Gotchas already paid for

Each of these cost real time. Do not rediscover them.

**Neon needs `connect_timeout=15` on both URLs.** Scale-to-zero suspends idle
computes and Prisma's default connect timeout is shorter than a cold start.
Symptom: a query fails with P1001, the identical retry succeeds.

**Strip `channel_binding=require`** from Neon's connection strings. Prisma's
driver does not support SCRAM channel binding.

**`DIRECT_URL` points at the pooled endpoint.** This project's derived direct
host is not routable. Migrations work through the pooler regardless.

**`deleteOutDir` must stay `false` in `nest-cli.json`** while `tsconfig.json`
has `"incremental": true`. Wiping `dist/` does not invalidate
`tsconfig.tsbuildinfo`, so the next watch build reports "Found 0 errors",
emits nothing, and nest dies on a missing `dist/main`.

**Vitest must use `pool: "threads"`.** The default forks pool times out on
Windows and silently skips most test files.

**Stale Turbopack cache** after changing `layout.tsx`: `rm -rf apps/web/.next`.

**`apps/web/.env` must exist** with `NEXT_PUBLIC_API_URL="http://localhost:3001"`.

**Prisma migrations with hand-written SQL need `--create-only`.** Two rules
live only in SQL: partial unique indexes for "one current session/term", and a
trigger rejecting a stream on a non-senior arm. A `CHECK` constraint cannot do
the latter — Postgres forbids subqueries in CHECK.

---

## 4. Done in the last block

- Design tokens wired: Libre Baskerville / IBM Plex via `next/font`, the
  "Administrative Authority" palette, status colours, 7px/5px radii.
- Academic structure module: schema, migration, services, controller, 20 tests.
- Student registry: `Student`, `Guardian`, `StudentGuardian`, `Enrolment`,
  `AdmissionCounter`; registration service, controller, 20 tests.
- Registration form and its container, 9 tests.
- Academic structure seeded so registration can actually run.
- App shell: role-aware navigation, current period, sign out, 11 tests.
- Student registry list at `/students`, with search.
- `db:reset-password` CLI — the only way back into a locked-out superadmin.

Verified end to end over HTTP against live Neon: consecutive admission numbers,
duplicate rejection naming the existing number, one guardian row shared between
two siblings, enrolment into the current session, search, and detail.

---

## 5. Next, in order

1. **More arms.** Seeded with arm "A" per level. The school will have B and C
   in places — add through `POST /academic/levels/:id/arms`, no UI yet.
2. **Confirm the admission number format with the school** before volume entry.
   It is `GVPS/2026/0001` today, configurable on the `School` row
   (`admissionNoFormat`, `admissionNoPrefix`, `admissionNoPadding`). Changing it
   after 200 students means two formats in one register.
3. **Bulk entry grid** (`FEATURES.md` §3.5). The form is one-at-a-time; the grid
   is what makes a form teacher's own class viable.
4. **Subjects, offerings, teacher assignments** (§2.3–2.4). Form-teacher
   ownership belongs here, session-scoped — see the note in
   `class-structure.service.ts` for why it is not a column on `ClassArm`.

---

## 6. Known gaps

**No integration tests.** `TESTS.md` §2 requires suites against a real Postgres;
every API test today mocks Prisma. The database-level rules (partial unique
indexes, the stream trigger, cross-school scoping, concurrent admission
numbering) are verified only by hand. This needs a harness before the results
engine.

**Admission numbers are not proven under real concurrency.** The counter uses an
atomic increment inside the transaction and there is a unique index behind it,
but nothing has yet hammered it with parallel registrations.

**No photograph capture.** Deliberate — `FEATURES.md` §3.5 says it must never
block entry. `Student.photoUrl` exists and is unused.

**Two lint warnings** on `guardian-fieldset.tsx` (103 lines) and
`student-bio-fields.tsx` (105). Both are flat lists of form fields — one idea
each — and §7 says never split on line count alone. Left deliberately.

**Design exports unorganised.** Five `stitch_school_management_system_ui*`
folders at the repo root; four screenshots are 28-byte placeholders.
