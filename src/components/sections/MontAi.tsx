import { Reveal } from "../layout/Reveal";
import { Beat } from "../ui/Beat";
import { SkipPin } from "../ui/SkipPin";
import { usePinnedPhases } from "../../lib/usePinnedPhases";

// Mont AI as a cinematic walkthrough. The act pins and the system assembles
// itself under the scroll: first the ERP alone, then the agentic core wiring
// into it with data pulses flowing, then the outcome lanes connecting one by
// one with the presales lane brightening and the 3-hours stat revealing.
// Then the honesty line, and release.
//
// The visual is a live schematic of the real architecture (SMIL pulses,
// omitted under reduced motion), never a fake product screenshot.

const INK = "#f3f3f1";
const MUTED = "#8c8c88";
const NODE_FILL = "#101012";
const NODE_STROKE = "rgba(255,255,255,0.16)";
const PIPE = "rgba(255,255,255,0.22)";
const MONO = "Spline Sans Mono, monospace";

const THRESHOLDS = [0.15, 0.38, 0.62, 0.86];

function Node(props: {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  sub?: string;
  strong?: boolean;
  bright?: boolean;
}) {
  const { x, y, w, h, label, sub, strong, bright } = props;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={8}
        fill={NODE_FILL}
        stroke={bright ? "rgba(255,255,255,0.45)" : strong ? "rgba(255,255,255,0.34)" : NODE_STROKE}
        strokeWidth={strong || bright ? 1.5 : 1}
        style={{ transition: "stroke 480ms var(--ease-out)" }}
      />
      <text
        x={x + w / 2}
        y={sub ? y + h / 2 - 4 : y + h / 2 + 4}
        textAnchor="middle"
        fill={INK}
        fontFamily={MONO}
        fontSize={12}
      >
        {label}
      </text>
      {sub ? (
        <text x={x + w / 2} y={y + h / 2 + 14} textAnchor="middle" fill={MUTED} fontFamily={MONO} fontSize={10}>
          {sub}
        </text>
      ) : null}
    </g>
  );
}

function Pulse({ pathId, dur, begin }: { pathId: string; dur: number; begin: number }) {
  return (
    <circle r={2.5} fill={INK} opacity={0.85}>
      <animateMotion dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite">
        <mpath href={`#${pathId}`} />
      </animateMotion>
    </circle>
  );
}

// stage: 1 = ERP alone, 2 = + agentic core and its pipes, 3+ = + outcome lanes.
function StageGroup({ on, children }: { on: boolean; children: React.ReactNode }) {
  return (
    <g
      style={{
        opacity: on ? 1 : 0,
        transition: "opacity 560ms var(--ease-out)",
      }}
    >
      {children}
    </g>
  );
}

function Diagram({ stage, reduced }: { stage: number; reduced: boolean }) {
  const corePipes = [
    { id: "mont-p1", d: "M 200 155 C 270 155, 270 148, 340 148" },
    { id: "mont-p2", d: "M 340 192 C 270 192, 270 185, 200 185" },
  ];
  const lanePipes = [
    { id: "mont-p3", d: "M 500 140 C 570 140, 570 70, 640 70" },
    { id: "mont-p4", d: "M 500 170 C 570 170, 570 170, 640 170" },
    { id: "mont-p5", d: "M 500 200 C 570 200, 570 270, 640 270" },
  ];

  return (
    <svg
      viewBox="0 0 820 340"
      className="w-full"
      role="img"
      aria-label="Mont AI system diagram: the company ERP feeds an agentic core, which drives the presales opportunity workflow, removes redundant steps, and speeds task turnaround"
    >
      <StageGroup on={stage >= 1}>
        <Node x={40} y={130} w={160} h={80} label="Company ERP" sub="records, orders, accounts" />
      </StageGroup>

      <StageGroup on={stage >= 2}>
        {corePipes.map((p) => (
          <path key={p.id} id={p.id} d={p.d} fill="none" stroke={PIPE} strokeDasharray="2 5" />
        ))}
        <Node x={340} y={118} w={160} h={104} label="Mont AI" sub="agentic core" strong />
        {!reduced && stage >= 2 && (
          <>
            <Pulse pathId="mont-p1" dur={2.6} begin={0} />
            <Pulse pathId="mont-p1" dur={2.6} begin={-1.3} />
            <Pulse pathId="mont-p2" dur={3.1} begin={-0.7} />
          </>
        )}
      </StageGroup>

      <StageGroup on={stage >= 3}>
        {lanePipes.map((p) => (
          <path key={p.id} id={p.id} d={p.d} fill="none" stroke={PIPE} strokeDasharray="2 5" />
        ))}
        <Node x={640} y={38} w={150} h={64} label="Presales" sub="80 min a day" bright={stage >= 3} />
        <Node x={640} y={138} w={150} h={64} label="Redundancy" sub="steps removed" />
        <Node x={640} y={238} w={150} h={64} label="Turnaround" sub="tasks, faster" />
        {!reduced && stage >= 3 && (
          <>
            <Pulse pathId="mont-p3" dur={2.2} begin={-0.3} />
            <Pulse pathId="mont-p3" dur={2.2} begin={-1.4} />
            <Pulse pathId="mont-p4" dur={2.4} begin={-0.9} />
            <Pulse pathId="mont-p5" dur={2.8} begin={-1.8} />
          </>
        )}
      </StageGroup>
    </svg>
  );
}

