import type { CSSProperties, ReactNode } from "react";

// The crossfade primitive for cinematic acts: caption beats and control
// blocks rise into place when their phase arrives and fall away when it
// passes. Content is real DOM either way; only opacity and transform move,
// and pointer events are dead while hidden.
export function Beat({
  on,
  children,
  className,
  style,
}: {
  on: boolean;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={className}
      aria-hidden={on ? undefined : true}
      style={{
        opacity: on ? 1 : 0,
        transform: on ? "none" : "translateY(16px)",
        // visibility:hidden also removes the element from the tab order, so it
        // is held through the fade (480ms) then hidden.
        transition:
          "opacity 480ms var(--ease-out), transform 480ms var(--ease-out), visibility 480ms",
        pointerEvents: on ? "auto" : "none",
        visibility: on ? "visible" : "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
