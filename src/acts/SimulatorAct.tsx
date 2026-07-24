import { useEffect, useMemo, useRef, useState } from "react";
import { CountUp } from "../components/hero/CountUp";
import { Slider } from "../components/ui/Slider";
import { Beat } from "../components/ui/Beat";
import { SkipPin } from "../components/ui/SkipPin";
import { usePinnedPhases } from "../lib/usePinnedPhases";

// The Portfolio Simulator as a cinematic walkthrough. The act pins and the
// scroll teaches it in three beats: your contributions (dashed line), what
// compounding adds (the average line lifts and the wedge between them fills;
// that wedge IS compounding), and the market's mood (the bear/bull fan
// spreads). Then the controls fade up and the instrument is yours. The
// contributions line stays after the lesson as a permanent reference.
//
// The model is deterministic monthly compounding rebuilt from the original at
// rohandhruv.com/viz/portfolio-simulator: blended annual return from a
// stocks/bonds mix, Bear / Average / Bull shifting it by 2.5 points.

type Scenario = "bear" | "base" | "bull" | "all";

const SCENARIO_ADJ: Record<Exclude<Scenario, "all">, number> = { bear: -2.5, base: 0, bull: 2.5 };
const SCENARIO_LABEL: Record<Exclude<Scenario, "all">, string> = {
  bear: "Bear case",
  base: "Average case",
  bull: "Bull case",
};
const STOCK_RETURN = 9.5;
const BOND_RETURN = 4.0;
const MUTED = "#8c8c88";

const THRESHOLDS = [0.14, 0.4, 0.64, 0.86];

function fmtDollars(v: number): string {
  const sign = v < 0 ? "-" : "";
  const a = Math.abs(v);
  if (a >= 1e6) return `${sign}$${(a / 1e6).toFixed(2)}M`;
  if (a >= 1e3) return `${sign}$${Math.round(a / 1e3)}K`;
  return `${sign}$${Math.round(v)}`;
}

function project(start: number, monthly: number, years: number, annualRate: number): Float32Array {
  const r = annualRate / 100 / 12;
  const pts = new Float32Array(years + 1);
  let val = start;
  pts[0] = val;
  for (let y = 1; y <= years; y++) {
    for (let m = 0; m < 12; m++) val = val * (1 + r) + monthly;
    pts[y] = val;
  }
  return pts;
}

interface Curves {
  bear: Float32Array;
  base: Float32Array;
  bull: Float32Array;
  contrib: Float32Array; // what you put in, no growth: the reference line
  yMax: number;
}

interface Vis {
  contrib: boolean;
  base: boolean;
  fan: boolean;
}

