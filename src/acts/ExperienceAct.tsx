import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import gsap from "gsap";
import { useReducedMotion } from "../lib/useReducedMotion";
import { skipPastPin } from "../lib/usePinnedPhases";
import { SkipPin } from "../components/ui/SkipPin";

gsap.registerPlugin(ScrollTrigger);

// Experience as a pinned, scroll-driven sequence. Each role is composed as a
// full-screen spread, not a stacked readout: a hairline with the role up top,
// the company name set huge in the display face, and the metric seated on a
// baseline rule at the bottom with its context beside it, the way a number
// sits on a line in financial print. The number counts up in the display face
// (tabular figures) as its panel arrives.
//
// Under reduced motion it collapses to a plain stacked list, fully readable
// with no pinning and no count-up.

export interface Panel {
  org: string;
  role?: string;
  prefix?: string;
  value?: number;
  suffix?: string;
  comma?: boolean;
  decimals?: number;
  context: string;
  placeholder?: boolean;
}

// Real numbers from the August 2026 resume, concised to the critical fact.
// Education lives in its own section (src/components/sections/Education.tsx).
// One panel per role: a recruiter's scroll budget is the scarcest resource on
// the page, so Fleet Team's five metrics share one composed spread.
const PANELS: Panel[] = [
  { org: "Fleet Team", role: "Account Management Intern, May–Aug 2026", prefix: "$", value: 61, suffix: "K", context: "in client savings across 103 accounts, alongside 2,200 accounts mapped into 3 automated tools (2 hrs to 20 sec), 240 accounts bridged by a custom SQL query, a preventative-maintenance overhaul cutting costs 16.3%, and a RACI matrix cutting weekly info requests from 20+ to 3." },
  { org: "Mont Granite", role: "Summer Intern, 2023 and 2025", value: 80, suffix: "%", context: "support-delay reduction from Synthesis GPT, an internal AI assistant I built, used by 10+ staff." },
  { org: "Speranza Resources", role: "Procurement Intern, 6-day Brazil buying trip", value: 52, suffix: "%", context: "bundle price reduction supported in factory negotiations, $13.50 down to $6.50 per square foot." },
  { org: "Validom LLC", role: "Founder, 2020 to 2022", prefix: "$", value: 9, suffix: "K+", context: "revenue in 4 months from a global gaming and apparel brand, 80+ members across 4 continents." },
];

function Counter({
  value,
  comma,
  decimals,
  active,
}: {
  value: number;
  comma?: boolean;
  decimals?: number;
  active: boolean;
}) {
  const reduced = useReducedMotion();
  const [n, setN] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    // Once played, a counter keeps its value; replaying from zero on every
    // revisit reads as a glitch, not a delight.
    if (!active) return;
    if (reduced) {
      setN(value);
      return;
    }
    const start = performance.now();
    const dur = 750;
    cancelAnimationFrame(raf.current);
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setN(value * eased);
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [active, value, reduced]);

  if (decimals) return <span>{n.toFixed(decimals)}</span>;
  const rounded = Math.round(n);
  return <span>{comma ? rounded.toLocaleString() : rounded}</span>;
}

// The composed spread, shared by the pinned and reduced-motion layouts, and
// reused by the standalone Education section so the whole resume speaks one
// typographic language.
export function PanelSpread({ p, active }: { p: Panel; active: boolean }) {
  return (
    <div>
      <div className="border-t border-line pt-4">
        <span className="font-mono text-[12px] text-ink-3">{p.role ?? "Experience"}</span>
      </div>

      <h3 className="mt-5 font-display text-[clamp(2.6rem,7.5vw,5.75rem)] font-extrabold leading-[0.94] tracking-tight text-ink">
        {p.org}
      </h3>

      {!p.placeholder && p.value !== undefined ? (
        <div className="mt-8 flex flex-col gap-4 border-b border-line pb-3 sm:mt-10 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
          <div
            className="font-display text-[clamp(4rem,14vw,10.5rem)] font-extrabold leading-[0.85] tracking-tight text-ink"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {p.prefix ? (
              <span className="inline-block align-top text-[0.42em] leading-none text-ink-2">{p.prefix}</span>
            ) : null}
            <Counter value={p.value} comma={p.comma} decimals={p.decimals} active={active} />
            {p.suffix ? <span className="text-[0.42em] text-ink-2">{p.suffix}</span> : null}
          </div>
          <p className="max-w-[300px] pb-2 text-[15px] leading-relaxed text-ink-2 sm:text-right">
            {p.context}
          </p>
        </div>
      ) : (
        <div className="mt-8 border-b border-line pb-4 sm:mt-10">
          <p className="max-w-md text-lg text-ink-2">{p.context}</p>
        </div>
      )}
    </div>
  );
}

