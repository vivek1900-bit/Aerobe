// Obsidian Bento AI Planner modal — preset goal chips + custom input → Gemini plan →
// "Apply AI Setpoints" writes recommendations into the store.
import { useState } from 'react';
import { useConsoleStore } from './store';
import { generatePlan, type PlanResult } from '../services/geminiPlanner';
import { X, Sparkles, Loader2, Check } from 'lucide-react';

const PRESETS = [
  'Maximize Biomass Yield',
  'Prevent DO Starvation (<20%)',
  'High-Density Fed-Batch Protocol',
  'Thermal Fault Recovery',
];

export function AIPlannerModal({ onClose }: { onClose: () => void }) {
  const { organism, controls, snapshot, alarms, setControl } = useConsoleStore();
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PlanResult | null>(null);
  const [applied, setApplied] = useState(false);

  const telemetry = {
    organism,
    T: snapshot?.T ?? controls.Tset,
    pH: snapshot?.pH ?? controls.pHset,
    rpm: controls.rpm,
    vvm: controls.vvm,
    feedRate: controls.feed,
    X: snapshot?.X ?? 0,
    S: snapshot?.S ?? 0,
    DO: snapshot?.DO ?? 100,
    alarms: alarms.map((a) => a.message),
  };

  const run = async (g: string) => {
    const trimmed = g.trim();
    if (!trimmed) return;
    setGoal(trimmed);
    setLoading(true);
    setResult(null);
    const r = await generatePlan(trimmed, telemetry);
    setResult(r);
    setLoading(false);
  };

  const apply = () => {
    if (!result) return;
    const sp = result.recommendedSetpoints;
    setControl('Tset', sp.temperature);
    setControl('pHset', sp.pH);
    setControl('rpm', sp.agitation);
    setControl('vvm', sp.aeration);
    setControl('feed', sp.feedRate);
    setApplied(true);
    setTimeout(onClose, 600);
  };

  const sp = result?.recommendedSetpoints;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Goal & Plan AI planner"
    >
      <div
        className="bento-card flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden p-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500">
              <Sparkles className="h-4 w-4 text-white" />
            </span>
            <div>
              <h2 className="font-jakarta text-sm font-semibold text-white">Goal &amp; Plan</h2>
              <p className="font-jetbrains text-[10px] text-zinc-500">AI Planner · server-side</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] text-zinc-400 hover:text-white"
            aria-label="Close planner"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-3">
          {/* goal chips */}
          <div className="mb-2 font-jetbrains text-[10px] uppercase tracking-widest text-zinc-500">Goal presets</div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => run(p)}
                disabled={loading}
                className={`rounded-full border px-3 py-1.5 font-jakarta text-xs transition disabled:opacity-40 ${
                  goal === p
                    ? 'border-indigo-400/50 bg-indigo-500/15 text-indigo-200'
                    : 'border-white/[0.08] bg-white/[0.03] text-zinc-300 hover:border-indigo-400/40 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* custom input */}
          <div className="mt-3 mb-3">
            <div className="mb-2 font-jetbrains text-[10px] uppercase tracking-widest text-zinc-500">Custom goal</div>
            <div className="flex gap-2">
              <input
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && run(goal)}
                placeholder="e.g. Minimize acetate overflow…"
                className="h-9 flex-1 rounded-lg border border-white/[0.08] bg-[#101115] px-3 font-jetbrains text-xs text-white placeholder:text-zinc-600 focus:border-indigo-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => run(goal)}
                disabled={loading || !goal.trim()}
                className="flex h-9 items-center gap-1.5 rounded-lg bg-white px-3 font-jakarta text-xs font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-40"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                Generate
              </button>
            </div>
          </div>

          {/* result */}
          {loading && (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-[#17181D] p-6 font-jetbrains text-xs text-zinc-400">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
              Optimizing bioprocess setpoints…
            </div>
          )}

          {result && !loading && (
            <div className="space-y-3">
              <div className="rounded-xl border border-indigo-400/30 bg-indigo-500/10 p-3">
                <div className="font-jakarta text-sm font-semibold text-white">{result.planTitle}</div>
                <p className="mt-1 font-jakarta text-xs leading-relaxed text-zinc-300">{result.kineticsSummary}</p>
              </div>

              <div>
                <div className="mb-1.5 font-jetbrains text-[10px] uppercase tracking-widest text-zinc-500">Steps</div>
                <ol className="space-y-1">
                  {result.steps.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 font-jakarta text-xs text-zinc-300">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded bg-white/[0.06] font-jetbrains text-[9px] text-indigo-300">
                        {i + 1}
                      </span>
                      {s}
                    </li>
                  ))}
                </ol>
              </div>

              {sp && (
                <div className="rounded-xl border border-white/[0.06] bg-[#17181D] p-3">
                  <div className="mb-2 font-jetbrains text-[10px] uppercase tracking-widest text-zinc-500">
                    Recommended setpoints
                  </div>
                  <div className="grid grid-cols-2 gap-2 font-jetbrains text-xs tabular-nums">
                    {(
                      [
                        ['Temperature', `${sp.temperature.toFixed(1)} °C`],
                        ['pH', sp.pH.toFixed(2)],
                        ['Agitation', `${sp.agitation.toFixed(0)} rpm`],
                        ['Aeration', `${sp.aeration.toFixed(1)} vvm`],
                        ['Feed Rate', `${sp.feedRate.toFixed(0)} mL/h`],
                      ] as const
                    ).map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-2.5 py-1.5">
                        <span className="text-zinc-500">{label}</span>
                        <span className="text-indigo-200">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={apply}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 font-jakarta text-xs font-semibold text-white transition hover:brightness-110 active:scale-[0.99]"
              >
                {applied ? <Check className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                {applied ? 'Applied!' : '⚡ Apply AI Setpoints to Console'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
