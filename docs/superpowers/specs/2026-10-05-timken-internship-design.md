# Timken internship announcement — design

Date: 2026-10-05
Status: approved

## Goal

Rohan accepted a Summer 2027 Finance & Accounting internship at Timken. The
search is closed: remove every "seeking 2027 internships" line and present
Timken as the newest, most prominent role, in the site's existing typographic
language (DESIGN.md: monochrome, display-scale metric spreads, no new accent,
no badges).

## Changes

### 1. Experience: Timken lead spread

Add one entry at the top of `PANELS` in `src/acts/ExperienceAct.tsx`:

```ts
{ org: "Timken", role: "Incoming Finance & Accounting Intern", prefix: "Summer ", value: 2027, context: "Offer accepted. Finance and accounting at a $4.6B global maker of engineered bearings and power transmission." },
```

- Renders through the existing `PanelSpread`; no layout code changes.
- `prefix` renders at 0.42em in `--text-secondary`, top-aligned, as for `$`.
  The trailing space keeps "Summer" off the numerals.
- `value: 2027` without `comma`, so it counts up to `2027`, not `2,027`.
- Pinned scroll length grows by one panel automatically
  (`PANELS.length * 0.85 * innerHeight`); the progress rail gains a fifth tick.
- Mobile / reduced-motion: it becomes the first item in the static list.
- Revenue figure: Timken 2025 net sales $4,581.8M (Q4/FY2025 release,
  2026-02-04), rounded to $4.6B.
- Update the comment above `PANELS` that says the numbers come from the August
  2026 resume, so it notes that the Timken entry comes from the accepted offer.

### 2. Hero copy — `src/components/hero/DcfHero.tsx`

> Sophomore at the University of Akron, incoming Finance & Accounting intern at
> Timken. The current below is a live valuation: drag the drivers and it
> re-routes.

### 3. Contact — `src/components/sections/Contact.tsx`

- Headline: "Headed to Timken, summer 2027."
- Subcopy, resume button, email, LinkedIn unchanged.

### 4. Link-unfurl description — `index.html`

In `og:description` (the only tag carrying the old string), replace
"University of Akron sophomore seeking 2027 internships." with
"University of Akron sophomore, incoming Finance &amp; Accounting intern at
Timken." (`&amp;` because it sits in an HTML attribute.) `meta name="description"`
has no internship line and stays unchanged.

## Out of scope

- Resume PDF: no updated resume exists yet; the current PDF stays linked.
- OG image regeneration.
- Any new visual elements (pills, badges, accent color).

## Verification

- `npm run build` passes (tsc + vite).
- Local preview, desktop: scroll the Experience act; Timken is the first
  spread, counts up to 2027, "Summer" prefix sits correctly, five rail ticks.
- Local preview, mobile width (375px): Timken is first in the static list,
  no overflow from the 2027 numeral.
- `grep -ri "seeking\|looking for 2027"` in `src/` and `index.html` returns
  nothing.
