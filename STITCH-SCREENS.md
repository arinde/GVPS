# STITCH-SCREENS.md

Twenty-five screen briefs. **Paste the whole of `STITCH-GLOBAL.md` first,
then one brief from this file. One screen per generation.**

Do not batch screens. A model that infers nothing produces shallow work when
asked for five screens at once. One at a time is slower and far more accurate.

**Index**

Desktop, staff: 1 Dashboard · 2 Approval queue · 3 Broadsheet · 4 Registry ·
5 Student profile · 6 Bulk entry grid · 7 Fee structure · 8 Debtor list ·
9 Fee ledger · 10 Record payment · 11 Submission review · 12 Staff accounts

Mobile, teacher: 13 Teacher home · 14 Score entry unsynced ·
15 Score entry synced · 16 Attendance · 17 Sync conflict

Mobile, parent: 18 Portal home · 19 Result view · 20 Ask about a result ·
21 Fee statement · 22 Message thread · 23 Sign in · 24 Enter code ·
25 Detail form

---

## SCREEN 1 — Dashboard

```
SCREEN BRIEF: Superadmin dashboard.
Canvas: desktop, 1440px. Active nav item: Dashboard.
Top bar user block: "Mrs F. Adeyinka" with role "Superadmin".

PAGE HEADER
Heading: "Good morning, Folake"
Subtitle: "Week 9 of 13 · four things need you"

REGION 1 — a full-width card, 14px below the page header.
Card header strip: heading "Waiting on you" on the left; muted caption
"Only you can action these" 10px to its right; a small secondary button
reading "Clear queue" right-aligned.
Card body: four rows, each 1px solid #DEE6EC bottom border except the last
which has none. Each row is 11px tall padding, laid out as: a status pill,
a 12px gap, a two-line text block that flexes to fill, then a button.

Row 1: pill = filled square, danger colours, word "Blocked".
  Line 1, body emphasis: "JSS 3B results cannot be approved"
  Line 2, caption #7C8B97: "Basic Technology and French have no scores submitted."
  Button, small secondary: "Chase teachers"
Row 2: pill = filled diamond, warning colours, word "4 requests".
  Line 1: "Guardian links awaiting approval"
  Line 2: "Each one grants access to a child's records."
  Button: "Review"
Row 3: pill = filled diamond, warning colours, word "1 report".
  Line 1: "Teacher report — conduct"
  Line 2: "Filed two days ago. Not yet acknowledged."
  Button: "Open"
Row 4: pill = hollow circle, pending colours, word "Held 6 days".
  Line 1: "New staff account requested by the office"
  Line 2: "Adebayo O. — Mathematics, senior secondary."
  Button, small PRIMARY: "Approve"

REGION 2 — four equal cards in a row, 14px gaps, 14px below region 1.
Each card: 14px padding. A label in caption type #7C8B97, then 6px, then a
large figure, then optionally a progress bar, then 7px, then a trailing line
in caption type #4A5A67.

Card 1: label "Students enrolled", figure "412",
        trailing "Primary 236 · Junior 118 · Senior 58"
Card 2: label "Fees collected", figure "₦29.1m" followed by " of ₦38.4m" in
        IBM Plex Sans 500 12px #7C8B97 on the same baseline,
        progress bar filled to 76%, trailing "75.8% · ahead of last term"
Card 3: label "Outstanding", figure "₦9.3m",
        trailing "64 students · 11 over one term"
Card 4: label "Attendance this week", figure "93.1%",
        progress bar filled to 93%, trailing "Lowest: JSS 1B at 84%"

REGION 3 — two cards side by side, left card 55% width, right 45%, 18px gap.

Left card header: heading "Score submission", muted caption "by arm",
right-aligned small button "All arms".
Left card body: six rows, each 1px #DEE6EC bottom border except the last.
Each row: a label 64px wide in body emphasis, 10px gap, a progress bar
flexing to fill, 10px gap, a count 52px wide right-aligned in caption type.
  "Primary 5A"  100%  "9 of 9"
  "Primary 5B"  100%  "9 of 9"
  "JSS 2A"       86%  "12 of 14"
  "JSS 3B"       57%  "8 of 14"   — this bar uses the diagonal stripe fill
  "SSS 1 Sci"    90%  "9 of 10"
  "SSS 2 Art"   100%  "10 of 10"

Right card header: heading "Recent activity", right-aligned small button
"Audit log".
Right card body: six rows, each with a two-line text block flexing to fill
and a monospace timestamp right-aligned.
  "Results published" / "Primary 5A · Second Term"          / "10:42"
  "Payment recorded" / "₦120,000 · Adeyinka family"          / "10:19"
  "Scores approved" / "SSS 2 Arts · 10 subjects"             / "09:55"
  "Guardian details approved" / "3 submissions · by the office" / "09:31"
  "Score unlocked" / "JSS 2A Yoruba — entry error, row 14"   / "Tue"
  "Backup completed" / "412 students · 18.4 MB"              / "02:00"
```

---

## SCREEN 2 — Results approval queue

```
SCREEN BRIEF: Principal reviewing one class arm's results.
Canvas: desktop, 1440px. Active nav item: Results.
Top bar user block: "Mr S. Okonjo" with role "Principal · secondary".

PAGE HEADER
Heading: "JSS 3B — Second Term"
Subtitle: "31 students · 14 subjects · form teacher Mrs A. Eze"
Right-aligned on the same line: secondary button "View broadsheet", then a
PRIMARY button "Approve all" rendered DISABLED at 40% opacity.

Directly beneath the page header, 8px gap, a single line of body text in
colour #9B2226:
"Cannot approve yet — Basic Technology and French have not been submitted."

REGION — one full-width data table, 14px below that line.
Columns, left to right, with widths as a share of 1200px:
  Subject        22%  left-aligned, name weight
  Teacher        16%  left-aligned
  Status         13%  left-aligned, contains a status pill
  Entered         9%  right-aligned
  Class avg       8%  right-aligned
  Highest         7%  right-aligned
  Lowest          7%  right-aligned
  Failing         7%  right-aligned
  (action)       11%  right-aligned, contains a small button

Twelve body rows, exactly:
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

Pill mapping: "Reviewed" = hollow circle pending. "Submitted" = filled
diamond warning. "Not submitted" = filled square danger. "Approved" =
filled circle success.
The two "Remind" buttons are secondary, not small. All "Open" buttons are
small secondary.

FOOTER ROW
"10 of 14 subjects ready" spanning the first three columns, then
— | 60.1 | 85 | 18 | 31 | (empty)
```

---

## SCREEN 3 — Broadsheet

