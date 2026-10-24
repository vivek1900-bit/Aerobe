// Plan generation form — calls POST /api/plan, renders optimized biological targets.
// Server-side clamps to §6 control ranges; client validates before dispatch.
import { useCallback, useState, type FormEvent } from 'react';
import { useConsoleStore } from './store';
import { callPlan } from '../services/api';
import { Panel } from '../ui/Panel';
import { Button } from '../ui/Button';
import { Readout } from '../ui/Readout';

interface PlanFormProps {
  organism: 'ecoli' | 'yeast';
}

export function PlanForm({ organism }: PlanFormProps) {
  const { setPlan, setPlanLoading, plan, planLoading } = useConsoleStore();
  const [goal, setGoal] = useState('');

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const g = goal.trim();
      if (!g) return;

      setPlanLoading(true);
      try {
        const res = await callPlan({ goal: g, organism });
        setPlan(res.plan ?? null);
      } finally {
        setPlanLoading(false);
      }
    },
    [goal, organism, setPlan, setPlanLoading]
  );

  return (
    <Panel title="Goal → Plan" index="06">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="e.g. maximize biomass, minimize DO drop"
          maxLength={200}
          className="h-10 w-full border border-line bg-panel2 px-3 text-sm text-text outline-none placeholder:text-muted focus:border-signal"
        />
        <p className="mt-1 font-mono text-[10px] uppercase tracking-label text-muted">
          Max 200 characters
        </p>
        <Button type="submit" className="mt-3 w-full" disabled={!goal.trim() || planLoading}>
          Generate Plan
        </Button>
      </form>

      {planLoading && (
        <p className="mb-2 mt-3 animate-pulse font-mono text-[11px] uppercase tracking-label text-signal">
          Computing plan…
        </p>
      )}

      {plan && (
        <div className="mt-4 grid grid-cols-2 gap-3 border border-line bg-panel2 p-3">
          <Readout label="Temperature" value={`${plan.Tset} °C`} />
          <Readout label="pH Setpoint" value={plan.pHset} />
          <Readout label="Agitation" value={`${plan.rpm} rpm`} />
          <Readout label="Aeration" value={`${plan.vvm} vvm`} />
          <Readout label="Feed Rate" value={`${plan.feed} mL/h`} />
          <div className="col-span-2">
            <span className="font-mono text-[10px] uppercase tracking-label text-muted">
              Reasoning
            </span>
            <p className="mt-1 text-sm text-muted">{plan.reason ?? '—'}</p>
          </div>
        </div>
      )}

      {plan === null && goal && !planLoading && (
        <p className="mt-3 font-mono text-[11px] uppercase tracking-label text-warn">
          Plan failed — using default organism preset.
        </p>
      )}
    </Panel>
  );
}
