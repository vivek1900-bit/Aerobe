// Main console dashboard layout — ties together ControlPanel, AdvisorChat, and PlanForm.
// Person 2 owns src/console/** per 03_ARCHITECTURE.md §4.

import { useConsoleStore } from './store';
import { ControlPanel } from './ControlPanel';
import { AdvisorChat } from './AdvisorChat';
import { PlanForm } from './PlanForm';

export function Console() {
  const { organism, snapshot, liteMode, reducedMotion } = useConsoleStore();

  return (
    <main className="max-w-5xl mx-auto p-6 gap-6">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">AEROBE Console</h1>
        <p className="text-gray-600 text-sm">Deterministic teaching bioreactor simulation — illustrative parameters.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ControlPanel
            onApply={(appliedControls) => {
              // Hook into simulation engine here when wired to src/sim.
              // eslint-disable-next-line no-console
              console.log('Controls applied:', appliedControls);
            }}
          />
          <PlanForm organism={organism} />
        </div>

        <div className="lg:col-span-2">
          <div className="flex flex-col gap-4 h-full">
            <div className="flex-1 min-h-[400px]">
              {/* ReactorSVG / charts placeholder — Person 1 owns src/reactor/** */}
              <section className="p-4 border rounded-lg bg-white/50 backdrop-blur-sm flex flex-col items-center justify-center h-full">
                <p className="text-gray-500 text-sm">ReactorSVG and live SVG charts render here.</p>
                <p className="text-xs text-gray-400 mt-1">Bound to: rpm → impeller, vvm → bubbles, X → turbidity, T → jacket glow, DO/pH → probe colour.</p>
              </section>
            </div>
            <AdvisorChat snapshot={snapshot} />
          </div>
        </div>
      </div>

      <footer className="mt-6 pt-4 border-t text-xs text-gray-500">
        Lite mode: {liteMode ? 'on' : 'off'} &nbsp;|&nbsp; Reduced motion: {reducedMotion ? 'on' : 'off'} &nbsp;|&nbsp;
        Simulation runs in-browser; backend only proxies Gemini via serverless functions.
      </footer>
    </main>
  );
}
