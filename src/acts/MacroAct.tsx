import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { Slider } from "../components/ui/Slider";
import { Beat } from "../components/ui/Beat";
import { SkipPin } from "../components/ui/SkipPin";
import { usePinnedPhases } from "../lib/usePinnedPhases";
import { MACRO_SNAPSHOT, fetchMacroRead } from "../lib/macro-data";

// The macro act as a cinematic walkthrough. The act pins and the scroll
// teaches the diagram in three beats: the three curves draw in one at a time,
// the equilibrium dot lands where they agree, and then the visitor's own
// scroll closes the Strait of Hormuz: the SRAS drags left under their finger
// (a scrubbed stretch, progress 0.58 to 0.82) and the dot slides into
// stagflation. The handoff keeps the oil shock live with its tab lit, and the
// controls fade up.
//
// Model, index space 0..100, potential output at 50:
//   AD: P = (100 + a) - Y,  SRAS: P = Y - s,  LRAS: Y = 50
//   Equilibrium: Y = (100 + a + s) / 2,  P = (100 + a - s) / 2


type ScenKey = "baseline" | "oil" | "cut" | "hike";

const SCENARIOS: Record<ScenKey, { label: string; a: number; s: number; story: string }> = {
  baseline: {
    label: "Baseline",
    a: 0,
    s: 0,
    story: "Long-run equilibrium. Output at potential, prices stable.",
  },
  oil: {
    label: "Oil shock",
    a: 0,
    s: -14,
    story:
      "A Strait of Hormuz closure spikes oil. SRAS shifts left: output falls while prices rise. Stagflation.",
  },
  cut: {
    label: "Rate cut",
    a: 12,
    s: 0,
    story: "The Fed cuts rates. Cheaper credit lifts spending: AD shifts right. Output and prices rise.",
  },
  hike: {
    label: "Rate hike",
    a: -12,
    s: 0,
    story: "The Fed hikes rates. Borrowing cools: AD shifts left. Output and prices ease.",
  },
};

const THRESHOLDS = [0.14, 0.34, 0.54, 0.86];
const SCRUB_START = 0.58;
const SCRUB_END = 0.82;
const OIL_S = -14;

const POTENTIAL = 50;
const INK = "#f3f3f1";
const MUTED = "#8c8c88";
const MONO = "Spline Sans Mono, monospace";

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

function storyFor(a: number, s: number): string {
  const preset = (Object.keys(SCENARIOS) as ScenKey[]).find(
    (k) => SCENARIOS[k].a === a && SCENARIOS[k].s === s,
  );
  if (preset) return SCENARIOS[preset].story;
  const parts: string[] = [];
  if (a !== 0) parts.push(`demand shifted ${a > 0 ? "right" : "left"}`);
  if (s !== 0) parts.push(`supply shifted ${s > 0 ? "right" : "left"}`);
  return `Custom shock: ${parts.join(", ")}. The equilibrium re-prices.`;
}

interface Scales {
  x: d3.ScaleLinear<number, number>;
  y: d3.ScaleLinear<number, number>;
}

function positionsFor(a: number, s: number, sc: Scales) {
  const eqY = (100 + a + s) / 2;
  const eqP = (100 + a - s) / 2;
  return {
    ad: { y1: sc.y(94 + a), y2: sc.y(6 + a) },
    sras: { y1: sc.y(6 - s), y2: sc.y(94 - s) },
    guideV: { x1: sc.x(eqY), x2: sc.x(eqY), y1: sc.y(eqP) },
    guideH: { y1: sc.y(eqP), y2: sc.y(eqP), x2: sc.x(eqY) },
    dot: { cx: sc.x(eqY), cy: sc.y(eqP) },
    adLabelY: sc.y(Math.min(94, Math.max(6, 8 + a))) - 8,
    srasLabelY: sc.y(Math.min(94, Math.max(6, 92 - s))) - 8,
  };
}

