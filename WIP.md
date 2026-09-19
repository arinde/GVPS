# WIP

Working state, so a session can be picked up cold. Update it at the end of a
work block, not continuously.

**Last updated:** 2026-09-19

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

Tests: **321 passing** — 166 API (Jest, 18 suites), 155 web (Vitest, 20 files).

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

**Stopping the API means stopping the watcher.** Killing the process on port
3001 is not enough: `nest start --watch` respawns it and it keeps the Prisma
engine locked (`prisma generate` fails with EPERM). Stop the node processes
whose command line mentions `nest` or `dist/main`.

**A JSON file beside a same-named module shadows it in Jest**, which resolves
`js, json, ts` in that order — hence `nigeria-states.data.json`, not
`nigeria-states.json`.

**Optional list fields use `blankAsUndefined`**, never
`.optional().or(z.literal(""))`: the union form loses the field's message.

**Checking signed-in screens in a browser** without anyone's password: create a
short-lived refresh-token row for the superadmin (sha256 of a random value),
give headless Edge the raw value as the `refreshToken` cookie (domain
`localhost`, path `/auth`), then revoke only the rows created since the check
began. Done with `playwright-core` installed outside the repo; the helper
script is deleted after each use rather than kept around.

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

Then, on registration and UX (2026-09-18):

- **Errors.** API validation messages are plain English (`common/zod-messages.ts`).
  The web parses every error shape (`lib/api-error.ts`) and puts field errors
  beside their inputs via `FormField` + `controlProps`.
- **Toasts.** Sonner behind a single wrapper, `lib/notify.ts`. ESLint rejects a
  direct `sonner` import anywhere else. Every action toasts.
- **Passwords.** `PasswordInput` with show/hide on every password field; the
  change-password screen has a confirmation field, a live length count, and
  client-side checks before sending.
- **Registration form.** Sections (Student / Class / Home and health / Parents
  and guardians). State of origin and LGA are dependent dropdowns; blood group
  and department are dropdowns; "Home address". At least one guardian required.
- **Department (stream)** for SSS students, stored on the **enrolment**
  (migration `enrolment_stream`) — required for senior, refused otherwise.
- **States and LGAs** vendored as `apps/api/src/reference/nigeria-states.data.json`
  (37 states, 774 LGAs, counts pinned by tests), served at `GET /reference/states`.
  Source package audited; a second candidate was rejected for listing 846 LGAs.
- **Admission number is permanent.** A database trigger (migration
  `admission_no_immutable`) refuses any change to an issued number. Exact
  lookup at `GET /students/lookup?admissionNo=GVPS/2026/0001`.
- AGENTS.md §12 — the user-experience standard every screen is held to.

Verified end to end over HTTP against live Neon: consecutive admission numbers,
duplicate rejection naming the existing number, one guardian row shared between
two siblings, enrolment into the current session, search, and detail.

---

### 2026-09-20 — decisions confirmed by the owner

- Codes NUR / PRY / SEC are right; early-years order Creche → Nursery 1 →
  Nursery 2 → KG 1 → KG 2 is right.
- **Entering secondary changes the admission number** (FEATURES.md §3.1).
  Not built yet because nothing moves a pupil between classes yet; it belongs
  to promotion. Plan: an `admission_number_history` table (student, number,
  code, issued, retired); reissue inside the promotion transaction, with the
  `admission_no_immutable` trigger relaxed only when that transaction sets a
  local flag (`SET LOCAL gvps.reissue_admission_no = 'on'`), so every other
  path still cannot change a number; lookup searches history too; audited.

### 2026-09-20 (later) — superadmin editing, audited

- **Staff**: "Edit details" on `/staff/[id]` → `/staff/[id]/edit` (the create
  form, reused). `PUT /auth/staff/:id` replaces details, next of kin, salary
  account and roles in one save (`staff-update.service.ts`). Guards: nobody
  removes their own superadmin role, and the school always keeps one.
