// Bento control panel — organism selector + 5 parameter cards + run actions,
// all bound to the Zustand store with §6 control-range validation.
import { useState } from 'react';
import { useConsoleStore, type ConsoleControls } from './store';
import { CONTROL_RANGES, validateControlValue } from '../services/api';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { AIPlannerModal } from './AIPlannerModal';

type ControlKey = keyof ConsoleControls;

interface Props {
  running: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}

const ROWS: Array<{ key: ControlKey; label: string; unit: string; dot: string; range: string }> = [
  { key: 'Tset', label: 'Temperature', unit: '°C', dot: 'bg-amber-400', range: '20 - 45' },
  { key: 'pHset', label: 'pH Setpoint', unit: 'pH', dot: 'bg-emerald-400', range: '5.0 - 8.5' },
  { key: 'rpm', label: 'Agitation', unit: 'rpm', dot: 'bg-blue-400', range: '100 - 1000' },
  { key: 'vvm', label: 'Aeration', unit: 'vvm', dot: 'bg-cyan-400', range: '0.1 - 2.0' },
  { key: 'feed', label: 'Feed Rate', unit: 'mL/h', dot: 'bg-indigo-400', range: '0 - 50' },
];

const ORGANISMS: Array<{ id: 'ecoli' | 'yeast'; label: string; temp: string }> = [
  { id: 'ecoli', label: 'E. coli', temp: '37°C' },
  { id: 'yeast', label: 'S. cerevisiae', temp: '30°C' },
];

const ORGANISM_DEFAULTS: Record<'ecoli' | 'yeast', ConsoleControls> = {
  ecoli: { Tset: 37, pHset: 7.0, rpm: 400, vvm: 1.0, feed: 0 },
  yeast: { Tset: 30, pHset: 5.0, rpm: 300, vvm: 0.8, feed: 0 },
};

export function ControlPanel({ running, onStart, onPause, onReset }: Props) {
  const { controls, organism, setControls, setOrganism, setControl } = useConsoleStore();
  const [plannerOpen, setPlannerOpen] = useState(false);

  const handleOrganism = (org: 'ecoli' | 'yeast') => {
    if (org === organism) return;
    setOrganism(org);
    setControls(ORGANISM_DEFAULTS[org]);
  };

  return (
    <>
    <aside className="bento-card flex flex-col justify-between p-3.5">
      <div className="flex flex-col gap-3 overflow-y-auto pr-1">
        <div className="flex items-center justify-between pb-0.5">
          <h2 className="flex items-center gap-2 font-jakarta text-[13px] font-medium tracking-tight text-zinc-200">
            <span className="h-2 w-2 rounded-full bg-[#6366F1]" />
            Control &amp; Parameters
          </h2>
          <span className="rounded-full border border-[#6366F1]/20 bg-[#6366F1]/10 px-2.5 py-0.5 text-[10px] font-medium text-[#818cf8]">
            Auto PID
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1 rounded-full border border-white/[0.07] bg-[#18191E] p-1">
          {ORGANISMS.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => handleOrganism(o.id)}
              className={`flex items-center justify-center gap-2 rounded-full px-3 py-1.5 transition ${
                organism === o.id ? 'bg-[#262830] text-white shadow-sm' : 'bg-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${organism === o.id ? (o.id === 'ecoli' ? 'bg-emerald-400' : 'bg-amber-400') : 'bg-white/20'}`} />
              <span className="font-jakarta text-xs font-medium">{o.label}</span>
              <span className="font-jetbrains text-[10px] text-zinc-500">{o.temp}</span>
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {ROWS.map(({ key, label, unit, dot, range }) => {
            const r = CONTROL_RANGES[key];
            const value = controls[key];
            const decimals = (r.step.toString().split('.')[1] || '').length;
            const clamp = (v: number) => Math.max(r.min, Math.min(r.max, +v.toFixed(decimals)));
            return (
              <div key={key} className="rounded-xl border border-white/[0.06] bg-[#17181D] p-3 transition hover:border-white/[0.12]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${dot}`} />
                    <span className="font-jakarta text-[13px] font-medium text-zinc-300">{label}</span>
                  </div>
                  <div className="rounded-lg border border-white/[0.08] bg-[#101115] px-2 py-0.5 font-jetbrains text-xs font-medium tabular-nums text-zinc-100">
                    {value.toFixed(decimals)} <span className="text-[10px] text-zinc-500">{unit}</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={r.min}
                  max={r.max}
                  step={r.step}
                  value={value}
                  aria-label={label}
                  onChange={(e) => {
                    const v = validateControlValue(key, parseFloat(e.target.value));
                    if (v !== null) setControl(key, v);
                  }}
                  className="bento-range"
                />
                <div className="flex items-center justify-between pt-0.5 text-[11px] text-zinc-400">
                  <span>Range: {range}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setControl(key, clamp(value - r.step))}
                      className="flex h-5 w-5 items-center justify-center rounded-full border border-white/[0.08] bg-[#101115] text-xs text-zinc-300 hover:border-white/20"
                    >
                      -
                    </button>
                    <span className="w-9 text-center font-jetbrains text-[10px] tabular-nums text-zinc-100">{value.toFixed(decimals)}</span>
                    <button
                      type="button"
                      onClick={() => setControl(key, clamp(value + r.step))}
                      className="flex h-5 w-5 items-center justify-center rounded-full border border-white/[0.08] bg-[#101115] text-xs text-zinc-300 hover:border-white/20"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 space-y-2 border-t border-white/[0.08] pt-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={running ? onPause : onStart}
            className={`flex h-9 flex-1 items-center justify-center gap-2 rounded-full font-jakarta text-xs font-semibold tracking-wide transition active:scale-[0.98] ${
              running ? 'bg-emerald-500 text-black hover:bg-emerald-400' : 'bg-white text-black hover:bg-zinc-200'
            }`}
          >
            {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {running ? 'Batch Running' : 'Start Batch'}
          </button>
          <button
            type="button"
            onClick={onPause}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-[#1C1D22] text-xs text-zinc-300 hover:bg-white/[0.08]"
            title="Pause"
          >
            ❚❚
          </button>
          <button
            type="button"
            onClick={onReset}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-[#1C1D22] text-zinc-300 hover:bg-white/[0.08]"
            title="Reset"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => setPlannerOpen(true)}
          className="flex h-8 items-center justify-between rounded-xl border border-white/[0.06] bg-[#17181D] px-3 text-[11px] text-zinc-400 transition hover:border-indigo-400/40 hover:text-zinc-200"
        >
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
            ● Goal &amp; Plan
          </span>
          <span className="font-jetbrains text-[10px] text-indigo-300">Gemini AI</span>
        </button>
      </div>
    </aside>
    {plannerOpen && <AIPlannerModal onClose={() => setPlannerOpen(false)} />}
    </>
  );
}
