# Re-architecture: engulfing acts

Date: 2026-07-23. Status: proposed, awaiting approval before implementation.
Supersedes the stacked-sections layout of the first prototype. Reference:
`DESIGN.md` (source of truth) is updated from this once approved.

## Goal

Turn the site from one scrolling page of stacked sections into a sequence of
full-viewport "acts." Each act owns the whole screen, has its own entrance, and
you scroll into and out of it. The motion reads as craft, not decoration: the
functional financial model stays instant, and the cinematic weight lives in the
transitions between acts (Emil Kowalski's principle: a functional financial graph
should not have decorative lag).

## Slop rules (hard, site-wide)

1. No em-dashes anywhere. Periods, commas, or restructure.
2. No voicey or cute copy. Plain and factual. (The "paying rent" line is removed.)
3. No tag pills, no `01 / 02` section numbering, no dense paragraph blocks.
4. Metrics are a big number plus 3 to 5 words of context, never a paragraph.
5. Every project surface ships a real visual or an honest "asset pending" frame.

## The acts (in order)

1. **Opening scene.** Only the name on screen. Style: "plotted / typed in." The
   name draws itself left to right as if the system is plotting it, monochrome.
   As it lands, the contour field forms behind and the act hands off to the DCF.
   Roughly 1.6s, skippable, instant under reduced motion.
2. **The DCF.** The live 4-slider model, full viewport, the centerpiece. Sliders
   stay instant. Chart self-draws once on entry, updates live on drag.
3. **Experience.** Cinematic pinned. As you scroll, each role's biggest number
   engulfs the screen one at a time with tight context, then gives way to the
   next. Roles: Fleet Team (real metrics), Mont Granite, Speranza Resources,
   Validom LLC (placeholders).
4. **Portfolio Simulator.** Full viewport, live and moving, its own interactive
   world. Placeholder copy and behavior until real build.
5. **Macro (LRAS / AD).** Scroll down from the simulator into the next
   full-screen live graph. Shifts on monthly FRED data (cached). Placeholder
   until data is wired.
6. **ARIA.** The 3D moment. Rohan supplies a logo or GLB. The mark falls into its
   space with a spring settle, then the information staggers in. Scaffolded now
   with a placeholder mark, real asset dropped in when it arrives.
7. **Mont AI.** Full-viewport act, placeholder copy.
8. **Contact.** Closing statement, email, links.

Order note: finance credibility (DCF, simulator, macro) leads; ARIA is the
crescendo 3D showpiece. Easily reordered if Rohan wants the flagship earlier.

## Experience content

Big number plus short context. Real numbers are from Fleet Team; other roles are
placeholders Rohan will fill.

- Fleet Team, Account Management Intern:
  - `$46K` saved. 103 accounts reconciled.
  - `2,200` accounts mapped. 3 Salesforce maps.
  - `260+` SKUs automated. Python matching tool.
  - (also available: 240 accounts SQL-bridged, ~100 supplier MSAs)
- Mont Granite, Summer Intern: placeholder metric plus context.
- Speranza Resources: placeholder role, metric, context.
- Validom LLC: placeholder role, metric, context.

## Motion system (Emil-grounded)

Easing (stronger than CSS defaults):

- `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` for entrances, reveals, count-ups.
- `--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)` for on-screen movement, wipes.
- `--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)` for pinned scene progress.

Durations: button press 100 to 160ms, micro 125 to 200ms, reveals 200 to 500ms,
scene transitions can be longer. Nothing functional exceeds ~300ms.

Rules:

- Entrances use ease-out and start from `scale(0.95)` plus opacity, never
  `scale(0)`.
- Text reveals use `clip-path` inset wipes with a brief 2px blur that clears as
  the text lands.
- The ARIA drop uses a spring settle (`{ duration: 0.5, bounce: 0.2 }`), then
  info staggers at 40 to 60ms intervals.
- Stagger between sibling items is 30 to 80ms.
- The DCF sliders and readouts have no decorative lag. Count-up is subtle and
  fast.
- Reduced motion: reveals become quiet fades, 3D and contour freeze to a still
  frame, count-ups snap, scroll-snap still functions.

## Technical approach

- **Scroll choreography:** GSAP + ScrollTrigger (free), driving the pinned acts,
  integrated with Lenis for inertia. ScrollTrigger owns pinning and scene
  progress; Lenis owns smooth scroll.
- **3D:** React Three Fiber plus drei for the ARIA scene and, optionally, a
  migration of the contour field. Lazy-loaded, DPR capped, paused offscreen and
  under reduced motion, with a static fallback.
- **Micro-interactions:** CSS transitions and WAAPI (off main thread, hardware
  accelerated, interruptible) per Emil's performance rules. `motion` retained
  only where a React-driven interruptible spring is clearly better.
- **Structure:** each act is its own component under `src/acts/`, with one clear
  purpose and a well-defined prop interface, registered in a single scroll
  timeline. This keeps each act understandable and testable on its own.

## New dependencies

`gsap` (includes ScrollTrigger), `@react-three/fiber`, `@react-three/drei`.
Retain: `three`, `d3`, `lenis`. Re-evaluate `motion` and `react-router-dom`
(the acts are one long scroll; the full `/dcf` page may become an act or stay a
route).

## Open items (needed from Rohan)

- ARIA logo or GLB asset.
- Real copy: bio line, all project descriptions, roles and metrics for Mont
  Granite, Speranza Resources, Validom LLC.
- Project visuals for the non-3D projects.
- Public email confirmation, GitHub and LinkedIn URLs.
- FRED wiring decision for the macro act.

## Build order (once approved)

1. Convert the shell to the pinned-acts scaffold (GSAP + Lenis timeline).
2. Opening plotted-name scene.
3. Reflow the existing DCF into act 2.
4. Experience pinned number sequence with the new roles.
5. Portfolio Simulator and Macro act shells (live behavior iterated after).
6. ARIA 3D scaffold (placeholder mark), swap real asset on delivery.
7. Mont AI and Contact acts.
8. Update `DESIGN.md` with the new tokens, motion system, and slop rules.
