import { Reveal } from "../layout/Reveal";

// Campus selections in the site's own typographic language: the selective
// fact set huge in the display face, seated on a baseline rule, with the org
// and one line of context at the rule's right. Same composition as the
// experience spreads, smaller scale. ARIA is deliberately absent; it has its
// own act.

const ROWS = [
  {
    big: "1",
    small: "of 12",
    org: "University of Akron Ambassadors",
    detail: "Selected member. 20% acceptance, alumni and stakeholder engagement.",
  },
  {
    big: "60",
    small: "applicants",
    org: "College of Business Dean's Team",
    detail: "Selected from the full pool. Outreach with College of Business leadership.",
  },
  {
    big: "VP",
    small: "Pledge Education",
    org: "Delta Sigma Pi, professional business fraternity",
    detail: "Elected to lead onboarding and member education.",
  },
];

export function Leadership() {
  return (
    <section
      id="leadership"
      className="relative mx-auto w-full max-w-shell px-6 py-14 sm:py-24 sm:px-8"
      style={{ zIndex: "var(--z-content)" as unknown as number }}
    >
      <Reveal>
        <div className="flex items-baseline justify-between">
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold text-ink">Selected for</h2>
          <span className="tnum text-[13px] text-ink-2">Fall 2026</span>
        </div>
      </Reveal>

      <div className="mt-4">
        {ROWS.map((r, i) => (
          <Reveal key={r.org} delay={i * 70}>
            <div className="flex flex-col gap-3 border-b border-line pb-3 pt-10 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
              <div className="font-display text-[clamp(2.6rem,7vw,4.8rem)] font-extrabold leading-[0.88] tracking-tight text-ink">
                {r.big}
                <span className="ml-3 text-[0.34em] font-semibold text-ink-2">{r.small}</span>
              </div>
              <div className="max-w-md sm:text-right">
                <div className="font-semibold text-ink">{r.org}</div>
                <div className="mt-1 text-[13px] leading-relaxed text-ink-2">{r.detail}</div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
