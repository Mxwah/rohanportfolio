// Live bridge from the DCF model to the hero atmosphere. The hero writes its
// normalized 5-year FCF curve here whenever the model re-solves; the point
// field reads it every frame and shapes its elevation to match. Dragging WACC
// literally reshapes the weather of the page.

export const heroCurve = new Float32Array(5).fill(0.5);

export function setHeroCurve(values: number[]): void {
  if (values.length === 0) return;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  for (let i = 0; i < heroCurve.length; i++) {
    const v = values[Math.min(i, values.length - 1)];
    heroCurve[i] = 0.15 + 0.7 * ((v - min) / span);
  }
}
