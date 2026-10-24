// Main console dashboard layout — 3-column grid + Nav + SimBar (04 §4).
import { useConsoleStore } from './store';
import { Nav } from './Nav';
import { SimBar } from './SimBar';
import { ControlPanel } from './ControlPanel';
import { ReactorPanel } from './ReactorPanel';
import { AdvisorChat } from './AdvisorChat';
import { PlanForm } from './PlanForm';
import { Panel } from '../ui/Panel';

const CHART_METRICS = ['Biomass X', 'Substrate S', 'DO', 'pH', 'Temperature'];

export function Console() {
  const { organism, snapshot, liteMode, reducedMotion } = useConsoleStore();

  return (
    <div className="min-h-screen bg-ink text-text">
      <Nav />

      <main className="mx-auto w-full max-w-[1680px] px-6 pb-20 pt-20">
        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_380px]">
          {/* Left — control + plan */}
          <aside className="flex flex-col gap-6">
            <ControlPanel
              onApply={(appliedControls) => {
                // Phase 6 wires this to the in-browser simulation engine.
                void appliedControls;
              }}
            />
            <PlanForm organism={organism} />
          </aside>

          {/* Centre — reactor vessel */}
          <section className="min-w-0">
            <ReactorPanel />
          </section>

          {/* Right — charts, alarms, advisor */}
          <aside className="flex flex-col gap-6">
            <Panel title="Live Charts" index="03">
              <ul className="flex flex-col gap-2">
                {CHART_METRICS.map((m) => (
                  <li
                    key={m}
                    className="flex items-center justify-between border-b border-line pb-2 font-mono text-xs text-muted last:border-b-0"
                  >
                    <span>{m}</span>
                    <span className="text-[10px] uppercase tracking-label text-muted">—</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-label text-muted">
                Small multiples render here — phase 6.
              </p>
            </Panel>

            <Panel title="Alarms" index="04">
              <p className="font-mono text-[11px] uppercase tracking-label text-muted">
                No active alarms
              </p>
            </Panel>

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
