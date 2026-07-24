# rohandhruv.com — DESIGN.md

The single source of truth. Every session reads this first. If code and this file
disagree, this file wins — fix the code or update this file deliberately.

Audience: finance recruiters (commercial / middle-market banking), not designers.
The site's job is to prove Rohan ships real product. The signature is a live DCF
model, treated as a piece — not a static hero.

---

## 1. Signature

The page opens directly onto a **live, self-assembling DCF model**. Four sliders
(revenue growth, EBITDA margin, WACC, terminal growth) drive three outputs
(intrinsic value / share, enterprise value, equity value) and a self-drawing
cash-flow chart. The name is set large over the instrument, not in a separate
banner. Everything recalculates live on drag.

## 2. Voice / aesthetic lane

**"A financial instrument rendered like a precise product."** Terminal-native
dark, monochrome UI where the *living data* is the color. Reference points: the
precision of a trading terminal + Vercel's monochrome restraint + Snellenberg's
interaction craft. **Not** the editorial-serif-magazine lane.

**Register change, 2026-07-23 (Rohan's explicit call):** the hero is upgraded
to full spectacle, reference class Active Theory / dragonfly.xyz. This
supersedes the Phase-0 "avoid spectacle sites" note **for the hero only**. The
contract: spectacle lives in the background and interaction layer; the name,
outputs, and sliders stay instantly legible on top. Spectacle must mean
something (here: the spectacle IS the model's output), never decoration.

## 3. Color tokens (monochrome, neutral, dark)

Defined in `src/styles/tokens.css`. No accent color by default; the data carries
the richness.

| Token | Value | Role |
|---|---|---|
| `--bg` | `#0B0B0D` | page background |
| `--bg-raised` | `#101012` | raised surface |
| `--bg-card` | `#151517` | cards, model panel |
| `--text` | `#F3F3F1` | primary ink (~AAA on bg) |
| `--text-secondary` | `#B8B8B4` | supporting (bright: sits over the river) |
| `--text-muted` | `#8C8C88` | hints, axis, timestamps (min ~6:1 on bg) |
| `--border` | `rgba(255,255,255,.09)` | hairline |
| `--border-strong` | `rgba(255,255,255,.16)` | emphasis / hover |

**Legibility over the river:** secondary/muted ink carry extra contrast
headroom, the river dims to 0.18 alpha under content acts, and dark feathered
scrims sit behind the hero's name and instrument bar and behind the experience
spreads. Scrims are functional contrast, not decoration, and are always the
site bg color feathered to transparent, never a light glow.

Up/down (valuation vs. price) is shown with ▲/▼ + weight, never red/green.

**One sanctioned exception:** the ARIA act may use ARIA Brand Violet `#6D3AF2`,
and only where ARIA's own guidelines reserve it: the aperture ring on the mark
and the iris point in the act's entrance. No violet anywhere else on the site.

## 4. Type (the "instrument" pairing)

Loaded in `index.html` from Google Fonts. **Neither face is on the Impeccable
reflex-reject list** (that's why Fraunces + IBM Plex Mono were dropped).

- **Display + body — Schibsted Grotesk** (400–800). Precise contemporary
  grotesque. Headings: `letter-spacing: -0.02em` (never past the −0.04em floor),
  `line-height` ~1.05, `text-wrap: balance`.
- **Data — Spline Sans Mono** (400–600), tabular. Used **only on real numbers**
  (`.tnum`) — never as decorative labels, which would read as costume.
- **Display-scale metrics** (the experience spreads, ARIA's 19) are set in
  Schibsted Grotesk 800 with `font-variant-numeric: tabular-nums`, prefix and
  suffix at ~0.42em in `--text-secondary` (financial-print style). Mono at hero
  scale reads as a terminal dump; mono is for live readouts, tables, axis
  ticks, and small data labels.
- Body `line-height: 1.65` (light-on-dark needs the air). Prose capped ~68ch.

## 5. Spacing / radius

4px base scale. Sections: `py-24`/`md:py-32`. Content column `max-w-shell`
(1240px). Radius: controls ~8px, cards 12px. Never 24px+ on cards.

## 6. Motion tokens (easing / duration pairs)

| Token | Value | Used for |
|---|---|---|
| `--ease-out` | `cubic-bezier(.23,1,.32,1)` | entrances, reveals, count-ups, chart |
| `--ease-inout` | `cubic-bezier(.77,0,.175,1)` | on-screen movement, clip wipes |
| `--ease-drawer` | `cubic-bezier(.32,.72,0,1)` | pinned scene progress |
| `--dur-fast` | 160ms | hover, cursor, button press |
| `--dur-base` | 300ms | slider-release settle |
| `--dur-slow` | 560ms | section reveals |
| `--dur-reveal` | 900ms | opening scene / chart first-draw |

Emil Kowalski's rules apply: never `ease-in` on UI, never animate from `scale(0)`
(start at `scale(0.95)` + opacity), functional readouts (the DCF) have no
decorative lag, cinematic weight lives in the between-act transitions. Full
architecture in `docs/2026-07-23-engulfing-acts.md` and the project
walkthroughs in `docs/2026-07-23-project-cinematics.md` (shared engine:
`src/lib/usePinnedPhases.ts`, caption primitive `src/components/ui/Beat.tsx`).

Live drag updates every frame (0ms). Reduced motion: art freezes to one still
frame, smooth-scroll off, reveals become instant, count-ups snap. All enforced
in `index.css` + `useReducedMotion`.

## 7. Layout / structure

Single page + one route. The page is a sequence of full-viewport acts (see
`docs/2026-07-23-engulfing-acts.md`):
1. **Opening scene** — the name plots itself in, then hands off. The custom
   cursor does not exist during the intro; it fades in with the hero.
2. **Hero** — DCF-as-art (`DcfHero`) behind **the river of value**
   (`FlowField`): ~42k stateless luminous particles flowing along a
   Catmull-Rom spline whose course IS the live model's 5-year FCF curve
   (`src/lib/field-link.ts`). Drag a slider and the river re-routes (points
   lerp toward the new curve, so the morph reads as a current shift). The
   cursor is a repulsion field: particles burst away and heal behind it.
   ~2.5% of particles are bright embers driving an UnrealBloom pass (half
   res, threshold 0.12) — bloom is what separates dots from spectacle. The
   river ignites on load, sweeping in from upstream over ~2.2s. Stateless
   particles (position = f(seed, time) in the vertex shader, no GPGPU), an
   opaque canvas in the site bg hex (no alpha-composite fights). Lessons
   kept: random scatter with no flow reads as static; structure and flow
   read as intent. **No glow behind the headline, ever** (Phase-0 ban,
   violated once, never again).

   **Hero layout:** the name rides high, the river owns the center of the
   viewport unobstructed, and the model is a terminal-style instrument bar
   docked at the bottom (3 outputs + full-model link + 4 sliders). No chart
   in the hero on purpose: the river IS the chart; bars and tables live on
   `/dcf`.

   **The river never dies.** Per-act moods, read from whichever section
   covers the viewport center, all properties lerped: hero (full, y 0,
   speed 1) → experience/simulator/work (alpha .3, sunk −2.4, speed .45: a
   quiet undercurrent below the content) → ARIA act (parked at 0; that
   stage belongs to the mark, and its canvas gets the GPU) → leadership
   (.5) → contact (.7, calm). Permanent motion: traveling surges meander
   down the course and the width swells and narrows (pools and narrows),
   so the river never settles into a straight channel. **The aperture
   drink is built:** as the ARIA act rises into view, the current drains
   toward it (per-particle pull rates, shrinking points), holds while the
   act owns the screen, and the river returns after. Future candidate:
   per-act particle formations.
3. **Education** (`Education.tsx`, `#education`) — its own addressable
   section in the composed-spread language (reuses `PanelSpread`): U Akron
   set huge, 3.95 GPA counting on the baseline rule, Honors College, Dean's
   List x2, Dec 2028. Split out of the experience pin because a degree is
   not work experience and the nav needs a real anchor.
4. **Experience** — pinned sequence (`ExperienceAct`), all real July-2026
   resume content: Fleet Team x3 ($46K/103 accts, 2,200 accts/3 maps, 260+
   SKUs) → Mont Granite 80% (Synthesis GPT) → Speranza 52% (Brazil trip) →
   Validom $9K+ (founder). Fleet Feet retail deliberately omitted.
5. **Portfolio Simulator** (`src/acts/SimulatorAct.tsx`) — beginner-first,
   rebuilt from Rohan's original, now a CINEMATIC WALKTHROUGH (spec:
   `docs/2026-07-23-project-cinematics.md`). Pins 2.4 screens; scroll beats:
   contributions line → the compounding wedge fills → the bear/bull fan
   spreads → controls unlock (default scenario "All three"). Deterministic
   monthly compounding, no Monte Carlo (removed at Rohan's call). The dashed
   contributions line is a permanent reference: the wedge between it and the
   growth line IS compounding. Assumptions on the face; "a model, not
   advice."
6. **Macro** (`src/acts/MacroAct.tsx`, `#macro`) — the LRAS / AD / SRAS
   diagram from Rohan's original ARIA visualization, now a CINEMATIC
   WALKTHROUGH (spec: `docs/2026-07-23-project-cinematics.md`). Pins 2.4
   screens: curves draw in sequence → the equilibrium dot lands → a SCRUBBED
   stretch (progress .58 to .82) where the visitor's own scroll closes the
   Strait of Hormuz, dragging SRAS to s = -14 and the dot into stagflation →
   handoff keeps the oil shock live with its tab lit, controls unlock.
   Scenario tabs preset two sliders; curves glide 650ms ease-out over dashed
   ghost baselines. "US read" strip is a dated snapshot (June 2026: CPI 3.5,
   core 2.6, unemployment 4.1); live FRED refresh at deploy.
7. **Mont AI** (`MontAi.tsx`, `#mont-ai`) — agentic AI wired into Mont
   Granite's ERP; separate from Synthesis GPT (experience panel). Now a
   CINEMATIC WALKTHROUGH (spec: `docs/2026-07-23-project-cinematics.md`).
   Pins 2.0 screens: ERP node alone → the agentic core wires in, pulses flow
   → outcome lanes connect, presales lane brightens, the 3-hrs stat reveals
   → honesty line, release. Real numbers: up to 3 hrs a day, 80 min presales.
   Live schematic with SMIL pulses (off under reduced motion), never a fake
   product screenshot. The old "Selected work" grid is retired; every
   project is its own act.
9. **Leadership** (`Leadership.tsx`, after ARIA) — "Selected for, Fall 2026"
   in the site's own baseline-rule language: the selective fact set huge in
   the display face ("1 of 12", "60 applicants", "VP Pledge Education")
   seated on the hairline, org + one context line at the rule's right. Same
   composition as the experience spreads, smaller scale. Never plain
   settings-page rows (tried once, read as slop). ARIA deliberately absent;
   it has its own act.

**Nav:** every act is addressable on every device — the strip scrolls
horizontally on phones (`no-scrollbar`) instead of amputating items — plus a
permanent first-class **Resume** link (the recruiter's terminal action). The
bar carries its own backdrop (`rgba(11,11,13,.72)` + 12px blur) so scrolling
content never collides with it. Clicking a pinned act lands it at the END of
its pin (unlocked), not the empty phase-0 stage. The name always goes home.
All programmatic scrolls go through Lenis via `scrollToY` / `getLenis` — a raw
`window.scrollTo` is reverted on Lenis's next frame.

**Post-critique hardening (23/40 baseline, 2026-07-24).** Conversion: resume
PDF in `/public` linked from nav + Contact; hero leads with positioning
("Sophomore at the University of Akron, seeking 2027 internships"); OG/Twitter
tags + favicon for the LinkedIn unfurl; title/desc em-dash-free. Time-to-value:
Fleet Team collapsed 3 panels → 1; a `SkipPin` "skip ↓" affordance on every
pinned act; experience counters keep their value on revisit (no zero-replay).
Mobile: all cinematic acts + experience un-pin below `md` (`disableOnMobile` in
`usePinnedPhases`, `staticLayout`), so no 100svh clipping or captive thumb-
scroll. A11y: `Beat` hidden state uses `visibility: hidden` (removes controls
from tab order) + `aria-hidden`. Macro no longer overrides the user's chosen
scenario on re-entry (one-time handoff ref).
8. **ARIA** (`src/acts/aria`) — the crescendo. Aperture-iris entrance (black,
   violet point, circle blooms open). The visitor's scroll assembles the mark
   (shutter bloom; the violet ring snaps in last), and **the founder story is
   scroll-choreographed too**: after the ring locks, the text cascades in line
   by line (rise + blur-clear, GSAP-scrubbed `.aria-line` stagger in the same
   pinned timeline; pin length 260%). Nothing in the act is on a timer; the
   scrollbar is the timeline.
   The object is environment-lit polished metal (procedural Lightformer studio,
   no HDRI fetch) with an anodized-violet ring. Once assembled it hangs with a
   bounded sway and float, **never a full rotation** (an extruded logo edge-on
   reads as a cardboard cutout), plus cursor parallax. Founder story staggers
   in on lock. Lazy-loaded R3F; flat brand SVG when WebGL is missing; plain
   readable section under reduced motion.
10. **Contact** — internship-seeking statement, email + LinkedIn.
11. **`/dcf`** — full instrument (projection table now; editable inputs + WACC
   sensitivity next).

## 8. DCF spec (see `src/lib/dcf.ts`)

Hero sliders: growth 0–50% (12), margin 1–60% (22), WACC 4–25% (10), TGR 0–5%
(2.5). Held constant (editable on `/dcf` later): base rev $500M, D&A 4%, capex
5%, ΔNWC 2%, tax 21%, net debt $200M, shares 100M.

Per year (1–5): `rev = rev0·(1+g)^y`; `ebitda = rev·margin`; `ebit = ebitda − D&A`;
`nopat = ebit·(1−tax)`; `fcf = nopat + D&A − capex − ΔNWC`; `pv = fcf/(1+wacc)^y`.
`TV = fcf₅·(1+tgr)/(wacc−tgr)`; `pvTV = TV/(1+wacc)^5`. **EV = Σpv + pvTV;
Equity = EV − netDebt; Intrinsic = Equity/shares.** Guarded when `wacc ≤ tgr`.

Chart: 5-year bars, FCF solid + PV outline, monochrome, self-draws then updates
live.

## 9. Anti-slop contract (non-negotiable)

Every component is held to these. Derived from the Impeccable brand register.

1. No font from the reflex-reject list; mono only on real data.
2. No em-dashes anywhere in copy. No cute or voicey lines. No tag pills. No
   per-section uppercase tracked eyebrows; no `01/02/03` as scaffolding.
3. No editorial-cover fingerprint (ruled columns + italic serif + mono metadata).
4. Every project surface ships a **real** visual (screenshot / live embed) — a
   dashed "asset pending" frame is the only allowed placeholder, never a colored
   block posing as finished.
5. Metrics live in authored context, not a big-number hero grid. Projects are
   asymmetric authored blocks, not an identical card grid.
6. Motion is per-element intentional; every animation has a reduced-motion path.
7. Grain via a raster/SVG-noise tile, faint; no decorative CSS grid overlays.
8. No gradient text, side-stripe borders, glassmorphism-by-default, ghost-cards
   (1px border + big shadow), or card radius ≥ 24px.
9. Second-order check per section: could someone guess "finance portfolio → dark
   mono editorial" from it? If yes, differentiate.

## 10. Stack

React 18 + Vite + TypeScript + Tailwind. `gsap` + ScrollTrigger (pinned acts),
`lenis` (smooth scroll, drives ScrollTrigger via the GSAP ticker), `three` +
`@react-three/fiber` + `three-stdlib` (contour field, ARIA act), `d3` (model
chart), `motion` (micro-interactions), `react-router-dom` (`/dcf`).
Conventions: functional components, TS-first, named exports, `lowercase-dashes`
folders, early returns.

## 11. Open / TODO

- All project copy is now real. Remaining content: none owed.
- Roles/metrics for Mont Granite, Speranza Resources, Validom LLC panels.
- Macro act: swap the dated snapshot for live FRED at deploy (key + serverless fn).
- `/dcf`: editable secondary inputs + WACC × TGR sensitivity grid.
- Optional: magnetic CTA hover; page-wipe route transitions.
- Contact email confirmed (rdgoggle@gmail.com); LinkedIn linked; no GitHub.
