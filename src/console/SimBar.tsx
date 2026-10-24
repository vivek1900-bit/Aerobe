// Bottom simulation bar (04 §4): time · phase chip · scrubber · speed.
import { useConsoleStore } from './store';
import { phases } from '../sim/index';
import { Chip } from '../ui/Chip';

const SPEEDS = [1, 60, 600, 3600];

function fmtSpeed(s: number): string {
  if (s >= 3600) return '3600×';
  if (s >= 600) return '600×';
  if (s >= 60) return '60×';
  return '1×';
}

export function SimBar() {
  const { snapshot, history, organism, speed, setSpeed } = useConsoleStore();

  const tH = snapshot?.t_h ?? 0;
  const phase = history.length > 1 ? phases(history, organism)[history.length - 1] : 'standby';

  const maxT = history.length > 1 ? history[history.length - 1].t_h : 12;
  const progress = maxT > 0 ? Math.min(100, Math.max(0, (tH / maxT) * 100)) : 0;

  return (
    <footer className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center gap-6 border-t border-line bg-panel px-4 sm:px-6">
      {/* Time */}
      <div className="flex flex-col">
        <span className="font-mono text-[10px] uppercase tracking-label text-muted">Time</span>
        <span className="font-display text-2xl leading-none tabular-nums text-text">
          {tH.toFixed(2)}
          <span className="ml-1 font-mono text-xs text-muted">h</span>
        </span>
      </div>

      {/* Phase chip */}
      <div className="hidden items-center gap-2 sm:flex">
        <span className="font-mono text-[10px] uppercase tracking-label text-muted">Phase</span>
        <span className="inline-flex items-center gap-2 border border-line px-3 py-1 font-mono text-xs uppercase tracking-label text-broth">
          <span className="h-1.5 w-1.5 rounded-full bg-broth" />
          {phase}
        </span>
      </div>

      {/* Scrubber (interactive in Phase 6 once history is populated) */}
      <div className="mx-2 hidden flex-1 items-center md:flex">
        <input
          type="range"
          min={0}
          max={maxT}
          step={0.01}
          value={tH}
          disabled={history.length < 2}
          aria-label="Simulation timeline scrubber"
          className="slider-track w-full"
          style={{
            background: `linear-gradient(to right, var(--signal) 0%, var(--signal) ${progress}%, var(--line) ${progress}%, var(--line) 100%)`,
          }}
        />
      </div>

      {/* Speed */}
      <div className="ml-auto flex items-center gap-2">
        <span className="hidden font-mono text-[10px] uppercase tracking-label text-muted lg:inline">
          Speed
        </span>
        <div className="flex gap-1" role="radiogroup" aria-label="Simulation speed">
          {SPEEDS.map((s) => (
            <Chip key={s} label={fmtSpeed(s)} selected={speed === s} onClick={() => setSpeed(s)} />
          ))}
        </div>
      </div>
    </footer>
  );
}
