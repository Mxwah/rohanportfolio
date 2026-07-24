import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "../../lib/useReducedMotion";

gsap.registerPlugin(ScrollTrigger);

// The ARIA act, the site's crescendo, fully scroll-choreographed. Entrance is
// an aperture iris: black, a violet point, then the circle blooms open. The
// visitor's scroll then assembles the mark (shutter bloom, ring locks last),
// and in the final stretch of the pin the founder story cascades in line by
// line, each one rising and clearing as the scroll advances. Nothing in this
// act is on a timer; the scrollbar is the timeline.
//
// The 3D scene is lazy-loaded so three.js and R3F never touch the initial
// bundle; its render loop only runs while the act is on screen. If WebGL is
// unavailable the flat brand SVG stands in and the text choreography still
// plays. Reduced motion skips the pin, the iris, and the assembly entirely
// and shows the settled composition as a plain readable section.

const AriaScene = lazy(() => import("./AriaScene"));

function hasWebgl(): boolean {
  try {
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") ?? c.getContext("webgl"));
  } catch {
    return false;
  }
}

const DETAIL_LINES = [
  "Authored the governing constitution and bylaws.",
  "Designed the brand identity system and built the public website.",
  "Built the 9-month operating plan, including a partnership initiative with the City of Akron and Summit County Mayor's Office.",
  "Assembled the executive board ahead of the first semester.",
];

// In scrub mode every item carries the aria-line class and GSAP owns its
// entrance from the pinned timeline. In static mode (reduced motion) the
// composition renders plainly, fully visible.
function AriaInfo({ scrub }: { scrub: boolean }) {
  const cls = scrub ? "aria-line" : "";
  return (
    <div className="flex max-w-2xl flex-col items-center text-center">
      <img src="/aria/ARIA_wordmark_white_transparent.svg" alt="ARIA" className={`h-9 ${cls}`} />
      <div className={`mt-3 font-mono text-[11px] tracking-[0.22em] text-ink-2 ${cls}`}>
        APPLIED REASONING &amp; INNOVATION AKRON
      </div>
      <div className={`mt-2 text-[15px] italic text-ink-2 ${cls}`}>the tomorrow of today.</div>

      <div className={`mt-7 flex flex-col items-center ${cls}`}>
        <div className="font-mono text-[12px] text-ink-3">Founder</div>
        <p className="mt-2 text-lg text-ink">
          <span
            className="font-display text-[clamp(2rem,4.5vw,3rem)] font-extrabold tracking-tight"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            19
          </span>
          <span className="ml-3 text-ink-2">
            charter members recruited ahead of the Fall 2026 launch, nearly double the university
            minimum.
          </span>
        </p>
      </div>

      <ul className="mt-6 flex flex-col gap-2">
        {DETAIL_LINES.map((line) => (
          <li key={line} className={`text-[13px] leading-relaxed text-ink-2 ${cls}`}>
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FlatMark({ className }: { className?: string }) {
  // ARIA_mark_dark.svg is the brand's own dark-background variant: white blades
  // with the violet ring. Exactly right as the non-WebGL and loading stand-in.
  return <img src="/aria/ARIA_mark_dark.svg" alt="ARIA mark" className={className} />;
}

export function AriaAct() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const irisRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const reduced = useReducedMotion();
  const [load, setLoad] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const [webgl] = useState(hasWebgl);

  // Mount the heavy scene well before the act is visible.
  useEffect(() => {
    if (reduced) {
      setLoad(true);
      return;
    }
    const section = sectionRef.current;
    if (!section) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setLoad(true);
          io.disconnect();
        }
      },
      { rootMargin: "150% 0px" },
    );
    io.observe(section);
    return () => io.disconnect();
  }, [reduced]);

  useLayoutEffect(() => {
    if (reduced) return;
    const section = sectionRef.current;
    const stage = stageRef.current;
    const iris = irisRef.current;
    const dot = dotRef.current;
    if (!section || !stage || !iris || !dot) return;

    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(section);
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          // Functional pixel end: "%" strings resolve against the trigger's
          // height including the pin spacer and compound on every refresh.
          end: () => `+=${Math.round(2.6 * window.innerHeight)}`,
          scrub: 0.5,
          pin: stage,
          anticipatePin: 1,
          onToggle: (self) => setOnScreen(self.isActive),
          onUpdate: (self) => {
            // The scroll owns the assembly: iris opens over 0.08 to 0.38 of
            // the pin, the shutter bloom runs 0.08 to 0.58, the ring locks
            // just before the text begins.
            progressRef.current = Math.min(1, Math.max(0, (self.progress - 0.08) / 0.5));
          },
        },
      });

      // The aperture point appears, then the iris blooms open through it.
      tl.fromTo(dot, { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.08, ease: "none" }, 0)
        .fromTo(
          iris,
          { clipPath: "circle(0.4% at 50% 50%)" },
          { clipPath: "circle(75% at 50% 50%)", duration: 0.3, ease: "none" },
          0.08,
        )
        .to(dot, { autoAlpha: 0, duration: 0.05, ease: "none" }, 0.12)
        // The founder story cascades in under scroll control after the ring
        // locks: each line rises and clears in sequence.
        .fromTo(
          q(".aria-line"),
          { autoAlpha: 0, y: 26, filter: "blur(5px)" },
          {
            autoAlpha: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.12,
            stagger: 0.045,
            ease: "power2.out",
          },
          0.55,
        )
        .to({}, { duration: 0.02 }); // settle beat at the end of the pin
    }, section);

    return () => ctx.revert();
  }, [reduced]);

  if (reduced) {
    return (
      <section
        id="aria"
        className="mx-auto flex min-h-[100svh] max-w-shell flex-col items-center justify-center gap-8 px-6 py-24 sm:px-8"
      >
        <FlatMark className="h-36 w-36" />
        <AriaInfo scrub={false} />
      </section>
    );
  }

  return (
    <section ref={sectionRef} id="aria" className="relative">
      <div ref={stageRef} className="relative h-[100svh] overflow-hidden bg-bg">
        <div
          ref={irisRef}
          className="absolute inset-0 flex flex-col items-center justify-center px-6"
          style={{ clipPath: "circle(0.4% at 50% 50%)", willChange: "clip-path" }}
        >
          <div className="relative h-[44svh] w-full max-w-3xl">
            {/* Faint display-case glow that seats the object in space. */}
            <div
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 h-[64vmin] w-[64vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0) 62%)",
              }}
            />
            {webgl && load ? (
              <Suspense
                fallback={
                  <div className="flex h-full items-center justify-center">
                    <FlatMark className="h-32 w-32 opacity-80" />
                  </div>
                }
              >
                <AriaScene progressRef={progressRef} running={onScreen} onAssembled={() => {}} />
              </Suspense>
            ) : (
              <div className="flex h-full items-center justify-center">
                <FlatMark className="h-32 w-32" />
              </div>
            )}
          </div>
          <AriaInfo scrub />
        </div>

        <div
          ref={dotRef}
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: "#6d3af2", opacity: 0 }}
        />
      </div>
    </section>
  );
}
