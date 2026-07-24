import { Link, useLocation } from "react-router-dom";
import { scrollToY } from "../../lib/usePinnedPhases";

// Top nav. Every act is addressable on every device (the strip scrolls
// horizontally on phones instead of amputating items), Resume is a permanent
// first-class item (the recruiter's terminal action), and clicking a pinned
// act lands it at the END of its pin, fully unlocked, instead of teleporting
// into an empty phase-0 stage. The name always goes home.

const LINKS = [
  { label: "Model", id: "model" },
  { label: "Education", id: "education" },
  { label: "Experience", id: "experience" },
  { label: "Simulator", id: "simulator" },
  { label: "Macro", id: "macro" },
  { label: "Mont AI", id: "mont-ai" },
  { label: "Leadership", id: "leadership" },
  { label: "Contact", id: "contact" },
];

// Acts that pin: jump to the end of the pin (content unlocked), not the start.
const PINNED = new Set(["experience", "simulator", "macro", "mont-ai"]);

export function Nav() {
  const location = useLocation();

  const goTo = (id: string) => (e: React.MouseEvent) => {
    const el = document.getElementById(id);
    if (!el || location.pathname !== "/") return; // fall through to href navigation
    e.preventDefault();
    const rect = el.getBoundingClientRect();
    // Pinned acts: land at the END of the pin (fully unlocked), not the empty
    // phase-0 stage. Everything else: land at the top of the section.
    const target = PINNED.has(id)
      ? window.scrollY + rect.bottom - window.innerHeight
      : window.scrollY + rect.top;
    scrollToY(target);
    history.replaceState(null, "", `/#${id}`);
  };

  return (
    <nav
      className="fixed inset-x-0 top-0 flex items-center justify-between gap-6 px-6 py-4 sm:px-8"
      style={{
        zIndex: "var(--z-nav)" as unknown as number,
        // Functional readability backdrop: content scrolls beneath the nav
        // constantly (pinned acts especially), so the bar carries its own
        // contrast instead of colliding with whatever passes under it.
        background: "rgba(11, 11, 13, 0.72)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <Link
        to="/"
        data-cursor
        onClick={() => {
          if (location.pathname === "/") scrollToY(0);
        }}
        className="shrink-0 font-display text-sm font-semibold tracking-tight text-ink no-underline"
      >
        Rohan Dhruv
      </Link>
      <div
        className="no-scrollbar flex items-center gap-5 overflow-x-auto whitespace-nowrap sm:gap-6"
        style={{ scrollbarWidth: "none" }}
      >
        {LINKS.map((link) => (
          <a
            key={link.id}
            href={`/#${link.id}`}
            data-cursor
            onClick={goTo(link.id)}
            className="text-[13px] text-ink-2 no-underline transition-colors duration-200 hover:text-ink"
          >
            {link.label}
          </a>
        ))}
        <a
          href="/Rohan-Dhruv-Resume.pdf"
          target="_blank"
          rel="noopener noreferrer"
          data-cursor
          className="text-[13px] font-medium text-ink underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-ink"
        >
          Resume
        </a>
      </div>
    </nav>
  );
}