function drawChart(
  canvas: HTMLCanvasElement,
  curves: Curves,
  shown: Exclude<Scenario, "all">,
  fanMode: boolean,
  years: number,
  vis: Vis,
): void {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (w === 0 || h === 0) return;
  if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
    canvas.width = w * dpr;
    canvas.height = h * dpr;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const padL = 54;
  const padB = 22;
  const padT = 8;
  const iw = w - padL - 8;
  const ih = h - padT - padB;
  const x = (i: number) => padL + (i / years) * iw;
  const y = (v: number) => padT + ih - (v / curves.yMax) * ih * 0.94;

  ctx.font = "10px 'Spline Sans Mono', monospace";
  ctx.fillStyle = MUTED;
  ctx.strokeStyle = "rgba(255,255,255,0.07)";
  ctx.lineWidth = 1;
  for (let g = 0; g <= 4; g++) {
    const v = (curves.yMax / 4) * g;
    const gy = y(v);
    ctx.beginPath();
    ctx.moveTo(padL, gy);
    ctx.lineTo(w - 8, gy);
    ctx.stroke();
    ctx.fillText(fmtDollars(v), 4, gy + 3);
  }
  ctx.textAlign = "center";
  ctx.fillText("Now", x(0), h - 6);
  ctx.fillText(`Yr ${Math.round(years / 2)}`, x(years / 2), h - 6);
  ctx.fillText(`Yr ${years}`, x(years), h - 6);
  ctx.textAlign = "left";

  const tracePath = (pts: Float32Array) => {
    ctx.beginPath();
    ctx.moveTo(x(0), y(pts[0]));
    for (let i = 1; i <= years; i++) ctx.lineTo(x(i), y(pts[i]));
  };

  const line = (pts: Float32Array, width: number, alpha: number, dash: number[]) => {
    tracePath(pts);
    ctx.setLineDash(dash);
    ctx.lineWidth = width;
    ctx.strokeStyle = `rgba(243,243,241,${alpha})`;
    ctx.stroke();
    ctx.setLineDash([]);
  };

  // The compounding wedge: the area between the growth line and what you put in.
  const fillBetween = (top: Float32Array, bottom: Float32Array) => {
    ctx.beginPath();
    ctx.moveTo(x(0), y(top[0]));
    for (let i = 1; i <= years; i++) ctx.lineTo(x(i), y(top[i]));
    for (let i = years; i >= 0; i--) ctx.lineTo(x(i), y(bottom[i]));
    ctx.closePath();
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fill();
  };

  const main = curves[shown];

  if (vis.contrib) {
    line(curves.contrib, 1.2, 0.45, [5, 5]);
    ctx.fillStyle = MUTED;
    ctx.fillText("contributions", Math.min(x(years) - 84, w - 92), y(curves.contrib[years]) + 14);
  }
  if (vis.base) {
    fillBetween(main, curves.contrib);
    if (vis.fan && fanMode) {
      line(curves.bear, 1.2, 0.45, [6, 4]);
      line(curves.bull, 1.2, 0.75, [2, 3]);
      ctx.fillStyle = MUTED;
      ctx.fillText("Bear", Math.min(x(years) - 30, w - 38), y(curves.bear[years]) - 6);
      ctx.fillText("Bull", Math.min(x(years) - 30, w - 38), y(curves.bull[years]) - 6);
    }
    line(main, 1.8, 1, []);
  }
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-ink-3">{label}</div>
      <div className="mt-1 font-mono text-xl text-ink sm:text-2xl">
        <CountUp value={value} format={fmtDollars} />
      </div>
    </div>
  );
}

