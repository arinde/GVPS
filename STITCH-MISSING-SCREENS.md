# STITCH-MISSING-SCREENS.md

Screens that exist in our system but are absent from the Figma file.
All follow the design pattern extracted from the Figma file — same
sidebar, top bar, colours, fonts, radii, and table patterns.

Paste the ENTIRE contents of STITCH-GLOBAL.md above each brief.
One screen per generation.

---

## INDEX OF MISSING SCREENS

Desktop (admin/staff):
M1 Results approval queue (principal)
M2 Broadsheet — full score matrix
M3 Bulk student entry grid
M4 Fee structure configuration
M5 Debtor list
M6 Student fee ledger
M7 Record a payment (modal)
M8 Parent submission review queue
M9 Staff accounts and role management
M10 Score entry — subject view (desktop, for form teacher)

Mobile (teacher):
M11 Teacher home — mobile
M12 Score entry — mobile, unsynced
M13 Score entry — mobile, synced
M14 Attendance marking — mobile
M15 Sync conflict error — mobile

Mobile (parent portal):
M16 Parent portal home
M17 Full result view
M18 Ask about a result (request form)
M19 Fee statement
M20 Message thread
M21 Sign in (passwordless)
M22 Enter OTP code
M23 Parent detail form (claim code)

---

## M1 — Results approval queue

```
SCREEN BRIEF: The principal reviewing all subjects for one class arm.
Canvas: desktop 1440px. Sidebar active item: Results.
Top bar left content: "JSS 3B · Second Term 2026/2027"
Top bar right: bell icon, Log out button.
Signed-in user displayed in top-right corner: "Mr S. Okonjo · Principal"

PAGE HEADING AREA — 24px below top bar, left-aligned in the content zone.
Heading "JSS 3B — Second Term" in page heading type #282828.
Subtitle "31 students · 14 subjects · form teacher Mrs A. Eze" in
body type #424242.
Right-aligned on the same line: a small secondary button "View broadsheet",
then a PRIMARY button "Approve all" rendered DISABLED at 40% opacity.
Directly beneath, 8px gap: a line of body type in #9B2226:
"Cannot approve yet — Basic Technology and French have not been submitted."

TABLE — full width of content zone, 16px below that warning line.
Header row columns and widths:
  Subject          22%  left
  Teacher          16%  left
  Status           13%  left (contains a status pill)
  Entered           9%  right
  Class average     8%  right
  Highest           7%  right
  Lowest            7%  right
  Failing           7%  right
  (action)         11%  right (contains a small button)

Twelve body rows:
English Language | Mrs A. Eze | Reviewed | 31 of 31 | 58.4 | 79 | 31 | 4 | Open
Mathematics | Mr K. Adebayo | Reviewed | 31 of 31 | 51.2 | 84 | 18 | 9 | Open
Basic Science | Mrs I. Ogun | Reviewed | 31 of 31 | 60.9 | 81 | 37 | 2 | Open
Basic Technology | Mr T. Nwosu | Not submitted | 0 of 31 | — | — | — | — | Remind
Social Studies | Mrs A. Eze | Reviewed | 31 of 31 | 64.1 | 80 | 42 | 1 | Open
Civic Education | Mr B. Lawal | Submitted | 31 of 31 | 62.7 | 78 | 40 | 1 | Open
Business Studies | Mrs C. Uche | Reviewed | 31 of 31 | 57.3 | 76 | 29 | 5 | Open
Agricultural Science | Mr T. Nwosu | Reviewed | 31 of 31 | 61.5 | 82 | 38 | 2 | Open
Computer Studies | Mr K. Adebayo | Reviewed | 31 of 31 | 59.8 | 85 | 33 | 3 | Open
French | Mlle R. Diallo | Not submitted | 0 of 31 | — | — | — | — | Remind
Yoruba | Mrs I. Ogun | Submitted | 29 of 31 | 58.0 | 77 | 30 | 4 | Open
Cultural and Creative Arts | Mrs C. Uche | Approved | 31 of 31 | 66.2 | 84 | 45 | 0 | Open

Pill mapping:
  "Reviewed" = hollow circle, pending colours (#3C5A78 on #E5EDF4)
  "Submitted" = filled diamond, warning colours (#8A6316 on #F7EEDC)
  "Not submitted" = filled square, danger colours (#9B2226 on #F7E4E4)
  "Approved" = filled circle, success colours (#1F6B45 on #E4F0EA)

"Remind" buttons are secondary full-size (32px tall). All "Open"
buttons are small secondary.

Footer row: "10 of 14 subjects ready" spanning first 3 columns, then
— | 60.1 | 85 | 18 | 31 | (empty action cell)
```

---

## M2 — Broadsheet

```
SCREEN BRIEF: Full score matrix, one class arm.
Canvas: desktop 1440px. Sidebar active item: Results.
Top bar left: "Broadsheet · JSS 2A · Second Term 2026/2027"
Signed-in user: "Mrs A. Eze · Form teacher"

PAGE HEADING AREA
Heading "Broadsheet — JSS 2A" in page heading type.
Subtitle "Second Term 2026/2027 · 32 students · 14 subjects" in body type.
Right-aligned: small buttons "Export Excel" and "Print", then secondary
button "Recalculate".

A horizontal scrollable table. The first column (student name) is STICKY
on horizontal scroll, marked with a 1px solid #B9C5CE right border.
The header row is STICKY on vertical scroll.

Column 1, sticky, 180px: "Student" left-aligned name weight.
Columns 2–15, 58px each: abbreviated subject headers, wrapped to two
lines, right-aligned:
  Eng.Lang | Maths | Basic Sci | Basic Tech | Social Std | Civic Ed |
  CRS | Business | Agric | Home Eco | Computer | French | Yoruba | CCA
Column 16, 60px: "Total" right-aligned. 1px solid #B9C5CE left border.
Column 17, 56px: "Avg" right-aligned.
Column 18, 52px: "Pos" right-aligned.

Show 16 student rows. Row 2 must be "Adeyinka, Oluwatobiloba" with
these exact values: 76, 82, 71, 66, 75, 69, 79, 61, 69, 75, 81, 54,
63, 71 — Total 992, Avg 70.86, Pos 4th.
Fill remaining rows with the other student names and plausible scores.

Footer row (600 weight): "Class average" in column 1, then a figure
for each subject column, then 964.2, 60.24, empty.
```

---

