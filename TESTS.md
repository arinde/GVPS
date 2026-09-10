# TESTS.md

Testing strategy.

Section references follow `FEATURES.md`, which is the source of truth for
scope. A feature specified there and absent here is a gap in this file, not an
optional extra.

The premise: this system produces report cards and fee balances for real
families. A subtly wrong class position or a mis-applied sibling discount is
worse than a crash, because a crash is noticed and a wrong number is not.
Test accordingly — heavily where correctness is consequential, lightly
everywhere else.

---

## 1. What gets tested, and how much

| Area | Coverage target | Why |
|---|---|---|
| Results computation engine | ~100% | Wrong output goes to families and cannot be quietly fixed |
| Result snapshotting | ~100% | Silent corruption of historical records |
| Fee ledger arithmetic | ~100% | Money. Disputes are real |
| Discounts and waivers | ~100% | Easy to get subtly wrong, hard to notice |
| Permission scoping | ~100% | A teacher seeing another arm's data, or a bursar seeing results |
| Parent authentication | ~100% | A failure exposes another family's results and finances |
| Parent request containment | ~100% | If parent writes reach real tables, every immutability guarantee is void |
| Enrolment and promotion | High | Corrupts academic history irreversibly |
| Multi-tenancy isolation | ~100% | `school_id` sits on every table from migration #1; untested, it is decoration |
| Offline sync and conflict | High | The failure that makes teachers abandon the system |
| Attendance summary | High | Printed on every report card; a wrong figure is visible to every parent |
| Timetable clash detection | High | A missed clash puts one teacher in two rooms at once |
| Approval workflow transitions | High | Locking must actually lock |
| PDF generation | Medium | Visual regression, not unit tests |
| CRUD modules | Moderate | Standard; don't gold-plate |
| Exports | Moderate | The school files Ministry returns out of them |
| UI components | Light | Test flows, not buttons |

Coverage percentage as a whole-repo metric is not a goal. Coverage of the
listed critical paths is.

---

## 2. Tooling

| Layer | Tool |
|---|---|
| Unit and integration (backend) | Jest, with `@nestjs/testing` |
| API end-to-end | Jest + Supertest against a real Postgres |
| Database isolation | Testcontainers, or a dedicated Postgres per test run |
| Frontend E2E | Playwright |
| Component tests | React Testing Library |
| Visual regression (report cards) | Playwright screenshot comparison |
| Load and bulk generation | k6 or Artillery, ad-hoc |
| Factories / fixtures | Custom builders, seeded and deterministic |

Prisma is not mocked for anything that involves computation or money. Those
tests run against a real Postgres, because the bugs that matter live in the
interaction between the query and the data.

---

## 3. Fixtures

A single deterministic seed is used across every integration test.

```
Schools:       two. The first is fully populated and used by every test; the
               second is near-empty and exists only to prove isolation
Session:       2026/2027, three terms
Sections:      primary, junior, senior
Levels:        Primary 1–6, JSS1–3, SSS1–3
Arms:          two per level (A and B)
Students:      ~30 per arm, deterministic names and DOBs
Guardians:     includes a family with three siblings across
               primary and secondary — the sibling-discount and
               family-statement case
Staff:         primary class teachers, secondary subject teachers,
               one teacher deliberately assigned across two arms
               at the same period (timetable clash case)
Edge students: one repeating a class
               one admitted mid-term
               one withdrawn mid-session
               one transferred between arms
               one on full scholarship
               one staff child (waiver)
               two with identical total scores (tie case)
```

The fixture school is deliberately larger than the real one — roughly 720
students against about 400. Correctness suites run against it as it stands; the
bulk-generation and performance budgets in §10.3 and §12 are stated against
the real figure, so a fixture run that passes carries headroom rather than a
false pass.

Every edge case in the fixture set exists because it breaks something.
Never remove one to make a test pass.

---

## 4. Results engine — the critical suite

### 4.1 Component weighting
- Weighted total from configured components.
- Different component sets for primary vs senior.
- Rejects a configuration whose weights do not total 100.
- Rejects a score above a component maximum.
- Handles a missing component score (absent from an exam) without producing
  a silently wrong total.

### 4.2 Grading
- Score maps to the correct band at each boundary.
- Boundary values exactly (74/75, 39/40) — off-by-one here is the classic bug.
- Primary and secondary scales applied per section, never crossed.
- Per-subject pass mark override respected.