export function MontAi() {
  const { sectionRef, stageRef, phase, reduced, staticLayout, skip } = usePinnedPhases({
    screens: 2.0,
    thresholds: THRESHOLDS,
    disableOnMobile: true,
  });
  const interactive = phase >= THRESHOLDS.length;

  return (
    <section ref={sectionRef} id="mont-ai" className="relative">
      <div
        ref={stageRef}
        className={`relative flex flex-col justify-center px-6 sm:px-8 ${
          staticLayout ? "min-h-[100svh] py-24" : "h-[100svh] overflow-hidden"
        }`}
        style={{ zIndex: "var(--z-content)" as unknown as number }}
      >
        <SkipPin onSkip={skip} show={!staticLayout && !interactive} />
        <div className="mx-auto w-full max-w-shell">
          <Reveal>
            <div className="text-[13px] text-ink-3">Applied AI, Mont Granite</div>
            <h2 className="mt-1 text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold text-ink">Mont AI</h2>
            <p className="mt-2 max-w-lg text-ink-2">
              An agentic AI system wired into the company ERP.
            </p>
          </Reveal>

          {/* The lesson captions. */}
          <div className="relative mt-4 h-14 sm:h-16">
            <Beat on={phase === 1} className="absolute inset-0">
              <p className="font-display text-[clamp(1.2rem,2.6vw,1.9rem)] font-bold text-ink">
                The ERP holds everything.
              </p>
            </Beat>
            <Beat on={phase === 2} className="absolute inset-0">
              <p className="font-display text-[clamp(1.2rem,2.6vw,1.9rem)] font-bold text-ink">
                An agent sits inside it.
              </p>
            </Beat>
            <Beat on={phase === 3} className="absolute inset-0">
              <p className="font-display text-[clamp(1.2rem,2.6vw,1.9rem)] font-bold text-ink">
                It gives hours back.
              </p>
            </Beat>
          </div>

          <div className="border-y border-line py-6">
            <Diagram stage={phase} reduced={reduced} />
          </div>

          <Beat on={phase >= 3}>
            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-14">
              <div className="font-display text-[clamp(2.2rem,6vw,4rem)] font-extrabold leading-[0.88] tracking-tight text-ink">
                3<span className="ml-3 text-[0.34em] font-semibold text-ink-2">hrs a day</span>
              </div>
              <p className="max-w-md pb-1 text-[14px] leading-relaxed text-ink-2">
                saved, up to, across ERP-connected workflows. 80 minutes of it from the presales
                opportunity workflow alone.
              </p>
            </div>
          </Beat>
          <Beat on={interactive}>
            <p className="tnum mt-4 text-[12px] text-ink-3">
              In development at Mont Granite. Internal system, no public link.
            </p>
          </Beat>
        </div>
      </div>
    </section>
  );
}