```
SCREEN BRIEF: Full score matrix for one class arm.
Canvas: desktop, 1440px. Active nav item: Results.
Top bar user block: "Mrs A. Eze" with role "Form teacher · JSS 2A".

PAGE HEADER
Heading: "Broadsheet — JSS 2A"
Subtitle: "Second Term 2026/2027 · 32 students · 14 subjects"
Right-aligned: small buttons "Export to Excel", "Print", then a secondary
button "Recalculate".

REGION — a single very wide table with horizontal scrolling.
The first column (student name) is STICKY on horizontal scroll and has a
1px solid #B9C5CE right border to separate it from the scrolling area.
The header row is STICKY on vertical scroll.

Column 1, sticky, 180px: "Student", left-aligned, name weight.
Columns 2 to 15, 62px each: the fourteen subject names from the domain
facts, each header rotated 0 degrees but wrapped onto two lines and
abbreviated to fit — for example "English Lang.", "Basic Tech.",
"Christian Rel. Std.", "Cultural and Creative Arts" becomes "Creative Arts".
All right-aligned.
Column 16, 62px: "Total", right-aligned, 1px solid #B9C5CE LEFT border.
Column 17, 52px: "Average", right-aligned.
Column 18, 52px: "Position", right-aligned.

Show 16 student rows using the student names from the domain facts,
repeating surnames alphabetically to fill. Scores are two-digit numbers
between 31 and 89. Totals are four-digit numbers around 900 to 1100.
Averages have two decimal places. Positions are written "1st", "2nd", "3rd",
"4th" and so on.

Row 2 must be "Adeyinka, Oluwatobiloba" with these exact values across the
fourteen subjects: 76, 82, 71, 66, 75, 69, 79, 61, 69, 75, 81, 54, 63, 71 —
then Total 992, Average 70.86, Position 4th.

Beneath the table, a footer row in 600 weight showing "Class average" in
column 1 and a two-decimal figure in each subject column, then 964.2, 60.24
and an empty position cell.
```

---

## SCREEN 4 — Student registry

```
SCREEN BRIEF: Searchable list of all students.
Canvas: desktop, 1440px. Active nav item: Students.
Top bar user block: "Mrs B. Okoro" with role "Office".

PAGE HEADER
Heading: "Students"
Subtitle: "412 enrolled · 2026/2027"
Right-aligned: secondary button "Import", PRIMARY button "Add student".

REGION 1 — a filter bar, 14px below the header, inside a card with 12px
padding. Contains left to right: a search input 280px wide with placeholder
"Search name or admission number"; a select 150px wide labelled nothing but
showing "All sections"; a select 150px showing "All classes"; a select 140px
showing "All fee statuses"; then right-aligned muted caption text
"412 results".

REGION 2 — a full-width data table, 14px below.
Columns and widths as a share of 1200px:
  (photo)          4%  a 24px circular grey placeholder
  Name            22%  left, name weight
  Admission no.   13%  left, IBM Plex Mono
  Class           8%   left
  Sex             5%   left
  Guardian        18%  left
  Guardian phone  14%  left
  Fees            9%   left, status pill
  (action)        7%   right, small button "Open"

Fourteen rows using these students in this order, with plausible admission
numbers in the pattern AMC/2023/0161 and Nigerian mobile numbers in the
pattern 0803 411 2288:
Abiodun, Chidera | JSS 2A | F | Mrs R. Abiodun | Cleared
Adeyinka, Oluwatobiloba | JSS 2A | F | Mrs F. Adeyinka | Cleared
Afolabi, Ridwan | JSS 2A | M | Mr Y. Afolabi | This term
Ajayi, Nkechi | JSS 2A | F | Mrs L. Ajayi | Cleared
Bello, Hauwa | JSS 2A | F | Alhaji M. Bello | 2 terms
Chukwu, Emeka | JSS 2A | M | Mr P. Chukwu | Cleared
Danladi, Grace | JSS 2A | F | Mrs P. Danladi | 1 term
Eze, Amarachi | Primary 5A | F | Mrs G. Eze | This term
Lawal, Tunde | Primary 3B | M | Mrs S. Lawal | This term
Ogun, Kelechi | SSS 2 Art | M | Mr F. Ogun | This term
Okafor, Somto | SSS 1 Sci | M | Mr E. Okafor | 1 term
Salami, Ibrahim | JSS 2A | M | Mr A. Salami | Cleared
Tijani, Fatimah | JSS 2A | F | Mrs K. Tijani | Cleared
Umeh, Chinaza | JSS 2B | F | Mrs N. Umeh | 2 terms

Pill mapping: "Cleared" = filled circle success. "This term" = hollow circle
pending. "1 term" = filled diamond warning. "2 terms" = filled square danger.

REGION 3 — pagination beneath the table, 12px gap. Left: muted caption
"Showing 1–14 of 412". Right: small buttons "Previous" and "Next" plus page
numbers 1, 2, 3, an ellipsis, and 30.
```

---

## SCREEN 5 — Student profile

```
SCREEN BRIEF: One student's full record.
Canvas: desktop, 1440px. Active nav item: Students.
Top bar user block: "Mrs B. Okoro" with role "Office".

PAGE HEADER
Heading: "Adeyinka, Oluwatobiloba"
Subtitle: "JSS 2A · AMC/2023/0184 · enrolled September 2023"
Right-aligned: small button "Print record", secondary button "Edit details".

Two columns, 18px gap. Left column 320px fixed, right column flexes.

LEFT COLUMN — one card, 15px padding.
A 120px by 160px rectangle with a 1px #B9C5CE border containing the muted
caption "Passport photograph" centred over two lines.
14px gap, then a definition list, one item per row, 1px #DEE6EC bottom
border between rows, 7px vertical padding. Each row has a label in caption
type #7C8B97 on the left and a value in body emphasis right-aligned:
  Date of birth      8 March 2013
  Age                13 years
  Sex                Female
  Admission no.      AMC/2023/0184        (monospace)
  Admitted           September 2023
  State of origin    Ogun
  Previous school    Bright Star Nursery
14px gap, then the section label "Guardians", then two blocks each with a
name in body emphasis, a relationship in caption type, and a phone number in
caption type:
  Mrs F. Adeyinka / Mother / 0803 411 2288
  Mr O. Adeyinka / Father / 0805 991 4477
Beneath them a muted caption: "Also guardian to Ayomide (Primary 5A) and
Temiloluwa (Primary 2B)."

RIGHT COLUMN — one card.
Card header strip containing four tabs, not buttons: "Results", "Fees",
"Attendance", "Enrolment history". "Results" is active, styled with 600
weight, colour #17242F and a 2px #6E1D22 bottom border. Inactive tabs are
#4A5A67.

Card body shows the Results tab: a data table with columns
  Term            30%  left
  Average          15%  right
  Position         15%  right
  Grade            12%  right
  Status           16%  left, status pill
  (action)         12%  right, small button "View sheet"
Rows:
  Second Term 2026/2027 | 70.86 | 4th of 32 | B2 | Published
  First Term 2026/2027  | 68.40 | 6th of 32 | B3 | Published
  Third Term 2025/2026  | 71.20 | 3rd of 30 | B2 | Published
  Second Term 2025/2026 | 67.90 | 7th of 30 | B3 | Published
  First Term 2025/2026  | 65.40 | 9th of 30 | B3 | Published
All "Published" pills are filled circle success.
```

---

## SCREEN 6 — Bulk student entry grid