## M3 — Bulk student entry grid

```
SCREEN BRIEF: Typing hundreds of students from a paper register.
Optimised for typing speed. Canvas: desktop 1440px.
Sidebar active item: Students / Classes.
Top bar left: "Student entry · JSS 2A · 2026/2027"
Signed-in user: "Mrs B. Okoro · Office"

PAGE HEADING AREA
Heading "JSS 2A — data entry" in page heading type.
Subtitle "28 of 34 entered · started Tuesday" in body type.
Right-aligned: secondary button "Switch arm", PRIMARY button "Add row".

A progress bar full width, 6px tall, filled to 82% (#509CDB fill on
#EEF3F7 track), 4px radius. 12px below the heading area.

ENTRY TABLE — a data table where every body cell is an editable inline
input. No visible border at rest; focused cells get a 2px #152259
border and #F0F5FF fill.

Columns and widths as share of content zone:
  (row no.)     3%   centred, caption type #B9C5CE, not editable
  Surname      17%
  First name   17%
  Other names  14%
  Sex           6%   a select: M / F / —
  Date of birth 11%
  Guardian phone 15%
  Admission no. 17%  IBM Plex Mono 13px for this column only

Four rows:
Row 26, #F7FAFC tint showing it is saved:
  Salami | Ibrahim | Olayinka | M | 14/07/2013 | 0803 411 2288 | AMC/2023/0198
Row 27, also saved:
  Tijani | Fatimah | (empty) | F | 02/11/2012 | 0810 776 4501 | AMC/2023/0199
Row 28, NOT saved. Surname, First name and Date of birth cells have a
#FFF3C4 background (the stat card wash, used here as a soft warning):
  Umeh | Chinaza | (empty) | F | 19/05/2013 | 0705 220 9134 | AMC/2023/0200
Row 29, empty. Surname cell is FOCUSED (2px #152259 border, #F0F5FF
fill) with placeholder text "Surname". Admission no. pre-filled:
  (focused) | (empty) | (empty) | — | (empty) | (empty) | AMC/2023/0201

WARNING BAR — directly beneath the table, no gap. Background #F7EEDC,
1px solid #DCC392 border, no top border. Padding 10px 16px.
Contents: a filled-diamond warning pill reading "Row 28", then body
text "Chinaza Umeh, born 19/05/2013, already exists in JSS 2B.", then
right-aligned two small buttons: "Open existing record" and "Save anyway".

KEYBOARD HINTS BAR — directly beneath the warning bar.
Background #EEF3F7, 1px solid #DEE6EC border, no top border.
Padding 8px 16px. Small key caps for Tab, Enter, Shift+Tab.
Right-aligned caption: "Every row saves as you leave it."
```

---

## M4 — Fee structure configuration

```
SCREEN BRIEF: Defining what each class level is charged per term.
Canvas: desktop 1440px. Sidebar active item: Fees / Billing.
Top bar left: "Fee structure · Second Term 2026/2027"
Signed-in user: "Mr D. Igwe · Bursar"

PAGE HEADING AREA
Heading "Fee structure" in page heading type.
Subtitle "JSS 2 · Second Term 2026/2027".
Right-aligned: a select showing "JSS 2", a select showing "Second Term",
then PRIMARY button "Save structure".

Two columns, 20px gap. Left 60%, right 40%.

LEFT CARD — 12px radius, 20px padding.
Card heading "Fee items".
A data table with columns:
  Item             40%  left, body medium
  Amount (₦)       22%  right, editable inline input
  Applies to       22%  left, a select
  Compulsory       16%  left, a toggle pill (two states: Compulsory /
                        Optional — the active state has #509CDB background
                        and white text; inactive is #FFFFFF with #B9C5CE border)

Eight rows:
  Tuition | 95,000 | All students | Compulsory
  Development levy | 15,000 | All students | Compulsory
  Examination fee | 8,500 | All students | Compulsory
  Textbooks | 18,000 | All students | Compulsory
  Uniform | 12,000 | New students only | Optional
  PTA levy | 5,000 | All students | Compulsory
  ICT levy | 6,000 | All students | Compulsory
  Lesson fee | 14,000 | Opt-in | Optional

Footer row (SemiBold): "Compulsory total" spanning the first column,
"129,500" right-aligned in the Amount column, rest empty.
Beneath the table: small secondary button "Add fee item".

RIGHT CARD — 12px radius, 20px padding.
Card heading "Discounts and waivers".
Four rows, each 1px #DEE6EC bottom border, 12px vertical padding:
  "Second child" / "Applies to the second enrolled sibling" / value "10%"
  "Third child onwards" / "From the third sibling" / value "20%"
  "Staff child" / "Children of full-time staff" / value "50%"
  "Scholarship" / "Approved individually by superadmin" / value "Varies"
Each row: name in body medium left, description in caption #424242
beneath it, value in section heading type right-aligned.
Beneath: caption type #424242:
"Discounts apply to tuition only, never to levies."
```

---

## M5 — Debtor list

```
SCREEN BRIEF: Who owes the school money.
Canvas: desktop 1440px. Sidebar active item: Fees / Billing.
Top bar left: "Outstanding fees · Second Term 2026/2027"
Signed-in user: "Mr D. Igwe · Bursar"

PAGE HEADING AREA
Heading "Outstanding fees" in page heading type.
Subtitle "64 students · ₦9,312,500 owed" in body type.
Right-aligned: select "All arms", small button "Export",
PRIMARY button "Send reminders".

FOUR STAT CARDS in a row beneath the heading (same pattern as admin
dashboard but only two backgrounds used — alternate #E8E8FF and
#FFF3C4):
  "Total invoiced" / "₦38,412,000" / "This term"
  "Total collected" / "₦29,099,500" / "75.8% collection rate"
  "Outstanding" / "₦9,312,500" / "64 students"
  "Overdue 2+ terms" / "₦245,000" / "11 students"

TABLE — full width, 16px below the stat cards.
Columns:
  (checkbox)      3%
  Student        20%  left, name weight
  Arm             9%  left
  Guardian       17%  left
  Invoiced       11%  right
  Paid           11%  right
  Balance        11%  right, SemiBold, 1px solid #B9C5CE left border
  Age of debt    11%  left, status pill
  (action)        7%  right, small button "Ledger"

Eight rows, sorted by balance descending. Amounts without ₦ in body:
Umeh, Chinaza | JSS 2B | Mrs N. Umeh | 142,500 | 0 | 142,500 | 2 terms
Bello, Hauwa | JSS 2A | Alhaji M. Bello | 142,500 | 40,000 | 102,500 | 2 terms
Okafor, Somto | SSS 1 Sci | Mr E. Okafor | 186,000 | 90,000 | 96,000 | 1 term
Danladi, Grace | JSS 2A | Mrs P. Danladi | 142,500 | 60,000 | 82,500 | 1 term
Afolabi, Ridwan | JSS 2A | Mr Y. Afolabi | 142,500 | 75,000 | 67,500 | This term
Eze, Amarachi | Primary 5A | Mrs G. Eze | 98,000 | 40,000 | 58,000 | This term
Lawal, Tunde | Primary 3B | Mrs S. Lawal | 92,000 | 45,000 | 47,000 | This term
Ogun, Kelechi | SSS 2 Art | Mr F. Ogun | 186,000 | 145,000 | 41,000 | This term

Pill: "This term" = hollow circle pending. "1 term" = filled diamond
warning. "2 terms" = filled square danger.

Footer: "64 students" across first 4 cols, empty, empty, 9,312,500,
"11 owing more than one term" across last 2.

Caption beneath: "Open any ledger to see the combined family statement
for guardians with several children."
```