export function ExperienceAct() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);
  const [entered, setEntered] = useState(false);
  const [staticLayout, setStaticLayout] = useState(false);

  useLayoutEffect(() => {
    // Pinned caption choreography on a thumb-scrolled phone is fatigue, not
    // cinema: below md, and under reduced motion, collapse to a plain list.
    const mobileOff = window.matchMedia("(max-width: 767px)").matches;
    if (reduced || mobileOff) {
      setStaticLayout(true);
      return;
    }
    setStaticLayout(false);

    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;

    const st = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      // Functional pixel end, recomputed from the VIEWPORT on refresh. Never
      // a "%" string here: those resolve against the trigger's height, which
      // includes the pin spacer, so every refresh compounds the length until
      // the page is tens of thousands of pixels tall.
      end: () => `+=${Math.round(PANELS.length * 0.85 * window.innerHeight)}`,
      pin: stage,
      anticipatePin: 1,
      onEnter: () => setEntered(true),
      onUpdate: (self) => {
        const idx = Math.min(PANELS.length - 1, Math.floor(self.progress * PANELS.length));
        setActive((prev) => (prev === idx ? prev : idx));
      },
    });

    return () => st.kill();
  }, [reduced]);

  if (staticLayout) {
    return (
      <section id="experience" className="mx-auto max-w-shell px-6 py-24 sm:px-8">
        <ul className="flex flex-col gap-20">
          {PANELS.map((p, i) => (
            <li key={i}>
              <PanelSpread p={p} active />
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section ref={sectionRef} id="experience" className="relative">
      <div ref={stageRef} className="relative flex h-[100svh] items-center overflow-hidden">
        <SkipPin onSkip={() => skipPastPin(sectionRef.current)} show={entered} />
        {/* Legibility scrim behind the spreads: a soft dark ellipse where the
            text lives, so numbers and context always read over the river. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 90% 70% at 42% 50%, rgba(11,11,13,0.8) 0%, rgba(11,11,13,0.3) 55%, rgba(11,11,13,0) 78%)",
          }}
        />
        <div className="relative mx-auto w-full max-w-shell px-6 sm:px-8">
          {PANELS.map((p, i) => {
            const isActive = entered && i === active;
            return (
              <div
                key={i}
                className="absolute inset-x-6 top-1/2 sm:inset-x-8"
                style={{
                  transform: `translateY(-50%) translateY(${isActive ? "0px" : "26px"})`,
                  opacity: isActive ? 1 : 0,
                  pointerEvents: isActive ? "auto" : "none",
                  transition: "opacity 520ms var(--ease-out), transform 520ms var(--ease-out)",
                  willChange: "transform, opacity",
                }}
              >
                <PanelSpread p={p} active={isActive} />
              </div>
            );
          })}
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-5 top-1/2 flex -translate-y-1/2 flex-col gap-2 sm:right-8"
        >
          {PANELS.map((_, i) => (
            <span
              key={i}
              className="block w-[2px] rounded-full"
              style={{
                height: i === active ? 24 : 8,
                background: i === active ? "var(--text)" : "var(--border-strong)",
                transition: "height 300ms var(--ease-out), background 300ms var(--ease-out)",
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
