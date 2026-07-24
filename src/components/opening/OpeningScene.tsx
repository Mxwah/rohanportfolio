import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useReducedMotion } from "../../lib/useReducedMotion";

// The opening act: nothing on screen but the name, which plots itself in left to
// right (a clip-path wipe with a travelling caret and a blur that clears as the
// letters land), then hands off to the page beneath. Plays once, is skippable
// with a click, scroll, or key, and snaps instantly under reduced motion.

export function OpeningScene({ onFinish }: { onFinish: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const [gone, setGone] = useState(false);
  const finished = useRef(false);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    const overlay = overlayRef.current;
    document.body.style.overflow = "";
    const done = () => {
      setGone(true);
      onFinish();
    };
    if (!overlay) {
      done();
      return;
    }
    try {
      const anim = overlay.animate(
        [
          { opacity: 1, transform: "scale(1)" },
          { opacity: 0, transform: "scale(1.015)" },
        ],
        { duration: 460, easing: "cubic-bezier(0.23, 1, 0.32, 1)", fill: "forwards" },
      );
      anim.onfinish = done;
    } catch {
      // WAAPI unavailable: no fade, but never a stuck overlay.
    }
    // Belt and suspenders: whatever happens to the fade, the overlay leaves.
    window.setTimeout(done, 700);
  }, [onFinish]);

  useLayoutEffect(() => {
    document.body.style.overflow = "hidden";
    const text = textRef.current;
    const caret = caretRef.current;
    if (!text) return;

    if (reduced) {
      text.style.clipPath = "inset(0 0 0 0)";
      text.style.filter = "none";
      if (caret) caret.style.opacity = "0";
      const t = window.setTimeout(finish, 650);
      return () => window.clearTimeout(t);
    }

    // Failsafe: if the plot animation never completes (background-tab load,
    // WAAPI missing, anything), the intro still dismisses itself. The site can
    // never be stuck behind this overlay.
    const failsafe = window.setTimeout(finish, 3200);

    let reveal: Animation | undefined;
    try {
      reveal = text.animate(
        [
          { clipPath: "inset(0 100% 0 0)", filter: "blur(6px)" },
          { clipPath: "inset(0 0 0 0)", filter: "blur(0px)" },
        ],
        { duration: 1200, easing: "cubic-bezier(0.77, 0, 0.175, 1)", fill: "forwards" },
      );

      if (caret) {
        caret.animate([{ left: "0%" }, { left: "100%" }], {
          duration: 1200,
          easing: "cubic-bezier(0.77, 0, 0.175, 1)",
          fill: "forwards",
        });
        caret.animate([{ opacity: 1 }, { opacity: 1 }, { opacity: 0 }], {
          duration: 1500,
          easing: "linear",
          fill: "forwards",
        });
      }

      reveal.onfinish = () => {
        window.setTimeout(finish, 260);
      };
    } catch {
      text.style.clipPath = "inset(0 0 0 0)";
      text.style.filter = "none";
      window.setTimeout(finish, 650);
    }

    return () => {
      window.clearTimeout(failsafe);
      reveal?.cancel();
    };
  }, [reduced, finish]);

  useEffect(() => {
    const skip = () => finish();
    window.addEventListener("wheel", skip, { passive: true, once: true });
    window.addEventListener("keydown", skip, { once: true });
    window.addEventListener("pointerdown", skip, { once: true });
    return () => {
      window.removeEventListener("wheel", skip);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
  }, [finish]);

  if (gone) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 flex items-center justify-center bg-bg px-6"
      style={{ zIndex: 8000 }}
      aria-label="Rohan Dhruv"
    >
      <div ref={textRef} className="relative" style={{ clipPath: "inset(0 100% 0 0)", filter: "blur(6px)" }}>
        <span className="font-display text-[clamp(2.6rem,9vw,7rem)] font-extrabold leading-none tracking-tight text-ink">
          Rohan Dhruv
        </span>
        <span
          ref={caretRef}
          aria-hidden="true"
          className="absolute top-0 bottom-0 w-[2px] bg-ink"
          style={{ left: "0%" }}
        />
      </div>
    </div>
  );
}