---

## M6 — Student fee ledger

```
SCREEN BRIEF: Running financial statement for one student.
Canvas: desktop 1440px. Sidebar active item: Fees / Billing.
Top bar left: "Fee ledger · Bello, Hauwa · JSS 2A"
Signed-in user: "Mr D. Igwe · Bursar"

PAGE HEADING AREA
Heading "Bello, Hauwa — fee ledger" in page heading type.
Subtitle "JSS 2A · AMC/2023/0177 · guardian Alhaji M. Bello".
Right-aligned: small "Print statement", secondary "Family statement",
PRIMARY "Record payment".

THREE STAT CARDS in a row (same card pattern, #E8E8FF alternating):
  "Total invoiced" / "₦285,000" / "across two terms"
  "Total paid" / "₦182,500" / "last payment 12 February"
  "Balance" / "₦102,500" / "overdue by one term"
Third card uses danger colours: figure in #9B2226, stat background
keep #FFF3C4 but add a 1px solid #DCA9A9 border.

TABLE — full width, 16px below cards.
Columns:
  Date          11%  left, IBM Plex Mono 12px
  Description   30%  left
  Reference     14%  left, IBM Plex Mono 12px
  Term          13%  left
  Debit         10%  right
  Credit        10%  right
  Balance       12%  right, SemiBold, 1px solid #B9C5CE left border

Eight rows, oldest first:
12/09/2026 | Opening balance | — | First Term | — | — | 0
15/09/2026 | Termly invoice | INV/26/0412 | First Term | 142,500 | — | 142,500
02/10/2026 | Payment — bank transfer | PAY/26/1188 | First Term | — | 100,000 | 42,500
18/11/2026 | Payment — cash | PAY/26/1533 | First Term | — | 42,500 | 0
09/01/2027 | Termly invoice | INV/27/0088 | Second Term | 142,500 | — | 142,500
21/01/2027 | Payment — POS | PAY/27/0204 | Second Term | — | 60,000 | 82,500
28/01/2027 | Payment reversed | REV/27/0031 | Second Term | 60,000 | — | 142,500
12/02/2027 | Payment — bank transfer | PAY/27/0451 | Second Term | — | 40,000 | 102,500

The reversal row (REV/27/0031) has a #F7E4E4 background full width.
Caption beneath: "Reversals are recorded as new entries. Original
entries are never edited or removed."
```

---

## M7 — Record a payment (modal)

```
SCREEN BRIEF: The bursar entering a payment received at the school.
Canvas: desktop 1440px. This screen shows the debtor list dimmed
behind a centred modal dialogue.

The background (debtor list) is rendered at 40% opacity behind a
rgba(21,34,89,0.4) overlay covering the full screen.

MODAL — 720px wide, centred. #FFFFFF background. 12px radius.
Shadow: 0 8px 32px rgba(21,34,89,0.18).

MODAL HEADER — 20px padding, 1px solid #DEE6EC bottom border.
Left: "Record payment" in section heading type #282828.
Right: a ✕ close button, 20px, #B9C5CE.

MODAL BODY — 20px padding. Two columns, 24px gap. Left 58%, right 42%.

LEFT COLUMN — a form:
Labels in card heading type #282828, 6px gap above each input.
  "Student" — a filled input showing "Bello, Hauwa — JSS 2A" with a
    small × on the right to clear it.
  "Amount" — input with "₦" prefix inside at #B9C5CE, value "40,000"
  "Payment method" — four pill-toggle options in a row: "Cash",
    "Bank transfer" (selected, #509CDB bg white text), "POS", "Online"
  "Reference number" — input value "GTB/2027/0451", IBM Plex Mono 13px
  "Date received" — input value "12/02/2027"
  "Evidence" — a 100% wide, 72px tall dashed rectangle (1px dashed
    #B9C5CE, 8px radius) with centred caption "Drop a receipt or browse"
  "Note" — three-line textarea, empty, placeholder "Anything to note"

RIGHT COLUMN — a card with #EEF3F7 background, 12px radius, 16px padding.
Section label "This payment settles" in section label type #424242.
A list of rows, each label left caption type and value right SemiBold:
  Invoice     INV/27/0088   (IBM Plex Mono)
  Term        Second Term
  Invoice total   ₦142,500
  Already paid    ₦40,000
  This payment    ₦40,000   (#509CDB colour)
1px #B9C5CE divider, then:
  Remaining balance  ₦62,500   (stat figure type #282828)
Caption: "A receipt will be sent to Alhaji M. Bello by WhatsApp."

MODAL FOOTER — 20px padding, 1px solid #DEE6EC top border.
Right-aligned: secondary "Cancel", then PRIMARY "Record payment".
```

---

## M8 — Parent submission review queue

