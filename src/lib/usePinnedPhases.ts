import { useCallback, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "./useReducedMotion";
import { getLenis } from "./useSmoothScroll";

// Scroll to an absolute Y position through Lenis when it is running, so the
// jump is not reverted on Lenis's next frame; native smooth otherwise.
export function scrollToY(y: number): void {
  const top = Math.max(0, Math.round(y));
  const lenis = getLenis();
  if (lenis) lenis.scrollTo(top, { duration: 0.9 });
  else window.scrollTo({ top, behavior: "smooth" });
}

gsap.registerPlugin(ScrollTrigger);

// The shared engine for cinematic acts: pin a stage for a given number of
// screens and advance a phase counter as scroll progress crosses thresholds.
// Phases fire ONCE per crossing (triggered, not scrubbed) so captions are
// never caught half-faded mid-read; acts that want a scrubbed stretch (the
// macro act's oil shock) hook the raw progress via onProgress.
//
// Ends are functional pixel values, never "%" strings: percentage ends
// resolve against the trigger's height including the pin spacer and compound
// on every refresh until the page is tens of thousands of pixels tall
// (learned the hard way; see DESIGN.md).
//
// staticLayout is true under reduced motion AND (when disableOnMobile is set)
// on phones: no pin, phase snaps to final, everything simply visible. Pinned
// caption choreography on a thumb-scrolled phone is fatigue, not cinema.

export function skipPastPin(section: HTMLElement | null): void {
  if (!section) return;
  const rect = section.getBoundingClientRect();
  scrollToY(window.scrollY + rect.bottom - window.innerHeight + 2);
}

export function usePinnedPhases(opts: {
  screens: number;
  thresholds: number[];
  disableOnMobile?: boolean;
  onProgress?: (progress: number) => void;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const maxPhase = opts.thresholds.length;
  const [phase, setPhase] = useState(0);
  const [staticLayout, setStaticLayout] = useState(false);
  const progressRef = useRef(0);
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const skip = useCallback(() => skipPastPin(sectionRef.current), []);

  useLayoutEffect(() => {
    const mobileOff =
      Boolean(optsRef.current.disableOnMobile) &&
      window.matchMedia("(max-width: 767px)").matches;

    if (reduced || mobileOff) {
      setPhase(maxPhase);
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
      end: () => `+=${Math.round(optsRef.current.screens * window.innerHeight)}`,
      pin: stage,
      anticipatePin: 1,
      onUpdate: (self) => {
        progressRef.current = self.progress;
        let ph = 0;
        for (const t of optsRef.current.thresholds) if (self.progress >= t) ph++;
        setPhase((p) => (p === ph ? p : ph));
        optsRef.current.onProgress?.(self.progress);
      },
    });

    return () => st.kill();
  }, [reduced, maxPhase]);

  return { sectionRef, stageRef, phase, reduced, staticLayout, progressRef, skip };
}
