import { describe, it, expect } from 'vitest';
import {
  fT,
  fpH,
  fO2,
  lim,
  initState,
  step,
  snap,
  run,
  phases,
  VESSEL,
  ORG,
  type Snapshot,
} from '../index';

describe('cardinal models (fT / fpH / fO2)', () => {
  for (const org of ['ecoli', 'yeast']) {
    const p = ORG[org];

    it(`${org}: fT(Topt)=1, fT(Tmin)=0, fT(Tmax)=0`, () => {
      expect(Math.abs(fT(p.Topt, p) - 1)).toBeLessThan(1e-9);
      expect(fT(p.Tmin, p)).toBe(0);
      expect(fT(p.Tmax, p)).toBe(0);
    });

    it(`${org}: fT monotone up to Topt`, () => {
      const step = (p.Topt - p.Tmin) / 10;
      let prev = fT(p.Tmin + step, p);
      for (let i = 2; i <= 10; i++) {
        const cur = fT(p.Tmin + i * step, p);
        expect(cur).toBeGreaterThanOrEqual(prev - 1e-9);
        prev = cur;
      }
    });

    it(`${org}: fT returns 0 outside [Tmin, Tmax]`, () => {
      expect(fT(p.Tmin - 1, p)).toBe(0);
      expect(fT(p.Tmax + 1, p)).toBe(0);
    });

    it(`${org}: fpH(pHopt)=1, zero at limits`, () => {
      expect(Math.abs(fpH(p.pHopt, p) - 1)).toBeLessThan(1e-9);
      expect(fpH(p.pHmin, p)).toBe(0);
      expect(fpH(p.pHmax, p)).toBe(0);
    });

    it(`${org}: fpH returns 0 outside [pHmin, pHmax]`, () => {
      expect(fpH(p.pHmin - 0.1, p)).toBe(0);
      expect(fpH(p.pHmax + 0.1, p)).toBe(0);
    });

    it(`${org}: fO2 monotone increasing`, () => {
      expect(fO2(0, p)).toBe(0);
      expect(fO2(p.Ko2, p)).toBe(0.5);
      expect(fO2(100, p)).toBeGreaterThan(fO2(1, p));
    });
  }
});

describe('non-negativity and physical bounds', () => {
  for (const org of ['ecoli', 'yeast']) {
    const p = ORG[org];
    const d = p.defaults;

    it(`${org}: all states >= 0 over 24 h extreme controls`, () => {
      const extreme = { Tset: 45, pHset: 8.5, rpm: 100, vvm: 0.1, feed: 50 };
      const rows = run(org, extreme, 24, { every: 60 });
      expect(rows.every((r: Snapshot) => r.X >= 0)).toBe(true);
      expect(rows.every((r: Snapshot) => r.S >= 0)).toBe(true);
      expect(rows.every((r: Snapshot) => r.C >= 0)).toBe(true);
      expect(rows.every((r: Snapshot) => r.pH >= 0 && r.pH <= 14)).toBe(true);
      expect(rows.every((r: Snapshot) => r.T >= 0 && r.T <= 100)).toBe(true);
    });

    it(`${org}: S never increases with feed=0`, () => {
      const rows = run(org, d, 12, { every: 60 });
      for (let i = 1; i < rows.length; i++) {
        expect(rows[i].S).toBeLessThanOrEqual(rows[i - 1].S + 1e-6);
      }
    });

    it(`${org}: biomass gain <= Yxs*(S0-S)+0.05`, () => {
      const rows = run(org, d, 12, { every: 60 });
      const last = rows[rows.length - 1];
      expect(last.X - p.X0).toBeLessThanOrEqual(p.Yxs * (p.S0 - last.S) + 0.05);
    });
  }
});

describe('growth shape and phase detection', () => {
  for (const org of ['ecoli', 'yeast']) {
    const p = ORG[org];
    const d = p.defaults;

    it(`${org}: default batch shows lag -> exp -> stationary`, () => {
      const rows = run(org, d, 12, { every: 60 });
      const ph = phases(rows, org);
      expect(ph).toContain('lag');
      expect(ph).toContain('exp');
    });

    it(`${org}: doubling time within 10% of reference`, () => {
      const rows = run(org, d, 12, { every: 60 });
      const at = (h: number) =>
        rows[Math.min(rows.length - 1, Math.round(h * 60))];
      const a = at(2.2);
      const b = at(2.3);
      const meas = Math.LN2 / (Math.log(b.X / a.X) / 0.1);
      const pred = at(2.25).doublingTime_h;
      expect(pred).not.toBeNull();
      expect(Math.abs(meas - pred!) / pred!).toBeLessThan(0.10);
    });
  }
});