```
SCREEN BRIEF: Typing hundreds of students in from a paper register.
This screen is optimised for typing speed, not for looking at.
Canvas: desktop, 1440px. Active nav item: Students.
Top bar user block: "Mrs B. Okoro" with role "Office".

PAGE HEADER
Heading: "JSS 2A"
Subtitle: "28 of 34 entered · started Tuesday"
Right-aligned: secondary button "Switch arm", PRIMARY button "Add row".

REGION 1 — the entry grid, a data table where every cell contains an inline
grid cell input as specified in the global section 6.
Columns and widths as a share of 1200px:
  (row no.)        3%  centred, caption type #7C8B97, not editable
  Surname         17%
  First name      17%
  Other names     14%
  Sex              6%  a select containing M and F
  Date of birth   11%
  Guardian phone  15%
  Admission no.   17%  monospace

Four rows:
Row 26, rendered with a #F7FAFC background to show it is saved:
  Salami | Ibrahim | Olayinka | M | 14/07/2013 | 0803 411 2288 | AMC/2023/0198
Row 27, also saved:
  Tijani | Fatimah | (empty) | F | 02/11/2012 | 0810 776 4501 | AMC/2023/0199
Row 28, NOT saved. The Surname, First name and Date of birth cells each have
a #F7EEDC background to flag a possible duplicate:
  Umeh | Chinaza | (empty) | F | 19/05/2013 | 0705 220 9134 | AMC/2023/0200
Row 29, empty, with the Surname cell FOCUSED — showing the 1.5px #17242F
outline and #EEF6FC fill — and placeholder text "Surname". Only the
Admission no. cell is pre-filled, with AMC/2023/0201.

REGION 2 — a bar attached directly beneath the grid with no gap. Background
#EEF3F7, 1px solid #DEE6EC border, no top border. Padding 8px 12px.
Contains, left to right: a filled-diamond warning pill reading "Row 28";
then body text "Chinaza Umeh, born 19/05/2013, already exists in JSS 2B.";
then right-aligned, two small buttons: "Open existing record" and
"Save anyway".

REGION 3 — a second bar directly beneath, same styling, showing keyboard
hints. Each hint is a small key cap: a 1px #B9C5CE border with a 2px bottom
border, 5px radius, #FFFFFF background, IBM Plex Mono 10px, 0 4px padding.
  [Tab] next field    [Enter] new row    [Shift]+[Tab] back
Right-aligned muted caption:
"Every row saves as you leave it. Photographs are added in a second pass."
```

---

## SCREEN 7 — Fee structure

```
SCREEN BRIEF: Defining what a class level is charged in a term.
Canvas: desktop, 1440px. Active nav item: Fees.
Top bar user block: "Mr D. Igwe" with role "Bursar".

PAGE HEADER
Heading: "Fee structure"
Subtitle: "JSS 2 · Second Term 2026/2027"
Right-aligned: two selects, one showing "JSS 2" and one showing
"Second Term", then a PRIMARY button "Save structure".

Two columns, 18px gap. Left column 62%, right column 38%.

LEFT CARD — header heading "Fee items".
A data table with columns:
  Item            42%  left
  Amount          20%  right, each cell an inline editable input
  Applies to      22%  left, a select
  Compulsory      16%  left, a two-option segmented control reading
                       "Compulsory" and "Optional"
Rows:
  Tuition             | 95,000 | All students | Compulsory
  Development levy    | 15,000 | All students | Compulsory
  Examination fee     |  8,500 | All students | Compulsory
  Textbooks           | 18,000 | All students | Compulsory
  Uniform             | 12,000 | New students only | Optional
  PTA levy            |  5,000 | All students | Compulsory
  ICT levy            |  6,000 | All students | Compulsory
  Lesson fee          | 14,000 | Opt-in | Optional
Footer row: "Total, compulsory items only" spanning the first column, then
"142,500" right-aligned in the Amount column.
Beneath the table, a small secondary button "Add fee item".

RIGHT CARD — header heading "Discounts and waivers".
Four rows, each 1px #DEE6EC bottom border, 10px vertical padding, each with
a name in body emphasis, a caption line beneath, and a value right-aligned
in medium figure type:
  "Second child" / "Applies to the second enrolled sibling" / "10%"
  "Third child onwards" / "Applies from the third sibling" / "20%"
  "Staff child" / "Children of full-time staff" / "50%"
  "Scholarship" / "Approved individually by the proprietor" / "Varies"
Beneath, a muted caption:
"Discounts apply to tuition only, never to levies or examination fees."
```

---

## SCREEN 8 — Debtor list

```
SCREEN BRIEF: Who owes the school money.
Canvas: desktop, 1440px. Active nav item: Fees.
Top bar user block: "Mr D. Igwe" with role "Bursar".

PAGE HEADER
Heading: "Outstanding fees"
Subtitle: "64 students · ₦9,312,500 owed"
Right-aligned: a select showing "All arms", small button "Export",
PRIMARY button "Send reminders".

REGION — a full-width data table.
Columns and widths as a share of 1200px:
  (checkbox)       3%
  Student         20%  left, name weight
  Arm              9%  left
  Guardian        17%  left
  Invoiced        11%  right
  Paid            11%  right
  Balance         11%  right, 600 weight, 1px #B9C5CE LEFT border
  Age of debt     11%  left, status pill
  (action)         7%  right, small button "Ledger"

Fourteen rows, sorted by balance descending. All money without the ₦ symbol
in the table body, comma separated:
Umeh, Chinaza | JSS 2B | Mrs N. Umeh | 142,500 | 0 | 142,500 | 2 terms
Bello, Hauwa | JSS 2A | Alhaji M. Bello | 142,500 | 40,000 | 102,500 | 2 terms
Okafor, Somto | SSS 1 Sci | Mr E. Okafor | 186,000 | 90,000 | 96,000 | 1 term
Danladi, Grace | JSS 2A | Mrs P. Danladi | 142,500 | 60,000 | 82,500 | 1 term
Afolabi, Ridwan | JSS 2A | Mr Y. Afolabi | 142,500 | 75,000 | 67,500 | This term
Eze, Amarachi | Primary 5A | Mrs G. Eze | 98,000 | 40,000 | 58,000 | This term
Lawal, Tunde | Primary 3B | Mrs S. Lawal | 92,000 | 45,000 | 47,000 | This term
Ogun, Kelechi | SSS 2 Art | Mr F. Ogun | 186,000 | 145,000 | 41,000 | This term
Then six further rows using the remaining student names with balances
between 12,000 and 38,000, all marked "This term".

Pill mapping: "This term" = hollow circle pending. "1 term" = filled diamond
warning. "2 terms" = filled square danger.

FOOTER ROW
"64 students" spanning the first four columns, then empty, empty,
"9,312,500", then "11 owing more than one term" spanning the last two.

Beneath the table, 11px muted caption:
"Amounts in naira. The Adeyinka family holds three children — open any
ledger to see the combined family statement."
```

---

## SCREEN 9 — Student fee ledger

