# Results flow: browser test plan

Covers score entry → submit → review → approve → publish → remarks → report card → parent view.
Run it in the browser at the web app, against the live API. Tick each step as you go.

## 0. Before you start

| Need                                                                                    | Why                                                                                                                                                        |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A **current term** set (Academic year) with a session                                   | Every result is per term                                                                                                                                   |
| A class arm with **at least 3 active students**                                         | Positions and averages need more than one student                                                                                                          |
| **Assessment components** for that term and the class's section (e.g. Test 40, Exam 60) | Score cells come from these                                                                                                                                |
| A **grading scale** for the section                                                     | Grades and the promotion threshold come from this                                                                                                          |
| **Subject assignments**: one subject teacher per subject, for that arm                  | Only assigned teachers can submit                                                                                                                          |
| One **form teacher** assigned to that arm                                               | Review and remarks                                                                                                                                         |
| A **principal** account (optional)                                                      | Approve, publish, reopen, principal's comment. Superadmin can do all of these, so you can run the whole plan as superadmin if no principal account exists. |
| A **parent** account linked to one of the students                                      | Parent view step                                                                                                                                           |

Accounts known in the database today: `superadmin@example.com` (superadmin), `damolaige1@gmail.com` (form teacher), `fayemiah111@gmail.com` (subject teacher and form teacher).

Use a second browser profile or a private window for each role so you don't keep signing out.

**Note:** if a step says "should be hidden", the button must not appear at all. A visible button that the API then refuses is a bug.

---

## 1. Score entry locks

Sign in as the **subject teacher**. Open **Score entry**, pick the term, subject and arm.

| #   | Action                                                                    | Expected                                                                                                             |
| --- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 1.1 | Leave one student's Test score blank. Click that row's **Save**.          | Saves. (Blank is allowed while entering.)                                                                            |
| 1.2 | Open **Results approval**, pick the arm. Find the subject row.            | Status **Not submitted**. Action button **Submit scores** is visible.                                                |
| 1.3 | Click **Submit scores**.                                                  | Error toast names the blank count, e.g. "1 score is still blank…". Status stays **Not submitted**.                   |
| 1.4 | Fill the blank cell, save, click **Submit scores** again.                 | Toast "… submitted for review". Status pill **Submitted**.                                                           |
| 1.5 | Go back to **Score entry** for the same subject. Edit any score and save. | Refused with a readable message: "These scores are submitted and locked…". The cell value does not change on reload. |

## 2. Permissions at each stage

Still signed in as the subject teacher, look at the same row in **Results approval**.

| #   | Action                                                                                       | Expected                                              |
| --- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 2.1 | Status **Submitted**, Next step column.                                                      | Reads "Waiting for form teacher review". No button.   |
| 2.2 | Open the page as the form teacher.                                                           | **Mark as reviewed** is visible on the Submitted row. |
| 2.3 | Open the page as the subject teacher. Try the URL `/results/approval` and pick the same arm. | Same status, but **no** Review or Approve button.     |

## 3. Review and approval

| #   | Who             | Action                                           | Expected                                                                                         |
| --- | --------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| 3.1 | Form teacher    | Click **Mark as reviewed**.                      | Toast "… marked as reviewed". Status **Reviewed**. Next step: "Waiting for principal approval".  |
| 3.2 | Subject teacher | Reload the page.                                 | Row still **Reviewed**, no button.                                                               |
| 3.3 | Principal       | Click **Approve and freeze**.                    | Toast "… approved and frozen". Status **Approved**. Next step shows **Reopen** (principal only). |
| 3.4 | Subject teacher | Open Score entry for that subject, edit a score. | Refused: "These scores are approved and locked…".                                                |

## 4. Remarks and traits

