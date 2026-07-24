// The quiet exit from any pinned act. Always present while a pin holds the
// scroll, because a recruiter's minute matters more than the choreography.
export function SkipPin({ onSkip, show }: { onSkip: () => void; show: boolean }) {
  return (
    <button
      type="button"
      data-cursor
      onClick={onSkip}
      className="absolute bottom-5 right-6 font-mono text-[12px] text-ink-3 transition-colors hover:text-ink sm:right-8"
      style={{
        opacity: show ? 1 : 0,
        visibility: show ? "visible" : "hidden",
        pointerEvents: show ? "auto" : "none",
        transition: "opacity 300ms var(--ease-out)",
        zIndex: 20,
      }}
    >
      skip ↓
    </button>
  );
}
