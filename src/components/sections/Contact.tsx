import { Section } from "../layout/Section";
import { Reveal } from "../layout/Reveal";

// Closing act: who I am and what I want, then the two ways to reach me.

const EMAIL = "rdgoggle@gmail.com";
const LINKEDIN = "https://www.linkedin.com/in/rohandhruv";

export function Contact() {
  return (
    <Section id="contact" className="border-t border-line">
      <Reveal>
        <h2 className="max-w-3xl text-[clamp(2rem,5vw,3.5rem)] font-bold leading-[1.05] text-ink">
          Looking for 2027 internships.
        </h2>
        <p className="mt-5 max-w-xl text-lg text-ink-2">
          Sophomore at the University of Akron studying financial management and economics. This site
          is my portfolio.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-5">
          <a
            href="/Rohan-Dhruv-Resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            data-cursor
            className="border border-line-strong px-6 py-3 text-[14px] font-medium text-ink no-underline transition-colors hover:bg-card"
            style={{ borderRadius: 8 }}
          >
            Resume (PDF)
          </a>
          <a
            href={`mailto:${EMAIL}`}
            data-cursor
            className="font-mono text-lg text-ink underline-offset-4 transition-colors hover:underline"
          >
            {EMAIL}
          </a>
          <a
            href={LINKEDIN}
            target="_blank"
            rel="noopener noreferrer"
            data-cursor
            className="text-[14px] text-ink-2 no-underline transition-colors hover:text-ink"
          >
            LinkedIn
          </a>
        </div>
        <p className="mt-16 text-[12px] text-ink-3">© {new Date().getFullYear()} Rohan Dhruv</p>
      </Reveal>
    </Section>
  );
}