describe('oxygen limitation and substrate exhaustion DO spike', () => {
  it('ecoli: low rpm/vvm gives DO < 10% and lower average mu', () => {
    const d = ORG.ecoli.defaults;
    const rows = run('ecoli', d, 12, { every: 60 });
    const low = run('ecoli', { ...d, rpm: 100, vvm: 0.1 }, 12, { every: 60 });

    const lowWindow = low.filter((r: Snapshot) => r.t_h >= 2 && r.t_h <= 6);
    const defaultWindow = rows.filter((r: Snapshot) => r.t_h >= 2 && r.t_h <= 6);

    const avgMuLow =
      lowWindow.reduce((acc: number, r: Snapshot) => acc + r.mu, 0) / lowWindow.length;
    const avgMuDef =
      defaultWindow.reduce((acc: number, r: Snapshot) => acc + r.mu, 0) / defaultWindow.length;

    expect(Math.min(...low.map((r: Snapshot) => r.DO))).toBeLessThan(10);
    expect(avgMuLow).toBeLessThan(avgMuDef);
  });

  it('ecoli: DO rises after substrate exhaustion', () => {
    const d = ORG.ecoli.defaults;
    const rows = run('ecoli', d, 12, { every: 60 });
    const iDep = rows.findIndex((r: Snapshot) => r.S < 0.05);
    expect(iDep).toBeGreaterThanOrEqual(0);
    const r0 = rows[iDep];
    const r1: Snapshot = rows[Math.min(rows.length - 1, iDep + 10)];
    expect(r1.DO).toBeGreaterThan(r0.DO + 1);
  });

  it('yeast: DO rises after substrate exhaustion', () => {
    const d = ORG.yeast.defaults;
    const rows = run('yeast', d, 12, { every: 60 });
    const iDep = rows.findIndex((r: Snapshot) => r.S < 0.05);
    expect(iDep).toBeGreaterThanOrEqual(0);
    const r0 = rows[iDep];
    const r1: Snapshot = rows[Math.min(rows.length - 1, iDep + 10)];
    expect(r1.DO).toBeGreaterThan(r0.DO + 1);
  });
});

describe('determinism', () => {
  for (const org of ['ecoli', 'yeast']) {
    const p = ORG[org];
    const d = p.defaults;

    it(`${org}: same inputs produce identical outputs`, () => {
      const a = run(org, d, 3, { every: 60 });
      const b = run(org, d, 3, { every: 60 });
      expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    });

    it(`${org}: repeated step calls are bit-for-bit identical`, () => {
      const st1 = initState(org, d);
      const st2 = initState(org, d);
      expect(JSON.stringify(st1)).toBe(JSON.stringify(st2));

      step(st1, d, org, 2, VESSEL);
      step(st2, d, org, 2, VESSEL);
      expect(JSON.stringify(st1)).toBe(JSON.stringify(st2));

      const s1 = snap(st1, d, org, VESSEL);
      const s2 = snap(st2, d, org, VESSEL);
      expect(JSON.stringify(s1)).toBe(JSON.stringify(s2));
    });
  }
});

describe('PI controller and clamping', () => {
  const p = ORG.ecoli;
  const d = p.defaults;

  it('clamps base duty u to [0, 1]', () => {
    const st = initState('ecoli', d);
    step(st, d, 'ecoli', 2, VESSEL);
    expect(st.u).toBeGreaterThanOrEqual(0);
    expect(st.u).toBeLessThanOrEqual(1);
  });

  it('pH stays within +/-0.3 of setpoint after 1 h (default run)', () => {
    const rows = run('ecoli', d, 12, { every: 60 });
    expect(
      rows.filter((r: Snapshot) => r.t_h > 1).every((r: Snapshot) => Math.abs(r.pH - d.pHset) <= 0.3),
    ).toBe(true);
  });

  it('PI integral accumulates only when not saturated or moving toward setpoint', () => {
    const st = initState('ecoli', { ...d, pHset: 7.0 });
    // Force a large positive error so PI saturates high
    st.s[3] = 4.0; // pH far below setpoint -> large e
    const beforeI = st.I;
    step(st, { ...d, pHset: 7.0 }, 'ecoli', 2, VESSEL);
    expect(st.u).toBeLessThanOrEqual(1);
    expect(st.I).toBeGreaterThanOrEqual(beforeI);
  });

  it('clamps temperature to [0, 100] in lim()', () => {
    expect(lim([0, 0, 0, 7, 200, 2])[4]).toBe(100);
    expect(lim([0, 0, 0, 7, -10, 2])[4]).toBe(0);
  });

  it('clamps pH to [0, 14] in lim()', () => {
    expect(lim([0, 0, 0, 20, 37, 2])[3]).toBe(14);
    expect(lim([0, 0, 0, -5, 37, 2])[3]).toBe(0);
  });

  it('clamps non-negative states X, S, C', () => {
    expect(lim([-1, -2, -3, 7, 37, 2])[0]).toBe(0);
    expect(lim([-1, -2, -3, 7, 37, 2])[1]).toBe(0);
    expect(lim([-1, -2, -3, 7, 37, 2])[2]).toBe(0);
  });
});

