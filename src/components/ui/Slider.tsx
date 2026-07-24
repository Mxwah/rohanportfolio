// The one slider. Every instrument on the site (DCF, simulator, macro) uses
// this exact control so the whole site handles as one machine.
export function Slider(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block select-none">
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] text-ink-2">{props.label}</span>
        <span className="tnum text-[13px] text-ink">{props.format(props.value)}</span>
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