```
SCREEN BRIEF: The running financial statement for one student.
Canvas: desktop, 1440px. Active nav item: Fees.
Top bar user block: "Mr D. Igwe" with role "Bursar".

PAGE HEADER
Heading: "Ledger — Bello, Hauwa"
Subtitle: "JSS 2A · AMC/2023/0177 · guardian Alhaji M. Bello"
Right-aligned: small button "Print statement", secondary button
"Family statement", PRIMARY button "Record payment".

REGION 1 — three cards in a row, 14px gap.
  Card 1: label "Total invoiced", figure "₦285,000",
          trailing "across two terms"
  Card 2: label "Total paid", figure "₦182,500",
          trailing "last payment 12 February"
  Card 3: label "Balance", figure "₦102,500",
          trailing "overdue by one term"

REGION 2 — a full-width data table, 14px below.
Columns and widths as a share of 1200px:
  Date          11%  left
  Description   30%  left
  Reference     14%  left, IBM Plex Mono
  Term          13%  left
  Debit         10%  right
  Credit        10%  right
  Balance       12%  right, 600 weight, 1px #B9C5CE LEFT border

Rows in chronological order, oldest first:
12/09/2026 | Opening balance | — | First Term | — | — | 0
15/09/2026 | Termly invoice | INV/26/0412 | First Term | 142,500 | — | 142,500
02/10/2026 | Payment — bank transfer | PAY/26/1188 | First Term | — | 100,000 | 42,500
18/11/2026 | Payment — cash | PAY/26/1533 | First Term | — | 42,500 | 0
09/01/2027 | Termly invoice | INV/27/0088 | Second Term | 142,500 | — | 142,500
21/01/2027 | Payment — POS | PAY/27/0204 | Second Term | — | 60,000 | 82,500
28/01/2027 | Payment reversed — POS declined | REV/27/0031 | Second Term | 60,000 | — | 142,500
12/02/2027 | Payment — bank transfer | PAY/27/0451 | Second Term | — | 40,000 | 102,500

The reversal row has a #F7E4E4 background across its full width. Beneath the
table an 11px muted caption:
"Reversals are recorded as separate entries. Original entries are never
edited or removed."
```

---

## SCREEN 10 — Record a payment

```
SCREEN BRIEF: The bursar entering a payment received at the school office.
Canvas: desktop, 1440px. Active nav item: Fees.
Top bar user block: "Mr D. Igwe" with role "Bursar".

Render this as a modal dialogue centred over a dimmed version of the debtor
list. The dim layer is rgba(23,36,47,0.4). The modal is 720px wide,
#FFFFFF, 7px radius, with the CARD shadow.

MODAL HEADER — 15px padding, 1px #DEE6EC bottom border.
Heading in page heading type: "Record payment"
A small close cross on the right, 14px, #7C8B97.

MODAL BODY — 15px padding. Two columns, 18px gap. Left 58%, right 42%.

LEFT COLUMN — a form. Each field has a label above it in section label type
and a 6px gap.
  "Student" — a filled search input showing "Bello, Hauwa — JSS 2A" with a
    small cross to clear it.
  "Amount" — a text input with the prefix "₦" rendered inside the field on
    the left in #7C8B97, value "40,000".
  "Payment method" — a segmented control of four options: "Cash",
    "Bank transfer", "POS", "Online". "Bank transfer" is selected.
  "Reference number" — text input, value "GTB/2027/0451"
  "Date received" — text input, value "12/02/2027"
  "Evidence" — a dashed 1px #B9C5CE bordered rectangle 100% wide and 70px
    tall with centred muted caption "Drop a receipt image, or browse"
  "Note" — a textarea three lines tall, empty, placeholder
    "Anything the school should record about this payment"

RIGHT COLUMN — a card with #EEF3F7 background and no shadow, 15px padding.
Section label: "This payment settles"
Then a list, each row with a label in caption type left and value right:
  Invoice            INV/27/0088   (monospace)
  Term               Second Term
  Invoice total      ₦142,500
  Already paid       ₦40,000
  This payment       ₦40,000       (600 weight)
A 1px #B9C5CE divider, then:
  Remaining balance  ₦62,500       (medium figure type)
Beneath, an 11px muted caption:
"A receipt will be generated and sent to the guardian by WhatsApp."

MODAL FOOTER — 15px padding, 1px #DEE6EC top border, buttons right-aligned:
secondary "Cancel", then PRIMARY "Record payment".
```

---

## SCREEN 11 — Parent submission review

```
SCREEN BRIEF: The office approving details a parent submitted from home.
Canvas: desktop, 1440px. Active nav item: Requests.
Top bar user block: "Mrs B. Okoro" with role "Office".

PAGE HEADER
Heading: "Parent submissions"
Subtitle: "12 of 47 reviewed"
Right-aligned: small buttons "Skip" and "Previous", then a PRIMARY button
"Approve and next".

REGION 1 — a thin progress bar full width, filled to 26%, 14px below.

REGION 2 — a card, 14px below.
Card header strip: heading "Adeyinka, Oluwatobiloba — JSS 2A"; muted caption
"Submitted 6 March by Mrs F. Adeyinka using claim code AMC-4471";
right-aligned a hollow-circle pending pill reading "Waiting".

Card body: a comparison table with FOUR columns:
  Field                    22%  left, caption type #7C8B97
  Currently on record      30%  left, body
  Submitted by parent      30%  left, body emphasis
  Accept                   18%  left, a two-option segmented control per row
                                reading "Accept" and "Reject"

Rows. Any row where the two values differ has a #F7EEDC background on the
"Submitted by parent" cell only:
  Guardian name    | Mrs F. Adeyinka | Mrs Folake Adeyinka | (differs)
  Relationship     | Mother | Mother | (same)
  Phone            | 0803 411 2288 | 0803 411 2288 | (same)
  Alternate phone  | (empty) | 0705 664 1190 | (differs)
  Email            | (empty) | f.adeyinka@gmail.com | (differs)
  Occupation       | (empty) | Civil servant | (differs)
  Home address     | 14 Ijaiye Road, Ogba | 22 Ijaiye Road, Ogba, Ikeja | (differs)
  Second guardian  | (empty) | Mr O. Adeyinka, Father, 0805 991 4477 | (differs)

The segmented control on every row defaults to "Accept" except the
"Home address" row, which is set to "Reject".

Beneath the table, 12px gap: a label "Reason for rejection" and a textarea
two lines tall containing:
"House number does not match the admission register. Please confirm."

REGION 3 — beneath the card, a muted caption:
"Approving writes these values to the student and guardian records. Linking
a guardian to an additional child needs superadmin approval and is not part
of this review."
```

---

## SCREEN 12 — Staff accounts and roles

