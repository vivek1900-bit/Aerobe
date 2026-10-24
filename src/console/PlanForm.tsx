// Plan generation form — calls POST /api/plan, renders optimized biological targets.
// Server-side clamps to §6 control ranges; client validates before dispatch.

import { useCallback, useState } from 'react';
import { useConsoleStore } from './store';
import { callPlan } from '../services/api';

interface PlanFormProps {
  organism: 'ecoli' | 'yeast';
}

export function PlanForm({ organism }: PlanFormProps) {
  const { setPlan, setPlanLoading, plan } = useConsoleStore();
  const [goal, setGoal] = useState('');

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
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
    <section className="p-4 border rounded-lg bg-white/50 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-sm font-medium text-gray-700">Goal → Slider Plan</h3>
      </div>

      <form onSubmit={handleSubmit} className="mb-4">
        <label className="block text-xs font-medium text-gray-700 mb-1">Goal</label>
        <input
          type="text"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="e.g. maximize biomass, minimize DO drop, maintain pH stability"
          maxLength={200}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
        <p className="text-xs text-gray-400 mt-1">Max 200 characters.</p>
        <button
          type="submit"
          disabled={!goal.trim() || planLoading}
          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Generate Plan
        </button>
      </form>

      {planLoading && <p className="text-xs text-blue-500 animate-pulse mb-2">Computing plan…</p>}

      {plan && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-green-50 rounded border border-green-200">
          <div>
            <div className="text-xs text-green-600 uppercase">Temperature</div>
            <div className="text-lg font-semibold">{plan.Tset} °C</div>
          </div>
          <div>
            <div className="text-xs text-green-600 uppercase">pH Setpoint</div>
            <div className="text-lg font-semibold">{plan.pHset}</div>
          </div>
          <div>
            <div className="text-xs text-green-600 uppercase">Agitation</div>
            <div className="text-lg font-semibold">{plan.rpm} rpm</div>
          </div>
          <div>
            <div className="text-xs text-green-600 uppercase">Aeration</div>
            <div className="text-lg font-semibold">{plan.vvm} vvm</div>
          </div>
          <div>
            <div className="text-xs text-green-600 uppercase">Feed Rate</div>
            <div className="text-lg font-semibold">{plan.feed} mL/h</div>
          </div>
          <div className="sm:col-span-3">
            <div className="text-xs text-green-600 uppercase">Reasoning</div>
            <div className="text-sm text-gray-700">{plan.reason ?? '—'}</div>
          </div>
        </div>
      )}

      {plan === null && goal && !planLoading && (
        <p className="text-xs text-orange-500 mt-1">Plan generation failed — using default organism preset.</p>
      )}
    </section>
  );
}