### 4.3 Positions
- Subject position within arm.
- **Ties share a position and the next position is skipped** (1, 2, 2, 4).
  Confirm the school's convention before writing the assertion.
- Overall position in arm.
- Withdrawn and transferred students excluded from position calculations.
- A student admitted mid-term with partial scores handled per school policy.
- Single-student arm.
- Arm where every student scores identically.

### 4.4 Aggregates
- Class average, highest, lowest per subject.
- Student average across subjects.
- Cumulative average across first, second and third term.
- Cumulative where a student joined in second term.
- Promotion recommendation against the configured threshold.

### 4.5 Snapshotting — highest priority in the file
- Approving a result freezes computed values.
- Changing assessment component weights afterwards does **not** alter an
  approved result.
- Changing the grading scale afterwards does **not** alter an approved grade.
- Re-reading an approved result returns identical values on every read.
- A newly-computed current-term result uses the *current* configuration while
  a prior approved term retains its own.
- Deleting a grading scale that a snapshot references does not orphan or
  corrupt the snapshot.

This suite is the reason the system can be trusted in three years.

### 4.6 Approval workflow
- Valid transitions: draft → submitted → reviewed → approved → published.
- Every invalid transition rejected (approved → draft, draft → approved).
- Subject teacher cannot edit after submission.
- Form teacher cannot edit after principal approval.
- Post-approval unlock requires a reason and writes to the audit log.
- Publishing an unapproved result is rejected.
- Concurrent submission by two teachers for different subjects in the same arm.

### 4.7 Publication and withholding
- Publishing an approved result exposes it to that student's guardians and to
  nobody else.
- Publishing an unapproved result is rejected (also asserted in 4.6).
- With the fee-withholding toggle on, a student carrying an outstanding balance
  has their result withheld; with it off, the balance is irrelevant to
  publication.
- A withheld result is still computed, still snapshotted, and still visible to
  staff. Withholding is a visibility rule, not a computation rule.
- Recording the outstanding payment releases the result without recomputation
  and without a second approval.

### 4.8 Traits and comments
- Trait list is configurable per section, and a rating outside 1-5 is rejected.
- Primary and junior results carry traits; senior results do not.
- Comment bank returns the comments configured for that grade band.
- Free-text override replaces the selected comment without altering the bank.
- Form teacher and principal comments are stored and rendered separately.

---

## 5. Fees — the second critical suite

### 5.1 Invoicing
- Invoice total from the level's fee structure.
- Optional items excluded unless selected.
- Previous term's arrears carried as opening balance.
- Bulk generation for an arm produces exactly one invoice per enrolled student.
- Withdrawn students excluded.
- Regeneration does not duplicate.

### 5.2 Discounts
- Sibling discount applied at the correct rank across a three-sibling family
  spanning primary and secondary.
- Scholarship, full and partial.
- Staff-child waiver.
- Multiple discounts on one invoice — confirm and assert the stacking rule.
- Discount cannot produce a negative invoice.

### 5.3 Payments and ledger
- Part payments reduce the balance correctly.
- Overpayment handled per policy (credit carried forward, not silently lost).
- Reversal creates a reversal entry; the original row is untouched.
- Ledger balance equals invoices minus payments minus discounts, always.
- **Property test:** for any random sequence of invoices, payments, discounts
  and reversals, the ledger balance equals the sum of its entries. No
  arithmetic drift.
- Family statement aggregates correctly across siblings.

### 5.4 Money representation
- All amounts stored and computed as integer kobo.
- No floating-point arithmetic anywhere in the fee path — assert this with a
  lint rule as well as a test.
- Percentage discounts round consistently and to the school's stated rule.
- Rounding never creates or destroys a kobo across an invoice's line items.

### 5.5 Debtor reporting
- Debtor list matches the sum of individual balances.
- Filters by arm, level and threshold return correct sets.
- A student who paid in full does not appear.

---

## 6. Permissions

Every endpoint is tested against every role. This is tedious and it is the
suite that prevents the most embarrassing possible bug.

### 6.1 Matrix tests
Table-driven: for each endpoint × role, assert allow or deny against the
matrix in `FEATURES.md` §14.

