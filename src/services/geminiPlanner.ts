// Gemini AI bioprocess planner — POSTs the goal to the serverless /api/plan
// endpoint (server holds the key). Falls back to a deterministic heuristic when
// the endpoint returns null, times out, or fails, so the Goal & Plan box never errors.
export interface PlanSetpoints {
  temperature: number;
  pH: number;
  agitation: number;
  aeration: number;
  feedRate: number;
}

export interface PlanResult {
  planTitle: string;
  kineticsSummary: string;
  steps: string[];
  recommendedSetpoints: PlanSetpoints;
}

export interface TelemetrySnapshot {
  organism: string;
  T: number;
  pH: number;
  rpm: number;
  vvm: number;
  feedRate: number;
  X: number;
  S: number;
  DO: number;
  alarms: string[];
}

// Local/offline deterministic planner — used when /api/plan is unreachable or
// returns null, so the UI always has a safe, in-range plan.
function deterministicFallback(goal: string, t: TelemetrySnapshot): PlanResult {
  const g = goal.toLowerCase();
  const base: PlanSetpoints = {
    temperature: t.organism === 'yeast' ? 30 : 37,
    pH: t.organism === 'yeast' ? 5.0 : 7.0,
    agitation: 400,
    aeration: 1.0,
    feedRate: 0,
  };
  if (g.includes('biomass') || g.includes('yield')) {
    return {
      planTitle: 'Maximize Biomass Yield',
      kineticsSummary:
        'Elevated mass transfer (kLa) and optimal growth conditions to push specific growth rate toward μ_max.',
      steps: ['Step agitation to 700 rpm', 'Raise aeration to 1.5 vvm', 'Hold temperature at organism optimum'],
      recommendedSetpoints: { ...base, agitation: 700, aeration: 1.5 },
    };
  }
  if (g.includes('do') || g.includes('starvation') || g.includes('oxygen')) {
    return {
      planTitle: 'Prevent DO Starvation (<20%)',
      kineticsSummary:
        'Increase oxygen transfer above uptake to hold DO clear of the 20% critical threshold.',
      steps: ['Step agitation to 800 rpm', 'Raise aeration to 1.8 vvm', 'Verify sparger flow'],
      recommendedSetpoints: { ...base, agitation: 800, aeration: 1.8 },
    };
  }
  if (g.includes('fed-batch') || g.includes('density') || g.includes('high-density')) {
    return {
      planTitle: 'High-Density Fed-Batch Protocol',
      kineticsSummary:
        'Controlled exponential glucose feed with elevated mass transfer to reach high cell density without overflow metabolism.',
      steps: ['Enable exponential feed at 25 mL/h', 'Agitation 600 rpm', 'Aeration 1.2 vvm'],
      recommendedSetpoints: { ...base, agitation: 600, aeration: 1.2, feedRate: 25 },
    };
  }
  if (g.includes('thermal') || g.includes('fault') || g.includes('recovery')) {
    return {
      planTitle: 'Thermal Fault Recovery',
      kineticsSummary:
        'Lower the temperature setpoint below the 40°C thermal-denaturation threshold and re-establish a stable culture.',
      steps: ['Reduce temperature setpoint to safe range', 'Verify cooling jacket engaged', 'Monitor for thermal recovery'],
      recommendedSetpoints: { ...base, temperature: t.organism === 'yeast' ? 28 : 35 },
    };
  }
  return {
    planTitle: 'Optimal Operating Setpoints',
    kineticsSummary:
      'Deterministic baseline plan (no Gemini API key present). Setpoints held within validated §6 ranges.',
    steps: ['Maintain current setpoints within §6 ranges', 'Monitor DO > 20% and pH within 5.5–8.0'],
    recommendedSetpoints: base,
  };
}

// Map the server's plan shape { Tset, pHset, rpm, vvm, feed, reason } to PlanResult,
// clamping every setpoint to the §6 control ranges.
function mapServerPlan(plan: Record<string, unknown>, goal: string, t: TelemetrySnapshot): PlanResult {
  const fb = deterministicFallback(goal, t);
  const num = (v: unknown, dflt: number) => (typeof v === 'number' && Number.isFinite(v) ? v : dflt);
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

  const temperature = clamp(num(plan.Tset, fb.recommendedSetpoints.temperature), 20, 45);
  const pH = clamp(num(plan.pHset, fb.recommendedSetpoints.pH), 5, 8.5);
  const agitation = clamp(num(plan.rpm, fb.recommendedSetpoints.agitation), 100, 1000);
  const aeration = clamp(num(plan.vvm, fb.recommendedSetpoints.aeration), 0.1, 2.0);
  const feedRate = clamp(num(plan.feed, fb.recommendedSetpoints.feedRate), 0, 50);
  const reason = typeof plan.reason === 'string' ? plan.reason : '';

  return {
    planTitle: 'AI Optimized Plan',
    kineticsSummary: reason || fb.kineticsSummary,
    steps: [
      `Temperature ${temperature.toFixed(1)} °C`,
      `pH ${pH.toFixed(2)}`,
      `Agitation ${agitation.toFixed(0)} rpm`,
      `Aeration ${aeration.toFixed(1)} vvm`,
      `Feed rate ${feedRate.toFixed(0)} mL/h`,
    ],
    recommendedSetpoints: { temperature, pH, agitation, aeration, feedRate },
  };
}

export async function generatePlan(goal: string, telemetry: TelemetrySnapshot): Promise<PlanResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch('/api/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal, organism: telemetry.organism }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) return deterministicFallback(goal, telemetry);
    const data = await res.json();
    const plan = data?.plan;
    if (!plan || typeof plan !== 'object' || Array.isArray(plan)) {
      return deterministicFallback(goal, telemetry);
    }
    return mapServerPlan(plan as Record<string, unknown>, goal, telemetry);
  } catch {
    clearTimeout(timeoutId);
    return deterministicFallback(goal, telemetry);
  }
}
