---
name: Administrative Authority
colors:
  surface: '#f5fafe'
  surface-dim: '#d5dbdf'
  surface-bright: '#f5fafe'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4f8'
  surface-container: '#e9eef2'
  surface-container-high: '#e4e9ed'
  surface-container-highest: '#dee3e7'
  on-surface: '#171c1f'
  on-surface-variant: '#44474b'
  inverse-surface: '#2c3134'
  inverse-on-surface: '#ecf1f5'
  outline: '#74777c'
  outline-variant: '#c4c7cb'
  surface-tint: '#53606d'
  primary: '#020e18'
  on-primary: '#ffffff'
  primary-container: '#17242f'
  on-primary-container: '#7e8b99'
  inverse-primary: '#bac8d7'
  secondary: '#9d4043'
  on-secondary: '#ffffff'
  secondary-container: '#ff8d8d'
  on-secondary-container: '#772428'
  tertiary: '#170901'
  on-tertiary: '#ffffff'
  tertiary-container: '#301f0f'
  on-tertiary-container: '#9f856f'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d6e4f3'
  primary-fixed-dim: '#bac8d7'
  on-primary-fixed: '#101d28'
  on-primary-fixed-variant: '#3b4854'
  secondary-fixed: '#ffdad8'
  secondary-fixed-dim: '#ffb3b2'
  on-secondary-fixed: '#410008'
  on-secondary-fixed-variant: '#7e292d'
  tertiary-fixed: '#fdddc3'
  tertiary-fixed-dim: '#dfc1a9'
  on-tertiary-fixed: '#281809'
  on-tertiary-fixed-variant: '#584330'
  background: '#f5fafe'
  on-background: '#171c1f'
  surface-variant: '#dee3e7'
typography:
  headline-xl:
    fontFamily: Libre Baskerville
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-xl-mobile:
    fontFamily: Libre Baskerville
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
  headline-lg:
    fontFamily: Libre Baskerville
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Libre Baskerville
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
  headline-sm:
    fontFamily: Libre Baskerville
    fontSize: 16px
    fontWeight: '700'
    lineHeight: 24px
  body-lg:
    fontFamily: IBM Plex Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: IBM Plex Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: IBM Plex Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  data-mono:
    fontFamily: IBM Plex Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: IBM Plex Sans
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 16px
  label-sm:
    fontFamily: IBM Plex Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.5px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

This design system establishes an authoritative, institutional, and dependable interface tailored for Nigerian educational institutions, registrars, bursars, and administrative staff. It communicates gravity, regulatory precision, and uncompromised clarity. 

The aesthetic is functional administrative modernism. It rejects superficial visual ornamentation, rounded casualness, gradients, decorative illustrations, and emojis in favor of sober ledger aesthetics, crisp structural divisions, tabular alignment, and deliberate typographic contrast. The interaction design evokes physical government ledgers, national examination registries, and high-trust academic documentation while functioning seamlessly on high-density enterprise desktop interfaces and resource-constrained web clients.

## Colors

The palette is engineered for severe institutional utility, long hours of administrative data entry, and fail-safe semantic comprehension under varied display calibrations.

### Base & Structural Tones
- **Page Background (`#EEF3F7`)**: A cool, low-strain neutral canvas that isolates white surface panels.
- **Surface / Card (`#FFFFFF`)**: Pure white base for all data containers, form groups, and document panels.
- **Primary Text / Dark UI (`#17242F`)**: Deep carbon-slate used for authoritative headings, table headers, and primary data values.
- **Secondary Text (`#4A5A67`)**: Mid-tone slate for field labels, meta attributes, and supporting descriptions.
- **Muted Text (`#7C8B97`)**: Low-emphasis tone for placeholders, disabled states, and auxiliary hints.
- **Standard Border (`#DEE6EC`)**: Structural separator for cards, data table rows, and inner panel grids.
- **Strong Border (`#B9C5CE`)**: High-contrast boundary for focused inputs, emphasized table dividers, and structural headers.

### Brand Accent (Restricted)
- **Deep Oxblood (`#6E1D22`)**: The institutional signature tone. By strict mandate, it is reserved solely for the primary institutional crest/logo mark and the bottom indicator line of active navigation elements. It is never used for general buttons, tags, or links.

### Status System (Two-Tone Tokens)
All statuses are rendered as tinted pill containers pairing high-contrast foreground text with a pastel tinted ground:
- **Success (`#1F6B45` on `#E4F0EA`)**: Approved records, cleared fees, verified identity.
- **Warning (`#8A6316` on `#F7EEDC`)**: Unsubmitted grades, overdue deadlines, flagged anomalies.
- **Danger (`#9B2226` on `#F7E4E4`)**: Disciplinary holds, blocked registrations, payment failures.
- **Info / Pending (`#3C5A78` on `#E5EDF4`)**: Queued operations, reviewed entries, administrative notices.

## Typography

Typographic hierarchy enforces clean boundaries between institutional identity and clerical data processing:

- **Institutional Display (Libre Baskerville)**: Deployed strictly in Bold (`700`) for top-level view titles, modular section headers, and high-level analytical figures (e.g., total term fees collected, total student enrollment).
- **Core Interface & Content (IBM Plex Sans)**: Deployed for all interactive controls, form inputs, narrative data, and metadata. It balances legibility at compact sizes with structural discipline.
- **Reference & Code Registry (IBM Plex Mono)**: Deployed exclusively for student matriculation numbers, invoice IDs, session codes, transaction hashes, and system timestamps.
- **Tabular Numerals**: Every numeric character across the application must activate OpenType tabular lining figures (`font-variant-numeric: tabular-nums;`) to guarantee strict vertical column alignment across ledgers and score sheets.

