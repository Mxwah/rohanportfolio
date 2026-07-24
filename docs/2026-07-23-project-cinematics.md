# Project cinematics: full walkthroughs

Date: 2026-07-23. Approved by Rohan (option A, full cinematic for all three).

Each instrument act (Simulator, Macro, Mont AI) pins for ~2.0 to 2.4 screens.
Scroll advances a phase machine; each phase fires a caption beat while the live
instrument demonstrates that lesson itself. The final phase unlocks the
controls and releases the pin. The instruments teach themselves before they
hand over the keys.

Shared machinery:
- `src/lib/usePinnedPhases.ts` — pin (functional pixel end, never "%"), phase
  thresholds, optional per-frame progress callback for scrubbed stretches.
- `src/components/ui/Beat.tsx` — the caption/control crossfade primitive.
- Reduced motion: no pin, phase snaps to final, everything visible, no
  captions. Same fallback contract as every other act.

## Simulator (2.4 screens, thresholds .14 / .40 / .64 / .86)
1. Title + hook alone over an empty grid.
2. "This is you: $10,000 plus $500 a month." Contributions-only dashed line.
3. "This is compounding." The average line lifts; the wedge between it and
   the contributions line fills. That wedge IS compounding, and it stays
   permanently (new reference line kept after the lesson).
4. "This is the market's mood." The bear/bull fan spreads (all-three view).
5. Controls, stats, tabs fade up. Default scenario is now "All three".

## Macro (2.4 screens, thresholds .14 / .34 / .54 / .86)
1. Title + hook over empty axes.
2. "Three curves run the economy." AD, SRAS, LRAS draw in sequence.
3. "Equilibrium is where they agree." The dot pops in with its guides.
4. "Now close the Strait of Hormuz." SCRUBBED: progress .58 to .82 drags SRAS
   left to s = -14; the dot slides into stagflation under the visitor's own
   scroll. Handoff keeps the oil shock active with its tab lit.
5. Tabs, sliders, readouts, US strip fade up.

## Mont AI (2.0 screens, thresholds .15 / .38 / .62 / .86)
1. Title + kind line.
2. "The ERP holds everything." ERP node alone.
3. "An agent sits inside it." Core connects, first pulses flow.
4. "It gives hours back." Lanes connect in sequence, presales lane brightens,
   the 3 hrs stat reveals.
5. Honesty line fades up, release.
