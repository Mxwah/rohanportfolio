---
target: whole site (Home)
total_score: 23
p0_count: 2
p1_count: 2
timestamp: 2026-07-24T01-38-23Z
slug: src-pages-home-tsx
---
Method: dual-agent (A: design review sub-agent · B: detector sub-agent)

# Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Live readouts and progress dots good; nothing signals how long a pin lasts or how much page remains |
| 2 | Match System / Real World | 3 | DCF/macro vocabulary right for audience; WACC error message done well |
| 3 | User Control and Freedom | 1 | ~14.5 screens of captive pinned scroll, zero skip affordance; Macro force-resets user's chosen scenario |
| 4 | Consistency and Standards | 2 | One Slider/one token file good; but 3 h2 scales for peer sections, h1-to-h3 heading skips, 5 of 8 nav items vanish below md with no menu |
| 5 | Error Prevention | 3 | WACC<=TGR guarded, sliders bounded |
| 6 | Recognition Rather Than Recall | 2 | Lesson captions vanish permanently; fast scrollers never learn what the wedge meant |
| 7 | Flexibility and Efficiency | 1 | No fast path for the recruiter: no resume, no skip-pin, /dcf behind one 13px link |
| 8 | Aesthetic and Minimalist Design | 3 | Disciplined monochrome system; docked for five pins of ceremony around ~1 resume page of content |
| 9 | Error Recovery | 3 | Senior-level failure engineering: reduced-motion, WebGL fallbacks, intro failsafe |
| 10 | Help and Documentation | 2 | Assumptions-on-the-face is right; pins arrive unexplained |
| **Total** | | **23/40** | **Acceptable band; engineering scores high, respect-for-visitor-time scores low** |

# Anti-Patterns Verdict

LLM assessment: first-order clean, second-order half-escaped. "Finance portfolio -> terminal-dark monochrome + particle hero" is itself a saturated lane; the site transcends it exactly where the spectacle is semantic (river = live FCF curve; shutter-bloom ARIA) and relapses where it templates: the three lesson acts are an identical act grid (same h2/tabs/caption/chart/hairline/stats/sliders skeleton x3), the simulator captions use the AI-tell rule-of-three anaphora, mono is used as costume on prose in 4 spots (role lines, Founder label, Mont AI honesty line via .tnum), and the em-dash ban was violated in the site title tag itself (fixed during this run: title and meta description now dash-free).

Deterministic scan: 1 finding total across the entire src tree (layout-transition warning, ExperienceAct.tsx:214, the 2px progress rail height animation; true positive, trivial impact). Zero em-dashes in .tsx, zero gradient text, zero ghost cards, zero stripe/grid backgrounds. The grep sweep confirms the 8 uppercase tracking-wide instances are all the same data-readout label component (sanctioned instrument pattern), not per-section eyebrows. Detector and reviewer agree: the codebase is unusually clean at markup level; the real findings are structural/UX, invisible to static analysis.

Browser overlays: skipped (embedded pane visibility:hidden this session; no reliable overlay possible).

# Overall Impression

A genuinely authored spectacle wrapped around a conversion dead-end. The hero and ARIA act are portfolio-grade craft with meaning; the middle is a beautiful template repeated three times; and the site's terminal action - a recruiter forwarding a resume - is impossible because there is no resume. 42,000 particles made the cut; the PDF did not.

# What's Working

1. The spectacle is semantic: river course = live FCF curve, per-act river moods, the ARIA drink - one continuous system, not stacked effects.
2. Failure engineering is senior-level: reduced-motion static layouts everywhere, WebGL fallbacks, intro failsafe, functional pixel pin ends. The "ships real product" claim is substantiated in the code.
3. A real enforced design system: one Slider, one Beat, one PanelSpread, tokens mirroring DESIGN.md.

# Priority Issues

[P0] Transparent fixed nav collided with content - FIXED during this run (rgba(11,11,13,.72) + 12px blur backdrop). Was: every section scrolled through the links illegibly.

[P0] No resume anywhere on a recruiting site. The terminal recruiter action (forward the PDF) is impossible; 23 screens funnel to a mailto. Fix: "Resume" as permanent nav item + first-class button in Contact. Suggested: $impeccable shape (resume + contact conversion block).

[P1] Recruiter time-to-value / pin fatigue: ~14.5 captive screens across 5 pins, no skip affordance, anchors teleport into phase-0 pins. Fix: collapse Fleet Team 3 panels to 1 (Experience 5.1 -> ~2.6 screens); quiet "skip" affordance during pins; anchor jumps land acts in unlocked state. Suggested: $impeccable distill.

[P1] Mobile: 100svh overflow-hidden stages risk clipping sliders on small phones; Model/Simulator/Macro/Mont AI missing from mobile nav with no menu; 18k particles + bloom on phone GPUs. Suggested: $impeccable adapt.

[P2] Keyboard focus lands on invisible controls (Beat hides via opacity+pointer-events only; needs visibility/inert). No OG/Twitter meta, no favicon: LinkedIn unfurl - the site's real first impression - is a bare link. Suggested: $impeccable harden.

# Persona Red Flags

Jordan (recruiter, desktop, 60s): hero never says sophomore / U Akron / seeking 2027 internships (positioning lives at screen ~23); Experience pin swallows the scroll at 40s; if they find Contact: a gmail address, no resume. Leaves knowing the name and that the site is fancy; nothing to forward.

Casey (phone, 45s): Simulator/Macro/Mont AI don't exist in mobile nav; lesson stages risk clipping sliders below the 100svh fold; bloom pipeline heats the phone. Bounces mid-pin; the product evidence was never reachable.

Sam (a11y): reduced-motion version is best-in-class (unpinned, fully readable). Keyboard version: tabs into invisible pre-unlock controls; heading outline jumps h1->h3. Canvas/SVG aria labels done right.

# Minor Observations

- Intro replays on every load (no sessionStorage); by visit three it's a toll booth.
- MacroAct force-resets the user's chosen scenario to oil shock on re-entry (instrument overrides its owner).
- Leadership "60 applicants" reads inverted: 60 is the pool, not the achievement ("1 of 12" works).
- Grain layer z-index sits under all positioned content; mostly decorating empty background.
- Experience counters replay from 0 on revisit; second viewing reads as glitch.
- River runs full 42k bloom pipeline at alpha 0.18 through the whole middle of the page; only ARIA parks it.
- MontAi lives in components/sections/ while siblings live in acts/.
- No 404 route.
- Mono-as-costume on prose in 4 spots (role lines, Founder label, Mont AI honesty line).

# Questions to Consider

1. If the thesis is "he ships real product," why is the only artifact a recruiter can ship onward - the resume PDF - the one thing the site doesn't have?
2. The river's course is the site's central idea and nothing ever tells the visitor. If the signature is illegible to everyone but its author, is it a signature or a private joke?
3. Would this site survive being opened live during a phone screen? "Walk me through Speranza" currently costs fifteen screens of theater while a human waits.
