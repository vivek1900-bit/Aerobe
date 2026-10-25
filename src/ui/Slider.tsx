// Custom slider (07 §6): 2px track with live percentage gradient fill, precision thumb
// that scales and glows on hover/focus, compact inline numeric input with focus:border-signal.
import type { ChangeEvent } from 'react';

export interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  disabled = false,
}: SliderProps) {
  const clampedPct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  const fill = `linear-gradient(to right, #2F8CFF 0%, #2F8CFF ${clampedPct}%, #162436 ${clampedPct}%, #162436 100%)`;

  const handleRange = (e: ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value));
  const handleNumber = (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.valueAsNumber;
    if (!Number.isNaN(v)) onChange(v);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <label className="font-mono text-[11px] uppercase tracking-label text-muted">{label}</label>
        <span className="font-mono text-xs tabular-nums text-text">
          {value}
          {unit ? ` ${unit}` : ''}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleRange}
          disabled={disabled}
          aria-label={label}
          className="slider-track flex-1"
          style={{ background: fill }}
        />
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleNumber}
          disabled={disabled}
          aria-label={`${label} numeric input`}
          className="w-20 border border-line bg-panel2 px-2 py-1 font-mono text-xs tabular-nums text-text outline-none transition-colors focus:border-signal disabled:opacity-40"
        />
      </div>
      <div className="flex justify-between font-mono text-[10px] uppercase tracking-label text-muted">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
