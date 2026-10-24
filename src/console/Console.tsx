// Main console dashboard layout — 3-column grid + Nav + SimBar (04 §4).
import { useConsoleStore } from './store';
import { useSimulation } from './useSimulation';
import { Nav } from './Nav';
import { SimBar } from './SimBar';
import { ControlPanel } from './ControlPanel';
import { ReactorPanel } from './ReactorPanel';
import { LiveCharts } from './LiveCharts';
import { AlarmsPanel } from './AlarmsPanel';
import { AdvisorChat } from './AdvisorChat';
import { PlanForm } from './PlanForm';

export function Console() {
  const { organism, snapshot, liteMode, reducedMotion } = useConsoleStore();
  const { running, start, pause, reset } = useSimulation();

  return (
    <div className="min-h-screen bg-ink text-text">
      <Nav />

      <main className="mx-auto w-full max-w-[1680px] px-6 pb-20 pt-20">
        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_380px]">
          {/* Left — control + plan */}
          <aside className="flex flex-col gap-6">
            <ControlPanel running={running} onStart={start} onPause={pause} onReset={reset} />
            <PlanForm organism={organism} />
          </aside>

          {/* Centre — reactor vessel */}
          <section className="min-w-0">
            <ReactorPanel />
          </section>

          {/* Right — charts, alarms, advisor */}
          <aside className="flex flex-col gap-6">
            <LiveCharts />
            <AlarmsPanel />
            <AdvisorChat snapshot={snapshot} />
          </aside>
        </div>
      </main>

      <p className="sr-only">
        Lite mode {liteMode ? 'on' : 'off'} · reduced motion {reducedMotion ? 'on' : 'off'}
      </p>

      <SimBar />
    </div>
  );
}
