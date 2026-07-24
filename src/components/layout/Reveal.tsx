import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { useReducedMotion } from "../../lib/useReducedMotion";

// Scroll reveal that never ships a blank section: the default state is fully
// visible. Only when motion is allowed do we arm it (hide) before first paint,
// then reveal it the moment it scrolls into view.
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    if (!reduced && ref.current) ref.current.setAttribute("data-reveal", "armed");
  }, [reduced]);

  useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          window.setTimeout(() => el.setAttribute("data-reveal", "shown"), delay);
          io.unobserve(el);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [reduced, delay]);

  return (
    <div ref={ref} data-reveal="" className={className}>
      {children}
    </div>
  );
}
