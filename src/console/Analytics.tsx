// Analytics — Bento kinetic model, phase trajectory, optimization + sensitivity.
import { useMemo } from 'react';
import { useConsoleStore } from './store';
import { ORG, type Snapshot } from '../sim/index';

const W = 720;
const H = 260;

function linePath(rows: Snapshot[], acc: (s: Snapshot) => number, yMin: number, yMax: number): string {
  if (rows.length < 2) return '';
  const n = rows.length;
  const x = (i: number) => (i / (n - 1)) * W;
  const y = (v: number) => H - Math.max(0, Math.min(H, ((v - yMin) / (yMax - yMin)) * H));
  return rows.map((s, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(acc(s)).toFixed(1)}`).join(' ');
}

function areaPath(rows: Snapshot[], acc: (s: Snapshot) => number, yMin: number, yMax: number): string {
  const line = linePath(rows, acc, yMin, yMax);
  return line ? `${line} L${W},${H} L0,${H} Z` : '';
}

const SENSITIVITY = [
  { label: 'Agitation (RPM)', neg: 38, pos: 27 },
  { label: 'Aeration (VVM)', neg: 25, pos: 17 },
  { label: 'Temperature (°C)', neg: 31, pos: 7 },
  { label: 'pH Setpoint', neg: 14, pos: 6 },
];

export function Analytics() {
  const { history, snapshot, organism, alarms } = useConsoleStore();
  const p = ORG[organism] ?? ORG.ecoli;
  const rows = history.length > 1 ? history : [];
  const last = snapshot;

  const monodPath = useMemo(() => {
    let d = '';
    for (let i = 0; i <= 24; i++) {
      const S = (i / 24) * 12;
      const mu = p.mumax * (S / (p.Ks + S));
      d += `${i === 0 ? 'M' : 'L'}${(30 + (S / 12) * 220).toFixed(1)},${(110 - (mu / p.mumax) * 90).toFixed(1)} `;
    }
    return d;
  }, [p]);

  const opS = last ? last.S : p.S0;
  const opMu = last ? last.mu : 0;
  const kLa = last ? last.kLa : 0;
  const our = last ? last.OUR : 0;

  return (
    <div className="grid gap-3 lg:grid-cols-[310px_minmax(0,1fr)_340px]">
      {/* Left — kinetics */}
      <div className="flex flex-col gap-3">
        <div className="bento-card p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-2 font-jakarta text-xs font-semibold uppercase tracking-wider text-zinc-300">
              <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#38BDF8]" />
              Kinetic Model
            </span>
            <span className="font-jetbrains text-[10px] text-zinc-500">ODE-RK4</span>
          </div>
          <div className="rounded-lg border border-white/[0.05] bg-[#17181D] p-2">
            <svg viewBox="0 0 260 120" className="w-full" role="img" aria-label="Monod growth curve">
              <line x1="30" y1="110" x2="250" y2="110" stroke="#1B1D23" strokeWidth="1" />
              <line x1="30" y1="20" x2="30" y2="110" stroke="#1B1D23" strokeWidth="1" />
              <line x1="30" y1="20" x2="250" y2="20" stroke="#1B1D23" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
              <text x="250" y="108" fontSize="7" fill="#71717A" textAnchor="end" fontFamily="JetBrains Mono, monospace">S [g/L]</text>
              <text x="250" y="18" fontSize="7" fill="#F59E0B" textAnchor="end" fontFamily="JetBrains Mono, monospace">μ_max = {p.mumax.toFixed(2)}</text>
              <path d={monodPath} fill="none" stroke="#38BDF8" strokeWidth="2" />
              <circle cx={30 + (opS / 12) * 220} cy={110 - (opMu / p.mumax) * 90} r="4" fill="#F2A93B" stroke="#fff" strokeWidth="1" />
            </svg>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-1 text-center">
            {[
              ['μ_max', `${p.mumax.toFixed(2)}`],
              ['K_s', `${p.Ks.toFixed(2)}`],
              ['Y_x/s', `${p.Yxs.toFixed(2)}`],
            ].map(([l, v]) => (
              <div key={l} className="rounded-lg border border-white/[0.05] bg-[#17181D] p-2">
                <div className="font-jetbrains text-[9px] uppercase text-zinc-500">{l}</div>
                <div className="font-jetbrains text-[11px] font-semibold tabular-nums text-zinc-200">{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bento-card p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-jakarta text-xs font-semibold uppercase tracking-wider text-zinc-300">Mass Transfer</span>
            <span className="font-jetbrains text-[10px] text-zinc-500">Agit/Air</span>
          </div>
          <div className="flex flex-col gap-2 font-jetbrains text-xs">
            {[
              ['kLa', `${kLa.toFixed(1)} h⁻¹`, 'text-sky-400'],
              ['OUR', `${our.toFixed(2)} mmol/L·h`, 'text-emerald-400'],
              ['D.O.', `${(last?.DO ?? 0).toFixed(1)} %`, 'text-amber-300'],
            ].map(([l, v, c]) => (
              <div key={l} className="flex items-center justify-between">
                <span className="uppercase text-zinc-500">{l}</span>
                <span className={`tabular-nums ${c}`}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Center — trajectory */}
      <div className="bento-card flex min-w-0 flex-col p-3.5">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
          <span className="flex items-center gap-2 font-jakarta text-sm font-bold text-white">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_#22C55E]" />
            Phase Trajectory // B24-814
          </span>
          <span className="font-jetbrains text-[10px] tabular-nums text-zinc-500">t = {(last?.t_h ?? 0).toFixed(2)} h</span>
        </div>
        <div className="flex items-center gap-4 py-1 font-jakarta text-xs text-zinc-300">
          <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_6px_#F2A93B]" />Biomass X</span>
          <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-cyan-400" />Substrate S</span>
          <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-blue-400" />DO %</span>
          <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-emerald-400" />pH</span>
        </div>
        <div className="my-1 flex flex-1 rounded-xl border border-white/[0.06] bg-[#0E0F12] p-2">
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-full w-full" role="img" aria-label="Phase trajectory chart">
            <defs>
              <linearGradient id="an-x" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#F2A93B" stopOpacity="0.25" /><stop offset="100%" stopColor="#F2A93B" stopOpacity="0" /></linearGradient>
              <linearGradient id="an-s" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#38BDF8" stopOpacity="0.15" /><stop offset="100%" stopColor="#38BDF8" stopOpacity="0" /></linearGradient>
            </defs>
            {[0.25, 0.5, 0.75].map((q) => (
              <line key={q} x1="0" y1={H * q} x2={W} y2={H * q} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" strokeDasharray="4 4" />
            ))}
            <path d={areaPath(rows, (s) => s.S, 0, 12)} fill="url(#an-s)" />
            <path d={areaPath(rows, (s) => s.X, 0, 20)} fill="url(#an-x)" />
            <path d={linePath(rows, (s) => s.X, 0, 20)} fill="none" stroke="#F2A93B" strokeWidth="2.5" />
            <path d={linePath(rows, (s) => s.S, 0, 12)} fill="none" stroke="#38BDF8" strokeWidth="2" />
            <path d={linePath(rows, (s) => s.DO, 0, 100)} fill="none" stroke="#2F8CFF" strokeWidth="2" strokeDasharray="5 2" />
            <path d={linePath(rows, (s) => s.pH, 4, 9)} fill="none" stroke="#22C55E" strokeWidth="1.8" />
          </svg>
        </div>
      </div>

      {/* Right — optimization + sensitivity + anomalies */}
      <div className="flex flex-col gap-3">
        <div className="bento-card p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-jakarta text-xs font-semibold uppercase tracking-wider text-zinc-300">AI Advisor</span>
            <span className="rounded border border-purple-500/20 bg-purple-500/10 px-1.5 py-0.5 font-jetbrains text-[10px] text-purple-400">Neural Twin</span>
          </div>
          <div className="rounded-lg border border-white/[0.06] bg-[#17181D] p-2.5 font-jakarta text-xs leading-relaxed text-zinc-300">
            <span className="font-semibold text-amber-400">Prescriptive:</span> agitation step-up before feed transition prevents hypoxic DO drop below 30%. Values illustrative.
          </div>
          <div className="mt-2 flex justify-between px-1 font-jetbrains text-[10px] text-zinc-400">
            <span>Est. yield gain: <b className="text-emerald-400">+6.4%</b></span>
            <span>DO margin: <b className="text-sky-400">+12%</b></span>
          </div>
        </div>

        <div className="bento-card p-3">
          <div className="mb-2 font-jakarta text-xs font-semibold uppercase tracking-wider text-zinc-300">Sensitivity ∂Y/∂P</div>
          <div className="flex flex-col gap-2.5">
            {SENSITIVITY.map((s) => (
              <div key={s.label}>
                <div className="mb-0.5 flex justify-between font-jetbrains text-[10px] text-zinc-300">
                  <span>{s.label}</span>
                  <span className="tabular-nums text-zinc-400">-{s.neg}% / +{s.pos}%</span>
                </div>
                <div className="relative h-3 rounded bg-[#17181D]">
                  <div className="absolute inset-y-0 left-1/2 w-px bg-white/20" />
                  <div className="absolute inset-y-1 right-1/2 rounded-l bg-rose-500/80" style={{ width: `${s.neg / 2}%` }} />
                  <div className="absolute inset-y-1 left-1/2 rounded-r bg-emerald-400/80" style={{ width: `${s.pos / 2}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bento-card p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-jakarta text-xs font-semibold uppercase tracking-wider text-zinc-300">Anomalies</span>
            <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 font-jetbrains text-[10px] text-emerald-400">
              {alarms.filter((a) => a.severity === 'danger').length} Critical
            </span>
          </div>
          {alarms.length === 0 ? (
            <p className="font-jakarta text-[11px] text-zinc-500">No anomalies logged</p>
          ) : (
            <ul className="flex flex-col gap-2" aria-live="polite">
              {alarms.map((a) => (
                <li key={a.id} className={`rounded-lg border p-2 font-jetbrains text-[11px] ${a.severity === 'danger' ? 'border-red-500/20 bg-red-500/[0.03] text-red-400' : 'border-amber-500/20 bg-amber-500/[0.03] text-amber-200'}`}>
                  [{a.t_h.toFixed(1)}h] {a.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
