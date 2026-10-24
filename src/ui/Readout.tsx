// Telemetry readout (07 §6): mono muted label over large display value + small unit.
// Flashes `broth` for 300 ms whenever the value changes (signature interaction #6).
import { useEffect, useRef, useState } from 'react';

export interface ReadoutProps {
  label: string;
  value: string | number;
  unit?: string;
  className?: string;
}

export function Readout({ label, value, unit, className = '' }: ReadoutProps) {
  const [flash, setFlash] = useState(false);
  const prev = useRef<string | number>(value);

  useEffect(() => {
    if (prev.current !== value) {
      prev.current = value;
      setFlash(true);
      const timer = setTimeout(() => setFlash(false), 300);
      return () => clearTimeout(timer);
    }
  }, [value]);

  return (
    <div className={`flex flex-col ${className}`}>
      <span className="font-mono text-[11px] uppercase tracking-label text-muted">{label}</span>
      <span
        className={`font-display text-3xl leading-none tabular-nums transition-colors duration-300 ${
          flash ? 'text-broth' : 'text-text'
        }`}
      >
        {value}
      </span>
      {unit ? (
        <span className="font-mono text-[10px] uppercase tracking-label text-muted">{unit}</span>
      ) : null}
    </div>
  );
}
