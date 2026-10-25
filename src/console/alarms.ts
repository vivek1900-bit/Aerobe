// Alarm evaluation — maps a Snapshot to active out-of-bounds conditions (§6 / 04 §4.3).
import type { Snapshot } from '../sim/index';
import type { Alarm } from './store';

export function evaluateAlarms(s: Snapshot): Alarm[] {
  const out: Alarm[] = [];
  if (s.DO < 20) {
    out.push({ id: 'do-low', severity: 'danger', message: 'DO DEPLETION FAULT — Dissolved O₂ below 20%', t_h: s.t_h });
  }
  if (s.T > 40) {
    out.push({
      id: 't-high',
      severity: 'danger',
      message: 'CRITICAL FAULT: HIGH TEMPERATURE > 40.0°C — THERMAL DENATURATION RISK',
      t_h: s.t_h,
    });
  } else if (s.T < 20) {
    out.push({ id: 't-low', severity: 'warn', message: 'Temperature below 20 °C', t_h: s.t_h });
  }
  if (s.pH < 5.5 || s.pH > 8.0) {
    out.push({ id: 'ph-drift', severity: 'warn', message: 'pH outside 5.5–8.0', t_h: s.t_h });
  }
  if (s.S < 0.05) {
    out.push({
      id: 'substrate-exhausted',
      severity: 'warn',
      message: 'Carbon source exhausted — note the DO spike',
      t_h: s.t_h,
    });
  }
  return out;
}
