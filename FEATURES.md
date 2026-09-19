# FEATURES.md

School Management System — full feature specification.

Primary + Secondary school, Nigerian curriculum. Single school at launch,
multi-tenant-capable schema.

Status legend: `P1` `P2` `P3` `P4` `P5` `P6` = delivery phase. `—` = out of scope.

---

## 0. Scope and non-goals

### In scope
A complete replacement for the school's paper and verbal record-keeping:
student registry, academic structure, attendance, assessment and report cards,
fees and finance, parent communication, timetabling, staff records, and
reporting.

### Explicitly out of scope
| Excluded | Reason |
|---|---|
| Library management | School has no lending library |
| Hostel / boarding | Day school |
| Transport / bus tracking | Not operated by the school |
| E-learning / LMS / video lessons | Different product; teachers won't use it |
| CBT exam engine | Paper exams; revisit only if requested |
| Full accounting / general ledger | Fee ledger only; not a replacement for an accountant |

These appear in every commercial school product and are used by almost nobody.
Adding them costs maintenance and dilutes the parts that matter.

---

## 1. Identity, roles and access

### 1.1 Roles `P1`
Seven roles. Permissions are **scoped**, not global — a teacher's rights derive
from their assignments, not from their role alone.

| Role | Scope | Core capability |
|---|---|---|
| Superadmin (proprietor) | Whole school | Everything, including financial totals, audit log, and sole control of privilege grants |
| Principal | Section (primary / secondary) | Approves results, views everything academic |
| Bursar | Whole school | Fees, invoices, payments, debtors. **No result access** |
| Form teacher | Their arm | Reviews scores for their arm, writes form-teacher comments, marks daily attendance |
| Subject teacher | Their subject × arm assignments | Enters scores for assigned subjects only |
| Parent / guardian | Their wards only | Read: results, fee statement, attendance. Write: own requests only (§12) |
| Admin / secretary | Whole school | Student and staff records, admissions, no results approval, no payments |

A single staff member can hold several roles (a form teacher is also a subject
teacher; a principal may teach).

### 1.2 Authentication `P1`
- Staff: email + password, argon2 hashing.
- Forced password change on first login.
- Session via httpOnly refresh token + short-lived access token.
- Account lockout after repeated failures.
- Password reset by admin (staff are physically present; no email round-trip needed).
- Account creation and admin-issued reset both generate a temporary password
  shown to the admin **once**, in the response to that action — never emailed,
  never retrievable again. The admin relays it to the staff member in person,
  who is then forced through the password-change flow above on first login.

### 1.3 Parent accounts — passwordless `P4`

