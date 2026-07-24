import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DEFAULT_INPUTS, runDcf, type DcfYear } from "../lib/dcf";
import { fmtMoney, fmtShare, fmtPct } from "../lib/format";
import { CountUp } from "../components/hero/CountUp";
import { FcfChart } from "../components/hero/FcfChart";

// The full instrument. Same engine as the hero, but here we also lay the whole
// 5-year projection out as a table. Editable D&A / capex / tax / net-debt /
// shares inputs and a WACC sensitivity grid are the next build on this page.

function Slider(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  const decimals = props.step < 1 ? 1 : 0;
  return (
    <label className="block select-none">
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] text-ink-2">{props.label}</span>
        <span className="tnum text-[13px] text-ink">{props.value.toFixed(decimals)}%</span>
      </div>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        data-cursor
        onChange={(e) => props.onChange(Number(e.target.value))}
        className="mt-2 h-1 w-full cursor-pointer appearance-none rounded-full bg-line-strong"
        style={{ accentColor: "#f3f3f1" }}
        aria-label={props.label}
      />
    </label>
  );
}

const TABLE_ROWS: { label: string; get: (y: DcfYear) => number }[] = [
  { label: "Revenue", get: (y) => y.revenue },
  { label: "EBITDA", get: (y) => y.ebitda },
  { label: "EBIT", get: (y) => y.ebit },
  { label: "NOPAT", get: (y) => y.nopat },
  { label: "− Capex", get: (y) => y.capex },
  { label: "− ΔNWC", get: (y) => y.dnwc },
  { label: "Unlevered FCF", get: (y) => y.fcf },
  { label: "PV of FCF", get: (y) => y.pvFcf },
];

export function DcfPage() {
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

  return (
    <div
      className="relative mx-auto max-w-shell px-6 pb-28 pt-28 sm:px-8"
      style={{ zIndex: "var(--z-content)" as unknown as number }}
    >
      <Link to="/" data-cursor className="text-[13px] text-ink-2 no-underline hover:text-ink">
        ← back
      </Link>

      <h1 className="mt-6 text-[clamp(2.2rem,5vw,3.4rem)] font-bold text-ink">Full DCF model</h1>
      <p className="mt-4 max-w-prose text-ink-2">
        A 5-year unlevered discounted-cash-flow valuation. Illustrative company; drag the drivers and
        the whole projection re-solves. Base revenue ${DEFAULT_INPUTS.rev0}M, net debt $
        {DEFAULT_INPUTS.netDebt}M, {DEFAULT_INPUTS.shares}M shares.
      </p>

      <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-1">
            <Slider label="Revenue growth" value={growth} min={0} max={50} step={0.5} onChange={setGrowth} />
            <Slider label="EBITDA margin" value={margin} min={1} max={60} step={0.5} onChange={setMargin} />
            <Slider label="WACC" value={wacc} min={4} max={25} step={0.5} onChange={setWacc} />
            <Slider label="Terminal growth" value={tgr} min={0} max={5} step={0.1} onChange={setTgr} />
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4 border-t border-line pt-6">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-ink-3">Intrinsic</div>
              <div className="mt-1 font-mono text-xl text-ink">
                {result.valid ? <CountUp value={result.intrinsicPerShare} format={fmtShare} /> : "n/a"}
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-ink-3">EV</div>
              <div className="mt-1 font-mono text-xl text-ink">
                {result.valid ? <CountUp value={result.enterpriseValue} format={fmtMoney} /> : "n/a"}
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-ink-3">Terminal %</div>
              <div className="mt-1 font-mono text-xl text-ink">
                {result.valid ? fmtPct(result.terminalPct) : "n/a"}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          <FcfChart years={result.years} />

          <div className="mt-10 overflow-x-auto">
            <table className="w-full border-collapse text-right">
              <thead>
                <tr className="border-b border-line-strong">
                  <th className="py-2 text-left text-[12px] font-medium text-ink-2">Metric ($M)</th>
                  {result.years.map((y) => (
                    <th key={y.year} className="tnum py-2 pl-4 text-[12px] font-medium text-ink-2">
                      Yr {y.year}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TABLE_ROWS.map((row) => (
                  <tr key={row.label} className="border-b border-line">
                    <td className="py-2 text-left text-[13px] text-ink-2">{row.label}</td>
                    {result.years.map((y) => (
                      <td key={y.year} className="tnum py-2 pl-4 text-[13px] text-ink">
                        {fmtMoney(row.get(y))}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td className="py-2 text-left text-[13px] text-ink-2">Terminal value (PV)</td>
                  <td colSpan={4} />
                  <td className="tnum py-2 pl-4 text-[13px] text-ink">
                    {result.valid ? fmtMoney(result.pvTerminal) : "n/a"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-8 text-[13px] text-ink-3">
            Next on this page: editable D&amp;A, capex, tax, net debt and share count, plus a WACC ×
            terminal-growth sensitivity grid.
          </p>
        </div>
      </div>
    </div>
  );
}
