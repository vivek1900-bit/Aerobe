// Report — Bento GMP batch summary: KPI cards, telemetry, mass balance, audit,
// alarm chronology, e-signature. Reads the store.
import { useMemo } from 'react';
import { useConsoleStore } from './store';
import { ORG, type Snapshot } from '../sim/index';

const W = 720;
const H = 220;

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

export function Report() {
  const { history, snapshot, controls, organism, alarms } = useConsoleStore();
  const p = ORG[organism] ?? ORG.ecoli;
  const rows = history.length > 1 ? history : [];
  const last = snapshot;

  const kpi = useMemo(() => {
    if (rows.length === 0) return { peakX: p.X0, glucose: 0, muAvg: 0, duration: 0 };
    const peakX = Math.max(...rows.map((r) => r.X));
    const glucose = Math.max(0, p.S0 - Math.min(...rows.map((r) => r.S)));
    const muAvg = rows.reduce((a, r) => a + r.mu, 0) / rows.length;
    const duration = rows[rows.length - 1].t_h;
    return { peakX, glucose, muAvg, duration };
  }, [rows, p]);

  const KPI: Array<{ label: string; value: string; unit: string; dot: string }> = [
    { label: 'Peak Biomass', value: kpi.peakX.toFixed(1), unit: 'g/L', dot: 'bg-amber-400' },
    { label: 'Glucose Consumed', value: kpi.glucose.toFixed(1), unit: 'g/L', dot: 'bg-cyan-400' },
    { label: 'Avg Growth μ', value: kpi.muAvg.toFixed(3), unit: 'h⁻¹', dot: 'bg-emerald-400' },
    { label: 'Batch Duration', value: kpi.duration.toFixed(2), unit: 'h', dot: 'bg-blue-400' },
  ];

  const AUDIT: Array<[string, string]> = [
    ['Temperature', `${controls.Tset.toFixed(1)} °C`],
    ['pH Setpoint', controls.pHset.toFixed(2)],
    ['Agitation', `${controls.rpm} rpm`],
    ['Aeration', `${controls.vvm.toFixed(1)} vvm`],
    ['Feed Rate', `${controls.feed} mL/h`],
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* header */}
      <div className="bento-card flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="flex flex-wrap items-center gap-3.5">
          <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-[#1A1C22] px-3 py-1.5">
            <span className="h-2 w-2 rounded-full bg-cyan-400" />
            <span className="font-jetbrains text-xs font-semibold tracking-wider text-white">BATCH-2026-EC-048</span>
          </div>
          <span className="font-jakarta text-sm font-semibold text-white">{organism === 'ecoli' ? 'E. coli BL21(DE3)' : 'S. cerevisiae'}</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 font-jakarta text-xs font-medium text-emerald-400">
            ✓ Illustrative — teaching twin
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <button type="button" className="rounded-full border border-white/[0.1] bg-white/[0.06] px-3.5 py-1.5 font-jakarta text-xs font-medium text-zinc-200 hover:bg-white/[0.1]">Print Record</button>
          <button type="button" className="rounded-full border border-white/[0.1] bg-white/[0.06] px-3.5 py-1.5 font-jakarta text-xs font-medium text-zinc-200 hover:bg-white/[0.1]">Download CSV</button>
          <button type="button" className="rounded-full bg-white px-4 py-1.5 font-jakarta text-xs font-semibold text-zinc-900 hover:bg-zinc-100">Export PDF</button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {KPI.map((k) => (
          <div key={k.label} className="bento-card relative overflow-hidden p-4">
            <div className="mb-1 flex items-center justify-between font-jakarta text-xs text-zinc-400">
              <span>{k.label}</span>
              <span className={`h-1.5 w-1.5 rounded-full ${k.dot}`} />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-jakarta text-2xl font-bold tabular-nums tracking-tight text-white">{k.value}</span>
              <span className="font-jetbrains text-xs text-zinc-400">{k.unit}</span>
            </div>
            <div className="pointer-events-none absolute -bottom-4 -right-4 h-16 w-16 rounded-full bg-white/[0.02] blur-xl" />
          </div>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-12">
        {/* left */}
        <div className="flex flex-col gap-3 lg:col-span-8">
          <div className="bento-card p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-jakarta text-sm font-semibold tracking-tight text-white">Batch Telemetry</h3>
              <div className="flex flex-wrap items-center gap-3 font-jetbrains text-xs">
                <span className="flex items-center gap-1.5 text-zinc-300"><i className="h-1 w-2.5 rounded-full bg-amber-400" />Biomass</span>
                <span className="flex items-center gap-1.5 text-zinc-300"><i className="h-1 w-2.5 rounded-full bg-cyan-400" />Substrate</span>
                <span className="flex items-center gap-1.5 text-zinc-300"><i className="h-1 w-2.5 rounded-full bg-blue-400" />D.O.</span>
                <span className="flex items-center gap-1.5 text-zinc-300"><i className="h-1 w-2.5 rounded-full bg-emerald-400" />pH</span>
              </div>
            </div>
            <div className="mt-3 rounded-xl border border-white/[0.06] bg-[#0E1013] p-3">
              <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-64 w-full" role="img" aria-label="Batch telemetry chart">
                <defs>
                  <linearGradient id="rp-x" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#F2A93B" stopOpacity="0.25" /><stop offset="100%" stopColor="#F2A93B" stopOpacity="0" /></linearGradient>
                  <linearGradient id="rp-s" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#38BDF8" stopOpacity="0.18" /><stop offset="100%" stopColor="#38BDF8" stopOpacity="0" /></linearGradient>
                </defs>
                {[0.25, 0.5, 0.75].map((q) => (
                  <line key={q} x1="0" y1={H * q} x2={W} y2={H * q} stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" strokeDasharray="4 4" />
                ))}
                <path d={areaPath(rows, (s) => s.S, 0, 12)} fill="url(#rp-s)" />
                <path d={areaPath(rows, (s) => s.X, 0, 20)} fill="url(#rp-x)" />
                <path d={linePath(rows, (s) => s.X, 0, 20)} fill="none" stroke="#F2A93B" strokeWidth="2.5" />
                <path d={linePath(rows, (s) => s.S, 0, 12)} fill="none" stroke="#38BDF8" strokeWidth="2" />
                <path d={linePath(rows, (s) => s.DO, 0, 100)} fill="none" stroke="#2F8CFF" strokeWidth="2" strokeDasharray="5 2" />
                <path d={linePath(rows, (s) => s.pH, 4, 9)} fill="none" stroke="#22C55E" strokeWidth="1.8" />
              </svg>
            </div>
          </div>

          <div className="bento-card p-4">
            <h3 className="mb-3 font-jakarta text-sm font-semibold tracking-tight text-white">Mass Balance</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-jakarta text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] font-jetbrains text-[11px] text-zinc-400">
                    <th className="py-2.5 pr-3 font-medium">Metric</th>
                    <th className="py-2.5 pr-3 text-right font-medium">Current</th>
                    <th className="py-2.5 pr-3 text-right font-medium">Initial</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] font-jetbrains tabular-nums">
                  <tr><td className="py-2.5 pr-3 text-zinc-400">Biomass X</td><td className="py-2.5 pr-3 text-right text-amber-400">{last ? last.X.toFixed(2) : '0.00'} g/L</td><td className="py-2.5 pr-3 text-right text-zinc-500">{p.X0.toFixed(2)} g/L</td></tr>
                  <tr><td className="py-2.5 pr-3 text-zinc-400">Substrate S</td><td className="py-2.5 pr-3 text-right text-cyan-400">{last ? last.S.toFixed(2) : '0.00'} g/L</td><td className="py-2.5 pr-3 text-right text-zinc-500">{p.S0.toFixed(1)} g/L</td></tr>
                  <tr><td className="py-2.5 pr-3 text-zinc-400">Dissolved O₂</td><td className="py-2.5 pr-3 text-right text-blue-400">{last ? last.DO.toFixed(1) : '0.0'} %</td><td className="py-2.5 pr-3 text-right text-zinc-500">100.0 %</td></tr>
                  <tr><td className="py-2.5 pr-3 text-zinc-400">Medium pH</td><td className="py-2.5 pr-3 text-right text-emerald-400">{last ? last.pH.toFixed(2) : '0.00'}</td><td className="py-2.5 pr-3 text-right text-zinc-500">{controls.pHset.toFixed(2)}</td></tr>
                  <tr><td className="py-2.5 pr-3 text-zinc-400">Temperature</td><td className="py-2.5 pr-3 text-right text-amber-300">{last ? last.T.toFixed(1) : '0.0'} °C</td><td className="py-2.5 pr-3 text-right text-zinc-500">{controls.Tset.toFixed(1)} °C</td></tr>
                  <tr><td className="py-2.5 pr-3 text-zinc-400">Working Volume</td><td className="py-2.5 pr-3 text-right text-zinc-200">{last ? last.V.toFixed(2) : '0.00'} L</td><td className="py-2.5 pr-3 text-right text-zinc-500">2.00 L</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* right */}
        <div className="flex flex-col gap-3 lg:col-span-4">
          <div className="bento-card p-4">
            <h3 className="mb-3 font-jakarta text-sm font-semibold tracking-tight text-white">Setpoint Audit</h3>
            <div className="flex flex-col gap-2.5">
              {AUDIT.map(([label, value]) => (
                <div key={label} className="bento-subcard flex items-center justify-between p-3">
                  <span className="font-jakarta text-xs text-zinc-400">{label}</span>
                  <span className="font-jetbrains text-xs font-semibold tabular-nums text-zinc-200">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bento-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-jakarta text-sm font-semibold tracking-tight text-white">
                Alarm Chronology
                <span className={`h-2 w-2 rounded-full ${alarms.length ? 'bg-red-400' : 'bg-emerald-400'}`} />
              </h3>
              <span className="font-jetbrains text-[11px] text-zinc-400">{alarms.length} events</span>
            </div>
            {alarms.length === 0 ? (
              <p className="font-jakarta text-[11px] text-zinc-500">No alarms this batch</p>
            ) : (
              <ul className="flex flex-col gap-2" aria-live="polite">
                {alarms.map((a) => (
                  <li key={a.id} className={`rounded-lg border p-2.5 font-jetbrains text-[11px] ${a.severity === 'danger' ? 'border-red-500/20 bg-red-500/[0.03]' : 'border-amber-500/20 bg-amber-500/[0.03]'}`}>
                    <span className={a.severity === 'danger' ? 'text-red-400' : 'text-amber-400'}>[{a.t_h.toFixed(1)}h]</span>{' '}
                    <span className="text-zinc-200">{a.message}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bento-card border-emerald-500/20 bg-gradient-to-b from-[#121316] to-[#0E1514] p-4">
            <h3 className="mb-3 flex items-center gap-2 font-jakarta text-sm font-semibold tracking-tight text-white">
              Electronic Batch Signature
            </h3>
            <div className="flex flex-col gap-2 font-jetbrains text-xs">
              <div className="flex justify-between"><span className="text-zinc-400">Operator ID</span><span className="text-zinc-200">BIO-ENG-08492</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Timestamp</span><span className="text-zinc-200">2026-10-25 18:42 UTC</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Status</span><span className="font-semibold text-emerald-400">✓ Recorded (illustrative)</span></div>
              <div className="mt-1 flex items-center justify-between rounded border border-white/[0.06] bg-black/40 px-2 py-1.5">
                <span className="text-zinc-500">SHA-256</span>
                <span className="tabular-nums text-zinc-300">7f8c9b21…c42a8b</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
