// The DCF engine - a faithful rebuild of the model from rohandhruv.com/viz/dcf-model.
// Pure functions only: given inputs, return the full 5-year projection and the
// three headline outputs. No DOM, no React - so it's trivially testable and reused
// by both the hero (4 live sliders) and the full /dcf page (all inputs).

export interface DcfInputs {
  rev0: number; // base revenue, Year 0 ($M)
  growth: number; // revenue growth rate (decimal, e.g. 0.12)
  margin: number; // EBITDA margin (decimal)
  daPct: number; // D&A as % of revenue (decimal)
  capexPct: number; // capex as % of revenue (decimal)
  nwcPct: number; // change in net working capital as % of revenue (decimal)
  wacc: number; // discount rate (decimal)
  tgr: number; // terminal growth rate (decimal)
  tax: number; // tax rate (decimal)
  netDebt: number; // net debt ($M); negative = net cash
  shares: number; // shares outstanding (millions)
  price?: number; // current share price ($), optional
}

export interface DcfYear {
  year: number;
  revenue: number;
  ebitda: number;
  da: number;
  ebit: number;
  nopat: number;
  capex: number;
  dnwc: number;
  fcf: number; // unlevered free cash flow
  discountFactor: number;
  pvFcf: number; // present value of that year's FCF
}

export interface DcfResult {
  years: DcfYear[];
  pvFcfs: number; // Σ present value of the 5 explicit FCFs
  terminalValue: number; // undiscounted Gordon-growth terminal value
  pvTerminal: number; // present value of the terminal value
  enterpriseValue: number;
  equityValue: number;
  intrinsicPerShare: number;
  terminalPct: number; // share of EV that comes from the terminal value
  upside?: number; // % vs current price, if a price was supplied
  valid: boolean; // false when WACC <= TGR (terminal value breaks down)
}

export const HORIZON = 5;

// Default assumptions - the same starting point as the live model on the site.
export const DEFAULT_INPUTS: DcfInputs = {
  rev0: 500,
  growth: 0.12,
  margin: 0.22,
  daPct: 0.04,
  capexPct: 0.05,
  nwcPct: 0.02,
  wacc: 0.1,
  tgr: 0.025,
  tax: 0.21,
  netDebt: 200,
  shares: 100,
  price: 45,
};

export function runDcf(input: DcfInputs): DcfResult {
  const years: DcfYear[] = [];

  for (let year = 1; year <= HORIZON; year++) {
    const revenue = input.rev0 * Math.pow(1 + input.growth, year);
    const ebitda = revenue * input.margin;
    const da = revenue * input.daPct;
    const ebit = ebitda - da;
    const nopat = ebit * (1 - input.tax);
    const capex = revenue * input.capexPct;
    const dnwc = revenue * input.nwcPct;
    const fcf = nopat + da - capex - dnwc;
    const discountFactor = Math.pow(1 + input.wacc, year);
    const pvFcf = fcf / discountFactor;
    years.push({ year, revenue, ebitda, da, ebit, nopat, capex, dnwc, fcf, discountFactor, pvFcf });
  }

  // Guard the Gordon-growth terminal value: it divides by (WACC − TGR), which
  // explodes or goes negative once WACC <= TGR. The original page had no guard,
  // so dragging WACC below TGR produced nonsense. We flag it instead.
  const valid = input.wacc > input.tgr;
  const lastFcf = years[HORIZON - 1].fcf;
  const terminalValue = valid ? (lastFcf * (1 + input.tgr)) / (input.wacc - input.tgr) : 0;
  const pvTerminal = valid ? terminalValue / Math.pow(1 + input.wacc, HORIZON) : 0;
  const pvFcfs = years.reduce((sum, y) => sum + y.pvFcf, 0);

  const enterpriseValue = pvFcfs + pvTerminal;
  const equityValue = enterpriseValue - input.netDebt;
  const intrinsicPerShare = input.shares > 0 ? equityValue / input.shares : 0;
  const terminalPct = enterpriseValue !== 0 ? (pvTerminal / enterpriseValue) * 100 : 0;
  const upside =
    input.price && input.price > 0
      ? ((intrinsicPerShare - input.price) / input.price) * 100
      : undefined;

  return {
    years,
    pvFcfs,
    terminalValue,
    pvTerminal,
    enterpriseValue,
    equityValue,
    intrinsicPerShare,
    terminalPct,
    upside,
    valid,
  };
}
