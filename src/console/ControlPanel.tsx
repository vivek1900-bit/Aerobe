// Simulation parameter control panel with strict §6 control range validation (04 §4.1).
import { useConsoleStore, type ConsoleControls } from './store';
import { CONTROL_RANGES, validateControlValue } from '../services/api';
import { Panel } from '../ui/Panel';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { Slider } from '../ui/Slider';
import { Pause, Play, RotateCcw } from 'lucide-react';

type ControlKey = keyof ConsoleControls;

interface ControlPanelProps {
  running: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}

const CONTROL_ROWS: Array<{ key: ControlKey; label: string; unit: string }> = [
  { key: 'Tset', label: 'Temperature', unit: '°C' },
  { key: 'pHset', label: 'pH Setpoint', unit: 'pH' },
  { key: 'rpm', label: 'Agitation', unit: 'rpm' },
  { key: 'vvm', label: 'Aeration', unit: 'vvm' },
  { key: 'feed', label: 'Feed Rate', unit: 'mL/h' },
];

const ORGANISMS: Array<{ id: 'ecoli' | 'yeast'; label: string }> = [
  { id: 'ecoli', label: 'E. coli' },
  { id: 'yeast', label: 'S. cerevisiae' },
];

const ORGANISM_DEFAULTS: Record<'ecoli' | 'yeast', ConsoleControls> = {
  ecoli: { Tset: 37, pHset: 7.0, rpm: 400, vvm: 1.0, feed: 0 },
  yeast: { Tset: 30, pHset: 5.0, rpm: 300, vvm: 0.8, feed: 0 },
};

export function ControlPanel({ running, onStart, onPause, onReset }: ControlPanelProps) {
  const { controls, organism, setControls, setOrganism, setControl } = useConsoleStore();

  const handleOrganism = (org: 'ecoli' | 'yeast') => {
    if (org === organism) return;
    setOrganism(org);
    setControls(ORGANISM_DEFAULTS[org]);
  };

  return (
    <Panel title="Control" index="01">
      {/* Organism */}
      <div className="flex flex-col gap-2">
        <span className="font-mono text-[11px] uppercase tracking-label text-muted">Organism</span>
        <div className="flex gap-2" role="radiogroup" aria-label="Organism">
          {ORGANISMS.map((o) => (
            <Chip
              key={o.id}
              label={o.label}
              selected={organism === o.id}
              onClick={() => handleOrganism(o.id)}
            />
          ))}
        </div>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-label text-muted">
          Illustrative — teaching simulation only.
        </p>
      </div>

      {/* Setpoint sliders */}
      <div className="mt-5 flex flex-col gap-4">
        {CONTROL_ROWS.map(({ key, label, unit }) => {
          const range = CONTROL_RANGES[key];
          return (
            <Slider
              key={key}
              label={label}
              value={controls[key]}
              min={range.min}
              max={range.max}
              step={range.step}
              unit={unit}
              onChange={(v) => {
                const clamped = validateControlValue(key, v);
                if (clamped !== null) setControl(key, clamped);
              }}
            />
          );
        })}
      </div>

      {/* Run actions — Start / Pause / Reset */}
      <div className="mt-6 flex gap-2 border-t border-line pt-4">
        <Button variant="primary" className="flex-1" onClick={onStart} disabled={running}>
          <Play className="h-3.5 w-3.5" aria-hidden="true" />
          Start
        </Button>
        <Button variant="ghost" onClick={onPause} disabled={!running} aria-label="Pause simulation">
          <Pause className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
        <Button variant="ghost" onClick={onReset} aria-label="Reset simulation">
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </div>
    </Panel>
  );
}
