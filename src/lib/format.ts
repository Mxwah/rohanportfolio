// Number formatting for the model readouts. Everything that reaches the screen
// is rounded here so floating-point artifacts never leak into the UI.

export function fmtMoney(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1000) return `$${(v / 1000).toFixed(2)}B`;
  return `$${v.toFixed(0)}M`;
}

export function fmtShare(v: number): string {
  return `$${v.toFixed(2)}`;
}

export function fmtPct(v: number, dec = 1): string {
  return `${v.toFixed(dec)}%`;
}
