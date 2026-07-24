import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DEFAULT_INPUTS, runDcf } from "../../lib/dcf";
import { setHeroCurve } from "../../lib/field-link";
import { fmtMoney, fmtShare } from "../../lib/format";
import { CountUp } from "./CountUp";
import { Slider } from "../ui/Slider";

// The signature act. The name rides high, the river owns the center of the
// viewport unobstructed, and the model is a terminal-style instrument bar
// docked at the bottom: three outputs and four sliders in a strip. There is no
// chart here on purpose: the river IS the chart (its course follows the live
// FCF curve via field-link); the bar chart lives on /dcf with the full table.

const pct1 = (v: number) => `${v.toFixed(1)}%`;

function Output({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-ink-3">{label}</div>
      <div className="mt-1 font-mono text-xl text-ink sm:text-2xl">{children}</div>
    </div>
  );
}

export function DcfHero() {
  const [growth, setGrowth] = useState(12);
  const [margin, setMargin] = useState(22);
  const [wacc, setWacc] = useState(10);
  const [tgr, setTgr] = useState(2.5);

  const result = useMemo(
    () =>
      runDcf({
        ...DEFAULT_INPUTS,
        growth: growth / 100,
        margin: margin / 100,
        wacc: wacc / 100,
        tgr: tgr / 100,
      }),
    [growth, margin, wacc, tgr],
  );

  // Feed the river: its course follows this curve.
  useEffect(() => {
    setHeroCurve(result.years.map((y) => y.fcf));
  }, [result]);

  return (
    <section
      id="model"
      className="relative flex min-h-[100svh] flex-col justify-between px-6 pb-10 pt-28 sm:px-8"
      style={{ zIndex: "var(--z-content)" as unknown as number }}
    >
      {/* Legibility scrims: dark feathered bands where text sits, so the name
          and the instrument bar always read over the river's brightest crest.
          Functional contrast, not decoration. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[38%]"
        style={{ background: "linear-gradient(to bottom, rgba(11,11,13,0.85) 20%, rgba(11,11,13,0))" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[46%]"
        style={{ background: "linear-gradient(to top, rgba(11,11,13,0.92) 40%, rgba(11,11,13,0))" }}
      />

      {/* Top: the name. The river flows beneath, unobstructed. */}
      <div className="relative mx-auto w-full max-w-shell">
        <h1 className="text-[clamp(2.8rem,8vw,5.5rem)] font-extrabold leading-[0.98] text-ink">
          Rohan Dhruv
        </h1>
        <p className="mt-5 max-w-md text-lg text-ink-2">
          Sophomore at the University of Akron, seeking 2027 internships. The current below is a
          live valuation: drag the drivers and it re-routes.
        </p>
      </div>

      {/* Bottom: the instrument bar. */}
      <div className="relative mx-auto w-full max-w-shell">
        <div className="border-t border-line pt-5">
          <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
            <div className="flex flex-wrap gap-x-10 gap-y-4">
              <Output label="Intrinsic / sh">
                {result.valid ? <CountUp value={result.intrinsicPerShare} format={fmtShare} /> : "n/a"}
              </Output>
              <Output label="Enterprise">
                {result.valid ? <CountUp value={result.enterpriseValue} format={fmtMoney} /> : "n/a"}
              </Output>
              <Output label="Equity">
                {result.valid ? <CountUp value={result.equityValue} format={fmtMoney} /> : "n/a"}
              </Output>
            </div>
            <Link
              to="/dcf"
              data-cursor
              className="text-[13px] text-ink-3 underline-offset-4 transition-colors hover:text-ink hover:underline"
            >
              full model →
            </Link>
          </div>
          {!result.valid && (
            <p className="mt-2 text-[13px] text-ink-3">
              WACC has to exceed terminal growth for the model to resolve. Nudge the discount rate up.
            </p>
          )}

          <div className="mt-6 grid grid-cols-1 gap-x-10 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
            <Slider label="Revenue growth" value={growth} min={0} max={50} step={0.5} format={pct1} onChange={setGrowth} />
            <Slider label="EBITDA margin" value={margin} min={1} max={60} step={0.5} format={pct1} onChange={setMargin} />
            <Slider label="WACC" value={wacc} min={4} max={25} step={0.5} format={pct1} onChange={setWacc} />
            <Slider label="Terminal growth" value={tgr} min={0} max={5} step={0.1} format={pct1} onChange={setTgr} />
          </div>
        </div>
      </div>
    </section>
  );
}