### 6.2 Scoping
- Subject teacher accessing scores for an unassigned subject → denied.
- Form teacher accessing another arm's students → denied.
- **Bursar accessing any result endpoint → denied.**
- Parent accessing a student who is not their ward → denied.
- Parent accessing their own ward → allowed.
- Teacher who taught an arm last session accessing it this session → denied.
- Scoping enforced server-side even when the client sends a valid-looking id.

### 6.3 Parent authentication

Highest-severity suite outside results and fees. A failure here exposes another
family's records.

- Non-whitelisted number → OTP is not sent at all.
- Whitelisted number **without** completing OTP → no session issued.
  **The whitelist alone never authenticates.**
- Correct OTP → session issued, scoped to that guardian's wards only.
- Wrong OTP rejected; repeated failures rate limited and locked.
- Expired OTP rejected.
- OTP is single-use — replay rejected.
- OTP issued for number A cannot be redeemed against number B.
- Response to an unknown number is indistinguishable from a known one
  (no enumeration of the whitelist).
- Refresh token honoured within its window; rejected after expiry.
- Signing out a device invalidates that device only.
- Guardian revoked by the school → existing sessions terminated immediately,
  not merely blocked at next login.

**Contact change lockdown**
- Parent attempting to change their own phone number or email → rejected on
  every route, including direct API calls.
- Number changed by the office → old number's sessions invalidated.

**Identity edge cases**
- One number mapping to two guardian records → selection step presented,
  and each selection scopes to only that guardian's wards.
- Staff member who is also a parent → single identity, both role sets, no
  cross-contamination of scope.
- Withdrawn student → guardian retains read-only archive access, no current
  data.
- Graduated student → access expires after the configured period.
- Guardian linked to an additional child requires superadmin approval; a
  self-initiated link is rejected.

### 6.4 Onboarding and privilege separation
- Secretary creating a staff account → denied.
- Secretary assigning or changing a role → denied.
- Secretary creating a guardian-to-student link → denied.
- Secretary creating a student or guardian record → allowed.
- Superadmin performing all of the above → allowed, and each writes to audit.
- Every privilege grant appears in the audit log with actor and target.

### 6.5 Claim codes and staged submissions
- Valid unused code resolves to the correct student.
- Used code rejected.
- Expired code rejected.
- Invalid code response is non-enumerable — indistinguishable from a valid
  code's failure path, and rate limited.
- Submission writes to staging only; `students` and `guardians` unchanged
  until approval.
- Field-level approval writes only the approved fields; rejected fields leave
  the existing values intact.
- Rejection stores a reason and permits resubmission.
- Approval writes through and logs to audit.
- Two submissions for the same student queue independently without
  overwriting each other.

### 6.6 Audit
- Every mutation writes an audit entry with actor, timestamp and diff.
- Audit entries cannot be updated or deleted through any API path.
- Audit log readable only by superadmin and principal.

### 6.7 Parent request objects

The containment boundary. If any of these fail, the immutability guarantees
elsewhere in the system are void.

- Parent submitting a result review does **not** alter the result, the
  snapshot, or any score.
- Parent submitting a fee review does **not** alter the invoice, the ledger,
  or any payment row.
- Parent cannot write to any table other than their own requests — asserted
  by attempting every mutating endpoint in the system as a parent.
- Parent cannot read another guardian's requests.
- Parent cannot change the status of their own request.

**Result review**
- Request outside the deadline window rejected.
- Second open request for the same subject and term rejected.
- Upholding closes the request without touching the snapshot.
- A correction goes through the post-approval unlock path: reason recorded,
  audit written, snapshot reissued, card regenerated.
- The original snapshot remains retrievable after correction.

**Fee review**
- Adjustment creates a new ledger entry; the disputed entry is unchanged.
- Ledger balance after adjustment equals the sum of entries.
- Evidence upload is size-limited and type-restricted.

**Teacher reports**
- Not visible to the reported teacher through any route, including any
  endpoint that returns their own record.
- Not visible to other staff.
- Visible to superadmin and principal only.
- Hard delete rejected at the API level; soft delete writes to audit.
- Resolution requires an outcome note — closing without one rejected.
- Severe categories flagged on creation.

### 6.8 Multi-tenancy isolation

`school_id` is on every table from migration #1 (`PLAN.md` §4.1). One school
runs today, so nothing in normal use exercises this — which is exactly why it
needs a suite. The second fixture school exists for it.