| #   | Who                                                        | Action                                                                                           | Expected                                                                                         |
| --- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| 4.1 | Form teacher                                               | Open **Remarks and traits** (link at the top of Results approval). Pick the arm, then a student. | Form comment box, 11 trait dropdowns (1–5), and **no** principal comment box.                    |
| 4.2 | Form teacher                                               | Write a comment of about 40 words, set 4 traits, click **Save remarks**.                         | Toast "Remarks saved for …". Reload: values persist.                                             |
| 4.3 | Form teacher                                               | Clear a trait (choose "Not rated") and save.                                                     | Trait disappears on reload.                                                                      |
| 4.4 | Principal                                                  | Open the same student.                                                                           | Form comment and traits shown, plus a principal comment box. Write a principal comment and save. |
| 4.5 | Principal                                                  | Check the form comment still reads the form teacher's text.                                      | Unchanged.                                                                                       |
| 4.6 | Form teacher (not the arm's form teacher, if you have one) | Try the remarks URL for a different arm.                                                         | Refused: "Only this class's form teacher can write these remarks."                               |

## 5. Publish the class

| #   | Who          | Action                                                                | Expected                                                                                                                                      |
| --- | ------------ | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 5.1 | Principal    | With at least one subject **Approved**, click **Publish this class**. | Toast "1 subject published" (or the count you expect). Status **Published**.                                                                  |
| 5.2 | Principal    | Click **Publish this class** again with nothing new approved.         | Toast "0 subjects published". Nothing changes.                                                                                                |
| 5.3 | Form teacher | Open Remarks, pick a published student.                               | Dropdown label shows "(published)". The form shows "This report card is published, so these remarks can no longer be changed." and no inputs. |
| 5.4 | Principal    | Try to reopen a published subject.                                    | **Reopen** is visible. (Covered in step 6.)                                                                                                   |

## 6. Reopen

| #   | Who             | Action                                                                                                                | Expected                                                                   |
| --- | --------------- | --------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 6.1 | Principal       | Click **Reopen** on a Published subject. Leave the reason blank and click **Reopen scores**.                          | Warning "Give a reason for reopening these scores." Nothing changes.       |
| 6.2 | Principal       | Enter a reason, e.g. "Wrong score for one student", and confirm.                                                      | Toast "… reopened — the teacher can edit again". Status **Not submitted**. |
| 6.3 | Subject teacher | Score entry: edit a score and save.                                                                                   | Saves.                                                                     |
| 6.4 | Superadmin      | Check the `audit_logs` table (Neon console, `action = 'result.unlocked'`). The UI for result history isn't built yet. | One row with the reason in the `reason` column.                            |

Reopening is per subject. Re-approve and re-publish the class afterward, and the report cards update.

## 7. Report card (staff)

| #   | Who                             | Action                                                          | Expected                                                                                                                                          |
| --- | ------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 7.1 | Superadmin or principal         | Student profile → Results → **Open this term's report card**.   | Report card page loads. Header shows school name, student name, admission number, class, term.                                                    |
| 7.2 | Same                            | Check the numbers against the score entry grid for one student. | Each subject total = sum of its component scores. Overall average = total ÷ number of subjects. Position matches the ranking (ties share a rank). |
| 7.3 | Same                            | Check the class average and highest/lowest for a subject.       | Matches the other students' totals for that subject.                                                                                              |
| 7.4 | Same                            | Check **Outstanding fees**.                                     | Matches the student's fee ledger (Fees card on the profile).                                                                                      |
| 7.5 | Same                            | Click **Print report card**.                                    | Print dialog opens. Print preview shows only the card, with no sidebar or buttons.                                                                |
| 7.6 | Form teacher of the arm         | Open the same report card.                                      | Loads.                                                                                                                                            |
| 7.7 | Form teacher of a different arm | Try the report card URL for a student in another arm.           | Refused: "This student is not in one of your classes."                                                                                            |
| 7.8 | Subject teacher                 | Try the URL.                                                    | Refused: "You do not have access to report cards."                                                                                                |
| 7.9 | Any staff                       | Open a report card for a term that isn't published.             | "No report card yet" message. Not a crash.                                                                                                        |

## 8. Promotion and cumulative (third term only)

| #   | Action                                                                                                               | Expected                                                                  |
| --- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 8.1 | Publish a student's **third term** card where the cumulative average is at or above the scale's promotion threshold. | Card says "Recommended for promotion to the next class."                  |
| 8.2 | Repeat for a student below the threshold.                                                                            | Card says "Not yet recommended… must reach N%."                           |
| 8.3 | On a **first** or **second** term card.                                                                              | No promotion line appears.                                                |
| 8.4 | On a second-term card, check **Cumulative average**.                                                                 | "… over 2 terms." (Requires a published first term for the same student.) |

## 9. Parent portal (read-only)

Sign in to the portal as the parent.

| #   | Action                                                                             | Expected                                                                       |
| --- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 9.1 | Open the child's page before anything is published.                                | Report card area shows "No report card yet".                                   |
| 9.2 | After the class is published, reload the child's page.                             | Full report card: subjects, traits, comments, position, averages, fee balance. |
| 9.3 | Look for any edit control.                                                         | None. The card is read-only.                                                   |
| 9.4 | Check the card matches what staff see (step 7).                                    | Same numbers.                                                                  |
| 9.5 | Open a child who is not a ward of this parent (manually change the id in the URL). | "This child could not be found on your account."                               |

## 10. Errors and edge cases

| #    | Action                                                      | Expected                                                                              |
| ---- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 10.1 | Turn off the network, then click **Submit scores**.         | Toast says the server could not be reached. It must not say the scores are wrong.     |
| 10.2 | Double-click **Approve and freeze**.                        | Only one approval happens. The second click gets a conflict message, not a duplicate. |
| 10.3 | A class with a subject that has no scores at all.           | Its row stays **Not submitted**. Submitting says how many cells are blank.            |
| 10.4 | Publish, then approve a second subject, then publish again. | Positions and averages on the cards now include both subjects.                        |

---

## Known gaps (not tested here, not built yet)

- Attendance summary on the report card (the attendance module doesn't exist yet).
- Printed PDF generated as a background job (printing uses the browser's own print dialog).
- Broadsheet and comment bank.
- Next term's resumption date (the term has no resumption field yet).
- Parents don't see a card for a term until the whole class is published.

## Record of each run

| Date | Tester | Steps failed | Notes |
| ---- | ------ | ------------ | ----- |
|      |        |              |       |