- **Students**: "Edit details" on `/students/[id]` (superadmin only) →
  `/students/[id]/edit`: the child's details plus one card per guardian, each
  saved separately (a guardian may be shared by siblings).
  `PUT /students/:id` and `PUT /students/guardians/:guardianId`. Not editable
  on purpose: admission number and year, class (a transfer, later), links.
- **Audit**: every save that changes something writes one row with only the
  changed fields, before and after (`common/audit-diff.ts`); account numbers
  masked; a save with no changes writes nothing. The dashboard feed names the
  fields changed. There is no audit-log viewer screen yet.

### 2026-09-20 — admission codes, early years, passport photos

- **Admission numbers carry a category code**: `GVPS/NUR|PRY|SEC/{year}/{seq}`,
  each code with its own count per year (`AdmissionCounter.code`). Codes live
  on `School` (`admissionCodeNursery/Primary/Secondary`, defaults NUR, PRY,
  SEC) — change them there before real volume; no settings UI yet. JSS and
  SSS share SEC. The one number issued earlier (`GVPS/2026/0001`) keeps its
  old shape: issued numbers are immutable by trigger.
- **Year of admission** is a required dropdown on registration and sets the
  number's year; the exact date is now optional (`Student.admissionYear`,
  `dateOfAdmission` nullable). The year is kept between entries.
- **Early years**: Section `NURSERY` with Creche, Nursery 1, Nursery 2, KG 1,
  KG 2 (ranks 1–5, arm A each); every other level moved up five ranks.
  Order follows the owner's list; swap ranks if the school runs KG first.
- **Passport photos**: `student_photos` table (bytes, kept off `Student`),
  `GET/PUT /students/:id/photo`, scoped like the record. The browser resizes
  to a ≤360×460 JPEG first. Optional on registration (uploaded after the
  student is created; a failed upload never undoes it) and on the profile,
  where registering roles can add or change it.
- Migrations were written by hand (`migrate dev` refuses a non-interactive
  shell) and applied with `migrate deploy`; `migrate diff` confirmed the
  database matches the schema.

### 2026-09-19 — class setup

- **Classes** (`/classes`, superadmin and principal): add an arm to any level
  (choosing the level suggests its next letter; level and size are kept for
  the next one) and set each class's size inline — Enter or leaving the field
  saves it, empty clears it. New arms appear at once in registration, class
  allocation and the dashboard.
- API: `PATCH /academic/arms/:armId` (`{ capacity: number | null }`, audited as
  `academic.arm.updated`). Arm names are now stored upper-case.
- Arm names cannot be renamed or deleted from the UI on purpose: enrolments
  point at them. Add that only with a rule for arms that have students.

### 2026-09-19 — dashboard

- `GET /dashboard` (superadmin, principal; `apps/api/src/dashboard/`): enrolled
  per section, registered this week, staff and password-not-set counts,
  classes without a teacher, per-class enrolment, last 8 audit entries turned
  into plain lines by `describe-activity.ts`.
- Home page picks by role: leadership get screen 1 (Waiting on you, four stat
  cards, registration by class, recent activity); everyone else gets the quick
  links. Fees and attendance cards wait for those modules rather than show
  zeros. New common pieces: `StatCard`, `ProgressBar`. Registering, creating
  staff and allocating classes refresh it via the "Dashboard" tag.

### 2026-09-19 — staff screens

- **Staff accounts** (`/staff`, screen 12): name (links to `/staff/[id]`, the
  full profile), email, phone, role, classes, and a status pill — "Active" or
  "Password not set". The spec's Last sign-in and Suspended need data the app
  does not record yet.
- **Class allocation** (`/staff/classes`): every class with a form-teacher
  dropdown that saves on change and toasts the result. Teachers already at the
  limit are left out of other classes' lists. If there are no form teachers,
  the page links to creating one.
- Nav: "Add staff" became "Staff" and "Class allocation" (superadmin only).
  `StatusPill` in `components/common/` covers every status badge from now on.

