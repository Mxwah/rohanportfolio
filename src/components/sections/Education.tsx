import { useEffect, useRef, useState } from "react";
import { PanelSpread, type Panel } from "../../acts/ExperienceAct";
import { Reveal } from "../layout/Reveal";

// Education as its own addressable act, in the same composed-spread language
// as the experience sequence: role line, the university set huge, and the GPA
// seated on the baseline rule, counting up when it enters view.

const EDUCATION: Panel = {
  org: "The University of Akron",
  role: "B.S. Financial Management, Economics minor. Honors College",
  value: 3.95,
  decimals: 2,
  context: "GPA. Dean's List, Fall 2025 and Spring 2026. Expected December 2028.",
};

export function Education() {
  const ref = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      id="education"
      className="relative mx-auto w-full max-w-shell px-6 py-14 sm:py-28 sm:px-8"
      style={{ zIndex: "var(--z-content)" as unknown as number }}
    >
      <Reveal>
        <PanelSpread p={EDUCATION} active={seen} />
      </Reveal>
    </section>
  );
}
