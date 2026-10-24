// Simulation parameter control panel with strict §6 control range validation.
// Person 2 owns src/console/** per 03_ARCHITECTURE.md §4.

import { useEffect } from 'react';
import { useConsoleStore, type ConsoleControls } from './store';
import { CONTROL_RANGES, validateControlValue } from '../services/api';

type ControlKey = keyof ConsoleControls;

interface ControlPanelProps {
  onApply: (controls: ConsoleControls) => void;
}

export function ControlPanel({ onApply }: ControlPanelProps) {
  const { controls, organism, setControls, setOrganism, setControl, setSnapshot } =
    useConsoleStore();

  const handleChange = (key: ControlKey, value: string) => {
    const parsed = parseFloat(value);
    const clamped = validateControlValue(key, parsed);
    if (clamped !== null) {
      setControl(key, clamped);
    }
  };

  const handleApply = () => {
    onApply(controls);
  };

  const handleOrganismChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const org = e.target.value as 'ecoli' | 'yeast';
    setOrganism(org);
    const defaults =
      org === 'ecoli' ? { Tset: 37, pHset: 7.0, rpm: 400, vvm: 1.0, feed: 0 } : { Tset: 30, pHset: 5.0, rpm: 300, vvm: 0.8, feed: 0 };
    setControls(defaults);
  };

  useEffect(() => {
    setSnapshot(null);
  }, [organism, setSnapshot]);

  const controlRows: Array<{ key: ControlKey; label: string; unit: string }> = [
    { key: 'Tset', label: 'Temperature', unit: '°C' },
    { key: 'pHset', label: 'pH Setpoint', unit: 'pH' },
    { key: 'rpm', label: 'Agitation', unit: 'rpm' },
    { key: 'vvm', label: 'Aeration', unit: 'vvm' },
    { key: 'feed', label: 'Feed Rate', unit: 'mL/h' },
  ];

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-white/50 backdrop-blur-sm">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">Organism</label>
        <select
          value={organism}
          onChange={handleOrganismChange}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm bg-white"
        >
          <option value="ecoli">E. coli (aerobic, glucose)</option>
          <option value="yeast">S. cerevisiae (aerobic, glucose)</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">Illustrative parameters — teaching simulation only.</p>
      </div>

      <div className="space-y-3">
        {controlRows.map(({ key, label, unit }) => {
          const range = CONTROL_RANGES[key];
          return (
            <div key={key} className="flex flex-col gap-1">
              <div className="flex justify-between text-sm">
                <label className="font-medium text-gray-700">{label}</label>
                <span className="text-gray-500">{controls[key].toFixed(range.step < 1 ? 2 : 0)} {unit}</span>
              </div>
              <input
                type="number"
                step={range.step}
                min={range.min}
                max={range.max}
                value={controls[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <p className="text-xs text-gray-400">Range: {range.min}–{range.max} {unit} (step {range.step})</p>
            </div>
          );
        })}
      </div>

      <button
        onClick={handleApply}
        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        Apply to Simulation
      </button>
    </section>
  );
}
