// Bento telemetry rack — 5 sparkline cards bound to the live snapshot + history.
// Fault module replaces the status card when a critical condition is active.
import { useConsoleStore } from './store';
import type { Snapshot } from '../sim/index';

interface Metric {
  key: string;
  label: string;
  unit: string;
  accessor: (s: Snapshot) => number;
  yMin: number;
  yMax: number;
  color: string;
  dot: string;
  badge?: string;
  badgeC?: string;
  decimals: number;
}

const METRICS: Metric[] = [
  { key: 'S', label: 'Substrate', unit: 'g/L', accessor: (s) => s.S, yMin: 0, yMax: 12, color: '#38BDF8', dot: 'bg-cyan-400', badge: 'Glucose', badgeC: 'text-cyan-400 bg-cyan-400/10', decimals: 2 },
  { key: 'DO', label: 'Dissolved O₂', unit: '%', accessor: (s) => s.DO, yMin: 0, yMax: 100, color: '#6366F1', dot: 'bg-blue-500', badge: 'Crit: 20%', badgeC: 'text-blue-400 bg-blue-400/10', decimals: 1 },
  { key: 'pH', label: 'Medium pH', unit: 'pH', accessor: (s) => s.pH, yMin: 4, yMax: 9, color: '#22C55E', dot: 'bg-emerald-400', badge: 'Target: 7.00', badgeC: 'text-emerald-400 bg-emerald-400/10', decimals: 2 },
  { key: 'T', label: 'Vessel Temperature', unit: '°C', accessor: (s) => s.T, yMin: 20, yMax: 45, color: '#F59E0B', dot: 'bg-amber-400', badge: 'Jacket Active', badgeC: 'text-amber-400 bg-amber-400/10', decimals: 1 },
  { key: 'X', label: 'Biomass Density', unit: 'g/L', accessor: (s) => s.X, yMin: 0, yMax: 20, color: '#F2A93B', dot: 'bg-amber-500', decimals: 2 },
];

const W = 320;
const H = 44;

function path(data: Snapshot[], acc: (s: Snapshot) => number, yMin: number, yMax: number): string {
  if (data.length < 2) return '';
  const n = data.length;
  const x = (i: number) => (i / (n - 1)) * W;
  const y = (v: number) => H - Math.max(0, Math.min(H, ((v - yMin) / (yMax - yMin)) * H));
  return data.map((s, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(acc(s)).toFixed(1)}`).join(' ');
}

function areaPath(data: Snapshot[], acc: (s: Snapshot) => number, yMin: number, yMax: number): string {
  const line = path(data, acc, yMin, yMax);
  return line ? `${line} L${W},${H} L0,${H} Z` : '';
}

function MiniChart({ metric, data, snapshot }: { metric: Metric; data: Snapshot[]; snapshot: Snapshot | null }) {
  const value = snapshot ? metric.accessor(snapshot) : 0;
  const gradId = `bento-grad-${metric.key}`;
  const v = value.toFixed(metric.decimals);

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#17181D] p-3 transition hover:border-white/[0.12]">
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${metric.dot}`} />
          <span className="font-jakarta text-[13px] font-medium text-zinc-300">{metric.label}</span>
          {metric.badge ? (
            <span className={`rounded-full px-2 py-0.5 font-jakarta text-[10px] ${metric.badgeC}`}>{metric.badge}</span>
          ) : null}
        </div>
        <div className="font-jetbrains text-xs font-semibold tabular-nums text-zinc-100">
          {v} <span className="text-[10px] font-normal text-zinc-500">{metric.unit}</span>
        </div>
      </div>
      <div className="relative h-11 w-full overflow-hidden rounded-lg border border-white/[0.04] bg-[#101115]">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-full w-full" role="img" aria-label={`${metric.label} chart`}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={metric.color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={metric.color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {metric.key === 'DO' && (
            <line x1="0" y1={H - ((20 - metric.yMin) / (metric.yMax - metric.yMin)) * H} x2={W} y2={H - ((20 - metric.yMin) / (metric.yMax - metric.yMin)) * H} stroke="#EF4444" strokeWidth="1" strokeDasharray="3 3" opacity="0.7" />
          )}
          <path d={areaPath(data, metric.accessor, metric.yMin, metric.yMax)} fill={`url(#${gradId})`} />
          <path d={path(data, metric.accessor, metric.yMin, metric.yMax)} fill="none" stroke={metric.color} strokeWidth="1.75" />
        </svg>
      </div>
    </div>
  );
}

export function LiveCharts({
  fault,
  faultMessage,
  onAcknowledge,
}: {
  fault: boolean;
  faultMessage: string;
  onAcknowledge: () => void;
}) {
  const { history, snapshot, alarms } = useConsoleStore();
  const data = history.length > 0 ? history : [];
  const faults = alarms.filter((a) => a.severity === 'danger').length + (fault ? 1 : 0);

  return (
    <aside className="bento-card flex flex-col justify-between p-3.5">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
        <h2 className="flex items-center gap-2 font-jakarta text-[13px] font-medium tracking-tight text-zinc-200">
          <span className="h-2 w-2 rounded-full bg-cyan-400" />
          Telemetry &amp; Oscilloscope
        </h2>
        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-0.5 font-jetbrains text-[10px] font-medium text-emerald-400">
          4 Hz Live
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto py-2 pr-0.5">
        {METRICS.map((m) => (
          <MiniChart key={m.key} metric={m} data={data} snapshot={snapshot} />
        ))}
      </div>

      {/* Status / Fault module */}
      {fault ? (
        <div className="flex shrink-0 flex-col gap-2 rounded-xl border border-red-500/40 bg-red-500/10 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 animate-ping rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
              <span className="font-jakarta text-xs font-bold uppercase tracking-wide text-red-400">Critical Fault</span>
            </div>
            <span className="rounded-full border border-red-500/30 bg-red-500/20 px-2 py-0.5 font-jetbrains text-[10px] font-bold text-red-300">
              {faults} Faults
            </span>
          </div>
          <p className="font-jetbrains text-[11px] leading-snug text-red-200">{faultMessage}</p>
          <button
            type="button"
            onClick={onAcknowledge}
            className="h-8 rounded-lg border border-red-400/40 bg-red-500/20 font-jakarta text-[11px] font-semibold text-red-100 transition hover:bg-red-500/30"
          >
            Acknowledge / Reset Thermal Interlock
          </button>
        </div>
      ) : (
        <div className="flex h-12 shrink-0 items-center justify-between rounded-xl border border-white/[0.06] bg-[#17181D] px-3">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            <div>
              <div className="font-jakarta text-xs font-medium text-zinc-200">System Nominal</div>
              <div className="font-jakarta text-[10px] text-zinc-400">All interlocks engaged</div>
            </div>
          </div>
          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 font-jetbrains text-[10px] text-emerald-400">
            0 Faults
          </span>
        </div>
      )}
    </aside>
  );
}