```
SCREEN BRIEF: Office reviewing details a parent submitted from home.
Canvas: desktop 1440px. Sidebar active item: Requests.
Top bar left: "Parent submissions · 12 of 47 reviewed"
Signed-in user: "Mrs B. Okoro · Office"

PAGE HEADING AREA
Heading "Parent submissions" in page heading type.
Subtitle "12 of 47 reviewed — next: Adeyinka family".
Right-aligned: small buttons "Skip" and "Previous", PRIMARY "Approve and next".

A full-width progress bar, 6px tall, filled to 26%, 4px radius. 12px below heading.

MAIN CARD — full width, 12px radius, 20px padding.
Card header strip: card heading "Adeyinka, Oluwatobiloba — JSS 2A" left;
caption "Submitted 6 March via claim code AMC-4471" centre;
right: a hollow-circle pending pill "Waiting".

Card body: a four-column comparison table.
Column headers:
  Field               22%  caption type #424242
  Currently on record 30%  body
  Submitted by parent 30%  body medium
  Accept / Reject     18%  contains a two-option segmented control per row

Rows. Cells where values differ have a #FFF3C4 background on the
"Submitted by parent" column only:
  Guardian name | Mrs F. Adeyinka | Mrs Folake Adeyinka | Accept/Reject (differs)
  Relationship | Mother | Mother | Accept/Reject (same)
  Phone | 0803 411 2288 | 0803 411 2288 | Accept/Reject (same)
  Alternate phone | (empty) | 0705 664 1190 | Accept/Reject (differs)
  Email | (empty) | f.adeyinka@gmail.com | Accept/Reject (differs)
  Occupation | (empty) | Civil servant | Accept/Reject (differs)
  Home address | 14 Ijaiye Road, Ogba | 22 Ijaiye Road, Ogba, Ikeja | Accept/Reject (differs — set to REJECT)

The "Home address" row accept/reject control is set to "Reject".
The reject option shows #9B2226 text and #F7E4E4 background on that row.

Below the table: label "Reason for rejection", then a two-line
textarea containing "House number does not match the admission
register. Please confirm."

Caption beneath card: "Approving writes these values to the record.
Linking a guardian to an additional child needs superadmin approval."
```

---

## M9 — Staff accounts and role management

```
SCREEN BRIEF: The only screen where privileges are granted.
Canvas: desktop 1440px. Sidebar active item: Settings.
Top bar left: "Staff accounts"
Signed-in user: "Mrs F. Adeyinka · Superadmin"

PAGE HEADING AREA
Heading "Staff accounts" in page heading type.
Subtitle "24 accounts · 3 requests waiting".
Right-aligned: PRIMARY "Create staff account".

ALERT CARD — full width, 12px radius, 20px padding, left border
3px solid #509CDB. Margin 16px below heading.
Card heading "Requests awaiting your approval" left.
Caption "Only the superadmin can grant or change a role" right.
Three rows, each with a status pill, two-line text, and two action buttons:
  Hollow circle pending "Held 6 days":
    "Adebayo O. — new account"
    "Requested by office · Subject teacher, senior secondary"
    Buttons: "Reject" (small danger border), "Approve" (small PRIMARY)
  Hollow circle pending "Held 2 days":
    "Mrs I. Ogun — role change"
    "Requested by principal · Form teacher, JSS 3B"
    Buttons: "Reject", "Approve"
  Filled diamond warning "4 links":
    "Guardian access requests"
    "Four guardians asking to be linked to an additional child"
    Button: "Review all" (small secondary)

SECTION LABEL "All accounts" in section label type, 16px below alert card.

TABLE — full width.
Columns:
  Name          18%  left, name weight
  Email         20%  left
  Role          15%  left
  Section       10%  left
  Assigned       9%  right (number of arms)
  Status         9%  left, status pill
  Last sign-in  12%  left, IBM Plex Mono 12px
  (action)       7%  right, small button "Manage"

Twelve rows:
Mrs F. Adeyinka | f.adeyinka@... | Superadmin | All | — | Active | Today 08:12
Mr S. Okonjo | s.okonjo@... | Principal | Secondary | — | Active | Today 07:55
Mrs T. Balogun | t.balogun@... | Principal | Primary | — | Active | Yesterday
Mr D. Igwe | d.igwe@... | Bursar | All | — | Active | Today 09:31
Mrs B. Okoro | b.okoro@... | Office | All | — | Active | Today 08:40
Mrs A. Eze | a.eze@... | Form teacher | Secondary | 3 | Active | Today 10:02
Mr K. Adebayo | k.adebayo@... | Subject teacher | Secondary | 6 | Active | Today 09:14
Mrs I. Ogun | i.ogun@... | Subject teacher | Secondary | 5 | Active | Yesterday
Mr T. Nwosu | t.nwosu@... | Subject teacher | Secondary | 4 | Active | 3 days ago
Mr B. Lawal | b.lawal@... | Subject teacher | Secondary | 3 | Active | Today 08:58
Mrs C. Uche | c.uche@... | Subject teacher | Secondary | 5 | Active | Yesterday
Mlle R. Diallo | r.diallo@... | Subject teacher | Secondary | 7 | Suspended | 3 weeks ago

"Active" = filled circle success. "Suspended" = filled square danger.
Caption beneath: "Only the superadmin can create accounts, change
roles, or link a guardian to a student."
```

---

## M10 — Score entry desktop (form teacher overview)

```
SCREEN BRIEF: A form teacher seeing all subjects for their arm at once,
on desktop. Different from mobile score entry which goes subject by subject.
Canvas: desktop 1440px. Sidebar active item: Results.
Top bar left: "Score entry · JSS 2A · Second Term 2026/2027"
Signed-in user: "Mrs A. Eze · Form teacher"

PAGE HEADING AREA
Heading "JSS 2A — score entry" in page heading type.
Subtitle "Second Term 2026/2027 · 32 students · 14 subjects".
Right-aligned: select "Assignment" (active component), small "View all
components", PRIMARY "Submit for review".

A horizontal scrollable score matrix. First column sticky.

Column 1, sticky, 180px: student name, name weight, left-aligned.
Columns 2–15: one per subject (abbreviated), 58px each, right-aligned.
Each cell is an inline editable input: no border at rest, 2px #152259
border + #F0F5FF fill when focused.
Column 16, sticky right, 60px: "Total" right-aligned, auto-computed.

Show 14 rows using the student names. Row 2 is Adeyinka,
Oluwatobiloba with value 9 already entered (saved, #F7FAFC background).
Row 7 (Danladi, Grace) is focused with value "8" being entered.
One row shows "Abs" for Bello, Hauwa in the focused cell style but
with #EEF3F7 fill and caption "Abs" at 12px.

SYNC BAR — full width directly above the table.
Background #F7EEDC, 1px solid #DCC392 bottom border. Padding 8px 16px.
Left: filled diamond #8A6316, then "14 rows not sent. Saved in your
browser." Right: underlined "Send now" link in #509CDB.

KEYBOARD HINTS — beneath the table.
Background #EEF3F7, 8px 16px padding.
Key caps: Tab, Enter, Shift+Tab. Right-aligned caption:
"Scores save as you type. Photographs are not entered here."
```

