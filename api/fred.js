// Serverless proxy for the macro act's "US read" strip. Keeps the FRED API key
// server-side (never in the browser bundle) and returns a tiny, cached JSON:
// CPI year-over-year, core CPI year-over-year, and the unemployment rate.
//
// Deploy target: Vercel (this file becomes /api/fred automatically). On any
// problem it returns { live: false } with HTTP 200 so the client silently
// falls back to the built-in snapshot rather than showing an error.

const FRED = "https://api.stlouisfed.org/fred/series/observations";

async function series(id, key, limit) {
  const url = `${FRED}?series_id=${id}&api_key=${key}&file_type=json&sort_order=desc&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`FRED ${id} -> ${res.status}`);
  const json = await res.json();
  return (json.observations || [])
    .filter((o) => o.value !== ".")
    .map((o) => ({ date: o.date, value: parseFloat(o.value) }));
}

function yoy(obs) {
  // obs sorted newest-first; index 12 is ~one year earlier for monthly data.
  if (obs.length < 13) return null;
  const now = obs[0].value;
  const yearAgo = obs[12].value;
  if (!yearAgo) return null;
  return Math.round(((now - yearAgo) / yearAgo) * 1000) / 10;
}

function asOfLabel(dateStr) {
  const d = new Date(dateStr + "T00:00:00Z");
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

export default async function handler(_req, res) {
  const key = process.env.FRED_API_KEY;
  if (!key) {
    res.status(200).json({ live: false, reason: "no-key" });
    return;
  }
  try {
    const [cpiObs, coreObs, unrateObs] = await Promise.all([
      series("CPIAUCSL", key, 13),
      series("CPILFESL", key, 13),
      series("UNRATE", key, 1),
    ]);
    const cpi = yoy(cpiObs);
    const core = yoy(coreObs);
    const unemployment = unrateObs[0] ? Math.round(unrateObs[0].value * 10) / 10 : null;
    if (cpi === null || core === null || unemployment === null) {
      res.status(200).json({ live: false, reason: "incomplete" });
      return;
    }
    // Cache at the edge for 12h; monthly data does not move faster.
    res.setHeader("Cache-Control", "s-maxage=43200, stale-while-revalidate=86400");
    res.status(200).json({
      live: true,
      asOf: asOfLabel(cpiObs[0].date),
      cpi,
      core,
      unemployment,
    });
  } catch (err) {
    res.status(200).json({ live: false, reason: String(err && err.message ? err.message : err) });
  }
}
