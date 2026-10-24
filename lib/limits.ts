// Control ranges from 06 §6 (UI limits and server clamps)
export interface ControlRange {
  min: number;
  max: number;
  step: number;
  default: number;
}

export const CONTROL_RANGES: Record<string, ControlRange> = {
  Tset: { min: 20, max: 45, step: 0.5, default: 37 },
  pHset: { min: 5, max: 8.5, step: 0.1, default: 7 },
  rpm: { min: 100, max: 1000, step: 10, default: 400 },
  vvm: { min: 0.1, max: 2, step: 0.1, default: 1 },
  feed: { min: 0, max: 50, step: 1, default: 0 },
};

export type ControlName = keyof typeof CONTROL_RANGES;

export function getRange(name: string): ControlRange | undefined {
  return CONTROL_RANGES[name];
}

export function clampControl(name: string, value: unknown): number | null {
  const range = getRange(name);
  if (!range) return null;
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.min(Math.max(value, range.min), range.max);
}

export function clampPlan(plan: Record<string, unknown>): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [key, value] of Object.entries(plan)) {
    const clamped = clampControl(key, value);
    if (clamped !== null) {
      result[key] = clamped;
    }
  }
  return result;
}

export function validateControls(controls: Record<string, unknown>): boolean {
  const required: ControlName[] = ['Tset', 'pHset', 'rpm', 'vvm', 'feed'];
  return required.every((name) => {
    const range = getRange(name);
    if (!range) return false;
    const value = controls[name];
    if (typeof value !== 'number' || !Number.isFinite(value)) return false;
    return value >= range.min && value <= range.max;
  });
}