---

## M11 — Teacher home (mobile)

```
SCREEN BRIEF: What a subject teacher sees on opening the app on their phone.
Canvas: MOBILE 390px. No sidebar. No desktop top bar.

MOBILE TOP BAR — 56px, #FFFFFF, 1px #DEE6EC bottom border.
Left: "SchoolBase" in Kumbh Sans SemiBold 14px with "Base" in #509CDB.
Right: 32px circular avatar placeholder #EEF3F7.

GREETING BLOCK — 20px padding below top bar.
"Good morning, Kunle" in section heading type #282828.
"Second Term · week 9 of 13" in body type #424242.

SYNC BANNER — full width, background #E4F0EA, 1px #A9CDBB bottom border,
12px 16px padding. A 7px filled circle #1F6B45, then "All synced.
Last sent 08:04." in body type #1F6B45.

SECTION LABEL "Needs attention" — 12px left padding, 16px top margin,
caption type #424242.

Two rows, each 16px padding, 1px #DEE6EC bottom border:
  Row: two-line block "Mathematics — JSS 3B" (body medium) /
    "Exam scores due Friday" (caption #424242). Right: filled square
    danger pill "Overdue".
  Row: "Computer Studies — JSS 2A" / "Project scores not started".
    Right: filled diamond warning pill "Not started".

SECTION LABEL "My classes" — 16px top margin.

Six rows, each 16px padding, 1px #DEE6EC bottom border, 56px tall.
Each: two-line text block left, right-aligned progress figure + chevron.
  "Mathematics — JSS 2A" / "Assignment · 25 of 32 entered" / "78%"
  "Mathematics — JSS 2B" / "Assignment · 30 of 30 entered" / "100%"
  "Mathematics — JSS 3B" / "Exam · not started" / "0%"
  "Computer Studies — JSS 2A" / "Project · not started" / "0%"
  "Computer Studies — JSS 3A" / "Project · 18 of 29 entered" / "62%"
  "Computer Studies — SSS 1 Sci" / "Exam · 22 of 22 entered" / "100%"

BOTTOM TAB BAR — fixed, 60px, #FFFFFF, 1px #DEE6EC top border.
Four items: Classes (active, #509CDB), Attendance, Messages, Account.
```

---

## M12 — Score entry mobile, unsynced

```
SCREEN BRIEF: The most critical screen in the product. A teacher enters
marks on a phone in a staff room with a weak connection.
Canvas: MOBILE 390px.

MOBILE TOP BAR — 56px, #FFFFFF, 1px #DEE6EC bottom border.
Left: back chevron 20px #424242, then two-line block:
  "Mathematics — JSS 2A" in card heading type #282828
  "Second Term · 32 students" in caption type #424242.

SYNC BAR — full width, 44px, background #F7EEDC, 1px #DCC392 bottom border.
Padding 0 16px. Left: 7px filled diamond #8A6316. Then:
"7 rows not sent." in Kumbh Sans SemiBold 14px #8A6316, then
" Saved on this phone." in 400 weight same colour.
Right: "Send now" underlined link Kumbh Sans SemiBold 13px #509CDB.

COMPONENT TABS — full width, #EEF3F7 bg, 1px #B9C5CE bottom border.
Horizontally scrollable. Five tabs:
  "1st CA" / "done"    "2nd CA" / "done"
  "Assignment" / "25 of 32"  ← ACTIVE: #FFFFFF bg, #282828 text,
    SemiBold, 2px #509CDB bottom border
  "Project" / "—"    "Exam" / "—"
Each tab: 13px 16px padding, caption type for the count.

STUDENT ROWS — seven rows, 16px horizontal padding, 1px #DEE6EC
bottom border, 48px tall. Each row:
  Row number — 20px wide, caption #B9C5CE
  Two-line block flexing to fill: student name body medium / admission
    number IBM Plex Mono 11px #424242
  Sync dot — 9px: hollow 1px #DEE6EC = sent; filled #DCC392 = not sent
  Input — 60px wide, 38px tall, text centred, SemiBold 16px,
    border 1px #B9C5CE, 8px radius

Rows:
1 | Abiodun, Chidera | AMC/2023/0161 | SENT dot | value 8
  (row has #F7FAFC background — saved and sent)
2 | Adeyinka, Oluwatobiloba | AMC/2023/0184 | SENT | value 9
  (#F7FAFC background)
3 | Afolabi, Ridwan | AMC/2023/0190 | NOT SENT dot | value 7
4 | Ajayi, Nkechi | AMC/2024/0022 | NOT SENT | value 10
5 | Bello, Hauwa | AMC/2023/0177 | NOT SENT |
  input shows "Abs", #EEF3F7 fill, caption 12px
6 | Chukwu, Emeka | AMC/2023/0203 | NOT SENT | value 6
7 | Danladi, Grace | AMC/2025/0009 | NOT SENT |
  input FOCUSED: 2px #509CDB border, #F0F5FF fill, value empty

Rows 1–2 have #F7FAFC background. Rows 3–7 #FFFFFF.

FIXED FOOTER — 56px, #EEF3F7, 1px #B9C5CE top border, 16px padding.
Left: "25 of 32 entered · out of 10" in caption type #424242.
Right: secondary button "Save draft", PRIMARY button "Submit".
```

---

## M13 — Score entry mobile, everything synced

```
SCREEN BRIEF: The same screen as M12 after all work has reached the
server. Produce as a variant so both states can be compared.
Canvas: MOBILE 390px.

Identical to M12 in every respect EXCEPT:

SYNC BAR — background #E4F0EA, 1px #A9CDBB bottom border.
A 7px filled circle #1F6B45. Text:
"All 32 rows sent." SemiBold #1F6B45. " Last sent 14:06." 400 weight.
No "Send now" link.

COMPONENT TAB — "Assignment" tab count now reads "32 of 32".

ALL STUDENT ROWS — every row has #F7FAFC background and a hollow
SENT sync dot. Row 7 Danladi, Grace shows value 8, not focused.
No input is focused anywhere on this screen.

FIXED FOOTER — left text reads "Complete · out of 10".
```

