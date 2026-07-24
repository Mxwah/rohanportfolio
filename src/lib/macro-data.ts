// The macro act's "US read": live from FRED via /api/fred when deployed with a
// key, otherwise the built-in snapshot. The site never shows an error or an
// empty strip; a missing function, missing key, or failed fetch all resolve to
// the snapshot.

export interface MacroRead {
  asOf: string;
  cpi: number; // CPI year-over-year, %
  core: number; // core CPI year-over-year, %
  unemployment: number; // unemployment rate, %
  live: boolean;
}

// Hand-checked from BLS/FRED for June 2026; the fallback and the first paint.
export const MACRO_SNAPSHOT: MacroRead = {
  asOf: "June 2026",
  cpi: 3.5,
  core: 2.6,
  unemployment: 4.1,
  live: false,
};

export async function fetchMacroRead(): Promise<MacroRead> {
  try {
    const res = await fetch("/api/fred");
    if (!res.ok) return MACRO_SNAPSHOT;
    const data = (await res.json()) as Partial<MacroRead> | null;
    if (
      !data ||
      data.live !== true ||
      typeof data.cpi !== "number" ||
      typeof data.core !== "number" ||
      typeof data.unemployment !== "number" ||
      typeof data.asOf !== "string"
    ) {
      return MACRO_SNAPSHOT;
    }
    return {
      asOf: data.asOf,
      cpi: data.cpi,
      core: data.core,
      unemployment: data.unemployment,
      live: true,
    };
  } catch {
    return MACRO_SNAPSHOT;
  }
}
