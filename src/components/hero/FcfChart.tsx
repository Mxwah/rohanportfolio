import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import type { DcfYear } from "../../lib/dcf";
import { fmtMoney } from "../../lib/format";

// The five-year cash-flow chart, drawn by hand with d3 so we control every mark.
// Solid bars = unlevered FCF, outlined bars = its present value. Monochrome -
// the two series read apart by fill vs. stroke, never by color. On first mount
// the bars rise in sequence; while a slider is dragged they update instantly.

const INK = "#f3f3f1";
const MUTED = "#8c8c88";
const LINE = "rgba(255,255,255,0.09)";

export function FcfChart({ years }: { years: DcfYear[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const drawnOnce = useRef(false);
  const [width, setWidth] = useState(0);
  const height = 260;

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width);
    });
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || width === 0) return;

    const margin = { top: 16, right: 8, bottom: 28, left: 46 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current).attr("viewBox", `0 0 ${width} ${height}`);
    svg.selectAll("*").remove();
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x0 = d3
      .scaleBand<number>()
      .domain(years.map((y) => y.year))
      .range([0, innerW])
      .padding(0.3);
    const x1 = d3
      .scaleBand<string>()
      .domain(["fcf", "pv"])
      .range([0, x0.bandwidth()])
      .padding(0.16);

    const maxV = d3.max(years, (y) => Math.max(y.fcf, y.pvFcf)) ?? 1;
    const y = d3.scaleLinear().domain([0, maxV]).nice().range([innerH, 0]);

    // Faint horizontal gridlines + y labels.
    const yTicks = y.ticks(4);
    g.append("g")
      .selectAll("line")
      .data(yTicks)
      .join("line")
      .attr("x1", 0)
      .attr("x2", innerW)
      .attr("y1", (d) => y(d))
      .attr("y2", (d) => y(d))
      .attr("stroke", LINE);
    g.append("g")
      .selectAll("text")
      .data(yTicks)
      .join("text")
      .attr("x", -10)
      .attr("y", (d) => y(d))
      .attr("dy", "0.32em")
      .attr("text-anchor", "end")
      .attr("fill", MUTED)
      .attr("font-family", "Spline Sans Mono, monospace")
      .attr("font-size", 10)
      .text((d) => fmtMoney(d));

    // x labels.
    g.append("g")
      .selectAll("text")
      .data(years)
      .join("text")
      .attr("x", (d) => (x0(d.year) ?? 0) + x0.bandwidth() / 2)
      .attr("y", innerH + 18)
      .attr("text-anchor", "middle")
      .attr("fill", MUTED)
      .attr("font-family", "Spline Sans Mono, monospace")
      .attr("font-size", 10)
      .text((d) => `Yr ${d.year}`);

    const dur = drawnOnce.current ? 0 : 900;
    const baseline = y(0);

    const group = g
      .append("g")
      .selectAll("g")
      .data(years)
      .join("g")
      .attr("transform", (d) => `translate(${x0(d.year) ?? 0},0)`);

    // FCF - solid.
    group
      .append("rect")
      .attr("x", x1("fcf") ?? 0)
      .attr("width", x1.bandwidth())
      .attr("y", baseline)
      .attr("height", 0)
      .attr("fill", INK)
      .transition()
      .duration(dur)
      .delay((_d, i) => (drawnOnce.current ? 0 : i * 70))
      .ease(d3.easeCubicOut)
      .attr("y", (d) => y(Math.max(0, d.fcf)))
      .attr("height", (d) => Math.abs(baseline - y(Math.max(0, d.fcf))));

    // PV of FCF - outlined.
    group
      .append("rect")
      .attr("x", x1("pv") ?? 0)
      .attr("width", x1.bandwidth())
      .attr("y", baseline)
      .attr("height", 0)
      .attr("fill", "none")
      .attr("stroke", INK)
      .attr("stroke-width", 1)
      .transition()
      .duration(dur)
      .delay((_d, i) => (drawnOnce.current ? 0 : i * 70 + 40))
      .ease(d3.easeCubicOut)
      .attr("y", (d) => y(Math.max(0, d.pvFcf)))
      .attr("height", (d) => Math.abs(baseline - y(Math.max(0, d.pvFcf))));

    drawnOnce.current = true;
  }, [years, width]);

  return (
    <div ref={wrapRef} className="w-full" role="img" aria-label="Five-year unlevered free cash flow and its present value">
      <svg ref={svgRef} className="w-full" style={{ display: "block", height }} />
      <div className="mt-3 flex items-center gap-5 text-[11px] text-ink-3">
        <span className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5" style={{ background: INK }} /> Unlevered FCF
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5" style={{ border: `1px solid ${INK}` }} /> PV of FCF
        </span>
      </div>
    </div>
  );
}