---

## M14 — Attendance marking mobile

```
SCREEN BRIEF: Form teacher marking the daily class register.
Canvas: MOBILE 390px.

MOBILE TOP BAR — back chevron, then:
  "Attendance — JSS 2A" card heading.
  "Thursday, 12 March 2027" caption.

SUMMARY STRIP — full width, #FFFFFF, 1px #DEE6EC bottom border,
12px 16px padding. Four equal figures, each a medium stat figure over
a 10px caption label:
  "28" / "Present"   "3" / "Absent"   "1" / "Late"   "0" / "Excused"

SYNC BAR — unsynced state same as M12: "4 rows not sent. Saved on
this phone." with "Send now" link.

STUDENT ROWS — seven rows, 16px padding, 1px #DEE6EC bottom border,
56px tall. Each row: two-line block (name + admission number) left;
right-aligned four-option segmented control, 160px wide.
Four options: "P" "A" "L" "E". Selected option: #509CDB bg, #FFFFFF
text, SemiBold. Unselected: #FFFFFF bg, #424242 text, 1px #B9C5CE border.
  Abiodun, Chidera — P selected
  Adeyinka, Oluwatobiloba — P selected
  Afolabi, Ridwan — L selected
  Ajayi, Nkechi — P selected
  Bello, Hauwa — A selected
  Chukwu, Emeka — P selected
  Danladi, Grace — nothing selected (the cell awaits input)

FIXED FOOTER — 56px, #EEF3F7, 1px #B9C5CE top border, 16px padding.
Left: "31 of 32 marked" caption.
Right: secondary "Mark rest present", PRIMARY "Save register".
```

---

## M15 — Sync conflict error mobile

```
SCREEN BRIEF: Two scores couldn't send because the principal locked the
result while the teacher was offline. Work is intact. Tone is calm and
specific, never apologetic.
Canvas: MOBILE 390px.

MOBILE TOP BAR — back chevron, then "Mathematics — JSS 2A" /
"Second Term · 32 students".

ALERT BLOCK — full width, #F7E4E4 bg, 1px #DCA9A9 bottom border,
16px padding.
Line 1, SemiBold 15px #9B2226: "2 scores could not be sent"
Line 2, body type #4F4F4F over three lines:
"The principal approved this result at 14:02 while this phone was
offline. Approved scores are locked. Your two entries are saved here
and have not been lost."

SECTION LABEL "Not sent" — 12px left, 16px top margin.

Two rows, each 16px padding, 1px #DEE6EC bottom border, #FFFFFF bg.
Each row: two-line block (name + admission number) left; right: caption
"You entered" over a medium figure #282828.
  Chukwu, Emeka | AMC/2023/0203 | "You entered" | 6
  Danladi, Grace | AMC/2025/0009 | "You entered" | 8

SECTION LABEL "What you can do" — 16px top margin.
Two rows, each 16px padding, 1px #DEE6EC bottom border, chevron right:
  "Request an unlock" / "Asks the principal to reopen this subject."
  "Copy the scores" / "Save both values to your clipboard."

FIXED FOOTER — 56px, #EEF3F7, 1px #B9C5CE top border, 16px padding.
Left: "30 of 32 sent" caption.
Right: PRIMARY "Request unlock" full remaining width.
```

---

## M16 — Parent portal home (mobile)

```
SCREEN BRIEF: What a guardian sees on opening the portal.
More spacious than staff screens — this is what a parent judges
the school by.
Canvas: MOBILE 390px.

MOBILE TOP BAR — 56px, #FFFFFF, 1px #DEE6EC bottom border, 16px padding.
Left: "Adeola" Kumbh Sans SemiBold 13px #282828 + "Memorial" #509CDB.
Right: "Mrs F. Adeyinka" SemiBold 11px / "Guardian" caption below.

WARD CARD — full width, background #152259, 20px padding. No radius
at the top (flush with top bar edges on mobile). 12px radius bottom only.
Line 1, Kumbh Sans Bold 18px #FCFAFA: "Oluwatobiloba A. Adeyinka"
Line 2, 12px #FCFAFA at 70% opacity:
"JSS 2A · AMC/2023/0184 · Second Term 2026/2027"
16px gap. Three equal ward switcher buttons, 8px gaps:
  Button 1 SELECTED: #FFFFFF bg, #152259 text, SemiBold, 8px radius.
    "Oluwatobiloba" over "JSS 2A" in 10px.
  Buttons 2 and 3: rgba(255,255,255,0.12) bg, 1px rgba(255,255,255,0.28)
    border, #FCFAFA text, 8px radius.
    "Ayomide" / "Primary 5A"
    "Temiloluwa" / "Primary 2B"

RESULT CARD — 16px padding, #FFFFFF bg, 12px radius, shadow. 12px margin.
Top: "Second Term report sheet" card heading left, "4 April" caption right.
12px gap. Three figures side by side, separated by 1px #DEE6EC verticals,
12px vertical padding:
  "Position" (caption) / "4th of 32" (medium figure)
  "Average" (caption) / "70.86%" (medium figure)
  "Grade" (caption) / "B2" (medium figure)
12px gap. Two equal secondary buttons: "Open full sheet" and "Download PDF".

TILE (fees) — 12px radius card, 16px padding, 1px #DEE6EC border.
Row: "Fees" body medium left / "₦142,500 · paid in full" caption
below it / filled circle success pill "Cleared" right.

TILE (attendance) — same: "Attendance" / "58 of 62 days this term" / chevron.

SECTION LABEL "Earlier terms" — 20px top margin, 16px left, caption.
TILE: "First Term 2026/2027" / "6th of 32 · average 68.40%" / chevron
TILE: "2025/2026 session" / "Three terms · JSS 1A" / chevron

SECTION LABEL "Raise something" — 20px top margin.
TILE: "Ask about a result" / "Open until 18 April" / chevron
TILE: "Ask about a fee" / "Attach a receipt if you have one" / chevron
TILE: "Message the school office" / "Mrs Okoro replied yesterday" /
  filled diamond warning pill "Unread"
```

---

## M17 — Full result view (mobile)

