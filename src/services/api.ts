// API client wrapper for AEROBE serverless endpoints.
// Matches API_CONTRACT.md: POST /api/advisor and POST /api/plan.
// Always returns null fallback on failure; never throws.

export interface AdvisorRequest {
  question: string;
  organism: string;
  snapshot: Record<string, unknown>;
  recent: unknown[];
}

export interface AdvisorResponse {
  answer: string | null;
}

export interface PlanRequest {
  goal: string;
  organism: string;
}

export interface Plan {
  Tset: number;
  pHset: number;
  rpm: number;
  vvm: number;
  feed: number;
  reason?: string;
}

export interface PlanResponse {
  plan: Plan | null;
}

// §6 control ranges — client-side validation mirrors server clamps.
export const CONTROL_RANGES: Record<string, { min: number; max: number; step: number }> = {
  Tset: { min: 20, max: 45, step: 0.5 },
  pHset: { min: 5, max: 8.5, step: 0.1 },
  rpm: { min: 100, max: 1000, step: 10 },
  vvm: { min: 0.1, max: 2, step: 0.1 },
  feed: { min: 0, max: 50, step: 1 },
};

const BASE_URL = typeof window !== 'undefined' ? window.location.origin : '';

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

export function isValidAdvisorRequest(body: unknown): body is AdvisorRequest {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.question === 'string' && b.question.length > 0 && b.question.length <= 300 &&
    typeof b.organism === 'string' && b.organism.length > 0 && b.organism.length <= 50 &&
    typeof b.snapshot === 'object' && b.snapshot !== null && !Array.isArray(b.snapshot) &&
    Array.isArray(b.recent) && b.recent.length <= 12
  );
}

export function isValidPlanRequest(body: unknown): body is PlanRequest {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.goal === 'string' && b.goal.length > 0 && b.goal.length <= 200 &&
    typeof b.organism === 'string' && b.organism.length > 0 && b.organism.length <= 50
  );
}

export function validateControlValue(name: string, value: unknown): number | null {
  const range = CONTROL_RANGES[name];
  if (!range) return null;
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.min(Math.max(value, range.min), range.max);
}

export function validateControls(controls: Record<string, unknown>): Record<string, number> | null {
  const result: Record<string, number> = {};
  for (const [key, value] of Object.entries(controls)) {
    const clamped = validateControlValue(key, value);
    if (clamped === null) return null;
    result[key] = clamped;
  }
  return result;
}

export async function callAdvisor(body: AdvisorRequest): Promise<AdvisorResponse> {
  if (!isValidAdvisorRequest(body)) {
    return { answer: null };
  }
  try {
    return await postJson<AdvisorResponse>('/api/advisor', body);
  } catch {
    return { answer: null };
  }
}

export async function callPlan(body: PlanRequest): Promise<PlanResponse> {
  if (!isValidPlanRequest(body)) {
    return { plan: null };
  }
  try {
    return await postJson<PlanResponse>('/api/plan', body);
  } catch {
    return { plan: null };
  }
}