- Every list endpoint returns only the caller's school.
- A request carrying a valid id belonging to the other school is denied rather
  than filtered to empty; denial and absence must be distinguishable.
- Cross-school access is refused for every role, superadmin included.
- School id resolves server-side from the session, never from a request body,
  query parameter or header.
- Aggregates — class averages, positions, debtor totals, analytics — are
  computed within one school and never span both fixture schools.
- A query written without a school scope fails a repository-level guard rather
  than silently returning everything.

---

## 7. Academic structure, enrolment and history

### 7.1 Structure
- Session rollover creates the next session and carries forward levels, arms
  and subject offerings without altering the previous session's data.
- Exactly one session and one term are current at any moment.
- Subject offerings resolve by level and stream: a senior science student is
  not offered a commercial subject.
- Core and elective flags are respected in offering resolution.
- Per-subject pass mark override is respected (also asserted in 4.2).
- "Assign all subjects for Primary 3A to teacher X" creates one assignment per
  offering, and repeating it changes nothing.
- Form teacher ownership is independent of subject assignment: removing a
  subject assignment does not remove form teacher rights.

### 7.2 Enrolment and movement
- Promotion creates a new enrolment row; the prior row is unchanged.
- Prior-session results remain retrievable after promotion.
- Repetition creates an enrolment at the same level in the new session.
- Transfer between arms mid-session preserves scores already entered.
- Transfer out closes the enrolment and produces a transfer certificate; the
  student record and academic history remain.
- Withdrawal excludes the student from current-term computation but preserves
  history.
- Dismissal and alumni status are exits, not deletions.
- A returning student reinstates against their original student record, not a
  duplicate.
- Duplicate detection on name + date of birth during bulk entry.
- Admission number generation is unique under concurrent creation and follows
  the school's configured format.

---

## 8. Offline sync

The failure mode that kills adoption. Test it like it matters.

- Scores entered offline persist locally.
- Queue flushes on reconnection.
- Sync state is visible and accurate at every stage.
- App closed and reopened while offline → entries survive.
- Partial sync failure → unsynced rows remain queued, no silent loss.
- Same score entered on two devices → conflict resolved per the stated rule,
  and the losing value is recoverable.
- Sync attempted after the result was locked by approval → rejected clearly,
  with the local data preserved and surfaced to the teacher.
- **Under no tested condition is a teacher's entered score silently discarded.**

Run these as Playwright tests with network conditions simulated, not as unit
tests with a mocked queue.

---

## 9. Supporting modules

Results and fees are where the system earns trust. These are where it earns
daily use, and each one feeds something already tested above.

### 9.1 Attendance
- Daily marking records exactly one state per student per day; marking twice
  updates rather than duplicates.
- Period marking records one state per student per period.
- Termly summary is times present over times school opened, and equals the
  figure printed on the report card (asserted from the card side in 10.1).
- A student admitted mid-term is counted against the days the school opened
  after their admission, not the whole term.
- A withdrawn student's summary stops at their exit date.
- Chronic absentee list matches the configured threshold.
- Offline marking is covered by §8; it uses the same sync model as score entry.

### 9.2 Timetable
The fixture contains a teacher deliberately assigned to two arms in the same
period. It exists for these tests.

- A clash is detected when one teacher is allocated two arms in one period.
- The clash is reported before the timetable can be saved, not after.
- An arm cannot hold two subjects in one period.
- A teacher's free-period view is the exact complement of their allocations.
- Exam timetable rejects an invigilator already assigned elsewhere at that time.

### 9.3 Communication
- A broadcast to a filter — debtors above a threshold, one arm, one section —
  resolves to exactly the set that filter returns.
- Template variables substitute per recipient; an unresolved variable blocks
  the send rather than shipping a literal placeholder to a parent.
- Delivery status is recorded per recipient; a failure is retried, and a
  success is never sent twice.
- WhatsApp failure falls back to SMS per configuration, recording both attempts.
- A guardian with three wards receives one message, not three.
- Message history is retained and attributable to an actor.

### 9.4 Exports and data portability
- Every list view exports, and the export contains exactly the rows the
  filtered view showed.
- Scoping applies to exports as strictly as to screens: a form teacher's export
  covers their arm, a parent's export covers their wards.
- Excel and PDF exports of the same view agree on every value.
- Full-school export produces an open format readable without the application.

### 9.5 Admissions
- The pipeline advances only in order: enquiry, exam, offer, acceptance,
  enrolment.
