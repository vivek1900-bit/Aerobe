// Top navigation — Obsidian Bento (Stitch console). Brand + state badge, segmented
// Console/Analytics/Report tabs, Replay + Settings.
import { RotateCcw, Settings } from 'lucide-react';

export type ConsoleView = 'console' | 'analytics' | 'report';
export type BatchState = 'standby' | 'active' | 'fault';

const VIEWS: Array<{ id: ConsoleView; label: string }> = [
  { id: 'console', label: 'Console' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'report', label: 'Report' },
];

const STATE_META: Record<BatchState, { label: string; dot: string; text: string }> = {
  standby: { label: 'Standby', dot: 'bg-amber-400', text: 'text-amber-400' },
  active: { label: 'Active', dot: 'bg-emerald-400', text: 'text-emerald-400' },
  fault: { label: 'Fault', dot: 'bg-red-500', text: 'text-red-400' },
};

export function Nav({
  onReplay,
  view,
  onNavigate,
  state,
}: {
  onReplay?: () => void;
  view: ConsoleView;
  onNavigate: (v: ConsoleView) => void;
  state: BatchState;
}) {
  const meta = STATE_META[state];
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b border-white/[0.08] bg-[#121316] px-5">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-tr from-[#2563EB] to-[#6366F1] shadow-[0_0_14px_rgba(99,102,241,0.35)]">
            <span className="font-jetbrains text-sm font-bold text-white">Æ</span>
          </div>
          <span className="font-jakarta text-sm font-semibold tracking-tight text-white">Aerobe</span>
          <span className="border-l border-white/[0.08] pl-2.5 text-xs font-normal text-zinc-400">
            Bioreactor Studio
          </span>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.05] px-2.5 py-0.5 font-jakarta text-[10px] font-medium text-zinc-300">
          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot} ${state === 'fault' ? 'animate-pulse' : ''}`} />
          <span className={meta.text}>{meta.label}</span>
        </span>
      </div>

      <nav
        aria-label="Console views"
        className="flex items-center gap-1 rounded-full border border-white/[0.08] bg-[#17181D] p-1 font-jakarta text-xs font-medium"
      >
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => onNavigate(v.id)}
            aria-current={view === v.id ? 'page' : undefined}
            className={`rounded-full px-4 py-1.5 transition ${
              view === v.id ? 'bg-white/[0.1] text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {v.label}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onReplay}
          className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-[#17181D] px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.08] hover:text-white"
        >
          <RotateCcw className="h-3.5 w-3.5 text-zinc-400" />
          <span className="hidden sm:inline">Replay Tour</span>
        </button>
        <button
          type="button"
          aria-label="Settings"
          title="Settings"
          className="flex h-7 w-7 items-center justify-center rounded-full border border-white/[0.08] bg-[#17181D] text-zinc-300 transition hover:text-white"
        >
          <Settings className="h-3.5 w-3.5" />
        </button>
      </div>
    </header>
  );
}