> **Built differently for now (owner's decision, 2026-09-20).** One family
> portal for parents and students, used by the parent. Sign-in is the phone
> number on the guardian record plus a password the school issues on a slip
> (changed at first sign-in, reset by the superadmin), not a one-time code —
> chosen to avoid per-message SMS/WhatsApp costs. One login per phone number
> reaches every child linked to it. The whitelist-plus-proof principle below
> still holds: the slip password is the proof. Moving to one-time codes later
> needs only a messaging provider; the accounts and scoping stay.

Parents get real, persistent accounts. No passwords anywhere in the parent
flow, which removes the reset burden that would otherwise land on the school
office for 600+ people.

#### Whitelist plus proof of possession
Access requires **both**:
1. The phone number or email is whitelisted — it belongs to an approved
   guardian record.
2. The person proves they control it — a one-time code sent to that channel.

**The whitelist alone is not authentication.** It answers *"is this person
allowed?"*, not *"is this person who they claim to be?"* Parent phone numbers
circulate freely in class WhatsApp groups, so a whitelist-only check means
anyone holding a class list can read another family's results and fee records.
The OTP is what makes it an identity check.

#### Session model
- OTP verified once → long-lived refresh token issued to that device (90 days).
- A parent performs roughly three OTPs a year, not one per visit.
- Codes delivered over WhatsApp where available, SMS as fallback
  (WhatsApp template messages are materially cheaper than Nigerian SMS at volume).
- Code: 6 digits, single use, 10-minute expiry, rate limited per number.
- Device list visible to the parent, with the ability to sign out a device.

#### Contact changes are never self-service
A parent **cannot** change their own phone number or email from inside the
account. Allowing it makes account takeover a single step: get in once, change
the number, hold the account permanently. Changes route through the school
office under §1.6, same as any other record change.

#### Identity edge cases
| Case | Handling |
|---|---|
| Two guardians share one phone number | One number may resolve to several guardian records. After OTP, present a "who are you?" selection |
| Staff member who is also a parent | One identity, two roles. Decided at design time — never two accounts |
| Recycled Nigerian phone number | Access revoked on withdrawal/graduation; numbers not left whitelisted indefinitely |
| Student withdrawn | Access degrades to read-only archive of that child's historical records |
| Student graduated | Same, then expires after a configurable period |
| Guardian linked to a new child | Requires superadmin approval — this is a permission change, not a data change |

#### What parents can reach
- Their wards only, enforced through `student_guardians`.
- Published results, fee statement and ledger, attendance summary,
  announcements, timetable.
- Their own requests (§12). Nothing else is writable.

### 1.4 Audit log `P1`
Append-only record of every mutation to results, fees, and student records:
actor, timestamp, entity, before/after, reason where required.
Both result disputes and payment disputes end in *"who changed this?"* —
the log must be able to answer.

### 1.5 Permission enforcement `P1`
- All scoping enforced in the API layer (NestJS guards), never in the client.
- Guards resolve against `teacher_assignments` and `enrolments`, not against
  the students table directly.
- Every list endpoint is scoped by default; unscoped access requires an
  explicit elevated permission.

### 1.6 Onboarding and approval `P1`

**Registration is closed.** There is no public signup for any role.

#### The distinction that matters
"Onboarding" covers three different things, and they must not share one gate:

| Thing | Nature | Who controls it |
|---|---|---|
| Staff user account | A credential with privileges | **Superadmin only** |
| Role assignment or change | A privilege grant | **Superadmin only** |
| Guardian → student link | Governs who sees whose results — a permission decision wearing the costume of data entry | **Superadmin only** |
| Student record | Data | Admin / secretary |
| Guardian record | Data | Admin / secretary |
| Guardian contact update | Data | Admin / secretary |

Routing 400 student records through the superadmin guarantees Phase 1 stalls.
Routing a role grant through the secretary is a privilege escalation. Split
them.

#### Parent detail form `P2`
Pushes guardian data entry out to the parents themselves. Removes a large share
of Phase 1 typing and improves accuracy — parents know their own phone numbers,
the secretary does not.

**Claim codes, not an open link.** A public form invites junk submissions and
orphan records nobody can attribute. Instead:
- School sends home a slip per student carrying a single-use claim code.
- Parent enters the code; the child's name renders as confirmation.
- Every submission arrives already bound to a known student.
- Code expires on use; failed attempts rate limited and non-enumerable
  (the response must not reveal whether a code exists).

**Submissions are proposals, never writes.**
- Land in a staging table with a status: `pending` / `approved` / `rejected`.
- Never touch `students` or `guardians` until approved.
- Reviewer sees a **field-by-field comparison** of current value against
  submitted value.
- **Accept or reject per field**, not all-or-nothing. Parents get some fields
  right and some wrong; a binary decision means importing errors or discarding
  good data.
- Rejection carries a reason and a route back to resubmit.
- Approval writes through to the real record and logs to audit.

**Review throughput is a design constraint.** 400 submissions is real work. If
the queue sits for weeks, parents lose faith and revert to phoning the office.
The queue is keyboard-driven: one submission per screen, approve-and-advance,
no page reloads.

**The form is the only public-facing surface in the system.** Rate limit it,
never confirm code validity in an enumerable way, and log every attempt.

#### Ongoing use
The same flow handles change over time. A parent whose number changes
resubmits through the form and it passes through the same review, which keeps
contact data from rotting between sessions.

---

## 2. Academic structure

### 2.1 Sessions and terms `P1`
- Academic session (e.g. 2026/2027), with start and end dates.
- Three terms per session, each with start date, end date, and
  **number of times school opened** (needed on the report card).
- Exactly one session and one term marked "current"; almost every screen
  filters by these.
- Session rollover: creates next session, carries forward structure.

### 2.2 Class levels, arms, sections `P1`
- **Section**: `primary` | `junior` | `senior`. Drives grading scale, report
  card template, and teaching model.
- **Class level**: Primary 1–6, JSS1–3, SSS1–3.
- **Arm**: Primary 4A, JSS2B. Each arm has a capacity and one form teacher.
- **Stream** (`senior` only): Science | Arts | Commercial. Determines subject
  offerings.

### 2.3 Subjects and offerings `P1`
- Subject catalogue with name, code, and section.
- `subject_offerings` = subject × class level × stream. A subject is not
  "in the school", it is offered to a specific level and stream.
- Core vs elective flag.
- Per-subject pass mark override where the school wants one.

### 2.4 Teacher assignments `P1`
Must serve both teaching models:
- **Primary**: class-teacher model — one teacher owns all subjects for an arm.
  Assignment UI should allow "assign all subjects for Primary 3A to X" in one action.
- **Secondary**: subject-teacher model — one teacher across many arms.
- Form teacher ownership is separate from subject assignment.

---

## 3. Student lifecycle

### 3.1 Admissions `P3`
- Enquiry capture → entrance exam record → offer → acceptance → enrolment.
- Entrance exam scheduling and score recording.
- Offer letter generation (PDF).
- Conversion of an accepted applicant into a student without re-entry of data.

### 3.2 Student registry `P1`
Bio data (permanent facts only):
- Full name, other names, date of birth, sex, nationality, state of origin, LGA.
- Passport photograph.
- Admission number (system-generated, format configurable, e.g. `SCH/2026/0142`).
  Confirmed with the school (2026-09-20): `GVPS/{CODE}/{YEAR}/{SEQ}`, codes
  `NUR` (Creche–KG 2), `PRY` (Primary 1–6), `SEC` (JSS 1–SSS 3), each with its
  own count per year. **A pupil who moves from primary into JSS 1 is issued
  a new `SEC` number**; the old number is kept in the student's history and
  still finds them in a lookup. Numbers are otherwise never changed.
- Year of admission (required — it sets the number's year); exact date
  optional. Admitted into level.
- Address, blood group (school clinic requirement), and any standing medical
  note the school holds.
- Previous school.

**`class_id` does not live on the student record.** See 3.4.

### 3.3 Guardians `P1`
- Guardians are first-class entities, not fields on a student.
- `student_guardians` join table with relationship type (father, mother,
  guardian) and a primary-contact flag.
- One guardian → many students. Families have siblings across primary and
  secondary, and both the fee statement and the parent portal break if you
  model one parent per student.
- Contact: phone (primary channel), alternate phone, email, address, occupation.

### 3.4 Enrolment `P1`
`enrolments` = student × session × class_arm. **The most important table
in the system.**
- Promotion creates a new row; it never updates an old one.
- Repetition, mid-session admission, transfer between arms, and withdrawal all
  fall out of this model naturally.
- Full academic history is preserved — *"what was Tunde's JSS2 result"* remains
  answerable forever.

### 3.5 Bulk entry `P1`
The school has **no existing digital records**. Everything is in hardcover
registers, so this is manual data entry, and the UX of it is the single
biggest determinant of whether Phase 1 completes.

- Keyboard-driven entry grid: one row per student, tab between fields,
  no page reload, autosave per row, inline validation.
- Entry scoped to one arm at a time so a form teacher can do their own class.
- Progress indicator per arm ("Primary 3A: 28 of 34 entered").
- Duplicate detection on name + date of birth.
- Photograph upload deferred — capture in a second pass, never block entry on it.
- `P2`: CSV import, once the school has data worth exporting and re-importing.

### 3.6 Movement and exit `P2`
- Promotion (bulk, driven by third-term cumulative performance). Promoting
  Primary 6 into JSS 1 issues each pupil a new `SEC` admission number (§3.1).
- Repetition, with reason.
- Transfer out, with transfer certificate PDF.
- Withdrawal, dismissal, alumni status.
- Reinstatement of a returning student against their original record.

### 3.7 Student ID cards `P4`
Printable card with photo, admission number, class, session, and school branding.

---

## 4. Attendance

### 4.1 Daily attendance `P4`
- Primary and junior: marked once daily by the form teacher.
- Present / absent / late / excused.
- Offline-capable: marks persist locally and sync when connectivity returns.

### 4.2 Period attendance `P4`
- Senior secondary, per-period, by the subject teacher. Optional per school policy.

### 4.3 Attendance reporting `P4`
- Termly summary per student: times present / times school opened.
  **Feeds directly onto the report card** — this is a standard field.
- Absence patterns, chronic absentee list.
- `P5`: automatic absence notification to guardian.

---

## 5. Assessment and results

The heart of the system. Everything else is supporting infrastructure.

### 5.1 Assessment configuration `P2`
Fully data-driven. Schools change these constantly and every school differs;
none of it may be hardcoded.
- Assessment components per section, each with a name, maximum score, and weight
  (e.g. CA1 = 10, CA2 = 10, Assignment = 10, Project = 10, Exam = 60).
- Components may differ between primary, junior and senior.
- Total must validate to 100.
- Configuration is versioned per session and term.

### 5.2 Grading scales `P2`
- Boundaries per section (primary and secondary commonly differ).
- Grade letter, descriptor, and remark per band
  (e.g. 75–100 → A1 → Excellent).
- Pass mark, and separate promotion threshold.

### 5.3 Score entry `P2`
- Teacher sees only their assigned subject × arm combinations.
- Spreadsheet-style grid: students down, components across.
- **Offline-first.** Local persistence with a visible sync state and a queue.
  Score entry that loses 30 rows to a dropped connection is the single most
  common reason Nigerian school software gets abandoned.
- Validation against component maximum on entry.
- Partial save; a teacher can leave and return.
- Bulk paste from a column.

### 5.4 Approval workflow `P2`
Scores lock progressively at each stage. This is the control a principal
actually wants and most products omit.

```
draft → submitted (teacher) → reviewed (form teacher) → approved (principal) → published
```

- At `submitted`, the subject teacher can no longer edit.
- At `approved`, scores are frozen.
- Any post-approval change requires an unlock with a mandatory reason,
  and is written to the audit log.
- Per-arm and per-subject status dashboard so the principal can see who has
  not submitted.

### 5.5 Computation engine `P2`
- Subject total from weighted components.
- Grade from the section's scale.
- Subject position within the arm (with correct tie handling).
- Student total, average, and position in arm.
- Class average, highest and lowest per subject.
- Cumulative average across terms within the session.
- Promotion recommendation at third term.

**Published results are snapshotted, never recomputed on read.** The computed
values *and* the grading configuration used to produce them are frozen at
approval. If the school changes CA weights next session, last session's cards
must not silently change. This is the most commonly-missed decision in this
domain.

### 5.6 Traits `P2`
Primary and junior report cards carry these; senior cards usually drop them.
- Affective: punctuality, neatness, politeness, honesty, cooperation, attentiveness.
- Psychomotor: handwriting, sports, drawing, craft, musical skill.
- Rated 1–5 by the form teacher.
- Configurable trait list per section.

### 5.7 Comments `P2`
- Comment bank per grade band, so a form teacher can select rather than type
  the same sentence 34 times.
- Free-text override on every comment.
- Form teacher comment and principal comment, separately.

### 5.8 Report cards `P2`
- HTML/CSS templates rendered to PDF, one template per section.
- Carries school branding, student photo, subject table, traits grid,
  attendance summary, comments, next term's resumption date and fee balance.
- Must resemble the card the school already issues. **This is the output the
  whole system is judged on.**
- Generated as a background job with progress reporting — 400 cards is not a
  click that hangs a browser tab.
- Individual regeneration on demand.

### 5.9 Broadsheet `P2`
- Full arm × subject score matrix, on screen and as printable PDF/Excel.
- The artefact teachers currently produce by hand over entire weekends.

### 5.10 Result publication `P2`
- Publish per arm, per term.
- Publishing triggers parent notification with a token link.
- `P3`: withhold a result where fees are outstanding (school-configurable toggle).

---

## 6. Fees and finance

### 6.1 Fee structure `P3`
- Fee items: tuition, development levy, books, uniform, PTA levy, exam fee,
  lesson fee, ICT levy.
- Structure defined per class level per term; each item optional/compulsory.
- New session copies forward the previous structure as a starting point.

### 6.2 Discounts and waivers `P3`
- Sibling discount (percentage or fixed, configurable by sibling rank).
- Scholarship (full or partial).
- Staff-child waiver.
- Ad-hoc approved discount with reason and approver.

### 6.3 Invoicing `P3`
- Termly invoice generation per student, in bulk per arm or level.
- Invoice reflects applicable discounts.
- Opening balance carried from previous term's arrears.
- Printable/downloadable invoice PDF.

### 6.4 Payments `P3`
- Bursar-recorded offline payment (cash, transfer, POS) with reference and
  optional evidence upload.
- Part payment and instalment support.
- Receipt PDF with unique receipt number.
- Reversal with mandatory reason (never a hard delete).
- `P5`: online payment via Paystack / Flutterwave / Interswitch, with webhook
  reconciliation.

### 6.5 Ledger and arrears `P3`
- Running ledger per student: invoices, payments, discounts, balance.
- Family-level statement across siblings.
- **Debtor list, filterable by arm, level and amount.** The single report that
  justifies the system to school management.
- Ageing of arrears across terms.

### 6.6 Financial reporting `P5`
- Collection rate per term, per level.
- Revenue by fee item.
- Daily/weekly collection summary for the bursar.
- `P6`: expense recording and simple payroll.

---

## 7. Communication

### 7.1 Channels `P4`
- WhatsApp and SMS as primary. Email as secondary; open rates are low.
- Templated messages with variable substitution.
- Delivery status tracking and retry.

### 7.2 Broadcast `P4`
- Target by whole school, section, level, arm, individual, or a filter
  (e.g. all debtors above a threshold).
- Scheduled send.
- Message history and audit.

### 7.3 Triggered notifications `P4`
- Result published → token link to ward's report card.
- Invoice issued and fee reminder before deadline.
- Payment received → receipt confirmation.
- Absence alert.

### 7.4 Announcements and calendar `P5`
- Notice board visible on the parent portal.
- School calendar: term dates, holidays, PTA meetings, exams, resumption.

---

## 8. Timetable

### 8.1 Structure `P5`
- Period definitions per section (start/end times, break, assembly).
- Manual timetable builder, arm by arm.
- **Teacher clash detection** — one teacher cannot be in two arms at once.
- Free-period view per teacher.

### 8.2 Exam timetable `P5`
- Per term, per level, with venue and invigilator assignment.
- Printable.

### 8.3 Distribution `P5`
- Per-arm printable timetable.
- Per-teacher personal timetable.

---

## 9. Staff and HR

### 9.1 Staff records `P6`
- Bio data, photograph, staff number.
- Qualifications, subjects competent to teach, date of employment.
- Employment status (full-time, part-time, NYSC, contract).
- Next of kin, bank details for payroll.

### 9.2 Staff attendance `P6`
- Daily clock-in record or manual marking.
- Lateness and absence summary.

### 9.3 Leave `P6`
- Request, approval, balance tracking.

### 9.4 Payroll `P6`
- Salary structure, allowances, deductions.
- Monthly payroll run, payslip PDF.
- Deliberately last. It is the module most likely to be handled outside the
  system, and getting it wrong has consequences.

---

## 10. Analytics and reporting

### 10.1 Academic `P6`
- Subject performance across arms and teachers.
- Term-on-term trend per student, arm, and level.
- At-risk students (failing threshold, declining trend, chronic absence).
- Teacher performance comparison, handled carefully.

### 10.2 Enrolment `P6`
- Enrolment by level, sex, and session.
- Retention, attrition, admission funnel conversion.

### 10.3 Financial `P6`
Covered in 6.6.

### 10.4 Exports `P4`
- Every list view exports to Excel and PDF.
- Non-negotiable: schools submit returns to the Ministry of Education in
  their own formats, and the system must not become a place where data goes
  in but cannot come out.

---

## 11. System administration

### 11.1 School profile `P1`
- Name, motto, address, contact, logo, signatures (principal, proprietor).
- Applied to report cards, receipts, invoices, ID cards.

### 11.2 Configuration `P2`
- Grading scales, assessment components, comment banks, trait lists,
  admission number format, fee items.

### 11.3 Backup and recovery `P1`
- Automated nightly `pg_dump` to off-box object storage.
- **Restore procedure tested and documented before real data is entered.**
- Self-hosted infrastructure means no provider is doing this for you.
  Losing a school's fee ledger and result archive is unrecoverable.

### 11.4 Data export `P4`
- Full-school export in an open format. The school's data is the school's.

### 11.5 Audit log viewer `P2`
- Filterable by actor, entity, date. Proprietor and principal only.

---

## 12. Parent portal and requests

### 12.1 The request-object model `P4`

**Nothing a parent submits mutates school data.** Every parent action creates a
*request object* that raises a task on the school side. Parents write to their
own requests and to nothing else.

This is what keeps the immutable ledger (§4.5 in `PLAN.md`) and the result
snapshots (§5.5) genuinely immutable. A parent's disagreement produces a new
record; it never edits an existing one.

Common shape across all request types:

```
requested → acknowledged → under review → resolved
                                       ↘ rejected
```

- Every request carries: submitter, ward, timestamp, category, body, status,
  assignee, outcome note.
- Status changes notify the parent on their delivery channel.
- Requests are never hard-deleted.
- All state changes written to audit.

### 12.2 Result review request `P4`
- **Attaches to a specific published result and subject.** Not a free-floating
  complaint — the school must know what is being disputed.
- **Deadline window**: configurable, default 14 days after publication.
  Without it, the school fields disputes about a term from two years ago.
- **Limit**: one open request per subject per term. Otherwise one aggrieved
  parent submits fifteen.
- Routes to the form teacher, escalates to the principal.
- Outcome is either *upheld* (with explanation) or *corrected*.
- A correction triggers the existing post-approval unlock path (§5.4):
  mandatory reason, audit entry, snapshot reissued, card regenerated.
- Parent notified of the outcome either way.

### 12.3 Fee review request `P4`
- Attaches to a specific invoice or ledger line.
- Routes to the bursar.
- Outcome is either an explanation or an **adjustment entry**.
- **Never an edit to the original entry.** The ledger stays append-only.
- Evidence upload (transfer receipt, POS slip) supported — this is the common
  real case, where a parent paid and it was not recorded.

### 12.4 Message thread `P4`
Deliberately narrow. Not comments on results, cards, or announcements — that
becomes a social feed with moderation problems.

- **One thread per guardian**, routed to the school office.
- Office can escalate a thread to a form teacher or the principal.
- One inbox, one place for the school to look.
- Attachment support, size-limited.

### 12.5 Teacher report `P5`

Not CRUD. A grievance mechanism with employment consequences for a named
person, and it needs to be designed as one.

| Decision | Position | Reason |
|---|---|---|
| Visibility | **Superadmin and principal only** | If a teacher can see complaints against them, no parent files one honestly |
| Anonymity | **Identified to the school, not to the teacher** | True anonymity invites malicious use and leaves nothing to investigate |
| Deletion | **Soft-delete with audit trail; never hard-delete** | If complaints can be quietly erased, the feature is theatre |
| Workflow | received → under review → resolved, with a mandatory outcome note | A report that disappears without an outcome destroys trust in the channel |

- Category selection (conduct, absence, teaching quality, financial request,
  physical discipline) so the school can triage severity.
- **Expect a spike immediately after results are published**, driven by
  disappointment with grades. Surface any result published to that guardian
  in the same window alongside the report, so the principal has context.
- Severe categories flagged for immediate superadmin attention rather than
  sitting in a queue.

### 12.6 Parent portal views `P4`
Read-only:
- Ward selector where a guardian has several children.
- Published report cards, current and historical, downloadable as PDF.
- Fee statement and ledger; family-level statement across siblings.
- Attendance summary.
- Timetable, announcements, school calendar.
- Their own request history and statuses.

---

## 13. Cross-cutting requirements

| Requirement | Why |
|---|---|
| `school_id` on every table from migration #1 | Costs nothing now; turns this into a product later. Retrofitting is brutal |
| Money stored as integers in kobo | Floats and fee arrears do not mix |
| No hard deletes on scores or payments | Version them; a correction keeps the old row, actor, and reason |
| Offline-first score entry and attendance | Teachers work on phones on weak connections |
| Server-side PDF generation on a worker | Bulk generation is a background job with progress |
| Mobile-first UI | Teachers will use phones far more than desktops |
| Low-bandwidth budget | Paginate, avoid heavy payloads, compress images aggressively |
| Every destructive action reversible or logged | Result and fee disputes are real, and involve real families |
| Whitelist never used alone as authentication | Possession of a phone number is not proof of identity |
| Parents write only to their own request objects | Keeps the ledger and result snapshots genuinely immutable |
| Privilege grants exclusively superadmin | Role and guardian-link changes are security decisions, not clerical ones |
| Parent contact details never self-editable | Prevents single-step account takeover |

---

## 14. Role × module permission matrix

| Module | Superadmin | Principal | Bursar | Form teacher | Subject teacher | Admin | Parent |
|---|---|---|---|---|---|---|---|
| **Staff user accounts** | RW | — | — | — | — | — | — |
| **Role assignment** | RW | — | — | — | — | — | — |
| **Guardian → student link** | RW | — | — | — | — | R | — |
| Parent detail submissions | RW | R | — | — | — | RW | Submit only |
| Student registry | RW | R | R | R (own arm) | R (own arms) | RW | R (own wards) |
| Guardians | RW | R | R | R (own arm) | — | RW | R (self) |
| Enrolment / promotion | RW | RW | — | R | — | RW | — |
| Score entry | R | R | — | RW (own arm) | RW (own subjects) | — | — |
| Result approval | RW | RW | — | Review only | Submit only | — | — |
| Report cards | RW | RW | — | R (own arm) | — | R | R (own wards) |
| Fee structure | RW | R | RW | — | — | — | — |
| Invoices / payments | R | — | RW | — | — | — | R (own wards) |
| Debtor reports | RW | R | RW | R (own arm) | — | — | — |
| Attendance | R | R | — | RW (own arm) | RW (own periods) | R | R (own wards) |
| Communication | RW | RW | RW (fees only) | RW (own arm) | — | RW | — |
| Timetable | RW | RW | — | R | R | RW | R (own wards) |
| Staff / payroll | RW | R | R | — | — | R | — |
| Analytics | RW | RW | RW (financial) | — | — | — | — |
| Result review requests | RW | RW | — | RW (own arm) | R (own subjects) | R | Submit + R (own) |
| Fee review requests | RW | R | RW | — | — | — | Submit + R (own) |
| Message threads | RW | RW | — | RW (escalated) | — | RW | RW (own thread) |
| **Teacher reports** | RW | RW | — | — | — | — | Submit + R (own) |
| Audit log | RW | R | — | — | — | — | — |
| System config | RW | RW | — | — | — | — | — |

`RW` = read and write · `R` = read only · `—` = no access
