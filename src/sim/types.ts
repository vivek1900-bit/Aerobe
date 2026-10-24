// Types for the AEROBE bioreactor simulation (06 §1 snapshot schema, controls).
// All parameters marked ILLUSTRATIVE in the UI.

export interface ControlInputs {
  Tset: number;
  pHset: number;
  rpm: number;
  vvm: number;
  feed: number;
}

export interface SimState {
  s: number[]; // [X, S, C, pH, T, V]
  I: number;   // PI integral term
  t: number;   // simulated time (h)
  u?: number;  // base pump duty (0..1)
}

export interface Snapshot {
  t_h: number;
  X: number;
  S: number;
  C: number;
  DO: number;
  pH: number;
  T: number;
  V: number;
  mu: number;
  kLa: number;
  OUR: number;
  baseDuty: number;
  crowd: number;
  doublingTime_h: number | null;
}

export interface VesselParams {
  V0: number;
  Sin: number;
  k0: number;
  a: number;
  b: number;
  rpm_ref: number;
  vvm_ref: number;
  beta: number;
  tauT: number;
  gen: number;
  Kp: number;
  Ki: number;
}

export interface OrganismParams {
  mumax: number;
  Ks: number;
  Yxs: number;
  Yxo: number;
  Ko2: number;
  Xmax: number;
  Cstar: number;
  Tmin: number;
  Topt: number;
  Tmax: number;
  pHmin: number;
  pHopt: number;
  pHmax: number;
  kd: number;
  ms: number;
  mo: number;
  alpha: number;
  X0: number;
  S0: number;
  defaults: ControlInputs;
}

export interface RunOptions {
  dtS?: number;
  every?: number;
  v?: VesselParams;
}
