// In-browser simulation loop (04 §4): advances the deterministic src/sim engine in real time.
// Writes snapshots (4 Hz) + alarms, and appends history (1 point / simulated minute, ring ≤1500).
import { useCallback, useEffect, useRef, useState } from 'react';
import { useConsoleStore } from './store';
import { evaluateAlarms } from './alarms';
import { initState, snap, step, type SimState, type Snapshot } from '../sim/index';

const DT_S = 2; // sim integration step (seconds) — matches run()'s dtS
const SNAP_MS = 250; // readout snapshot cadence (4 Hz)
const HISTORY_EVERY_S = 60; // 1 history point per simulated minute
const HISTORY_MAX = 1500; // ring-buffer cap (04 §4.2)
const DT_REAL_MAX = 0.1; // clamp real dt to avoid huge jumps after tab backgrounding

export function useSimulation() {
  const [running, setRunning] = useState(false);
  const organism = useConsoleStore((s) => s.organism);
  const simRef = useRef<SimState | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef(0);
  const lastFlushRef = useRef(0);
  const accumRef = useRef(0);
  const pendingRef = useRef<Snapshot[]>([]);

  const resetSim = useCallback(() => {
    setRunning(false);
    const { controls, organism: org } = useConsoleStore.getState();
    simRef.current = initState(org, controls);
    const s0 = snap(simRef.current, controls, org);
    useConsoleStore.getState().setSnapshot(s0);
    useConsoleStore.getState().setHistory([s0]);
    useConsoleStore.getState().setAlarms([]);
  }, []);

  // (Re)initialise on mount and whenever the organism changes.
  useEffect(() => {
    resetSim();
  }, [organism, resetSim]);

  const start = useCallback(() => {
    const { controls, organism: org } = useConsoleStore.getState();
    if (!simRef.current) {
      simRef.current = initState(org, controls);
      const s0 = snap(simRef.current, controls, org);
      useConsoleStore.getState().setSnapshot(s0);
      useConsoleStore.getState().setHistory([s0]);
    }
    setRunning(true);
  }, []);

  const pause = useCallback(() => setRunning(false), []);
  const reset = useCallback(() => resetSim(), [resetSim]);

  useEffect(() => {
    if (!running) return;
    lastTsRef.current = 0;
    lastFlushRef.current = 0;
    accumRef.current = 0;
    pendingRef.current = [];

    const tick = (ts: number) => {
      if (lastTsRef.current === 0) lastTsRef.current = ts;
      if (lastFlushRef.current === 0) lastFlushRef.current = ts;

      const dtReal = Math.min(DT_REAL_MAX, (ts - lastTsRef.current) / 1000);
      lastTsRef.current = ts;

      const store = useConsoleStore.getState();
      const { controls, organism: org, speed } = store;
      const st = simRef.current;
      if (!st) return;

      let remaining = dtReal * speed;
      let guard = 0;
      while (remaining >= DT_S && guard < 4000) {
        step(st, controls, org, DT_S);
        remaining -= DT_S;
        guard += 1;
        accumRef.current += DT_S;
      }
      if (remaining > 0) {
        step(st, controls, org, remaining);
        accumRef.current += remaining;
      }

      // Queue one history point per simulated minute.
      while (accumRef.current >= HISTORY_EVERY_S) {
        pendingRef.current.push(snap(st, controls, org));
        accumRef.current -= HISTORY_EVERY_S;
      }

      // Flush snapshot + alarms + history at 4 Hz.
      if (ts - lastFlushRef.current >= SNAP_MS) {
        lastFlushRef.current = ts;
        const cur = snap(st, controls, org);
        store.setSnapshot(cur);
        store.setAlarms(evaluateAlarms(cur));
        if (pendingRef.current.length > 0) {
          const merged = [...store.history, ...pendingRef.current];
          if (merged.length > HISTORY_MAX) merged.splice(0, merged.length - HISTORY_MAX);
          store.setHistory(merged);
          pendingRef.current = [];
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [running]);

  useEffect(
    () => () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    },
    []
  );

  return { running, start, pause, reset };
}
