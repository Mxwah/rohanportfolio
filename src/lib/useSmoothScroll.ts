import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "./useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

// The active Lenis instance, exposed so nav jumps and pin-skips can scroll
// THROUGH Lenis. A raw window.scrollTo gets reverted on Lenis's next frame,
// because Lenis re-applies its own target every tick. Null under reduced
// motion (no Lenis) and before mount; callers fall back to window.scrollTo.
let lenisInstance: Lenis | null = null;
export function getLenis(): Lenis | null {
  return lenisInstance;
}

// One place that wires inertia scroll to the animation timeline. Lenis drives the
// smooth scroll; GSAP's ticker drives Lenis; every ScrollTrigger updates off the
// same loop so pinned scenes stay perfectly in sync with the scroll position.
// Under reduced motion we skip Lenis entirely and let ScrollTrigger read native
// scroll, so pinned content still resolves without any smoothing.
export function useSmoothScroll(): void {
  const reduced = useReducedMotion();

  useEffect(() => {
    // Re-measure all pins once the page is genuinely ready. The initial
    // refresh can catch stages mid-layout (lazy chunks, fonts, background
    // tabs) and lock pins at zero size; and ScrollTrigger's own resize
    // re-refresh is rAF-debounced, so throttled tabs never recover on their
    // own. Direct refresh() calls are synchronous and immune to both.
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    const t1 = window.setTimeout(refresh, 800);
    const t2 = window.setTimeout(refresh, 2400);
    document.fonts?.ready.then(refresh).catch(() => {});

    const cleanupRefresh = () => {
      window.removeEventListener("load", refresh);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };

    if (reduced) {
      ScrollTrigger.refresh();
      return cleanupRefresh;
    }

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });
    lenisInstance = lenis;

    lenis.on("scroll", ScrollTrigger.update);

    const onTick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    ScrollTrigger.refresh();

    return () => {
      cleanupRefresh();
      gsap.ticker.remove(onTick);
      lenis.destroy();
      lenisInstance = null;
    };
  }, [reduced]);
}
