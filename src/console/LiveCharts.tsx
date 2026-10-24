// Live scrolling SVG small-multiples (04 §4.2). No chart library; ring buffer ≤1500 points.
import { useConsoleStore } from './store';
import { Panel } from '../ui/Panel';
import type { Snapshot } from '../sim/index';

interface Metric {
  key: string;
  label: string;
  unit: string;
  accessor: (s: Snapshot) => number;
  yMin: number;
  yMax: number;
  color: string;
  threshold?: number;
}

const METRICS: Metric[] = [
  { key: 'X', label: 'Biomass', unit: 'g/L', accessor: (s) => s.X, yMin: 0, yMax: 20, color: '#2F8CFF' },
  { key: 'S', label: 'Substrate', unit: 'g/L', accessor: (s) => s.S, yMin: 0, yMax: 12, color: '#F2A93B' },
  { key: 'DO', label: 'Dissolved O₂', unit: '%', accessor: (s) => s.DO, yMin: 0, yMax: 100, color: '#3BD99F', threshold: 20 },
  { key: 'pH', label: 'pH', unit: '', accessor: (s) => s.pH, yMin: 4, yMax: 9, color: '#E8EEF3' },
  { key: 'T', label: 'Temperature', unit: '°C', accessor: (s) => s.T, yMin: 20, yMax: 45, color: '#FFB547' },
];

const W = 320;
const H = 72;

function buildPath(data: Snapshot[], accessor: (s: Snapshot) => number, yMin: number, yMax: number): string {
  if (data.length < 2) return '';
  const n = data.length;
  const x = (i: number) => (i / (n - 1)) * W;
  const y = (v: number) => H - ((v - yMin) / (yMax - yMin)) * H;
  return data
    .map((s, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(accessor(s)).toFixed(1)}`)
    .join(' ');
}

function MiniChart({ metric, data }: { metric: Metric; data: Snapshot[] }) {
  const path = buildPath(data, metric.accessor, metric.yMin, metric.yMax);
  const last = data[data.length - 1];
  const value = last ? metric.accessor(last) : 0;
  const decimals = metric.key === 'pH' ? 2 : 1;
  const thresholdY =
    metric.threshold !== undefined
      ? H - ((metric.threshold - metric.yMin) / (metric.yMax - metric.yMin)) * H
      : null;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[11px] uppercase tracking-label text-muted">{metric.label}</span>
        <span className="font-mono text-xs tabular-nums text-text">
          {value.toFixed(decimals)} {metric.unit}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="h-16 w-full"
        role="img"
        aria-label={`${metric.label} chart`}
      >
        {thresholdY !== null && (
          <line x1="0" y1={thresholdY} x2={W} y2={thresholdY} stroke="#FF5A4F" strokeWidth="1" strokeDasharray="3 3" />
        )}
        {path && <path d={path} fill="none" stroke={metric.color} strokeWidth="1.5" />}
      </svg>

      <details className="mt-1">
        <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-label text-muted">
          data
        </summary>
        <div className="mt-1 max-h-24 overflow-y-auto font-mono text-[10px] tabular-nums text-muted">
          {data
            .slice(-8)
            .reverse()
            .map((s, i) => (
              <div key={i}>
                t {s.t_h.toFixed(2)} h · {metric.accessor(s).toFixed(2)} {metric.unit}
              </div>
            ))}
        </div>
      </details>
    </div>
  );
}

export function LiveCharts() {
  const { history } = useConsoleStore();
  return (
    <Panel title="Live Charts" index="03">
      <div className="flex flex-col gap-4">
        {METRICS.map((m) => (
          <MiniChart key={m.key} metric={m} data={history} />
        ))}
      </div>
    </Panel>
  );
}
