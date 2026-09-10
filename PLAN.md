# PLAN.md

Delivery plan, architecture, and the decisions that are expensive to reverse.

Read alongside `FEATURES.md` (what) and `TESTS.md` (how it's verified).
`FEATURES.md` is the source of truth for scope and phasing. Where this file
disagrees with it, this file is wrong.

---

## 1. Guiding constraints

| Constraint | Consequence |
|---|---|
| Solo developer, no deadline | Optimise for correctness and maintainability over speed. Depth is affordable |
| Zero hosting budget | Self-hosted on Oracle Cloud Always Free. All ops work is yours |
| No existing digital records | Phase 1 is largely a data-entry problem, not a migration problem |
| Teachers mandated to use it | Mandate gets them to open it once. Reliability keeps them there |
| Real school, real families | Result and fee data are consequential. Correctness beats features |
| Learning project | Understand every abstraction before generating the next module |

---

## 2. Stack

### Chosen

| Layer | Choice | Rationale |
|---|---|---|
| Frontend | Next.js + TypeScript | Existing strength; App Router; server components for heavy list views |
| Backend | NestJS + TypeScript | Teaches DI, modules, guards, layered architecture — same mental model as Spring, without the language tax |
| Database | PostgreSQL 16 | Relational integrity is non-negotiable for results and ledgers |
| ORM | Prisma | Type safety end to end; migrations are first-class |
| Queue | BullMQ + Redis | Report card generation, bulk invoicing, message sending |
| PDF | Puppeteer (HTML/CSS → PDF) | Plays to frontend strength; iterate the card design in a browser |
| Auth | Passport + JWT in Nest | Learn it properly rather than delegating to a managed service |
| Storage | Local volume + off-box backup | Photos and generated PDFs |
| Hosting | Oracle Cloud Always Free ARM | 2 OCPU / 12 GB, permanently free |
| Frontend hosting | Cloudflare Pages | Free, unlimited bandwidth, no commercial-use restriction |
| Proxy / TLS | Caddy | Automatic certificates, minimal config |
| Backups | `pg_dump` → Cloudflare R2 | 10 GB free tier |

### Considered and rejected

**Java + Spring Boot.** Best career alignment with Interswitch and the best PDF
tooling (JasperReports). Rejected for now because learning Java syntax and
backend architecture simultaneously is where solo projects stall. NestJS is
deliberately Spring-shaped, so the architectural concepts transfer directly —
learn them once in TypeScript, then Java becomes syntax rather than syntax plus
paradigm. Revisit for v2 or for a standalone service.

**Go.** Already being learned, and consolidating beats adding a language.
Rejected because the web ecosystem is more assemble-it-yourself, the ORM story
is weaker, and this domain is heavy on relational modelling and business rules
where Go turns verbose. Good candidate later for the PDF worker as a separate
service.

**Express.** Gives routing and nothing else. A fifteen-module system without an
imposed structure becomes unmaintainable, and it teaches nothing new to someone
who already knows JavaScript well.

**Supabase-only (no backend service).** Fastest to ship, but the results engine
is heavy computation with a workflow state machine, which fits poorly in
serverless functions, and it would teach infrastructure-as-a-service rather
than backend engineering.

---

## 3. Architecture

```
┌─────────────────────┐         ┌──────────────────────┐
│  Next.js frontend   │         │  Parent token pages  │
│  Cloudflare Pages   │         │  (read-only, SSR)    │
└──────────┬──────────┘         └──────────┬───────────┘
           │                               │
           └───────────────┬───────────────┘
                           │ HTTPS
                  ┌────────▼─────────┐
                  │      Caddy       │  TLS termination
                  └────────┬─────────┘
                           │
                  ┌────────▼─────────┐
                  │   NestJS API     │  guards · DTO validation · services
                  └────┬────────┬────┘
                       │        │
              ┌────────▼──┐  ┌──▼──────────┐
              │ PostgreSQL│  │    Redis    │
              └───────────┘  └──┬──────────┘
                                │
                       ┌────────▼─────────┐
                       │  BullMQ workers  │  PDFs · invoicing · messaging
                       │   (Puppeteer)    │
                       └──────────────────┘

All backend containers on one Oracle Cloud ARM VM, via Docker Compose.
Nightly pg_dump → Cloudflare R2.
```

### NestJS module layout

```
src/
├── common/          guards, interceptors, pipes, decorators, filters
├── auth/            login, JWT strategy, parent token issuing
├── school/          school profile, branding, configuration
├── academic/        sessions, terms, levels, arms, sections, streams
├── subjects/        catalogue, offerings, teacher assignments
├── students/        registry, bulk entry
├── guardians/       guardians, student-guardian links
├── enrolment/       enrolment, promotion, transfer, withdrawal
├── admissions/      enquiry → exam → offer → enrolment
├── attendance/      daily and period marking, summaries
├── assessment/      components, grading scales, score entry
├── results/         computation engine, workflow, snapshots, broadsheet
├── reports/         PDF generation jobs, templates
├── fees/            structures, discounts, invoices, payments, ledger
├── parents/         parent accounts, OTP, device sessions, portal views
├── requests/        result review, fee review, threads, teacher reports
├── onboarding/      claim codes, staged submissions, approval queue
├── messaging/       WhatsApp/SMS adapters, templates, broadcast
├── timetable/       periods, allocation, clash detection
├── staff/           records, attendance, leave, payroll
├── analytics/       aggregations and dashboards
└── audit/           append-only log, viewer
```

**Build order is not this order.** See section 5.

---

## 4. Decisions that are expensive to reverse

Get these right in the first migration. Each has cost someone a rewrite.

### 4.1 `school_id` on every table
Single school today. The column costs nothing now and makes this sellable to
other schools later. Retrofitting multi-tenancy across forty tables is a
month of work and a source of subtle data-leak bugs.

### 4.2 Enrolment, not `class_id` on student
`enrolments` = student × session × class_arm. Promotion inserts a row. Putting
the class on the student record destroys history the moment anyone is promoted,
and the school's entire academic archive becomes unanswerable.

### 4.3 Snapshot published results
At approval, freeze both the computed values and the grading configuration
used. Never recompute on read. Otherwise changing CA weights next session
silently rewrites last session's report cards.

### 4.4 Money as integers in kobo
No floats anywhere near the fee ledger. Store `amount_kobo BIGINT`.
Format at the presentation layer only.

### 4.5 No hard deletes on scores or payments
Version rows. A corrected score keeps the original, the actor, the timestamp,
and a mandatory reason. A reversed payment is a reversal entry, not a deletion.

### 4.6 Guardians as entities with a join table
Not fields on the student. Families have siblings; family-level fee statements
and parent portal access both break under a one-parent-per-student model.

### 4.7 Section as a first-class concept
Primary and secondary differ in teaching model, grading scale, report card
layout, and traits. Model `section` explicitly rather than branching on
class level throughout the codebase.

### 4.8 Configuration in tables, not code
Assessment components, weights, grade boundaries, comment banks, trait lists,
fee items. Every one of these changes, and every school does it differently.

### 4.9 Offline-first score entry and attendance from the start
Retrofitting local persistence and a sync queue onto an online-only form means
rewriting the most-used screens in the system. Score entry and daily attendance
are both marked on phones on weak connections. Build one sync model, before
either screen exists, and reuse it.

### 4.10 Audit log from day one
Cheap to add at the start, effectively impossible to backfill.

### 4.11 Parents write only to request objects
Never to results, ledgers, or student records. If parent writes ever touch
real tables directly, the immutability guarantees in 4.3 and 4.5 are void, and
recovering them later means auditing every write path in the system.

### 4.12 Privilege grants separated from record creation
Staff accounts, role changes and guardian-to-student links are superadmin-only;
student and guardian records are created by office staff. Collapsing these into
one gate either stalls data entry or hands privilege escalation to a secretary.
Separating them afterwards means re-deriving who granted what, from an audit
log that was never designed to answer it.

### 4.13 The whitelist is never authentication on its own
A whitelisted number answers *"is this person allowed?"*, never *"is this
person who they claim to be?"* Parent numbers circulate freely in class
WhatsApp groups, so possession must be proved by OTP before any session is
issued. Shipping on a whitelist-only check and tightening it later invalidates
every existing session and means re-explaining the login to 600 people at once.

### 4.14 Parent contact details are never self-editable
Allowing a parent to change their own phone number from inside the account
turns one session into permanent account takeover. Contact changes route
through the school office like any other record change. Closing this afterwards
means auditing every account whose number moved while the route was open, with
no way to tell a legitimate change from a hostile one.

---

## 5. Phases

Each phase must be usable on its own. Nothing ships half-wired.

### Phase 1 — Foundation and registry
**Goal:** every student, guardian and staff member is in the system, and the
academic structure exists.

- Auth, roles, permission guards, audit log
- Privilege separation: staff accounts, role grants and guardian links are
  superadmin-only; student and guardian records are secretary work
- School profile and branding
- Sessions, terms, sections, levels, arms, streams
- Subjects, offerings, teacher assignments
- Student registry, guardians, enrolments
- Admission number format and generator
- Fast keyboard-driven bulk entry grid
- Backup and restore, tested with real data volume

**Done when:** the full school roll for the current session is entered,
verified against the paper register by the school office, and a restore from
backup has been performed successfully on a clean box.

**Note:** this phase feels like pure data entry to teachers. Phase 2 must
follow closely so they get something back for the effort.

---

### Phase 2 — Results engine
**Goal:** the school stops compiling results by hand.

- Assessment component configuration, grading scales
- Offline-capable score entry
- Approval workflow with progressive locking
- Computation: totals, grades, positions, class stats, cumulative
- Traits and comment banks
- Report card templates per section, PDF generation as a background job
- Broadsheet
- Result snapshotting
- Audit log viewer
- Parent detail form: claim codes, staged submissions, field-level approval queue
- Student movement: promotion, repetition, transfer, withdrawal, alumni
- CSV import, now that there is data worth exporting and re-importing

**Done when:** a full term's results are compiled, approved, and printed
entirely in the system, and the principal signs off that the cards match the
school's existing format.

**Highest-risk phase.** The computation engine and the snapshot model are the
hardest things in the project to change later. Test coverage here should be
near-total.

---

### Phase 3 — Fees
**Goal:** the school knows exactly who owes what.

- Fee structures, items, discounts, waivers
- Termly invoice generation
- Bursar payment recording, part payments, receipts
- Student and family ledger
- Debtor reports
- Withhold result on outstanding fees (school-configurable toggle)
- Admissions pipeline

**Done when:** a full term is invoiced, payments are recorded through the
system, and the debtor list reconciles against the bursar's own records.

---

### Phase 4 — Attendance, communication, parent portal
- Daily and period attendance, offline-capable
- Attendance summary feeding the report card
- WhatsApp/SMS adapters, templates, broadcast
- Triggered notifications: result published, fee reminder, receipt, absence alert
- **Parent accounts: whitelist + OTP, device sessions**
- **Parent portal: ward views, results, ledger, attendance**
- **Request objects: result review, fee review, message threads**
- Student ID cards
- Export to Excel/PDF across all list views
- Full-school data export in an open format

---

### Phase 5 — Timetable, online payments, reporting
- Period structure, timetable builder, clash detection
- Exam timetable
- Payment gateway integration and webhook reconciliation
- Financial reporting, collection rates
- Announcements and school calendar
- Teacher reporting workflow (restricted visibility, soft-delete only)

---

### Phase 6 — Staff, payroll, analytics
- Staff records, attendance, leave
- Payroll and payslips
- Academic and enrolment analytics
- At-risk student identification

---

## 6. Build discipline

**Build the first module slowly.** Students and enrolments, done deliberately,
understanding every decorator, guard, and provider before moving on. The
remaining modules are variations on it. Nest's DI and decorators feel like
magic when not understood, and copying tutorial patterns without knowing why
produces a codebase that cannot be debugged.

**One module at a time, fully finished:** entity → migration → DTOs →
validation → service → controller → guards → tests → UI. Do not leave a trail
of half-built modules.

**Write the migration before the code.** The schema is the durable artefact.

**Every endpoint scoped by default.** Unscoped access should require an
explicit, visible decision.

---

## 7. Infrastructure

### Provisioning
1. Oracle Cloud account. **Card verification frequently rejects Nigerian naira
   cards** — settle this before planning anything else around it.
2. Home region is permanent and cannot be changed; choose one with Ampere A1
   capacity. Expect "out of host capacity" and script the launch retry.
3. Ubuntu LTS on ARM, 2 OCPU / 12 GB (halved from 4/24 in June 2026).
4. Light cron job so the instance is never reclaimed as idle.
5. Docker + Docker Compose.
6. Caddy for TLS. Domain: a `.com.ng` or `.com` — the school will want a real one.

### Resource allocation (12 GB)
| Service | Memory |
|---|---|
| NestJS API | 1 GB |
| BullMQ worker + Puppeteer | 2 GB |
| PostgreSQL | 2 GB |
| Redis | 512 MB |
| Caddy | 128 MB |
| Headroom | remainder |

Comfortable. Chromium is the hungry one and only during generation runs.

### Backups — set up on day one, not after
- Nightly `pg_dump`, compressed, to Cloudflare R2.
- 30 daily, 12 monthly retention.
- Uploaded files backed up weekly.
- **Restore rehearsed on a clean box and documented before any real data is
  entered.** An untested backup is not a backup.
- Alert on backup failure.

### Environments
- Local: Docker Compose, seeded with realistic fake data.
- Staging: second Compose stack on the same VM, separate database.
- Production: never developed against directly.

---

## 8. Rollout to the school

Technical readiness is not adoption. The mandate gets teachers to open it once.

**Before Phase 1 data entry:** agree the admission number format, confirm the
exact current report card layout, get the school's logo and signatures, and
confirm the term dates and times-school-opened figures.

**During entry:** train the school secretary and form teachers on the entry
grid only. Nothing else. One screen, done well.

**Before Phase 2 goes live:** run one arm's results through the system in
parallel with the manual process. Compare every figure. Do not skip this.

**Ongoing:** a named person at the school who owns the data. Without one,
records rot regardless of the software.

**Watch for:** teachers reverting to paper after a sync failure. Treat any
report of lost score entry as a critical bug, not a support ticket.

---

## 9. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Oracle rejects card at signup | Blocks entire hosting plan | Resolve first, before any other planning |
| Oracle reclaims or terminates instance | Total loss | Off-box backups, tested restore, keep instance active |
| Oracle changes free tier again | Forced migration | Docker Compose means the stack is portable to any VPS |
| Score entry loses data | Teachers abandon the system | Offline-first, visible sync state, treat as critical |
| Report card doesn't match school format | Rejected by principal | Confirm layout before building; parallel run |
| Data entry stalls in Phase 1 | Project never starts | Excellent entry UX; scope to one arm at a time; progress visibility |
| Results computation subtly wrong | Wrong report cards to real families | Near-total test coverage; parallel run against manual results |
| Solo developer burnout on a 6-phase build | Project abandoned | Each phase independently useful; no phase depends on a later one |
| Fee data disputed | Trust in system collapses | Immutable ledger, no hard deletes, full audit log |
| Parent account accessed by non-parent | Another family's results and finances exposed | Whitelist plus OTP; never whitelist alone; no self-service contact change |
| OTP delivery costs escalate | Parents locked out | 90-day device sessions; WhatsApp before SMS; rate limiting |
| Approval queue backs up in Phase 2 | Parents abandon the form, revert to phoning the office | Keyboard-driven review, one screen per submission, secretary handles data approvals |
| Teacher reports used maliciously after results | Staff morale, unfair process | Identified not anonymous, restricted visibility, mandatory outcome note |

---

## 10. Definition of done, per module

- [ ] Migration written and reviewed
- [ ] Entities and DTOs with full validation
- [ ] Service logic with unit tests
- [ ] Controller with guards; permission tests for every role
- [ ] Integration tests against a real database
- [ ] Audit logging on all mutations
- [ ] UI complete and usable on a phone
- [ ] Error and loading states handled
- [ ] Works on a slow connection
- [ ] Documented in the module README