```
SCREEN BRIEF: The only screen where privileges are granted.
Canvas: desktop, 1440px. Active nav item: Staff.
Top bar user block: "Mrs F. Adeyinka" with role "Superadmin".

PAGE HEADER
Heading: "Staff accounts"
Subtitle: "24 accounts · 3 requests waiting"
Right-aligned: PRIMARY button "Create staff account".

REGION 1 — a card, 14px below, with a 3px solid #6E1D22 LEFT border.
Card header strip: heading "Requests awaiting your approval"; muted caption
"Only the superadmin can grant or change a role".
Card body: three rows, each with a status pill, a two-line text block, and
two buttons ("Reject" secondary small, "Approve" primary small):
  Pill hollow circle pending "Held 6 days":
    "Adebayo O. — new account"
    "Requested by the office · role: Subject teacher, senior secondary"
  Pill hollow circle pending "Held 2 days":
    "Mrs I. Ogun — role change"
    "Requested by the principal · from Subject teacher to Form teacher, JSS 3B"
  Pill filled diamond warning "4 links":
    "Guardian access requests"
    "Four guardians asking to be linked to an additional child"

REGION 2 — a full-width data table, 18px below, preceded by the section
label "All accounts".
Columns and widths as a share of 1200px:
  Name            18%  left, name weight
  Email           20%  left
  Role            15%  left
  Section         10%  left
  Assigned         9%  right
  Status           9%  left, status pill
  Last sign-in    12%  left, IBM Plex Mono
  (action)         7%  right, small button "Manage"

Twelve rows:
Mrs F. Adeyinka | f.adeyinka@adeolamemorial.sch.ng | Superadmin | All | — | Active | Today 08:12
Mr S. Okonjo | s.okonjo@... | Principal | Secondary | — | Active | Today 07:55
Mrs T. Balogun | t.balogun@... | Principal | Primary | — | Active | Yesterday
Mr D. Igwe | d.igwe@... | Bursar | All | — | Active | Today 09:31
Mrs B. Okoro | b.okoro@... | Office | All | — | Active | Today 08:40
Mrs A. Eze | a.eze@... | Form teacher | Secondary | 3 arms | Active | Today 10:02
Mr K. Adebayo | k.adebayo@... | Subject teacher | Secondary | 6 arms | Active | Today 09:14
Mrs I. Ogun | i.ogun@... | Subject teacher | Secondary | 5 arms | Active | Yesterday
Mr T. Nwosu | t.nwosu@... | Subject teacher | Secondary | 4 arms | Active | 3 days ago
Mr B. Lawal | b.lawal@... | Subject teacher | Secondary | 3 arms | Active | Today 08:58
Mrs C. Uche | c.uche@... | Subject teacher | Secondary | 5 arms | Active | Yesterday
Mlle R. Diallo | r.diallo@... | Subject teacher | Secondary | 7 arms | Suspended | 3 weeks ago

"Active" = filled circle success. "Suspended" = filled square danger.

Beneath the table, an 11px muted caption:
"Creating an account, changing a role, or linking a guardian to a student
can only be done here, by the superadmin. Office staff can create student
and guardian records but cannot grant access."
```

---

## SCREEN 13 — Teacher home

```
SCREEN BRIEF: What a subject teacher sees on opening the app.
Canvas: MOBILE, 390px wide. No desktop top bar or nav on any mobile screen.

TOP BAR — 44px tall, #FFFFFF, 1px #DEE6EC bottom border, 13px side padding.
The logo on the left as specified globally. On the right, a 28px circular
grey avatar.

GREETING BLOCK — 13px padding.
Page heading: "Good morning, Kunle"
Caption #7C8B97: "Second Term · week 9 of 13"

SYNC BAR — full width, SYNCED state, reading:
"Everything sent. Last sent 08:04."

SECTION LABEL — "Needs attention", 13px side padding, 14px top margin.
Two rows, each 13px padding, 1px #DEE6EC bottom border, containing a
two-line text block and a status pill right-aligned:
  "Mathematics — JSS 3B" / "Exam scores due Friday" / filled square danger
    pill reading "Overdue"
  "Computer Studies — JSS 2A" / "Project scores not started" / filled
    diamond warning pill reading "Not started"

SECTION LABEL — "My classes", 14px top margin.
Six rows, each 13px padding, 1px #DEE6EC bottom border, 56px tall.
Each row: a two-line text block flexing to fill, then a right-aligned
progress figure in caption type, then a chevron.
  "Mathematics — JSS 2A" / "Assignment · 25 of 32 entered" / "78%"
  "Mathematics — JSS 2B" / "Assignment · 30 of 30 entered" / "100%"
  "Mathematics — JSS 3B" / "Exam · not started" / "0%"
  "Computer Studies — JSS 2A" / "Project · not started" / "0%"
  "Computer Studies — JSS 3A" / "Project · 18 of 29 entered" / "62%"
  "Computer Studies — SSS 1 Sci" / "Exam · 22 of 22 entered" / "100%"

BOTTOM TAB BAR — fixed, 56px tall, #FFFFFF, 1px #DEE6EC top border.
Four items, evenly spaced, each a small shape above a 10px label:
"Classes", "Attendance", "Messages", "Account". "Classes" is active,
coloured #17242F with the others #7C8B97.
```

---

## SCREEN 14 — Score entry, work not yet sent

```
SCREEN BRIEF: The most important screen in the entire product. A teacher
enters marks one-handed on an inexpensive Android phone in a staff room
with a weak connection.
Canvas: MOBILE, 390px wide.

TOP BAR — 44px, #FFFFFF, 1px #DEE6EC bottom border, 13px side padding.
A back chevron on the left, 19px, #4A5A67. Then a two-line block:
line 1 in card heading type "Mathematics — JSS 2A",
line 2 in caption type #7C8B97 "Second Term · 32 students".

SYNC BAR — full width, UNSYNCED state. Contains, left to right:
a 7px filled diamond in #8A6316; then text where "7 rows not sent." is in
600 weight and "Saved on this phone." follows in 400 weight; then
right-aligned, a 600-weight 11px underlined link reading "Send now".

COMPONENT TAB STRIP — full width, horizontally scrollable, background
#EEF3F7, 1px #B9C5CE bottom border. Five tabs, each 8px 13px padding, with
a label on the first line and a 9.5px count on the second:
  "1st CA" / "done"
  "2nd CA" / "done"
  "Assignment" / "25 of 32"     ← ACTIVE: #FFFFFF background, #17242F text,
                                   600 weight, 2px #17242F bottom border
  "Project" / "—"
  "Exam" / "—"

STUDENT ROWS — seven rows, each 46px minimum height, 13px side padding,
1px #DEE6EC bottom border. Each row contains, left to right:
  a row number, 20px wide, caption type #7C8B97
  a two-line block flexing to fill: the student name at 13px, and beneath it
    the admission number in IBM Plex Mono 10px #7C8B97
  a 9px sync dot
  a number input 58px wide and 36px tall, centred text, 600 weight 15px

Sync dot states: a hollow 1px #DEE6EC circle means sent; a filled #8A6316
circle means not yet sent.

Rows, in order:
1 | Abiodun, Chidera | AMC/2023/0161 | sent | 8
2 | Adeyinka, Oluwatobiloba | AMC/2023/0184 | sent | 9
3 | Afolabi, Ridwan | AMC/2023/0190 | NOT sent | 7
4 | Ajayi, Nkechi | AMC/2024/0022 | NOT sent | 10
5 | Bello, Hauwa | AMC/2023/0177 | NOT sent | input reads "Abs" with a
    #EEF3F7 fill and #7C8B97 text at 12px
6 | Chukwu, Emeka | AMC/2023/0203 | NOT sent | 6
7 | Danladi, Grace | AMC/2025/0009 | NOT sent | empty, and this input is
    FOCUSED, showing a 2px #17242F border

Rows 1 and 2 have a #F7FAFC background to indicate they are complete and
sent. Rows 3 to 7 have a #FFFFFF background.

FIXED FOOTER — 56px, #EEF3F7, 1px #B9C5CE top border, 13px padding.
Left, caption type: "25 of 32 entered · out of 10"
Right: secondary button "Save draft", then PRIMARY button "Submit".
```

