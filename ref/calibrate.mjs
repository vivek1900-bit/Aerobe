import { ORG, run, fT, fpH, phases } from './sim_reference.mjs';
let fails = 0;
const ok = (n, c) => { console.log((c ? 'PASS ' : 'FAIL ') + n); if (!c) fails++; };
for (const org of ['ecoli', 'yeast']) {
  const p = ORG[org], d = p.defaults;
  ok(`${org}: fT(Topt)=1, fT(Tmin)=fT(Tmax)=0`, Math.abs(fT(p.Topt, p) - 1) < 1e-9 && fT(p.Tmin, p) === 0 && fT(p.Tmax, p) === 0);
  ok(`${org}: fpH(pHopt)=1, zero at limits`, Math.abs(fpH(p.pHopt, p) - 1) < 1e-9 && fpH(p.pHmin, p) === 0 && fpH(p.pHmax, p) === 0);
  const rows = run(org, d, 12, { every: 60 });
  const at = (h) => rows[Math.min(rows.length - 1, Math.round(h * 60))];
  ok(`${org}: non-negative, pH in [0,14]`, rows.every(r => r.X >= 0 && r.S >= 0 && r.C >= 0 && r.pH >= 0 && r.pH <= 14));
  ok(`${org}: S never increases (feed=0)`, rows.every((r, i) => i === 0 || r.S <= rows[i - 1].S + 1e-6));
  const last = rows[rows.length - 1];
  ok(`${org}: biomass gain <= Yxs*(S0-S)+0.05`, last.X - p.X0 <= p.Yxs * (p.S0 - last.S) + 0.05);
  const ph = phases(rows, org);
  ok(`${org}: lag then exp phase seen`, ph.includes('lag') && ph.includes('exp'));
  const a = at(2.2), b = at(2.3), meas = Math.LN2 / (Math.log(b.X / a.X) / 0.1), pred = at(2.25).doublingTime_h;
  ok(`${org}: doubling time within 10% (measured ${meas.toFixed(2)} h, predicted ${pred?.toFixed(2)} h)`, pred && Math.abs(meas - pred) / pred < 0.10);
  const iDep = rows.findIndex(r => r.S < 0.05);
  if (iDep >= 0) { const r0 = rows[iDep], r1 = rows[Math.min(rows.length - 1, iDep + 10)];
    ok(`${org}: DO rises after substrate runs out (${r0.DO.toFixed(0)}% -> ${r1.DO.toFixed(0)}%)`, r1.DO > r0.DO + 1 || r0.DO > 90); }
  else ok(`${org}: substrate runs out within 12 h`, false);
  const low = run(org, { ...d, rpm: 100, vvm: 0.1 }, 12, { every: 60 });
  const lowWindow = low.filter(r => r.t_h >= 2 && r.t_h <= 6), defaultWindow = rows.filter(r => r.t_h >= 2 && r.t_h <= 6);
  const avgMuLow = lowWindow.reduce((acc, r) => acc + r.mu, 0) / lowWindow.length;
  const avgMuDef = defaultWindow.reduce((acc, r) => acc + r.mu, 0) / defaultWindow.length;
  ok(`${org}: low rpm/vvm gives DO<10% and lower average mu`, Math.min(...low.map(r => r.DO)) < 10 && avgMuLow < avgMuDef);
  ok(`${org}: pH within +-0.3 of setpoint after 1 h`, rows.filter(r => r.t_h > 1).every(r => Math.abs(r.pH - d.pHset) <= 0.3));
  ok(`${org}: deterministic`, JSON.stringify(run(org, d, 3, { every: 60 })) === JSON.stringify(run(org, d, 3, { every: 60 })));
  console.log(`
${org} default run (h | X g/L | S g/L | DO % | pH | mu 1/h)`);
  for (let h = 0; h <= 12; h += 2) { const r = at(h); console.log(`${String(h).padStart(2)} | ${r.X.toFixed(2)} | ${r.S.toFixed(2)} | ${r.DO.toFixed(0)} | ${r.pH.toFixed(2)} | ${r.mu.toFixed(3)}`); }
  console.log(`peak X ${Math.max(...rows.map(r => r.X)).toFixed(2)} g/L, S<0.05 at ${iDep >= 0 ? rows[iDep].t_h.toFixed(2) + ' h' : 'never'}, min DO ${Math.min(...rows.map(r => r.DO)).toFixed(0)} %
`);
}
console.log(fails ? `${fails} CHECK(S) FAILED` : 'ALL CHECKS PASSED');
process.exit(fails ? 1 : 0);