export function SimulatorAct() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [start, setStart] = useState(10000);
  const [monthly, setMonthly] = useState(500);
  const [years, setYears] = useState(20);
  const [stocks, setStocks] = useState(70);
  const [scenario, setScenario] = useState<Scenario>("all");
  const { sectionRef, stageRef, phase, staticLayout, skip } = usePinnedPhases({
    screens: 2.4,
    thresholds: THRESHOLDS,
    disableOnMobile: true,
  });
  const interactive = phase >= THRESHOLDS.length;

  const blended = (stocks * STOCK_RETURN + (100 - stocks) * BOND_RETURN) / 100;

  const curves = useMemo<Curves>(() => {
    const bear = project(start, monthly, years, blended + SCENARIO_ADJ.bear);
    const base = project(start, monthly, years, blended);
    const bull = project(start, monthly, years, blended + SCENARIO_ADJ.bull);
    const contrib = new Float32Array(years + 1);
    for (let yv = 0; yv <= years; yv++) contrib[yv] = start + monthly * 12 * yv;
    return { bear, base, bull, contrib, yMax: bull[years] * 1.08 };
  }, [start, monthly, years, blended]);

  const shown: Exclude<Scenario, "all"> = scenario === "all" ? "base" : scenario;
  const vis: Vis = {
    contrib: phase >= 1,
    base: phase >= 2,
    fan: phase >= 3,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const draw = () => drawChart(canvas, curves, shown, scenario === "all", years, vis);
    draw();
    const retry = window.setTimeout(draw, 80); // first-paint insurance
    const ro = new ResizeObserver(draw);
    ro.observe(canvas);
    return () => {
      window.clearTimeout(retry);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curves, shown, scenario, years, phase]);

  const finalValue = curves[shown][years];
  const contributions = start + monthly * 12 * years;
  const gains = finalValue - contributions;

  return (
    <section ref={sectionRef} id="simulator" className="relative">
      <div
        ref={stageRef}
        className={`relative flex flex-col px-6 sm:px-8 ${
          staticLayout ? "py-24" : "h-[100svh] justify-center overflow-hidden"
        }`}
        style={{ zIndex: "var(--z-content)" as unknown as number }}
      >
        <SkipPin onSkip={skip} show={!staticLayout && !interactive} />
        <div className="mx-auto w-full max-w-shell">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold text-ink">
                Portfolio Simulator
              </h2>
              <p className="mt-2 max-w-lg text-ink-2">Set the mix, watch the line.</p>
            </div>
            <Beat on={interactive} className="flex gap-5">
              {(["bear", "base", "bull", "all"] as Scenario[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  data-cursor
                  onClick={() => setScenario(s)}
                  className={`border-b pb-1 text-[13px] transition-colors ${
                    scenario === s
                      ? "border-line-strong text-ink"
                      : "border-transparent text-ink-3 hover:text-ink-2"
                  }`}
                >
                  {s === "all" ? "All three" : SCENARIO_LABEL[s]}
                </button>
              ))}
            </Beat>
          </div>

          {/* The lesson captions: one slot, three beats, driven by the pin's
              scroll phases. Static mode (mobile / reduced motion) skips
              straight to unlocked, so these never fire; the box is dropped
              entirely rather than reserving empty height for good. */}
          {!staticLayout && (
          <div className="relative mt-4 h-14 sm:h-16">
            <Beat on={phase === 1} className="absolute inset-0">
              <p className="font-display text-[clamp(1.2rem,2.6vw,1.9rem)] font-bold text-ink">
                This is you: $10,000 plus $500 a month.
              </p>
            </Beat>
            <Beat on={phase === 2} className="absolute inset-0">
              <p className="font-display text-[clamp(1.2rem,2.6vw,1.9rem)] font-bold text-ink">
                This is compounding.
              </p>
            </Beat>
            <Beat on={phase === 3} className="absolute inset-0">
              <p className="font-display text-[clamp(1.2rem,2.6vw,1.9rem)] font-bold text-ink">
                This is the market's mood.
              </p>
            </Beat>
          </div>
          )}

          <canvas
            ref={canvasRef}
            className="h-[30svh] w-full sm:h-[34svh]"
            role="img"
            aria-label={`Projected portfolio value over ${years} years with contributions, the ${SCENARIO_LABEL[shown]} growth path, and bear to bull range`}
          />

          <Beat on={interactive}>
            <div className="mt-6 border-t border-line pt-5">
              <div className="flex flex-wrap items-end gap-x-10 gap-y-4">
                <Stat label="Projected value" value={finalValue} />
                <Stat label="You put in" value={contributions} />
                <Stat label="Compounding added" value={gains} />
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-ink-3">Blended return</div>
                  <div className="tnum mt-1 font-mono text-xl text-ink sm:text-2xl">
                    {(blended + (scenario === "all" ? 0 : SCENARIO_ADJ[shown])).toFixed(1)}%/yr
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-x-10 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
                <Slider label="Starting amount" value={start} min={1000} max={100000} step={500} format={(v) => `$${v.toLocaleString()}`} onChange={setStart} />
                <Slider label="Monthly contribution" value={monthly} min={0} max={5000} step={50} format={(v) => `$${v}`} onChange={setMonthly} />
                <Slider label="Time horizon" value={years} min={1} max={40} step={1} format={(v) => `${v} yrs`} onChange={setYears} />
                <Slider label="Stocks / bonds mix" value={stocks} min={0} max={100} step={5} format={(v) => `${v}% stocks`} onChange={setStocks} />
              </div>

              <p className="mt-4 text-[12px] text-ink-3">
                Illustrative: stocks 9.5% and bonds 4% average annual returns, compounded monthly.
                Bear and bull shift the return 2.5 points. A model, not advice.
              </p>
            </div>
          </Beat>
        </div>
      </div>
    </section>
  );
}