## Layout & Spacing

The layout is built around high administrative density and disciplined spatial predictability.

### Grid Architecture
- **Desktop (>= 1280px)**: 12-column structured grid with `1.5rem` (`24px`) gutters and fixed vertical structural sidebar navigation (`240px`). Top navigation bar fixed at `56px` height.
- **Tablet (768px - 1279px)**: 8-column layout with `1rem` (`16px`) gutters. Side navigation collapses to an authoritative icon-rail or off-canvas drawer.
- **Mobile (< 768px)**: 4-column layout with `1rem` outer canvas padding. Complex data tables degrade to stacked structured definition cards.

### Spacing Rhythm
Spacing is compact to maximize information density without causing optical clutter. Vertical margins between form rows are fixed at `space-md` (`12px`), while internal card containers enforce `space-lg` (`20px`) padding.

## Elevation & Depth

Visual hierarchy is maintained through crisp surface planes and structured borders rather than spatial depth or floating layers:

- **Plane Differentiation**: All spatial separation is communicated by resting `#FFFFFF` surfaces against the `#EEF3F7` background, bounded by a 1px `#DEE6EC` border.
- **Elevation Shadow**: When an elevation state is strictly required (such as modal overlays or floating dropdown menus), use a single low-impact shadow token:
  `box-shadow: 0 1px 2px rgba(23, 36, 47, 0.06);`
- **Zero-Depth Standard**: Cards, panels, buttons, and tables must remain flat. Do not apply progressive blur radii, ambient glow, or hover y-axis translations. Depth changes on focus or active states are communicated solely via border color shifting to `#B9C5CE` or `#17242F`.

## Shapes

The design system uses precise, hard-set corner radii specific to each component's functional role:

- **Cards & Data Modules**: Fixed `7px` border radius. Ensures containers retain structured, ledger-like corners without appearing sharp or brutalist.
- **Interactive Controls (Buttons, Inputs, Selects)**: Fixed `5px` border radius. Provides ergonomic touch boundaries while maintaining architectural firmness.
- **Status Pills & Micro Badges**: Fixed `20px` border radius. Distinguishes informational status chips from interactive buttons or rectangular data fields.
- **Prohibited**: Freeform organic contours, pill-shaped action buttons, and circular icons (except for status glyphs).

## Components

### Buttons
- **Primary Action**: Background `#17242F`, text `#FFFFFF`, border radius `5px`. Padding: `8px 16px`. Active state transitions to `#253847`.
- **Secondary Action**: Background `#FFFFFF`, border `1px solid #DEE6EC`, text `#17242F`, border radius `5px`. Hover state applies `#EEF3F7`.
- **Destructive Action**: Background `#9B2226`, text `#FFFFFF`, border radius `5px`.
- **Active Navigation Items**: No background fill. Plain text with a `3px` solid horizontal underline in `#6E1D22` (Brand Accent).

### Status Indicators (Pills)
Status pills feature a `20px` radius, `3px 10px` padding, and use `label-sm` typography with uppercase styling. Each status requires a geometric indicator shape placed directly before the label:
- **Approved**: Fill `#E4F0EA`, text `#1F6B45`. Shape: Filled Circle (●).
- **Submitted**: Fill `#E5EDF4`, text `#3C5A78`. Shape: Filled Circle (●).
- **Reviewed**: Fill `#E5EDF4`, text `#3C5A78`. Shape: Hollow Circle (○).
- **Not Submitted**: Fill `#F7EEDC`, text `#8A6316`. Shape: Diamond (◆).
- **Blocked**: Fill `#F7E4E4`, text `#9B2226`. Shape: Square (■).
- **Waiting**: Fill `#E5EDF4`, text `#3C5A78`. Shape: Hollow Circle (○).

### Data Tables
- **Header Row**: Background `#EEF3F7`, border-bottom `2px solid #B9C5CE`. Text `12px`, bold, uppercase, color `#4A5A67`.
- **Body Rows**: Background `#FFFFFF`, alternating rows with `#FAFCFD`. Row border `1px solid #DEE6EC`. Padding: `10px 12px`.
- **Numerical Cells**: Tabular numbers (`tabular-nums`), right-aligned. Column headers for numeric data must also be right-aligned.
- **Reference Codes**: Displayed in `IBM Plex Mono` at `13px`, text color `#17242F`.

### Input Fields & Controls
- **Inputs & Selects**: Height `36px`, background `#FFFFFF`, border `1px solid #DEE6EC`, radius `5px`. Padding `0 10px`. Font `IBM Plex Sans` `14px`.
- **Focus State**: Border color becomes `#17242F`. No outer glow or ring.
- **Checkboxes & Radios**: Size `16px`, border `1.5px solid #7C8B97`. Checked state: Background `#17242F` with white check/dot. Radius on checkboxes: `3px`.

### Cards & Group Panels
- Encased in `#FFFFFF` with a `1px solid #DEE6EC` perimeter border and `7px` radius.
- Header bars within cards have an explicit bottom rule of `1px solid #DEE6EC` separating panel labels from ledger content.