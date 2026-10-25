// Console shell — Obsidian Bento 3-column layout + 3D reactor + view switcher.
// 3-state: Fault (thermal setpoint or danger alarm) > Active (running) > Standby.
import { useState } from 'react';
import { useConsoleStore } from './store';
import { useSimulation } from './useSimulation';
import { Nav, type ConsoleView, type BatchState } from './Nav';
import { SimBar } from './SimBar';
import { ControlPanel } from './ControlPanel';
import { ReactorPanel } from './ReactorPanel';
import { LiveCharts } from './LiveCharts';
import { AlarmsPanel } from './AlarmsPanel';
import { Analytics } from './Analytics';
import { Report } from './Report';

export function Console({ onReplay }: { onReplay?: () => void }) {
  const [view, setView] = useState<ConsoleView>('console');
  const { alarms, controls, organism } = useConsoleStore();
  const { running, start, pause, reset } = useSimulation();

  // Thermal over-temperature setpoint fault (Tset > 40°C) triggers immediately.
  const thermalSetpointFault = controls.Tset > 40;
  const dangerAlarms = alarms.filter((a) => a.severity === 'danger');
  const fault = thermalSetpointFault || dangerAlarms.length > 0;
  const faultMessage = thermalSetpointFault
    ? 'CRITICAL FAULT: HIGH TEMPERATURE > 40.0°C — THERMAL DENATURATION RISK'
    : dangerAlarms[0]?.message ?? '';
  const state: BatchState = fault ? 'fault' : running ? 'active' : 'standby';

  const handleAcknowledge = () => {
    useConsoleStore.getState().setControl('Tset', organism === 'ecoli' ? 37 : 30);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0B0C0E] font-jakarta text-zinc-200">
      <Nav onReplay={onReplay} view={view} onNavigate={setView} state={state} />

      {view === 'console' ? (
        <main className="flex-1 overflow-hidden px-3 pt-[68px] pb-[72px]">
          <div className="mx-auto grid h-full max-w-[1680px] gap-3 overflow-hidden xl:grid-cols-[320px_minmax(0,1fr)_380px]">
            <aside className="overflow-y-auto pr-0.5">
              <ControlPanel running={running} onStart={start} onPause={pause} onReset={reset} />
            </aside>
            <section className="min-w-0 overflow-hidden">
              <ReactorPanel running={running} fault={fault} />
            </section>
            <aside className="flex flex-col gap-3 overflow-y-auto pr-0.5">
              <LiveCharts fault={fault} faultMessage={faultMessage} onAcknowledge={handleAcknowledge} />
              <AlarmsPanel />
            </aside>
          </div>
        </main>
      ) : (
        <main className="flex-1 overflow-y-auto px-3 pt-[68px] pb-[72px]">
          <div className="mx-auto max-w-[1680px]">{view === 'analytics' ? <Analytics /> : <Report />}</div>
        </main>
      )}

      <SimBar />
    </div>
  );
}
