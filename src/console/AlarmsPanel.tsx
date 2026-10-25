// Bento alarm list — severity + message + time. Never colour-only.
import { useConsoleStore } from './store';
import { AlertTriangle, AlertOctagon } from 'lucide-react';

export function AlarmsPanel() {
  const { alarms } = useConsoleStore();

  return (
    <div className="bento-card flex flex-col gap-2 p-3.5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-jakarta text-[13px] font-medium tracking-tight text-zinc-200">
          <span className={`h-2 w-2 rounded-full ${alarms.length ? 'bg-amber-400' : 'bg-emerald-400'}`} />
          Alarms
        </h2>
        <span className="font-jetbrains text-[10px] tabular-nums text-zinc-500">{alarms.length} active</span>
      </div>

      {alarms.length === 0 ? (
        <p className="font-jakarta text-[11px] text-zinc-500">No active alarms</p>
      ) : (
        <ul className="flex flex-col gap-2" aria-live="polite">
          {alarms.map((a) => (
            <li
              key={a.id}
              className={`flex items-start gap-2 rounded-xl border p-2 font-jakarta text-xs ${
                a.severity === 'danger' ? 'border-red-500/30 bg-red-500/10' : 'border-amber-500/30 bg-amber-500/10'
              }`}
            >
              {a.severity === 'danger' ? (
                <AlertOctagon className="mt-0.5 h-4 w-4 shrink-0 text-red-400" aria-hidden="true" />
              ) : (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
              )}
              <div className="flex flex-col">
                <span className="leading-tight text-zinc-200">{a.message}</span>
                <span className="font-jetbrains text-[10px] tabular-nums text-zinc-500">
                  {a.severity} · t {a.t_h.toFixed(2)} h
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