---

## SCREEN 15 — Score entry, everything sent

```
SCREEN BRIEF: The same screen as SCREEN 14 once all work has reached the
server. Produce it as a near-identical variant so the two can be compared
side by side.
Canvas: MOBILE, 390px wide.

Identical to SCREEN 14 in every respect EXCEPT:

SYNC BAR — SYNCED state. A 7px filled circle in #1F6B45; text where
"All 32 rows sent." is 600 weight and "Last sent 14:06." follows in 400
weight. NO "Send now" link.

COMPONENT TAB STRIP — the active "Assignment" tab now reads "32 of 32".

STUDENT ROWS — all seven rows have the #F7FAFC complete background and a
hollow sync dot. Row 7, Danladi Grace, now holds the value 8 and is not
focused. No input is focused on this screen.

FIXED FOOTER — the left text reads "Complete · out of 10".
```

---

## SCREEN 16 — Attendance marking

```
SCREEN BRIEF: A form teacher marking the daily register.
Canvas: MOBILE, 390px wide.

TOP BAR — as SCREEN 14. Back chevron, then two lines:
"Attendance — JSS 2A" and "Thursday, 12 March 2027".

SUMMARY STRIP — full width, #FFFFFF, 1px #DEE6EC bottom border, 12px 13px
padding. Four figures evenly spaced, each a medium figure over a 10px
caption label:
  "28" / "Present"    "3" / "Absent"    "1" / "Late"    "0" / "Excused"

SYNC BAR — UNSYNCED state, reading:
"4 rows not sent." in 600 weight, then "Saved on this phone." in 400, with
a "Send now" link right-aligned.

STUDENT ROWS — seven rows, 13px side padding, 1px #DEE6EC bottom border,
each 52px tall. Each row: a two-line block with the student name at 13px and
the admission number in mono 10px beneath; then a right-aligned segmented
control 150px wide with four single-letter options "P", "A", "L", "E".
The selected option has a #17242F fill and white text; the others have a
#FFFFFF fill, #4A5A67 text and a 1px #B9C5CE border.
  Abiodun, Chidera — P selected
  Adeyinka, Oluwatobiloba — P selected
  Afolabi, Ridwan — L selected
  Ajayi, Nkechi — P selected
  Bello, Hauwa — A selected
  Chukwu, Emeka — P selected
  Danladi, Grace — nothing selected yet

FIXED FOOTER — 56px, #EEF3F7, 1px #B9C5CE top border.
Left, caption type: "31 of 32 marked"
Right: secondary "Mark rest present", PRIMARY "Save register".
```

---

## SCREEN 17 — Sync conflict

```
SCREEN BRIEF: An error state. Two scores could not be sent because the
principal locked the result while the teacher was offline. The teacher's
work must be visibly intact. The tone is calm, specific and never
apologetic.
Canvas: MOBILE, 390px wide.

TOP BAR — as SCREEN 14: "Mathematics — JSS 2A" / "Second Term · 32 students".

ALERT BLOCK — full width, background #F7E4E4, 1px #DCA9A9 bottom border,
14px 13px padding.
Line 1, body emphasis colour #9B2226:
"2 scores could not be sent"
Line 2, body colour #4A5A67, over two lines:
"The principal approved this result at 14:02, while this phone was offline.
Approved scores are locked. Your entries are saved here and have not been
lost."

SECTION LABEL — "Not sent", 13px side padding, 14px top margin.

Two rows, each 13px padding, 1px #DEE6EC bottom border, background #FFFFFF.
Each row: a two-line block with the student name and admission number; then
a right-aligned block showing the caption "You entered" above a 19px medium
figure in #17242F.
  Chukwu, Emeka | AMC/2023/0203 | You entered | 6
  Danladi, Grace | AMC/2025/0009 | You entered | 8

SECTION LABEL — "What you can do", 18px top margin.
Two rows, each 13px padding, 1px #DEE6EC bottom border, each with a
two-line text block and a chevron:
  "Request an unlock" / "Asks the principal to reopen this subject so the
   two scores can be sent."
  "Copy the scores" / "Save both values to this phone's clipboard so you
   have them outside the app."

FIXED FOOTER — 56px, #EEF3F7, 1px #B9C5CE top border.
Left, caption type: "30 of 32 sent"
Right: PRIMARY button, full remaining width, "Request unlock".
```

---

## SCREEN 18 — Parent portal home

```
SCREEN BRIEF: What a guardian sees on signing in. This is the screen a
parent judges the school by, so it may be more spacious than the staff
screens. Everything here is read-only.
Canvas: MOBILE, 390px wide.

TOP BAR — 44px, #FFFFFF, 1px #DEE6EC bottom border, 13px side padding.
On the left, the school name "Adeola" in IBM Plex Sans 700 12px followed by
"Memorial" in Libre Baskerville 700 12px #6E1D22. On the right, a two-line
right-aligned block: "Mrs F. Adeyinka" at 10.5px and "Guardian" at 9.5px
#7C8B97.

BODY — background #EEF3F7, 15px padding.

WARD CARD — full width, background #17242F, 7px radius, 15px padding.
Line 1, Libre Baskerville 700 18px #FFFFFF:
"Oluwatobiloba A. Adeyinka"
Line 2, 11.5px #FFFFFF at 72% opacity:
"JSS 2A · AMC/2023/0184 · Second Term 2026/2027"
13px gap, then a row of three equal buttons, 7px gaps:
  Button 1 SELECTED: #FFFFFF fill, #17242F text, 600 weight —
    "Oluwatobiloba" over a 9.5px second line "JSS 2A"
  Button 2: transparent white fill at 8%, 1px white border at 28%, white
    text — "Ayomide" over "Primary 5A"
  Button 3: same as button 2 — "Temiloluwa" over "Primary 2B"

RESULT CARD — 14px below, a standard white card, 15px padding.
Top row: card heading "Second Term report sheet" on the left, caption
"4 April" right-aligned.
12px gap, then a three-column block separated by 1px #DEE6EC lines above and
below, 12px vertical padding. Each column centred, a 10px caption label over
a 19px medium figure:
  "Position" / "4th" followed by " of 32" in 10.5px #7C8B97
  "Average" / "70.86" followed by "%" in 10.5px #7C8B97
  "Grade" / "B2"
12px gap, then two equal secondary buttons side by side, 8px gap:
"Open full sheet" and "Download PDF".

TILE — 10px below. A white card, 13px 15px padding, containing a two-line
block on the left ("Fees" at 13px 500 weight, "₦142,500 invoiced · paid in
full" at 11px #7C8B97) and a filled-circle success pill reading "Cleared"
right-aligned.

TILE — 10px below. Same styling: "Attendance" / "Present 58 of 62 days this
term", with a chevron right-aligned instead of a pill.

SECTION LABEL — "Earlier terms", 18px top margin.
TILE: "First Term 2026/2027" / "6th of 32 · average 68.40%" / chevron
TILE: "2025/2026 session" / "Three terms · JSS 1A" / chevron

SECTION LABEL — "Raise something", 18px top margin.
TILE: "Ask about a result" / "Open until 18 April" / chevron
TILE: "Ask about a fee" / "Attach a receipt if you have one" / chevron
TILE: "Message the school office" / "Mrs Okoro replied yesterday" /
      a filled-diamond warning pill reading "Unread"
```

