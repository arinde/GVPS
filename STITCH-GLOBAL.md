# STITCH-GLOBAL.md

**Paste this entire file at the top of every screen prompt in
`STITCH-SCREENS.md`. Do not summarise it. Do not omit sections.**

Written to be followed literally by a model that infers nothing.

---

```
================================================================
GLOBAL SPECIFICATION — FOLLOW EXACTLY, SUBSTITUTE NOTHING
================================================================

You are producing one screen of a school management web and mobile
application for a Nigerian private school teaching Primary 1 through
SSS 3. It is an internal administrative tool used every working day by
staff, plus a portal used by parents. It is NOT a marketing website and
NOT a consumer lifestyle app.

This design system is extracted from an existing Figma file and must
be followed exactly. Do not substitute colours, fonts, or radii.

----------------------------------------------------------------
1. CANVAS
----------------------------------------------------------------
Desktop screens: 1440px wide. Content begins at x=241 (after the
sidebar). Total content area is 1199px wide.
Mobile screens: 390px wide. No sidebar — content runs edge to edge
with 16px gutters.
Each prompt states which to use. Never guess.

----------------------------------------------------------------
2. COLOUR — USE THESE EXACT HEX VALUES, NEVER APPROXIMATE
----------------------------------------------------------------

SIDEBAR AND NAVIGATION
  #152259   Sidebar background. The darkest navy. Also the fill of
            inactive nav items.
  #509CDB   Active nav item background. Also primary action buttons,
            links, and the logo accent.
  #2D88D4   Primary blue, darker variant. Hover state on buttons.
  #FCFAFA   All text inside the sidebar and on dark backgrounds.

PAGE AND CONTENT
  #FFFFFF   Main content area background. Card backgrounds. Input fills.
  #FCFAFA   Top bar background. Off-white, not pure white.
  #EEF3F7   Page canvas behind cards. Table header background.
            Progress bar tracks.
  #F7FAFC   Alternate table rows (zebra). Hover row highlight.

TEXT
  #282828   Primary heading text. Page titles. Card headings.
  #4F4F4F   Standard body text. Table cell content.
  #424242   Secondary body text. Subtitles and captions.
  #B9C5CE   Placeholder text inside inputs. Muted labels.

BORDERS AND STRUCTURE
  #DEE6EC   Standard card borders and table row dividers.
  #B9C5CE   Input field borders (default state). Table header rule.
  #152259   Input field border on focus (matches sidebar).

STATUS COLOURS — always pair with background and border
  #1F6B45 text / #E4F0EA background / #A9CDBB border — Approved, Paid
  #8A6316 text / #F7EEDC background / #DCC392 border — Pending, Warning
  #9B2226 text / #F7E4E4 background / #DCA9A9 border — Blocked, Overdue
  #3C5A78 text / #E5EDF4 background / #AEC3D6 border — In review, Waiting

STAT CARD BACKGROUNDS (used only on dashboard stat cards)
  #E8E8FF   Soft lavender — for student/enrolment stats
  #FFF3C4   Soft yellow — for teacher or award stats
  These are the ONLY two card background washes allowed. Never use
  any other coloured card background.

PROHIBITED EVERYWHERE
  Any colour not listed above. Gradients. Blur or glass effects.
  Drop shadows heavier than 0 1px 2px rgba(0,0,0,0.06).
  Teal, orange, pink, red, green, or purple used decoratively.

----------------------------------------------------------------
3. TYPOGRAPHY — TWO FAMILIES ONLY
----------------------------------------------------------------
PRIMARY FONT: "Kumbh Sans" — used for ALL text in this design.
FALLBACK: system-ui, sans-serif.

There is no serif font. There is no monospace font unless a prompt
explicitly specifies one for a specific field (admission numbers,
timestamps). If a prompt says "monospace" use IBM Plex Mono for
that field only.

Exact weights used in this design:
  Regular   400
  Medium    500
  SemiBold  600
  Bold      700

Exact type scale:
  Page heading      Kumbh Sans  700  36px  line-height normal
  Section heading   Kumbh Sans  600  20px  line-height normal
  Card heading      Kumbh Sans  600  16px  line-height normal
  Nav label         Kumbh Sans  600  14px  line-height normal
  Table header      Kumbh Sans  600  13px  line-height normal
  Body              Kumbh Sans  400  14px  line-height 20px
  Body medium       Kumbh Sans  500  14px  line-height 20px
  Small / caption   Kumbh Sans  400  12px  line-height 16px
  Button label      Kumbh Sans  600  14px  line-height normal
  Stat figure       Kumbh Sans  700  28px  line-height normal
  Stat label        Kumbh Sans  400  13px  line-height normal
  Badge / pill      Kumbh Sans  600  10px  line-height normal

ALL NUMBERS use tabular figures. ALL numeric table columns are
RIGHT-ALIGNED. All text columns LEFT-ALIGNED. Nothing centred in
a table except photo thumbnails.

----------------------------------------------------------------
4. SPACING — EXACT VALUES ONLY
----------------------------------------------------------------
Base unit: 8px.
Allowed values: 4, 8, 12, 16, 20, 24, 28, 32, 40, 48.
Nothing else.

Sidebar width:              241px (fixed, full height)
Top bar height:             95px
Sidebar nav item height:    40px
Sidebar nav item padding:   0 16px
Sidebar nav item gap:       8px between items
Card padding:               20px
Table cell padding:         12px vertical, 16px horizontal
Table row height:           48px (desktop), 52px (mobile list)
Gap between cards:          20px
Button height:              40px
Button padding:             0 20px
Input height:               40px
Input padding:              0 12px
Border radius — sidebar nav items: 4px
Border radius — buttons:    8px
Border radius — cards:      12px
Border radius — inputs:     8px
Border radius — stat cards: 12px
Border radius — pills:      20px
Border radius — photo:      50% (always circular)

----------------------------------------------------------------
5. DENSITY
----------------------------------------------------------------
This is an administrative tool. People need to see many records at once.

Desktop table: minimum 12 data rows visible without scrolling.
Mobile list: minimum 7 rows visible without scrolling.

If your layout shows fewer rows, reduce padding until it does.
Never sacrifice row count for whitespace or "breathing room".

----------------------------------------------------------------
6. SIDEBAR — APPEARS ON EVERY DESKTOP SCREEN
----------------------------------------------------------------
Position: fixed left. Width: 241px. Height: full viewport.
Background: #152259.

TOP SECTION:
A logo area 120px tall centred horizontally at the top. Contains a
circular school crest image (80px diameter) above the text
"SRMS Admin LMS" in Kumbh Sans SemiBold 14px #FCFAFA.

A full-width 1px horizontal divider in rgba(255,255,255,0.15)
beneath the logo section.

NAVIGATION SECTION:
A vertical list of nav items starting 28px below the divider.
Each item is 40px tall, 192px wide, 4px radius, left-aligned,
16px left padding, gap 8px between items.

ACTIVE item: background #509CDB, text #FCFAFA, icon #FCFAFA.
INACTIVE item: background #152259, text #FCFAFA, icon #FCFAFA at 70%.

Each nav item contains a 16px icon on the left and a 14px SemiBold
label 16px to its right.

Navigation items in order for admin role:
1. Dashboard (home icon)
2. Teachers (person-chalkboard icon)
3. Students / Classes (graduation cap icon)
4. Fees / Billing (bank icon)
5. Results (chart icon)
6. Requests (inbox icon)
7. Settings (gear icon)

A second group near the bottom:
8. Features (label with "NEW" badge in #B9D7F1 background)
9. Support (headset icon, pill-shaped button, background #152259,
   border radius 30px, 55px tall)

For non-admin roles (teacher, parent) the nav items differ —
each prompt will state the active item and role.

----------------------------------------------------------------
7. TOP BAR — APPEARS ON EVERY DESKTOP SCREEN
----------------------------------------------------------------
Height: 95px. Background: #FCFAFA. Full width minus sidebar (1199px).
Position: fixed top, left 241px.

LEFT SIDE: a promo or context strip in Kumbh Sans Regular 16px
#424242 with two lines of text. Each prompt states the content.

RIGHT SIDE: a bell notification icon (24px, #282828), then a
"Log out" button: background #509CDB, text #FCFAFA, SemiBold 14px,
8px radius, 40px tall, 120px wide, 10px horizontal padding.

----------------------------------------------------------------
8. STAT CARDS — DASHBOARD ONLY
----------------------------------------------------------------
Four cards in a row, equal width, 12px radius.
Height: approximately 120px.

Each card has:
- A background wash (#E8E8FF or #FFF3C4 alternating)
- Top-right: a small percentage badge (green arrow up or red arrow
  down) and a "..." overflow menu
- Main figure in stat figure type
- Label in stat label type, colour #4F4F4F
- No border, light shadow only

----------------------------------------------------------------
9. DATA TABLE PATTERN
----------------------------------------------------------------
Appears on registry, teacher list, student list, attendance,
fee ledger, debtor list, approval queue.

Header row: background #EEF3F7. 1px solid #B9C5CE top and bottom.
Table header type. Colour #424242. Height 48px.
Body rows: 48px tall. 1px solid #DEE6EC bottom border.
Alternate rows: #F7FAFC background.
Hover: #EEF3F7 background.
Footer/total: 1px solid #B9C5CE top. SemiBold weight.

Photo thumbnails in tables: 36px circular, object-cover.
Action buttons in rows: small secondary buttons, 32px tall,
8px radius, border #B9C5CE.

----------------------------------------------------------------
10. FORM PATTERN
----------------------------------------------------------------
Appears on registration, record payment, submission review.

Two-column layout on desktop. Left 58%, right 42%, 24px gap.
Labels above each field, SemiBold 13px #282828, 6px gap.
Inputs: 40px tall, 8px radius, border 1px #B9C5CE, bg #FFFFFF.
Focused input: border 2px #152259 (matches sidebar), bg #F0F5FF.
Photo upload slot: 120×160px rectangle, 8px dashed border #B9C5CE,
centred label "Upload photo" in caption type.

----------------------------------------------------------------
11. STATUS PILLS
----------------------------------------------------------------
Height: 24px. Border-radius: 20px. Padding: 2px 10px 2px 8px.
Font: Kumbh Sans SemiBold 10px.
Contains a 6px shape LEFT of the word. BOTH must appear — never
colour alone.

Pill shapes:
  Filled circle    = Approved / Paid / Sent / Active
  Filled diamond   = Pending / Submitted / Warning / Unread
  Filled square    = Blocked / Not submitted / Overdue / Suspended
  Hollow circle    = Reviewing / Waiting / In progress

Pill colours: use the four status colour sets from section 2.

----------------------------------------------------------------
12. MOBILE TOP BAR
----------------------------------------------------------------
Height: 56px. Background: #FFFFFF. 1px #DEE6EC bottom border.
Padding: 0 16px.
Left: back chevron (when applicable) then screen title in
Kumbh Sans SemiBold 16px #282828.
Right: circular avatar 32px or action icon.
NO sidebar on mobile screens.

MOBILE BOTTOM TAB BAR
Height: 60px. Background: #FFFFFF. 1px #DEE6EC top border.
Four items evenly spaced. Active item: icon and label in #509CDB.
Inactive: #B9C5CE.

----------------------------------------------------------------
13. BUTTONS
----------------------------------------------------------------
PRIMARY: background #509CDB. Text #FFFFFF. SemiBold 14px. 8px radius.
40px tall. 20px horizontal padding.
Hover: background #2D88D4.

SECONDARY: background #FFFFFF. Text #282828. Border 1px #B9C5CE.
SemiBold 14px. 8px radius. 40px tall.

SMALL: same as secondary but 32px tall and 12px horizontal padding.

DISABLED: 40% opacity of the primary. Must have adjacent visible
text explaining why it is disabled. Never bare.

PILL BUTTON (support, special actions only): border-radius 30px.
Background #152259. Text #FCFAFA. 55px tall. 173px wide.

----------------------------------------------------------------
14. COPY RULES
----------------------------------------------------------------
Sentence case everywhere — headings, labels, buttons.
Never ALL CAPS on content screens (welcome page excepted).
Buttons name the action: "Save record", "Approve", "Record payment".
Error and empty states are plain and specific. Never apologetic.
No emoji, no exclamation marks in UI copy.

----------------------------------------------------------------
15. DOMAIN FACTS — USE THESE EXACTLY
----------------------------------------------------------------
App name: SchoolBase
School name: Adeola Memorial College
Location: Ogba, Ikeja, Lagos State, Nigeria
Currency: Nigerian naira, symbol ₦, comma thousands separator.
Example: ₦142,500. Never $ or €.
Session: 2026/2027. Terms: First Term, Second Term, Third Term.
Current context everywhere: Second Term 2026/2027.

Classes: Primary 1–6, JSS 1–3, SSS 1–3.
Arms: written as "JSS 2A", "Primary 5B".
Senior streams: Science, Arts, Commercial.

Subjects: English Language, Mathematics, Basic Science, Basic
Technology, Social Studies, Civic Education, Christian Religious
Studies, Business Studies, Agricultural Science, Home Economics,
Computer Studies, French, Yoruba, Cultural and Creative Arts.

Assessment: 1st CA /10, 2nd CA /10, Assignment /10, Project /10,
Exam /60. Total 100.

Grades: A1 (75–100), B2 (70–74), B3 (65–69), C4 (60–64),
C5 (55–59), C6 (50–54), D7 (45–49), E8 (40–44), F9 (0–39).

PEOPLE — use only these names:
Students: Adeyinka Oluwatobiloba, Abiodun Chidera, Afolabi Ridwan,
Ajayi Nkechi, Bello Hauwa, Chukwu Emeka, Danladi Grace,
Umeh Chinaza, Okafor Somto, Eze Amarachi, Lawal Tunde, Ogun Kelechi,
Salami Ibrahim, Tijani Fatimah.

Staff: Mrs F. Adeyinka (superadmin), Mr S. Okonjo (principal),
Mr D. Igwe (bursar), Mrs B. Okoro (office), Mrs A. Eze (form teacher),
Mr K. Adebayo, Mrs I. Ogun, Mr T. Nwosu, Mr B. Lawal, Mrs C. Uche,
Mlle R. Diallo.

Guardians: Mrs F. Adeyinka, Alhaji M. Bello, Mr E. Okafor,
Mrs P. Danladi, Mr Y. Afolabi.

PROHIBITED NAMES: John Doe, Jane Smith, Lorem Ipsum, any Western
name not on the list above.

----------------------------------------------------------------
16. FINAL CHECKLIST — CONFIRM ALL BEFORE OUTPUTTING
----------------------------------------------------------------
  [ ] Every colour is a hex from section 2. No others.
  [ ] Font is Kumbh Sans throughout. No serif, no other sans.
  [ ] Sidebar is #152259, 241px, with nav items per section 6.
  [ ] Top bar is #FCFAFA, 95px.
  [ ] Active nav item has #509CDB background.
  [ ] Every numeric column is right-aligned.
  [ ] Every status shows a shape AND a word.
  [ ] Desktop table shows 12+ rows, mobile list 7+ rows.
  [ ] No gradient, no blur, no illustration, no emoji.
  [ ] All money uses ₦ and comma separators.
  [ ] Every person's name is from section 15.
  [ ] Disabled buttons have adjacent explanatory text.
  [ ] All card radii are 12px, button radii 8px, pill radii 20px.

================================================================
END OF GLOBAL SPECIFICATION — SCREEN BRIEF FOLLOWS BELOW
================================================================
```
