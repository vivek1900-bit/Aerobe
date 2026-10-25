// Bento simulation dock — batch time · phase badge · timeline scrubber · speed chips.
import { useConsoleStore } from './store';
import { phases } from '../sim/index';

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
  const maxT = history.length > 1 ? history[history.length - 1].t_h : 24;

  return (
    <footer className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-3">
      <div className="pointer-events-auto mx-auto flex h-14 max-w-[1680px] items-center justify-between rounded-2xl border border-white/[0.08] bg-[#121316] px-5">
        <div className="flex items-center gap-3">
          <div className="flex items-baseline gap-1.5 rounded-full border border-white/[0.06] bg-[#17181D] px-3 py-1">
            <span className="font-jakarta text-[10px] font-medium text-zinc-400">Time</span>
            <span className="font-jetbrains text-lg font-bold tabular-nums tracking-tight text-white">{tH.toFixed(2)}</span>
            <span className="font-jakarta text-xs text-zinc-500">h</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-[#17181D] px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="font-jakarta text-xs font-medium capitalize text-zinc-300">{phase}</span>
          </div>
        </div>

        <div className="mx-8 flex max-w-2xl flex-1 flex-col justify-center">
          <div className="mb-1 flex justify-between px-1 font-jetbrains text-[10px] text-zinc-400">
            <span>0h [Inoc]</span>
            <span>6h [Exp]</span>
            <span>12h [Mid]</span>
            <span>18h [Decel]</span>
            <span>24h [Harvest]</span>
          </div>
          <input
            type="range"
            min={0}
            max={maxT}
            step={0.01}
            value={tH}
            disabled={history.length < 2}
            aria-label="Simulation timeline scrubber"
            className="bento-range"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="mr-1 font-jakarta text-[11px] font-medium text-zinc-400">Speed</span>
          <div className="flex items-center gap-0.5 rounded-full border border-white/[0.06] bg-[#17181D] p-0.5">
            {SPEEDS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                className={`rounded-full px-3 py-1 font-jakarta text-xs transition ${
                  speed === s ? 'bg-white/10 font-medium text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {fmtSpeed(s)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