export function MacroAct() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const scalesRef = useRef<Scales | null>(null);
  const [width, setWidth] = useState(0);
  const [a, setA] = useState(0);
  const [s, setS] = useState(0);
  const [read, setRead] = useState(MACRO_SNAPSHOT);

  // Live FRED read when deployed with a key; silent snapshot fallback always.
  useEffect(() => {
    let alive = true;
    fetchMacroRead().then((r) => {
      if (alive) setRead(r);
    });
    return () => {
      alive = false;
    };
  }, []);

  const { sectionRef, stageRef, phase, reduced, staticLayout, skip } = usePinnedPhases({
    screens: 2.4,
    thresholds: THRESHOLDS,
    disableOnMobile: true,
    onProgress: (p) => {
      // The scrubbed stretch: the visitor's scroll drags SRAS left.
      const sc = scalesRef.current;
      const el = svgRef.current;
      if (!sc || !el || reduced) return;
      if (p < SCRUB_START || p > SCRUB_END + 0.04) return;
      const t = easeInOut(clamp01((p - SCRUB_START) / (SCRUB_END - SCRUB_START)));
      const pos = positionsFor(0, OIL_S * t, sc);
      const svg = d3.select(el);
      svg.select(".sras-line").attr("y1", pos.sras.y1).attr("y2", pos.sras.y2);
      svg.select(".guide-v").attr("x1", pos.guideV.x1).attr("x2", pos.guideV.x2).attr("y1", pos.guideV.y1);
      svg.select(".guide-h").attr("y1", pos.guideH.y1).attr("y2", pos.guideH.y2).attr("x2", pos.guideH.x2);
      svg.select(".eq-dot").attr("cx", pos.dot.cx).attr("cy", pos.dot.cy);
      svg.select(".sras-label").attr("y", pos.srasLabelY);
    },
  });
  const interactive = phase >= THRESHOLDS.length;

  const eqY = (100 + a + s) / 2;
  const eqP = (100 + a - s) / 2;
  const height = width > 0 ? Math.max(300, Math.min(420, width * 0.44)) : 380;

  // Handoff: the lesson ends on the oil shock, tab lit, ready to explore.
  // Fires exactly once; the instrument never overrides its owner's choices
  // on re-entry.
  const handedOff = useRef(false);
  useEffect(() => {
    if (interactive && !staticLayout && !handedOff.current) {
      handedOff.current = true;
      setS((prev) => (prev === 0 ? OIL_S : prev));
    }
  }, [interactive, staticLayout]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    setWidth(wrap.getBoundingClientRect().width);
    const ro = new ResizeObserver((entries) => setWidth(entries[0].contentRect.width));
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  // Skeleton: rebuilt on resize. In cinematic mode everything starts unseen
  // and the phase effect reveals it; under reduced motion it is simply there.
  useEffect(() => {
    const el = svgRef.current;
    if (!el || width === 0) return;

    const svg = d3.select(el).attr("viewBox", `0 0 ${width} ${height}`);
    svg.selectAll("*").remove();

    const padL = 46;
    const padB = 30;
    const padT = 10;
    const padR = 14;
    const x = d3.scaleLinear().domain([0, 100]).range([padL, width - padR]);
    const y = d3.scaleLinear().domain([0, 100]).range([height - padB, padT]);
    scalesRef.current = { x, y };
    const initOp = reduced ? 1 : 0;

    svg
      .append("clipPath")
      .attr("id", "macro-clip")
      .append("rect")
      .attr("x", padL)
      .attr("y", padT)
      .attr("width", width - padL - padR)
      .attr("height", height - padT - padB);

    const axis = svg.append("g").attr("stroke", "rgba(255,255,255,0.16)");
    axis.append("line").attr("x1", padL).attr("y1", height - padB).attr("x2", width - padR).attr("y2", height - padB);
    axis.append("line").attr("x1", padL).attr("y1", padT).attr("x2", padL).attr("y2", height - padB);
    svg
      .append("text")
      .attr("x", width - padR)
      .attr("y", height - 8)
      .attr("text-anchor", "end")
      .attr("fill", MUTED)
      .attr("font-family", MONO)
      .attr("font-size", 10)
      .text("Real GDP");
    svg
      .append("text")
      .attr("x", padL - 36)
      .attr("y", padT + 10)
      .attr("fill", MUTED)
      .attr("font-family", MONO)
      .attr("font-size", 10)
      .text("Price");

    const lras = svg.append("g").attr("class", "rv-lras").attr("opacity", initOp);
    lras
      .append("line")
      .attr("x1", x(POTENTIAL))
      .attr("x2", x(POTENTIAL))
      .attr("y1", y(97))
      .attr("y2", y(3))
      .attr("stroke", MUTED)
      .attr("stroke-dasharray", "5 5");
    lras
      .append("text")
      .attr("x", x(POTENTIAL))
      .attr("y", padT + 10)
      .attr("text-anchor", "middle")
      .attr("fill", MUTED)
      .attr("font-family", MONO)
      .attr("font-size", 10)
      .text("LRAS");

    const plot = svg.append("g").attr("clip-path", "url(#macro-clip)");

    const ghosts = plot.append("g").attr("class", "rv-ghost").attr("opacity", initOp);
    ghosts
      .append("line")
      .attr("x1", x(6)).attr("y1", y(94)).attr("x2", x(94)).attr("y2", y(6))
      .attr("stroke", "rgba(255,255,255,0.16)")
      .attr("stroke-dasharray", "3 5");
    ghosts
      .append("line")
      .attr("x1", x(6)).attr("y1", y(6)).attr("x2", x(94)).attr("y2", y(94))
      .attr("stroke", "rgba(255,255,255,0.16)")
      .attr("stroke-dasharray", "3 5");

    const gAd = plot.append("g").attr("class", "rv-ad").attr("opacity", initOp);
    gAd
      .append("line")
      .attr("class", "ad-line")
      .attr("x1", x(6)).attr("y1", y(94)).attr("x2", x(94)).attr("y2", y(6))
      .attr("stroke", INK)
      .attr("stroke-width", 1.8);
    const gSras = plot.append("g").attr("class", "rv-sras").attr("opacity", initOp);
    gSras
      .append("line")
      .attr("class", "sras-line")
      .attr("x1", x(6)).attr("y1", y(6)).attr("x2", x(94)).attr("y2", y(94))
      .attr("stroke", "rgba(243,243,241,0.72)")
      .attr("stroke-width", 1.5);

    const gEq = plot.append("g").attr("class", "rv-eq").attr("opacity", initOp);
    gEq
      .append("line")
      .attr("class", "guide-v")
      .attr("x1", x(50)).attr("y1", y(50)).attr("x2", x(50)).attr("y2", y(0))
      .attr("stroke", "rgba(255,255,255,0.28)")
      .attr("stroke-dasharray", "2 4");
    gEq
      .append("line")
      .attr("class", "guide-h")
      .attr("x1", x(0)).attr("y1", y(50)).attr("x2", x(50)).attr("y2", y(50))
      .attr("stroke", "rgba(255,255,255,0.28)")
      .attr("stroke-dasharray", "2 4");
    gEq
      .append("circle")
      .attr("class", "eq-dot")
      .attr("cx", x(50)).attr("cy", y(50)).attr("r", reduced ? 5 : 0)
      .attr("fill", INK);

    svg
      .append("text")
      .attr("class", "ad-label rv-ad-label")
      .attr("x", x(92)).attr("y", y(8) - 8)
      .attr("opacity", initOp)
      .attr("fill", INK)
      .attr("font-family", MONO)
      .attr("font-size", 11)
      .text("AD");
    svg
      .append("text")
      .attr("class", "sras-label rv-sras-label")
      .attr("x", x(92)).attr("y", y(92) - 8)
      .attr("opacity", initOp)
      .attr("fill", "rgba(243,243,241,0.72)")
      .attr("font-family", MONO)
      .attr("font-size", 11)
      .text("SRAS");
  }, [width, height, reduced]);

  // The reveal choreography: curves in sequence, then the equilibrium.
  useEffect(() => {
    const el = svgRef.current;
    if (!el || width === 0 || reduced) return;
    const svg = d3.select(el);
    const show = (sel: string, delay: number) =>
      svg.selectAll(sel).transition().delay(delay).duration(500).ease(d3.easeCubicOut).attr("opacity", 1);

    if (phase >= 1) {
      show(".rv-ad, .rv-ad-label", 0);
      show(".rv-sras, .rv-sras-label", 350);
      show(".rv-lras", 700);
      show(".rv-ghost", 700);
    }
    if (phase >= 2) {
      show(".rv-eq", 0);
      svg.select(".eq-dot").transition().duration(450).ease(d3.easeBackOut).attr("r", 5);
    }
  }, [phase, width, reduced]);

  // Interactive updates: glide to the live (a, s). Under reduced motion the
  // attributes set directly; no timers, no tweens.
  useEffect(() => {
    const el = svgRef.current;
    const sc = scalesRef.current;
    if (!el || !sc || width === 0) return;
    const pos = positionsFor(a, s, sc);
    const svg = d3.select(el);

    const apply = (selector: string, attrs: Record<string, number>) => {
      const sel = svg.select<SVGElement>(selector);
      if (reduced) {
        for (const [k, v] of Object.entries(attrs)) sel.attr(k, v);
        return;
      }
      const t = sel.transition().duration(650).ease(d3.easeCubicOut);
      for (const [k, v] of Object.entries(attrs)) t.attr(k, v);
    };

    apply(".ad-line", pos.ad);
    apply(".sras-line", pos.sras);
    apply(".guide-v", pos.guideV);
    apply(".guide-h", pos.guideH);
    apply(".eq-dot", pos.dot);
    apply(".ad-label", { y: pos.adLabelY });
    apply(".sras-label", { y: pos.srasLabelY });
  }, [a, s, width, height, reduced]);

  const activeKey = (Object.keys(SCENARIOS) as ScenKey[]).find(
    (k) => SCENARIOS[k].a === a && SCENARIOS[k].s === s,
  );

  return (
    <section ref={sectionRef} id="macro" className="relative">
      <div
        ref={stageRef}
        className={`relative flex flex-col justify-center px-6 sm:px-8 ${
          staticLayout ? "min-h-[100svh] py-24" : "h-[100svh] overflow-hidden"
        }`}
        style={{ zIndex: "var(--z-content)" as unknown as number }}
      >
        <SkipPin onSkip={skip} show={!staticLayout && !interactive} />
        <div className="mx-auto w-full max-w-shell">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold text-ink">The macro model</h2>
              <p className="mt-2 max-w-lg text-ink-2">
                Aggregate demand meets aggregate supply.
              </p>
            </div>
            <Beat on={interactive} className="flex gap-5">
              {(Object.keys(SCENARIOS) as ScenKey[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  data-cursor
                  onClick={() => {
                    setA(SCENARIOS[k].a);
                    setS(SCENARIOS[k].s);
                  }}
                  className={`border-b pb-1 text-[13px] transition-colors ${
                    activeKey === k
                      ? "border-line-strong text-ink"
                      : "border-transparent text-ink-3 hover:text-ink-2"
                  }`}
                >
                  {SCENARIOS[k].label}
                </button>
              ))}
            </Beat>
          </div>

          {/* The lesson captions. */}
          <div className="relative mt-4 h-14 sm:h-16">
            <Beat on={phase === 1} className="absolute inset-0">
              <p className="font-display text-[clamp(1.2rem,2.6vw,1.9rem)] font-bold text-ink">
                Three curves run the economy.
              </p>
            </Beat>
            <Beat on={phase === 2} className="absolute inset-0">
              <p className="font-display text-[clamp(1.2rem,2.6vw,1.9rem)] font-bold text-ink">
                Equilibrium is where they agree.
              </p>
            </Beat>
            <Beat on={phase === 3} className="absolute inset-0">
              <p className="font-display text-[clamp(1.2rem,2.6vw,1.9rem)] font-bold text-ink">
                Now close the Strait of Hormuz.
              </p>
            </Beat>
          </div>

          <div ref={wrapRef} className="w-full">
            <svg
              ref={svgRef}
              className="w-full"
              style={{ display: "block", height }}
              role="img"
              aria-label="Aggregate demand and aggregate supply diagram with a movable equilibrium"
            />
          </div>

          <Beat on={interactive}>
            <div className="mt-6 border-t border-line pt-5">
              <div className="flex flex-wrap items-end gap-x-10 gap-y-4">
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-ink-3">Real GDP</div>
                  <div className="tnum mt-1 font-mono text-xl text-ink sm:text-2xl">
                    {eqY.toFixed(0)} {eqY > POTENTIAL ? "▲" : eqY < POTENTIAL ? "▼" : ""}
                    <span className="ml-2 text-[13px] text-ink-2">
                      {eqY === POTENTIAL ? "at potential" : eqY > POTENTIAL ? "above potential" : "below potential"}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-ink-3">Price level</div>
                  <div className="tnum mt-1 font-mono text-xl text-ink sm:text-2xl">
                    {eqP.toFixed(0)} {eqP > 50 ? "▲" : eqP < 50 ? "▼" : ""}
                    <span className="ml-2 text-[13px] text-ink-2">
                      {eqP === 50 ? "stable" : eqP > 50 ? "inflationary" : "disinflationary"}
                    </span>
                  </div>
                </div>
                <p className="max-w-md text-[14px] leading-relaxed text-ink-2">{storyFor(a, s)}</p>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-x-10 gap-y-4 sm:grid-cols-2">
                <Slider label="Demand shift (AD)" value={a} min={-15} max={15} step={1} format={(v) => (v > 0 ? `+${v}` : `${v}`)} onChange={setA} />
                <Slider label="Supply shift (SRAS)" value={s} min={-15} max={15} step={1} format={(v) => (v > 0 ? `+${v}` : `${v}`)} onChange={setS} />
              </div>

              <p className="tnum mt-4 text-[12px] text-ink-3">
                US read, {read.asOf}: CPI {read.cpi}% YoY, core {read.core}%, unemployment{" "}
                {read.unemployment}%. {read.live ? "Live from FRED." : "Monthly snapshot."}
              </p>
            </div>
          </Beat>
        </div>
      </div>
    </section>
  );
}