### 2026-09-19 (later) — profiles

- **My profile** (`/profile`, `GET /me/profile`): every staff member sees their
  own details, next of kin, salary account, roles and classes. Read-only on
  purpose — edits go through the superadmin so a compromised login cannot
  redirect pay.
- **Student profile** (`/students/[studentId]`): the record card and enrolment
  history (STITCH-SCREENS.md screen 5). Results, fees and attendance tabs are
  added when those modules exist. Siblings are shown to school-wide staff only.
- **Tests paused** by the owner to save tokens — see AGENTS.md §9. Existing
  suites still run: 171 API, 155 web.

### 2026-09-19 — access rules, allocation, redesign, staff details

- **Access rules.** `apps/api/src/access/` decides what each person sees:
  superadmin, principal, bursar and secretary see the whole school; a teacher
  sees only students in classes allocated to them this session, and registers
  only into those. Enforced in every student endpoint, not the client.
  Allocations are read per request, so a change takes effect immediately.
  Deliberate widening of `FEATURES.md` §14: form teachers can register into
  their own class, because the school asked for it.
- **Class allocation.** `ClassAssignment` (session × class × teacher), one
  teacher per class, `MAX_CLASSES_PER_TEACHER = 2` in
  `class-assignments.service.ts` (a policy constant, change it there).
- **Staff details.** Names, phone, home address, next of kin, and an optional
  salary account (bank from a list, 10-digit NUBAN, account name; all three or
  none). Account numbers never appear in the staff list, only in the
  superadmin's single-profile read, and are masked (`******6789`) in the audit
  log. Format check only, no bank lookup: the owner confirms accounts with the
  bank themselves (decided 2026-09-19), so don't build name-enquiry.
- **Redesign to STITCH-GLOBAL.md.** Kumbh Sans, navy sidebar + top bar on
  desktop, top bar + bottom tabs on a phone, spec colours and radii. Controls
  come from `components/common/` wrappers; ESLint blocks the raw shadcn ones.
- **Bug fixed:** reloading any page while signed in bounced to the dashboard.
  The session restore now signs in within the same Redux action that ends the
  request (`auth-slice.ts`), so there is no in-between render.
- **Bug fixed:** link-styled buttons were announced as buttons to screen
  readers. `AppLinkButton` renders a real link.
- **Bug fixed:** optional list fields ("bank", "blood group") reported a bare
  "Invalid input". `common/schemas/blank-as-undefined.ts` fixes the pattern.

## 5. Next, in order

1. **Look at the dashboard in a browser.** Built and type-clean but not yet
   seen rendered (the dev servers were stopped mid-check). Class sizes
   (`ClassArm.capacity`) are unset until entered on `/classes`, so progress
   shows counts without bars until then. The class setup page is also unseen.
2. **Promotion and class transfer**, with the primary → secondary number
   reissue above.
3. **Bulk entry grid** (`FEATURES.md` §3.5). Also: an optional class on the
   create-staff form (the Figma form has one).
4. **Subjects and offerings** (§2.3). Class allocation (§2.4, form teacher) is
   done; subject-teacher allocation comes with subjects.

---

## 6. Known gaps

**Phone tab bar contrast.** STITCH-GLOBAL.md §12 sets inactive tab labels to
`#B9C5CE` on white, which fails WCAG contrast (about 1.9:1). The owner chose to
keep it as specified (2026-09-19), so don't change it unprompted.

**Figma frames not yet seen.** The Starter plan's call limit stopped after
three frames (dashboard, teachers, add teacher). Student registration and the
other 31 frames were not compared.

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

**Do not smoke-test registration against this database any more.** It holds
real students now (`GVPS/2026/0001` was registered on 2026-09-18), and every
test registration burns a real admission number. A test run on 2026-09-18
consumed `0002`; the counter was reset to 1 afterwards so the register has no
gap. Use a Neon branch or a separate database for anything that writes.
