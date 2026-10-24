// Public API for the AEROBE simulation engine.
// Ported from ref/sim_reference.mjs — deterministic, teaching-grade bioreactor model.

export {
  VESSEL,
  ORG,
  fT,
  fpH,
  fO2,
  kLa,
  terms,
  deriv,
  lim,
  initState,
  step,
  snap,
  run,
  phases,
} from './model';
export type {
  ControlInputs,
  SimState,
  Snapshot,
  VesselParams,
  OrganismParams,
  RunOptions,
} from './types';
export type { TermsResult } from './model';