- Converting an accepted applicant creates a student and an enrolment with no
  re-entry of data, and produces no duplicate if the conversion is repeated.
- A rejected or lapsed applicant never becomes a student.
- Offer letter renders the applicant's details and the school's branding.

---

## 10. PDF generation

Unit tests are the wrong tool. Use visual regression plus structural assertions.

### 10.1 Structural
- Report card contains every subject the student offers.
- Totals, averages and positions on the card match the computed snapshot exactly.
- Attendance figures match the attendance record.
- Traits section present on primary and junior cards, absent on senior.
- School logo, signatures and next-term resumption date present.
- Fee balance shown where the school has enabled it.

### 10.2 Visual regression
- Baseline screenshot per section template, compared on every change.
- Long student names do not overflow.
- A student offering the maximum subject count does not break pagination.
- Card fits one page — or breaks predictably where it does not.

### 10.3 Bulk generation
- 400-card run completes.
- Progress reported accurately.
- Job failure mid-run is resumable without duplicates.
- Memory stays within the worker's allocation across a full run.
- Concurrent generation requests for the same arm do not duplicate output.

---

## 11. End-to-end journeys

Playwright, against a seeded staging database. These are the flows the school
actually performs.

1. **Term results, end to end.** Subject teacher enters scores → submits →
   form teacher reviews and adds comments and traits → principal approves →
   cards generated → parent opens token link and sees the correct card.
2. **Bulk student entry.** Form teacher enters a full arm through the grid,
   including a mid-entry page refresh, and loses nothing.
3. **Fee cycle.** Bursar generates invoices for a level → records a part
   payment → issues a receipt → debtor list reflects the balance.
4. **Promotion.** Third term approved → promotion run → new session enrolments
   created → prior results still retrievable.
5. **Sibling family.** Three siblings across sections → correct sibling
   discounts → single family statement.
6. **Permission boundary.** Teacher logs in and cannot reach another arm's
   data by any route in the UI.
7. **Parent onboarding.** Slip with claim code → parent submits details →
   secretary approves some fields and rejects others → parent whitelisted →
   OTP login → sees only their own wards.
8. **Result dispute.** Result published → parent submits review request →
   form teacher reviews → principal corrects → snapshot reissued → card
   regenerated → parent notified and sees the updated card.
9. **Fee dispute with evidence.** Parent uploads a transfer receipt for an
   unrecorded payment → bursar adds an adjustment entry → balance updates →
   original entry untouched.
10. **Attendance to report card.** Form teacher marks a week of daily
    attendance offline → reconnects and syncs → termly summary matches the
    marks and appears on the generated card.
11. **Targeted broadcast.** Bursar filters debtors above a threshold → sends a
    templated reminder → delivery status tracked per recipient, and a failed
    send is retried without duplicating a successful one.

---

## 12. Non-functional

### Performance
- Arm list view (~35 students) renders under 1s on a throttled 3G profile.
- Broadsheet for a full arm computes under 2s.
- Score entry grid remains responsive with 40 students × 5 components.
- Payload sizes budgeted; assert no list endpoint returns unpaginated.

### Resilience
- API behaves correctly when Redis is unavailable (queue degrades, entry still works).
- Database connection loss surfaces clearly rather than silently failing.
- Backup script failure raises an alert.

### Backup and restore
- **Restore from a production-sized dump onto a clean box, timed and
  documented.** Rehearsed before any real data is entered, then quarterly.
- Restored database passes the full integration suite.
- An untested backup is not a backup.

---

## 13. CI

On every push:
1. Lint and typecheck
2. Unit tests
3. Integration tests against a containerised Postgres
4. Migration up and down verification
5. Build

On every PR to main, additionally:
6. E2E suite
7. Visual regression on report card templates

Critical suites — results, fees, and permissions including parent
authentication, request containment and school isolation — block merge on any
failure.
No exceptions, no skipped tests left in the tree.

---

## 14. Parallel run

Before Phase 2 goes live, the strongest test available is not automated.

Run one arm's results through the system alongside the school's manual process
for a full term. Compare every figure: subject totals, grades, subject
positions, overall position, class average, cumulative.

Any discrepancy is a bug in the engine or a misunderstanding of the school's
rules — and both are worth finding before 400 cards go home to parents.

Repeat for fees in Phase 3 against the bursar's own records.