---

## SCREEN 19 — Full result view

```
SCREEN BRIEF: The term's results, read on a phone. It must not require the
parent to read a PDF.
Canvas: MOBILE, 390px wide.

TOP BAR — back chevron, then two lines: "Second Term report" and
"Oluwatobiloba A. Adeyinka · JSS 2A".

SUMMARY BLOCK — full width, #17242F background, 15px padding.
Three columns evenly spaced, each a 10px caption label in white at 70%
opacity over a Libre Baskerville 700 22px white figure:
  "Position" / "4th of 32"
  "Average" / "70.86%"
  "Grade" / "B2"

SECTION LABEL — "Subjects", 13px side padding, 14px top margin.

Fourteen rows, each 13px side padding, 1px #DEE6EC bottom border, 44px tall.
Each row: the subject name at 13px flexing to fill; then three right-aligned
figures with fixed widths — total at 13px 600 weight (44px wide), grade at
13px in Libre Baskerville 700 (34px wide), and position at 11px #7C8B97
(44px wide).
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

TOTAL ROW — same layout, #F7FAFC background, 600 weight:
  "Total" | 992 | (empty) | "of 1400"

SECTION LABEL — "Attendance", 18px top margin.
One row: "Present 58 of 62 days" with "4 days absent" as a caption beneath.

SECTION LABEL — "Remarks", 18px top margin.
Two blocks, each 13px side padding, 12px vertical, 1px #DEE6EC bottom
border. Each has a caption label then body text in Libre Baskerville 400
13px line-height 21px:
  "Form teacher — Mrs A. Eze"
  "Oluwatobiloba has had a strong term, and her work in Mathematics and
  Computer Studies stands well above the class. French remains her weakest
  subject and would improve with steady reading at home."
  "Principal — Mr S. Okonjo"
  "A commendable result. With attention to French she is capable of
  finishing the session in the top three of her class."

FIXED FOOTER — 56px, #EEF3F7, 1px #B9C5CE top border, 13px padding.
Two equal buttons: secondary "Ask about a result", PRIMARY "Download PDF".
```

---

## SCREEN 20 — Ask about a result

```
SCREEN BRIEF: A parent raising a query against one subject. The request must
attach to something specific, and the rules must be stated before sending.
Canvas: MOBILE, 390px wide.

TOP BAR — back chevron, then two lines: "Ask about a result" and
"Oluwatobiloba · Second Term".

FIELD BLOCK 1 — 14px 15px padding, 1px #DEE6EC bottom border.
Label in section label type: "Which subject?"
A select, full width, showing the chosen option:
"French — 54, grade C6, 14th of 32"
The other options in the list, for reference:
"Business Studies — 61, grade C4, 11th of 32"
"Yoruba — 63, grade C4, 9th of 32"
"Basic Technology — 66, grade B3, 7th of 32"
Each option shows the subject with its score, grade and position so the
parent picks the right one without guessing.

FIELD BLOCK 2 — 14px 15px padding, 1px #DEE6EC bottom border.
Label: "What would you like the school to check?"
A textarea five lines tall containing this exact text:
"Tobi came home with 8 out of 10 on her second French assignment but the
card shows 6. Please could this be checked against her exercise book."

FIELD BLOCK 3 — 14px 15px padding, 1px #DEE6EC bottom border.
Label: "Attach anything that helps (optional)"
A dashed 1px #B9C5CE rectangle, full width, 64px tall, centred muted caption
"Add a photograph of the exercise book"

EXPLANATION BLOCK — 13px 15px padding, background #EEF3F7, no border.
Body text at 11.5px #4A5A67, line-height 19px:
"This goes to the form teacher, Mrs A. Eze, and then to the principal. You
will be told the outcome either way. Results can be queried for 14 days
after publication, once per subject each term."

FIXED FOOTER — 56px, #FFFFFF, 1px #DEE6EC top border, 13px padding.
Left, caption type #7C8B97: "Sending as Mrs F. Adeyinka"
Right: secondary "Cancel", PRIMARY "Send request".
```

---

## SCREEN 21 — Fee statement

```
SCREEN BRIEF: A parent looking at what they owe.
Canvas: MOBILE, 390px wide.

TOP BAR — back chevron, then two lines: "Fees" and
"Oluwatobiloba A. Adeyinka · JSS 2A".

BALANCE BLOCK — full width, #17242F background, 15px padding, centred.
A 10px caption label in white at 70% opacity: "Balance for Second Term"
A Libre Baskerville 700 26px white figure: "₦0.00"
An 11px line in white at 70%: "Paid in full on 12 February"

SECTION LABEL — "This term's invoice", 13px side padding, 14px top margin.
Eight rows, each 13px side padding, 1px #DEE6EC bottom border, 38px tall.
Each row: the item name at 13px left, the amount at 13px right-aligned.
  Tuition | ₦95,000
  Development levy | ₦15,000
  Examination fee | ₦8,500
  Textbooks | ₦18,000
  PTA levy | ₦5,000
  ICT levy | ₦6,000
  Second child discount | −₦4,000
  (total row, #F7FAFC background, 600 weight) Total | ₦142,500

SECTION LABEL — "Payments received", 18px top margin.
Three rows, each with a two-line block on the left (method at 13px, date and
reference in mono 10px beneath) and an amount right-aligned:
  "Bank transfer" / "09 January 2027 · PAY/27/0090" / ₦80,000
  "POS" / "24 January 2027 · PAY/27/0233" / ₦42,500
  "Bank transfer" / "12 February 2027 · PAY/27/0451" / ₦20,000

FAMILY BLOCK — 18px top margin, a white card, 15px padding.
Card heading: "Your other children"
Two rows, each with a name and class on the left and a balance plus status
pill on the right:
  "Ayomide — Primary 5A" / "₦0.00" / filled circle success "Cleared"
  "Temiloluwa — Primary 2B" / "₦31,000" / hollow circle pending "This term"
Beneath, a secondary button full width: "View combined family statement"

FIXED FOOTER — 56px, #EEF3F7, 1px #B9C5CE top border.
Two equal buttons: secondary "Ask about a fee", PRIMARY "Download receipt".
```

---

## SCREEN 22 — Message thread

