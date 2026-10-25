// Centre column — 3D console reactor + hero telemetry strip (Bento).
// Solid 3D / X-Ray toggle drives the wireframe; fault drives the red thermal glow.
import { useState } from 'react';
import { useConsoleStore } from './store';
import { ReactorViewport } from './ReactorViewport';

const HERO = [
  { key: 'X', label: 'Biomass', unit: 'g/L', dot: 'bg-amber-400', bar: 'from-amber-500 to-amber-300', tag: 'Lag', tagC: 'text-amber-400 bg-amber-400/10', get: (s: any) => s?.X ?? 0, pct: (s: any) => Math.min(100, ((s?.X ?? 0) / 20) * 100) },
  { key: 'DO', label: 'Dissolved O₂', unit: '%', dot: 'bg-cyan-400', bar: 'from-cyan-500 to-blue-400', tag: 'Aerobic', tagC: 'text-cyan-400 bg-cyan-400/10', get: (s: any) => s?.DO ?? 0, pct: (s: any) => Math.min(100, s?.DO ?? 0) },
  { key: 'T', label: 'Temperature', unit: '°C', dot: 'bg-blue-500', bar: 'from-blue-500 to-indigo-400', tag: 'Steady', tagC: 'text-emerald-400 bg-emerald-400/10', get: (s: any) => s?.T ?? 0, pct: (s: any) => Math.min(100, ((s?.T ?? 0) / 45) * 100) },
  { key: 'pH', label: 'pH', unit: 'pH', dot: 'bg-emerald-400', bar: 'from-emerald-500 to-teal-400', tag: 'Optimal', tagC: 'text-emerald-400 bg-emerald-400/10', get: (s: any) => s?.pH ?? 0, pct: (s: any) => Math.min(100, ((s?.pH ?? 0) / 14) * 100) },
];

export function ReactorPanel({ running, fault }: { running: boolean; fault: boolean }) {
  const { snapshot } = useConsoleStore();
  const [xray, setXray] = useState(false);
  const s: any = snapshot;

  const fmt = (key: string, v: number) =>
    key === 'pH' ? v.toFixed(2) : key === 'T' ? v.toFixed(1) : key === 'DO' ? v.toFixed(1) : v.toFixed(2);

  return (
    <section className="relative flex h-full flex-col justify-between overflow-hidden bento-card">
      <div className="pointer-events-none absolute left-4 right-4 top-3.5 z-20 flex items-center justify-between">
        <div className="flex items-center gap-2 font-jakarta text-[13px] font-medium text-zinc-200">
          <span className={`h-2 w-2 animate-pulse rounded-full ${fault ? 'bg-red-500' : 'bg-emerald-400'}`} />
          <span>Vessel Digital Twin // TWIN-300L</span>
        </div>
        <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/[0.08] bg-[#1A1B22]/80 p-0.5 font-jakarta text-xs backdrop-blur-md">
          <button
            type="button"
            onClick={() => setXray(false)}
            className={`rounded-full px-3 py-1 text-[11px] transition ${!xray ? 'bg-white/10 font-medium text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}
          >
            Solid 3D
          </button>
          <button
            type="button"
            onClick={() => setXray(true)}
            className={`rounded-full px-3 py-1 text-[11px] transition ${xray ? 'bg-cyan-400/20 font-medium text-cyan-300 shadow-sm' : 'text-zinc-400 hover:text-white'}`}
          >
            X-Ray
          </button>
        </div>
      </div>

      {/* 3D reactor */}
      <div className="relative flex-1 overflow-hidden">
        <ReactorViewport running={running} xray={xray} fault={fault} />
        {/* probe HUD pins */}
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div className="relative h-[360px] w-[300px]">
            <div className="absolute -left-16 top-[28%] flex items-center gap-1.5">
              <span className="font-jakarta text-[11px] font-medium text-zinc-400">pH</span>
              <div className="h-px w-8 bg-emerald-500/80" />
              <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            </div>
            <div className="absolute -left-16 top-[48%] flex items-center gap-1.5">
              <span className="font-jakarta text-[11px] font-medium text-zinc-400">DO</span>
              <div className={`h-px w-8 ${fault ? 'bg-red-500/80' : 'bg-blue-500/80'}`} />
              <div className={`h-2 w-2 rounded-full ${fault ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-blue-400 shadow-[0_0_8px_#60a5fa]'}`} />
            </div>
            <div className="absolute -left-16 top-[68%] flex items-center gap-1.5">
              <span className="font-jakarta text-[11px] font-medium text-zinc-400">Temp</span>
              <div className="h-px w-8 bg-amber-500/80" />
              <div className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
            </div>
          </div>
        </div>
      </div>

      {/* hero telemetry strip */}
      <div className="z-20 shrink-0 p-3">
        <div className="grid grid-cols-4 gap-2.5">
          {HERO.map((h) => (
            <div key={h.key} className="relative overflow-hidden rounded-xl border border-white/[0.07] bg-[#17181D] p-3 text-left">
              <div className={`absolute left-0 top-0 h-0.5 w-full ${h.dot}`} />
              <div className="mb-1 flex items-center justify-between">
                <span className="font-jakarta text-xs text-zinc-400">{h.label}</span>
                <span className={`rounded-full px-1.5 py-0.5 font-jakarta text-[9px] font-medium ${h.tagC}`}>{h.tag}</span>
              </div>
              <div className="my-0.5 font-jakarta text-2xl font-semibold leading-tight tracking-tight tabular-nums text-white">
                {fmt(h.key, h.get(s))} <span className="font-jakarta text-xs font-normal text-zinc-500">{h.unit}</span>
              </div>
              <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div className={`h-full rounded-full bg-gradient-to-r ${h.bar}`} style={{ width: `${h.pct(s)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
