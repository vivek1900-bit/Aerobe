// Centre column — reactor vessel. ReactorSVG (Phase 6) renders here; this is the framed shell
// with live readouts bound to the snapshot.
import { useConsoleStore } from './store';
import { Readout } from '../ui/Readout';
import { Brackets } from '../ui/Brackets';

export function ReactorPanel() {
  const { snapshot } = useConsoleStore();

  const X = snapshot ? snapshot.X.toFixed(2) : '0.00';
  const DO = snapshot ? snapshot.DO.toFixed(1) : '0.0';
  const T = snapshot ? snapshot.T.toFixed(1) : '0.0';
  const pH = snapshot ? snapshot.pH.toFixed(2) : '0.00';

  return (
    <section className="relative flex min-h-[560px] flex-col border border-line bg-panel">
      <Brackets tone="signal" />
      <header className="flex items-center justify-between border-b border-line px-4 py-2">
        <h2 className="font-mono text-[11px] uppercase tracking-label text-muted">Reactor Vessel</h2>
        <span className="font-mono text-[11px] uppercase tracking-label text-muted">02 / 03</span>
      </header>

      {/* Vessel placeholder — ReactorSVG lands here in Phase 6 */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="relative flex h-64 w-64 flex-col items-center justify-center gap-2 border border-line bg-panel2">
          <Brackets tone="line" />
          <span className="font-mono text-[11px] uppercase tracking-label text-signal">ReactorSVG</span>
          <span className="font-mono text-[10px] uppercase tracking-label text-muted">
            vessel renders here — phase 6
          </span>
        </div>
      </div>

      {/* Live readouts — bound to snapshot (broth flash on change via Readout) */}
      <div className="grid grid-cols-4 gap-px border-t border-line bg-line">
        <div className="bg-panel p-3">
          <Readout label="Biomass" value={X} unit="g/L" />
        </div>
        <div className="bg-panel p-3">
          <Readout label="DO" value={DO} unit="%" />
        </div>
        <div className="bg-panel p-3">
          <Readout label="Temp" value={T} unit="°C" />
        </div>
        <div className="bg-panel p-3">
          <Readout label="pH" value={pH} />
        </div>
      </div>
    </section>
  );
}