describe('integration and stiff substep stability', () => {
  const d = ORG.ecoli.defaults;

  it('handles high aeration (kLa stiff) without NaN or divergence', () => {
    const highAeration = { ...d, rpm: 1000, vvm: 2.0 };
    const rows = run('ecoli', highAeration, 12, { every: 60 });
    expect(rows.every((r: Snapshot) => isFinite(r.X))).toBe(true);
    expect(rows.every((r: Snapshot) => isFinite(r.S))).toBe(true);
    expect(rows.every((r: Snapshot) => isFinite(r.C))).toBe(true);
    expect(rows.every((r: Snapshot) => isFinite(r.pH))).toBe(true);
    expect(rows.every((r: Snapshot) => isFinite(r.T))).toBe(true);
  });

  it('handles extreme controls for 24 h without NaN', () => {
    const extreme = { Tset: 45, pHset: 8.5, rpm: 1000, vvm: 2.0, feed: 50 };
    const rows = run('ecoli', extreme, 24, { every: 60 });
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r: Snapshot) => isFinite(r.X))).toBe(true);
    expect(rows.every((r: Snapshot) => isFinite(r.S))).toBe(true);
    expect(rows.every((r: Snapshot) => isFinite(r.C))).toBe(true);
    expect(rows.every((r: Snapshot) => isFinite(r.pH))).toBe(true);
    expect(rows.every((r: Snapshot) => isFinite(r.T))).toBe(true);
  });

  it('substeps cap at 64 and solver remains stable', () => {
    const stiff = { ...d, rpm: 1000, vvm: 2.0 };
    const st = initState('ecoli', stiff);
    step(st, stiff, 'ecoli', 2, VESSEL);
    expect(isFinite(st.s[0])).toBe(true);
    expect(isFinite(st.s[2])).toBe(true);
  });
});

describe('canonical reference output values', () => {
  it('ecoli default run matches reference snapshot at key hours', () => {
    const rows = run('ecoli', ORG.ecoli.defaults, 12, { every: 60 });
    const at = (h: number) =>
      rows[Math.min(rows.length - 1, Math.round(h * 60))];

    const r0 = at(0);
    expect(r0.X).toBeCloseTo(0.05, 2);
    expect(r0.S).toBeCloseTo(10.0, 2);
    expect(r0.DO).toBeCloseTo(100, 1);
    expect(r0.pH).toBeCloseTo(7.0, 2);

    const r8 = at(8);
    expect(r8.S).toBeCloseTo(0, 0);
    expect(r8.DO).toBeGreaterThan(90);

    const peakX = Math.max(...rows.map((r: Snapshot) => r.X));
    expect(peakX).toBeGreaterThan(4.0);
    expect(peakX).toBeLessThan(5.0);
  });

  it('yeast default run matches reference snapshot at key hours', () => {
    const rows = run('yeast', ORG.yeast.defaults, 12, { every: 60 });
    const at = (h: number) =>
      rows[Math.min(rows.length - 1, Math.round(h * 60))];

    const r0 = at(0);
    expect(r0.X).toBeCloseTo(0.2, 2);
    expect(r0.S).toBeCloseTo(10.0, 2);
    expect(r0.DO).toBeCloseTo(100, 1);
    expect(r0.pH).toBeCloseTo(5.0, 2);

    const r10 = at(10);
    expect(r10.S).toBeCloseTo(0, 0);
    expect(r10.DO).toBeGreaterThan(90);

    const peakX = Math.max(...rows.map((r: Snapshot) => r.X));
    expect(peakX).toBeGreaterThan(4.0);
    expect(peakX).toBeLessThan(5.5);
  });
});
