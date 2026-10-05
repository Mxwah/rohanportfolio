# Timken internship announcement — design

Date: 2026-10-05
Status: implemented (revised after live review)

## Goal

Rohan accepted a Summer 2027 Finance & Accounting internship at Timken. The
search is closed: remove every "seeking 2027 internships" line and present
Timken as the newest, most prominent role, in the site's existing typographic
language (DESIGN.md: monochrome, display-scale metric spreads, no new accent,
no badges).

## Changes

### 1. Experience: Timken lead spread — `src/acts/ExperienceAct.tsx`

First entry in `PANELS`:

```ts
{ org: "Timken", role: "Incoming Finance & Accounting Intern, Summer 2027", value: 2027, static: true, context: "Offer accepted. Finance and accounting at a $4.6B global maker of engineered bearings and power transmission products." },
```

- New optional `Panel.static` flag: `PanelSpread` renders the value as-is
  instead of through `Counter`. A year counting up from zero reads as a glitch.
- "Summer" lives in the role label, not as a display-scale prefix: at 0.42em a
  whole word competes with the org name and its trailing space collapses
  against the numerals ("Summer2027").
- Pinned scroll length grows by one panel automatically
  (`PANELS.length * 0.85 * innerHeight`); the progress rail gains a fifth tick.
- Mobile / reduced-motion: first item in the static list.
- Revenue figure: Timken 2025 net sales $4,581.8M (Q4/FY2025 release,
  2026-02-04), rounded to $4.6B.

### 2. Hero — `src/components/hero/DcfHero.tsx`

Copy, two short lines, `text-balance` so phones don't orphan "at Timken.":

> Incoming Finance & Accounting intern at Timken.
> Sophomore at the University of Akron.

The "the current below is a live valuation: drag the drivers" sentence is cut;
the sliders directly below are self-evident. A feathered radial scrim
(site bg color) now sits under the name and intro so the river's crest can't
wash them out.

### 3. Contact — `src/components/sections/Contact.tsx`

- Headline: "Headed to Timken, summer 2027."
- Subcopy: "Studying financial management and economics. This site is my
  portfolio." (the hero already says sophomore at Akron).
- Full-bleed feathered radial scrim under the text (the river runs at 0.6
  alpha here). It spans `w-screen`, not the 1240px shell: bounded by the shell
  it was still dark at the shell edge and cut a hard seam on wide screens.
  `body` clips `overflow-x`, so the full-bleed layer adds no horizontal scroll.

### 4. Link-unfurl description — `index.html`

`og:description` now ends "University of Akron sophomore, incoming Finance
&amp; Accounting intern at Timken." `meta name="description"` had no
internship line and is unchanged.

## Out of scope

- Resume PDF: no updated resume exists yet; the current PDF stays linked.
- OG image regeneration.
- Any new visual elements (pills, badges, accent color).

## Verification

- `npm run build` passes (tsc + vite).
- Desktop: Timken is the first Experience spread, "2027" set static, label
  reads "…Intern, Summer 2027", five rail ticks.
- 375px: hero intro wraps without an orphan; no horizontal scroll.
- Wide (1700px): no seam at the Contact section's shell edge.
- `grep -ri "seeking\|looking for 2027"` in `src/` and `index.html` returns
  nothing.
