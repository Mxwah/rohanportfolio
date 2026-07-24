import { useEffect, useRef } from "react";
import { useReducedMotion } from "../../lib/useReducedMotion";

// A soft dot that trails the pointer and swells over anything marked
// data-cursor. Fine-pointer devices only (never on touch), and it degrades to
// the native cursor if JS never runs. Reduced motion removes the trailing lag.
//
// While `hidden` is true (the opening scene), the dot does not exist: no class
// on body, native cursor untouched, nothing rendered over the intro. When the
// intro hands off, the dot fades in with the hero.
export function CustomCursor({ hidden = false }: { hidden?: boolean }) {
  const dotRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const dot = dotRef.current;
    if (!finePointer || !dot || hidden) return;

    document.body.classList.add("has-custom-cursor");
    dot.style.opacity = "1";

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const pos = { ...target };
    const lerp = reduced ? 1 : 0.18;
    let hovering = false;
    let frame = 0;

    const onMove = (e: MouseEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      const overInteractive = (e.target as HTMLElement)?.closest?.("[data-cursor], a, button, input");
      hovering = Boolean(overInteractive);
    };

    const render = () => {
      pos.x += (target.x - pos.x) * lerp;
      pos.y += (target.y - pos.y) * lerp;
      const scale = hovering ? 2.6 : 1;
      dot.style.transform = `translate(${pos.x}px, ${pos.y}px) translate(-50%, -50%) scale(${scale})`;
      dot.style.borderColor = hovering ? "var(--text)" : "transparent";
      dot.style.backgroundColor = hovering ? "transparent" : "var(--text)";
      frame = requestAnimationFrame(render);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    frame = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(frame);
      dot.style.opacity = "0";
      document.body.classList.remove("has-custom-cursor");
    };
  }, [reduced, hidden]);

  return (
    <div
      ref={dotRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: 10,
        height: 10,
        borderRadius: "50%",
        border: "1px solid transparent",
        backgroundColor: "var(--text)",
        opacity: 0,
        pointerEvents: "none",
        zIndex: "var(--z-cursor)" as unknown as number,
        transition:
          "background-color 200ms var(--ease-out), border-color 200ms var(--ease-out), opacity 320ms var(--ease-out)",
        willChange: "transform",
      }}
    />
  );
}
