// AEROBE reference simulation (06 section 2 equations, unchanged). All parameters ILLUSTRATIVE. No DOM, no Math.random.
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
export const VESSEL = { V0: 2.0, Sin: 500, k0: 400, a: 1.2, b: 0.5, rpm_ref: 400, vvm_ref: 1.0, beta: 2.5, tauT: 0.1, gen: 1.0, Kp: 2.0, Ki: 4.0 };
export const ORG = {
  ecoli: { mumax: 0.80, Ks: 0.05, Yxs: 0.45, Yxo: 0.00125, Ko2: 0.2, Xmax: 20, Cstar: 7.0, Tmin: 8, Topt: 37, Tmax: 47, pHmin: 4.5, pHopt: 7.0, pHmax: 9.0,
           kd: 0.02, ms: 0.04, mo: 15, alpha: 0.4, X0: 0.05, S0: 10, defaults: { Tset: 37, pHset: 7.0, rpm: 400, vvm: 1.0, feed: 0 } },
  yeast: { mumax: 0.40, Ks: 0.10, Yxs: 0.50, Yxo: 0.00110, Ko2: 0.2, Xmax: 20, Cstar: 7.5, Tmin: 5, Topt: 30, Tmax: 40, pHmin: 2.5, pHopt: 5.0, pHmax: 8.0,
           kd: 0.01, ms: 0.02, mo: 10, alpha: 0.2, X0: 0.2, S0: 10, defaults: { Tset: 30, pHset: 5.0, rpm: 300, vvm: 0.8, feed: 0 } },
};
export const fT = (T, p) => (T <= p.Tmin || T >= p.Tmax) ? 0 :
  ((T - p.Tmax) * (T - p.Tmin) ** 2) / ((p.Topt - p.Tmin) * ((p.Topt - p.Tmin) * (T - p.Topt) - (p.Topt - p.Tmax) * (p.Topt + p.Tmin - 2 * T)));
export const fpH = (x, p) => (x <= p.pHmin || x >= p.pHmax) ? 0 : ((x - p.pHmin) * (x - p.pHmax)) / ((x - p.pHmin) * (x - p.pHmax) - (x - p.pHopt) ** 2);
export const fO2 = (C, p) => C / (p.Ko2 + C);
export const kLa = (c, v = VESSEL) => v.k0 * (c.rpm / v.rpm_ref) ** v.a * (c.vvm / v.vvm_ref) ** v.b;
export function terms(s, c, p, v = VESSEL) {
  const [X, S, C, pH, T] = s, F = c.feed / 1000;
  const crowd = Math.max(0, 1 - X / p.Xmax);
  const mu = p.mumax * S / (p.Ks + S) * fT(T, p) * fpH(pH, p) * fO2(C, p) * crowd;
  return { mu, OUR: (mu / p.Yxo + p.mo) * X, kLa: kLa(c, v), F, crowd };
}
export function deriv(s, c, p, u, v = VESSEL) {
  const [X, S, C, pH, T, V] = s, { mu, OUR, kLa: k, F } = terms(s, c, p, v);
  return [(mu - p.kd) * X - (F / V) * X, -(mu / p.Yxs + p.ms) * X + (F / V) * (v.Sin - S), k * (p.Cstar - C) - OUR,
          -p.alpha * mu * X + v.beta * u, (c.Tset - T) / v.tauT + v.gen * mu * X, F];
}
const lim = (s) => [Math.max(0, s[0]), Math.max(0, s[1]), Math.max(0, s[2]), clamp(s[3], 0, 14), clamp(s[4], 0, 100), s[5]];
export function initState(org, ctl, v = VESSEL) { const p = ORG[org]; return { s: [p.X0, p.S0, p.Cstar, ctl.pHset, ctl.Tset, v.V0], I: 0, t: 0 }; }
export function step(st, ctl, org, dtS = 2, v = VESSEL) {
  const p = ORG[org], dt = dtS / 3600, e = ctl.pHset - st.s[3];
  const uRaw = v.Kp * e + v.Ki * st.I, u = clamp(uRaw, 0, 1);
  if ((uRaw > 0 && uRaw < 1) || (uRaw <= 0 && e > 0) || (uRaw >= 1 && e < 0)) st.I += e * dt;
  const [X, S, , pH, T] = st.s;
  const muFree = p.mumax * S / (p.Ks + S) * fT(T, p) * fpH(pH, p) * Math.max(0, 1 - X / p.Xmax);
  const lambdaHat = kLa(ctl, v) + X * muFree / (p.Yxo * p.Ko2), nsub = clamp(Math.ceil(lambdaHat * dt), 1, 64), h = dt / nsub;
  const f = (x) => deriv(x, ctl, p, u, v), add = (x, d, hh) => x.map((xi, i) => xi + hh * d[i]);
  for (let j = 0; j < nsub; j++) {
    const k1 = f(st.s), k2 = f(add(st.s, k1, h / 2)), k3 = f(add(st.s, k2, h / 2)), k4 = f(add(st.s, k3, h));
    st.s = lim(st.s.map((xi, i) => xi + h / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])));
  }
  st.t += dt; st.u = u; return st;
}
export function snap(st, ctl, org, v = VESSEL) {
  const p = ORG[org], [X, S, C, pH, T, V] = st.s, tm = terms(st.s, ctl, p, v), net = tm.mu - p.kd - tm.F / V;
  return { t_h: st.t, X, S, C, DO: 100 * C / p.Cstar, pH, T, V, mu: tm.mu, kLa: tm.kLa, OUR: tm.OUR, baseDuty: st.u ?? 0, crowd: tm.crowd, doublingTime_h: net > 0 ? Math.LN2 / net : null };
}
export function run(org, ctl = ORG[org].defaults, hours = 12, { dtS = 2, every = 60, v = VESSEL } = {}) {
  const st = initState(org, ctl, v), out = [snap(st, ctl, org, v)], n = Math.round(hours * 3600 / dtS), m = Math.round(every / dtS);
  for (let i = 1; i <= n; i++) { step(st, ctl, org, dtS, v); if (i % m === 0) out.push(snap(st, ctl, org, v)); }
  return out;
}
export function phases(rows, org, dwellH = 0.25) {
  const p = ORG[org], dtH = rows[1].t_h - rows[0].t_h, back = Math.round(0.1 / dtH);
  const raw = rows.map((r, i) => { const prev = rows[Math.max(0, i - back)];
    if (r.S < 0.05 && r.mu < 0.9 * prev.mu) return 'depleted'; if (r.t_h < 1) return 'lag'; return r.mu >= 0.5 * p.mumax ? 'exp' : 'stationary'; });
  let cur = raw[0], cand = null, since = 0; const out = [cur];
  for (let i = 1; i < rows.length; i++) { if (raw[i] === cur) cand = null; else if (raw[i] !== cand) { cand = raw[i]; since = rows[i].t_h; }
    else if (rows[i].t_h - since >= dwellH - 1e-9) { cur = cand; cand = null; } out.push(cur); }
  return out;
}