```
SCREEN BRIEF: One conversation between a guardian and the school office.
Canvas: MOBILE, 390px wide.

TOP BAR — back chevron, then two lines: "School office" and
"Usually replies within a day".

CONTEXT STRIP — full width, #EEF3F7, 1px #DEE6EC bottom border, 10px 13px
padding, 11px #4A5A67 text:
"This thread goes to the school office and can be passed to a form teacher."

MESSAGE LIST — 15px padding, background #EEF3F7.
Messages alternate. Guardian messages are right-aligned with a #17242F
background, white text, 7px radius. Office messages are left-aligned with a
#FFFFFF background, #17242F text, 1px #DEE6EC border, 7px radius. Both are
maximum 78% of the width, with 10px 12px padding and a mono 10px timestamp
beneath at #7C8B97, aligned to the same side as the message.

Messages in order:
  GUARDIAN, "Monday 09:14": "Good morning ma. Please what time does the
  inter-house sports start on Saturday?"
  OFFICE, "Monday 11:02": "Good morning. It starts at 8am and parents are
  asked to be seated by 7:45. The programme has been sent home with the
  children."
  GUARDIAN, "Monday 11:20": "Thank you ma. Will Temiloluwa's class be
  running in the morning session?"
  OFFICE, "Yesterday 15:41": "Yes, Primary 2 events are all in the morning
  session, before the break at 11am."

Include a date divider before the last message: a centred 10px #7C8B97 label
reading "Yesterday" with a 1px #DEE6EC line on each side.

COMPOSER — fixed at the bottom, #FFFFFF, 1px #DEE6EC top border, 10px 13px
padding. A small paperclip shape 16px #7C8B97 on the left; a text input
flexing to fill with placeholder "Write a message"; a PRIMARY button "Send"
on the right.
```

---

## SCREEN 23 — Parent sign in

```
SCREEN BRIEF: Passwordless entry. There is no password field anywhere and
no way for a parent to register themselves.
Canvas: MOBILE, 390px wide.

The whole screen has a #FFFFFF background. No top bar, no tab bar.

BRAND BLOCK — 60px from the top, centred.
A 44px rounded square in #6E1D22 with the letters "AM" centred in white
Libre Baskerville 700 18px.
16px gap, then the school name centred in Libre Baskerville 700 17px:
"Adeola Memorial College"
6px gap, then centred caption #7C8B97: "Parent portal"

FORM BLOCK — 36px below, 24px side padding.
Page heading, left-aligned: "Sign in"
8px gap, body text #4A5A67 over two lines:
"Enter the phone number or email address you gave the school. We will send
you a code."
16px gap, then a label "Phone number or email" and a text input, full width,
containing "0803 411 2288".
14px gap, then a PRIMARY button, full width, 40px tall: "Send code"

HELP BLOCK — 24px below, 24px side padding, 12px vertical padding,
background #EEF3F7, 7px radius.
Body text at 11.5px #4A5A67, line-height 19px:
"Parents cannot create their own accounts. If your number is not recognised,
contact the school office on 0803 000 0000 and ask them to check the details
they hold for you."

FOOTER — fixed 20px from the bottom, centred, caption type #7C8B97:
"Adeola Memorial College · Ogba, Ikeja, Lagos"
```

---

## SCREEN 24 — Enter code

```
SCREEN BRIEF: One-time code entry. Second step of passwordless sign in.
Canvas: MOBILE, 390px wide.

The whole screen has a #FFFFFF background. A back chevron at the top left,
19px #4A5A67, 20px from the top and 16px from the left.

FORM BLOCK — 90px from the top, 24px side padding.
Page heading: "Enter your code"
8px gap, body text #4A5A67 over two lines:
"We sent a six-digit code to 0803 *** 2288 on WhatsApp. It expires in 10
minutes."

24px gap, then six code boxes in a row with 8px gaps between them. Each box
is 46px wide and 54px tall, #FFFFFF, 1px solid #B9C5CE, 5px radius, with a
centred character in IBM Plex Sans 600 22px.
The first four contain "4", "1", "7", "2". The fifth is FOCUSED, showing a
2px #17242F border and a #EEF6FC fill, and is empty. The sixth is empty.

20px gap, then a PRIMARY button, full width, 40px tall: "Sign in"

14px gap, centred caption #7C8B97: "Resend code in 0:42"
Beneath it, 8px gap, centred body text 12px, colour #17242F, underlined:
"Send to SMS instead"

HELP BLOCK — 28px below, 24px side padding, 12px vertical padding,
background #EEF3F7, 7px radius, 11.5px #4A5A67:
"If the code does not arrive, check that the school has your current number.
The office can update it for you — for your security you cannot change it
here."
```

---

## SCREEN 25 — Parent detail form

```
SCREEN BRIEF: A parent filling in their own details after receiving a claim
code on a slip sent home from school. Produce this as TWO linked screens
side by side on the canvas.
Canvas: MOBILE, 390px wide, two frames.

FRAME A — "Enter your code"
#FFFFFF background. The brand block from SCREEN 23 at the top, 40px down.
32px below it, 24px side padding:
Page heading: "Update your details"
8px gap, body #4A5A67 over three lines:
"Your child brought home a slip with a code on it. Enter the code to check
your details and correct anything that is wrong."
20px gap, label "Claim code", then a text input containing "AMC-4471".
14px gap, PRIMARY button full width: "Continue"
20px gap, help block styled as in SCREEN 23:
"Each code works once and belongs to one child. If you have more than one
child at the school, you will receive a separate slip for each."

FRAME B — the form, reached after the code is accepted.
TOP BAR — 44px, #FFFFFF, 1px #DEE6EC bottom border. Back chevron, then two
lines: "Your details" and "Step 2 of 2".

CONFIRMATION STRIP — full width, background #E4F0EA, 1px #A9CDBB bottom
border, 12px 15px padding. A 7px filled circle in #1F6B45 on the left, then
body text #1F6B45:
"Code accepted for Oluwatobiloba A. Adeyinka, JSS 2A"

FORM — 15px padding, background #EEF3F7. Fields grouped into two white
cards, each 15px padding, 12px gap between cards.

Card 1, heading "About you":
  "Full name" — input containing "Mrs Folake Adeyinka"
  "Relationship to the child" — select showing "Mother"
  "Phone number" — input containing "0803 411 2288", with a small lock shape
    and the caption beneath: "Only the school office can change this."
  "Alternate phone" — input containing "0705 664 1190"
  "Email address" — input containing "f.adeyinka@gmail.com"
  "Occupation" — input containing "Civil servant"
  "Home address" — a textarea two lines tall containing
    "22 Ijaiye Road, Ogba, Ikeja, Lagos"

Card 2, heading "Second guardian (optional)":
  "Full name" — input containing "Mr O. Adeyinka"
  "Relationship to the child" — select showing "Father"
  "Phone number" — input containing "0805 991 4477"

EXPLANATION BLOCK — 12px below, 13px padding, 11.5px #4A5A67:
"The school office will check these details before they take effect. You
will get a message when they have been approved, usually within two working
days."

FIXED FOOTER — 56px, #FFFFFF, 1px #DEE6EC top border, 13px padding.
A PRIMARY button, full width: "Send to the school"
```
