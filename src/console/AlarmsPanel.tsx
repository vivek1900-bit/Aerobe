// Alarm list (04 §4.3): severity icon + word + message + time. Never colour-only.
import { useConsoleStore } from './store';
import { Panel } from '../ui/Panel';
import { AlertTriangle, AlertOctagon } from 'lucide-react';

export function AlarmsPanel() {
  const { alarms } = useConsoleStore();

  return (
    <Panel title="Alarms" index="04">
      {alarms.length === 0 ? (
        <p className="font-mono text-[11px] uppercase tracking-label text-muted">No active alarms</p>
      ) : (
        <ul className="flex flex-col gap-2" aria-live="polite">
          {alarms.map((a) => (
            <li key={a.id} className="flex items-start gap-2 border border-line bg-panel2 p-2">
              {a.severity === 'danger' ? (
                <AlertOctagon className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
              ) : (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warn" aria-hidden="true" />
              )}
              <div className="flex flex-col">
                <span className="text-sm leading-tight text-text">{a.message}</span>
                <span className="font-mono text-[10px] uppercase tracking-label text-muted">
                  {a.severity} · t {a.t_h.toFixed(2)} h
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
