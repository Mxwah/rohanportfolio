import type { ReactNode } from "react";

// A page section: consistent vertical rhythm and a centered content column,
// while letting the hero and full-bleed pieces opt out via className.
export function Section({
  id,
  children,
  className = "",
}: {
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`relative mx-auto w-full max-w-shell px-6 py-24 sm:px-8 md:py-32 ${className}`}
      style={{ zIndex: "var(--z-content)" as unknown as number }}
    >
      {children}
    </section>
  );
}