```
SCREEN BRIEF: The term's results read on a phone without needing a PDF.
Canvas: MOBILE 390px.

MOBILE TOP BAR — back chevron, then "Second Term report" /
"Oluwatobiloba A. Adeyinka · JSS 2A".

SUMMARY BLOCK — full width, #152259 bg, 20px padding.
Three equal columns, each: caption 10px #FCFAFA 70% / figure Kumbh
Sans Bold 22px #FCFAFA.
  "Position" / "4th of 32"
  "Average" / "70.86%"
  "Grade" / "B2"

SECTION LABEL "Subjects" — 12px left, 16px top.

Fourteen rows, 16px side padding, 1px #DEE6EC bottom border, 44px tall.
Left: subject name body medium. Right: three columns fixed width —
  Total: 13px SemiBold (44px wide)
  Grade: Kumbh Sans Bold 14px #509CDB (34px wide)
  Position: caption #424242 (44px wide)
  English Language | 76 | A1 | 3rd
  Mathematics | 82 | A1 | 1st
  Basic Science | 71 | B2 | 5th
  Basic Technology | 66 | B3 | 7th
  Social Studies | 75 | A1 | 2nd
  Civic Education | 69 | B3 | 6th
  Christian Religious Studies | 79 | A1 | 2nd
  Business Studies | 61 | C4 | 11th
  Agricultural Science | 69 | B3 | 4th
  Home Economics | 75 | A1 | 3rd
  Computer Studies | 81 | A1 | 2nd
  French | 54 | C6 | 14th
  Yoruba | 63 | C4 | 9th
  Cultural and Creative Arts | 71 | B2 | 5th

TOTAL ROW — #F7FAFC bg, SemiBold: "Total" | 992 | (empty) | "of 1400"

SECTION LABEL "Attendance" — 16px top.
One tile: "58 of 62 days present" body / "4 days absent" caption.

SECTION LABEL "Remarks" — 16px top.
Two blocks, 16px side, 12px vertical, 1px #DEE6EC bottom. Each:
  Caption label / Kumbh Sans Regular 13px body text:
  "Form teacher — Mrs A. Eze" / "Oluwatobiloba has had a strong term,
  and her work in Mathematics and Computer Studies stands well above
  the class. French would improve with steady reading at home."
  "Principal — Mr S. Okonjo" / "A commendable result. With attention
  to French she is capable of finishing in the top three."

FIXED FOOTER — 56px, #EEF3F7, 1px #B9C5CE top border, 16px padding.
Two equal buttons: secondary "Ask about this result", PRIMARY "Download PDF".
```

---

## M18 — Ask about a result (mobile)

```
SCREEN BRIEF: A parent raising a result dispute on their phone.
Canvas: MOBILE 390px.

MOBILE TOP BAR — back chevron, "Ask about a result" /
"Oluwatobiloba · Second Term".

FIELD BLOCK 1 — 16px 16px padding, 1px #DEE6EC bottom border.
Section label "Which subject?" 6px gap.
Select full width showing "French — 54, grade C6, 14th of 32".
Options list (shown): also Business Studies, Yoruba, Basic Technology.
Each option shows the score, grade and position.

FIELD BLOCK 2 — 16px padding, 1px #DEE6EC bottom border.
Section label "What would you like checked?" 6px gap.
Textarea five lines, content:
"Tobi came home with 8 out of 10 on her second French assignment but
the card shows 6. Please could this be checked against her exercise book."

FIELD BLOCK 3 — 16px padding, 1px #DEE6EC bottom border.
Section label "Attach anything that helps (optional)".
A 64px tall dashed rectangle (1px dashed #B9C5CE, 8px radius):
centred caption "Add a photograph of the exercise book".

EXPLANATION BLOCK — 16px padding, #EEF3F7 bg.
Body type 12px #424242 line-height 20px:
"This goes to the form teacher, Mrs A. Eze, and then to the principal.
You will be told the outcome either way. Results can be queried for
14 days after publication, once per subject each term."

FIXED FOOTER — 56px, #FFFFFF, 1px #DEE6EC top border, 16px padding.
Left: caption #B9C5CE "Sending as Mrs F. Adeyinka".
Right: secondary "Cancel", PRIMARY "Send request".
```

---

## M19 — Fee statement (mobile)

```
SCREEN BRIEF: A parent checking their fee balance.
Canvas: MOBILE 390px.

MOBILE TOP BAR — back chevron, "Fees" /
"Oluwatobiloba A. Adeyinka · JSS 2A".

BALANCE BLOCK — full width, #152259 bg, 20px padding, centred.
Caption 10px #FCFAFA 70%: "Balance for Second Term"
Kumbh Sans Bold 28px #FCFAFA: "₦0.00"
12px #FCFAFA 70%: "Paid in full on 12 February"

SECTION LABEL "This term's invoice" — 12px left, 16px top.
Eight rows, 16px side, 1px #DEE6EC bottom, 40px tall.
Each: item name body medium left, amount body SemiBold right.
  Tuition | ₦95,000
  Development levy | ₦15,000
  Examination fee | ₦8,500
  Textbooks | ₦18,000
  PTA levy | ₦5,000
  ICT levy | ₦6,000
  Second child discount | −₦4,000
  (total row, #F7FAFC bg, SemiBold) Total | ₦142,500

SECTION LABEL "Payments received" — 16px top.
Three rows, each: method body medium left, date + reference IBM Plex
Mono 11px #424242 beneath, amount SemiBold right.
  Bank transfer / 09 Jan · PAY/27/0090 / ₦80,000
  POS / 24 Jan · PAY/27/0233 / ₦42,500
  Bank transfer / 12 Feb · PAY/27/0451 / ₦20,000

FAMILY CARD — 12px radius, 16px padding, 1px #DEE6EC border, 16px top margin.
Card heading "Other children".
Two rows:
  "Ayomide — Primary 5A" / filled circle success pill "Cleared" / ₦0.00
  "Temiloluwa — Primary 2B" / hollow circle pending "This term" / ₦31,000
Secondary button full width: "View combined family statement".

FIXED FOOTER — secondary "Ask about a fee", PRIMARY "Download receipt".
```

---

## M20 — Message thread (mobile)

```
SCREEN BRIEF: One conversation thread between a guardian and the office.
Canvas: MOBILE 390px.

MOBILE TOP BAR — back chevron, "School office" /
"Usually replies within a day".

CONTEXT STRIP — full width, #EEF3F7, 1px #DEE6EC bottom, 10px 16px.
Caption #424242: "This thread goes to the school office."

MESSAGE LIST — 16px side padding, #EEF3F7 bg, scrollable.
Guardian messages: RIGHT-aligned. #509CDB bg. #FFFFFF text. 12px radius.
Max width 78%. Padding 12px 14px.
Office messages: LEFT-aligned. #FFFFFF bg. #282828 text. 1px #DEE6EC
border. 12px radius. Same max width.
Timestamp beneath each, IBM Plex Mono 10px #B9C5CE, same alignment.

Date divider before the last office message: centred caption #B9C5CE
"Yesterday" with 1px #DEE6EC rules each side.

Messages in order:
  GUARDIAN Mon 09:14: "Good morning ma. Please what time does the
  inter-house sports start on Saturday?"
  OFFICE Mon 11:02: "Good morning. It starts at 8am and parents are
  asked to be seated by 7:45."
  GUARDIAN Mon 11:20: "Thank you ma. Will Temiloluwa's class be running
  in the morning session?"
  [divider: Yesterday]
  OFFICE Yesterday 15:41: "Yes, Primary 2 events are all in the morning
  session, before the break at 11am."

COMPOSER — fixed bottom, 56px, #FFFFFF, 1px #DEE6EC top. 16px padding.
A paperclip icon 18px #B9C5CE left; input flexing to fill, placeholder
"Write a message"; PRIMARY button "Send" right.
```

---

## M21 — Parent sign in (mobile)

```
SCREEN BRIEF: Passwordless login. No registration. No password field.
Canvas: MOBILE 390px. No sidebar, no tab bar, no top bar.
Full screen #FFFFFF background.

BRAND BLOCK — centred, 80px from top.
A 52px rounded square (12px radius) background #152259 containing
"AM" in Kumbh Sans Bold 20px #FCFAFA.
16px gap. "Adeola Memorial College" Kumbh Sans Bold 18px #282828.
6px gap. "Parent portal" caption #424242.

FORM BLOCK — 40px below brand, 24px side padding.
"Sign in" section heading type #282828.
12px gap. Body type #424242 over two lines:
"Enter the phone number or email you gave the school.
We will send you a code."
20px gap. Input full width, placeholder "0803 411 2288",
showing value "0803 411 2288".
16px gap. PRIMARY button full width, 44px tall: "Send code"

HELP BLOCK — 32px below form, 24px side padding.
12px radius card, #EEF3F7 bg, 16px padding, body type 12px #424242:
"Parents cannot create their own accounts. If your number is not
recognised, contact the school office on 0803 000 0000."

FOOTER — fixed 20px from bottom, centred, caption #B9C5CE:
"Adeola Memorial College · Ogba, Ikeja, Lagos"
```

---

## M22 — Enter OTP code (mobile)

```
SCREEN BRIEF: Six-digit code entry after the parent requests a sign-in code.
Canvas: MOBILE 390px. No sidebar, no tab bar.

Back chevron top-left, 20px from top, 16px from left.

FORM BLOCK — 100px from top, 24px side padding.
"Enter your code" section heading #282828.
12px gap. Body 13px #424242 over two lines:
"We sent a six-digit code to 0803 *** 2288 on WhatsApp.
It expires in 10 minutes."

28px gap. Six code input boxes in a row, 8px gaps.
Each box: 46px wide, 56px tall, #FFFFFF bg, 1px #B9C5CE border, 8px radius,
character centred Kumbh Sans SemiBold 24px #282828.
Boxes 1–4 contain: 4, 1, 7, 2.
Box 5: FOCUSED — 2px #509CDB border, #F0F5FF bg, empty, cursor visible.
Box 6: empty, 1px #B9C5CE border.

24px gap. PRIMARY button full width 44px: "Sign in"

16px gap. Centred caption #424242: "Resend code in 0:42"
10px gap. Centred body 12px #509CDB underlined: "Send to SMS instead"

HELP BLOCK — 24px below, 24px side padding.
12px radius #EEF3F7 card, 14px padding, caption #424242:
"If the code does not arrive, the school office can check that
your number is correct. For security, you cannot change it here."
```

---

## M23 — Parent detail form (mobile)

```
SCREEN BRIEF: A parent filling in their own details after entering a
claim code from a slip sent home from school. Show TWO linked frames
side by side — Frame A (enter code) and Frame B (fill details).
Canvas: MOBILE 390px × 2 frames.

FRAME A — "Enter your claim code"
No top bar. Full #FFFFFF bg.
Brand block from M21 (crest + school name + "Parent portal").
40px below: section heading "Update your details" #282828.
12px gap. Body 13px #424242 over three lines:
"Your child brought home a slip with a code on it. Enter the
code below to check your details and correct anything that is wrong."
24px gap. Input full width, label "Claim code", value "AMC-4471".
16px gap. PRIMARY full width "Continue"
20px gap. Help card #EEF3F7 12px radius 14px padding caption #424242:
"Each code works once and belongs to one child. You will receive
a separate slip for each child you have at the school."

FRAME B — "Your details form"
MOBILE TOP BAR — "Your details" card heading /
"Oluwatobiloba A. Adeyinka · JSS 2A".

CONFIRMATION STRIP — full width, #E4F0EA, 1px #A9CDBB bottom border,
12px 16px padding.
Filled circle #1F6B45, then body #1F6B45:
"Code accepted for Oluwatobiloba A. Adeyinka, JSS 2A"

FORM BODY — #EEF3F7 bg, 16px padding. Two white cards (12px radius,
16px padding, 1px #DEE6EC border), 12px gap between them.

CARD 1 heading "About you":
  Full name | "Mrs Folake Adeyinka"
  Relationship to child | select "Mother"
  Phone | "0803 411 2288" — LOCKED, shows a lock icon 14px #B9C5CE
    inside the field. Caption beneath: "Only the school office can
    change this. Contact them if it is wrong."
  Alternate phone | "0705 664 1190"
  Email address | "f.adeyinka@gmail.com"
  Occupation | "Civil servant"
  Home address | two-line textarea "22 Ijaiye Road, Ogba, Ikeja, Lagos"

CARD 2 heading "Second guardian (optional)":
  Full name | "Mr O. Adeyinka"
  Relationship | select "Father"
  Phone | "0805 991 4477"

EXPLANATION — 12px margin, caption 12px #424242:
"The school office will check these details. You will get a message
when they are approved, usually within two working days."

FIXED FOOTER — PRIMARY full width "Send to the school".
```
