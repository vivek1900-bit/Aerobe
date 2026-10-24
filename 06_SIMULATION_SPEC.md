# 06 — Simulation Specification (teaching-grade bioreactor model)

**Purpose:** a deterministic, unit-tested model that makes the console feel real and gives the AI grounded numbers.
**Claim boundary:** this is a *teaching/planning simulation*, **not** a validated process model. All parameters marked `ILLUSTRATIVE` are
**illustrative placeholders** until a source is added; the UI must show "illustrative parameters" wherever they appear.

## 1. State vector (units)
| Symbol | Meaning | Unit |
|---|---|---|
| `X` | biomass | g/L |
| `S` | limiting substrate (e.g. glucose) | g/L |
| `C` | dissolved oxygen concentration | mg/L |
| `DO` | dissolved oxygen, % of saturation = `100·C/Cstar` | % |
| `pH` | acidity | pH units |
| `T` | culture temperature | °C |
| `V` | working volume | L |
| `t` | simulated time | h |

Inputs (controls): `Tset` (°C), `pHset`, `rpm`, `vvm` (air volume per liquid volume per minute), `feed` (mL/h of concentrated substrate, `Sin` g/L).

## 2. Equations
```
mu     = mumax · S/(Ks+S) · fT(T) · fpH(pH) · fO2(C) · crowd(X)
crowd  = max(0, 1 − X/Xmax)              (simple carrying capacity; optional exponent n)
dX/dt  = (mu − kd)·X − (F/V)·X           (F = feed in L/h; dilution term)
dS/dt  = −(mu/Yxs + ms)·X + (F/V)·(Sin − S)
dV/dt  = F
OUR    = (mu/Yxo + mo)·X                 (oxygen uptake rate, mg/L/h)
kLa    = k0 · (rpm/rpm_ref)^a · (vvm/vvm_ref)^b     (h⁻¹, correlation form; exponents ILLUSTRATIVE)
dC/dt  = kLa·(Cstar − C) − OUR
dpH/dt = −alpha·mu·X + beta·u            (u = base-pump duty 0..1 from PI controller)
dT/dt  = (Tset − T)/tauT + gen·mu·X      (first-order jacket control + small metabolic heat)
```
### Cardinal models (so growth peaks at an optimum and falls to zero at limits)
```
fT(T)  = (T−Tmax)(T−Tmin)² / ( (Topt−Tmin)·[ (Topt−Tmin)(T−Topt) − (Topt−Tmax)(Topt+Tmin−2T) ] )   for Tmin<T<Tmax else 0
fpH(p) = (p−pHmin)(p−pHmax) / ( (p−pHmin)(p−pHmax) − (p−pHopt)² )                                       for pHmin<p<pHmax else 0
fO2(C) = C/(Ko2 + C)
```
*These cardinal expressions are retained unchanged from the checked reference model. The reference calibration and the §5 tests are the acceptance evidence for this teaching simulation; they are not a claim of real-process validation.*

### Phase detection (for labels/UI)
- `depleted`: `S < 0.05 g/L` and `mu` collapsing. `lag`: `t < ~1 h` or `mu < 0.1·mumax` early. `exp`: `mu ≥ 0.5·mumax`. else `stationary`.

### Educational "signature" events (auto-insights)
1. **Substrate exhaustion → DO spike:** when `S` hits ~0, OUR collapses, so DO rises sharply. Insight text: "Carbon source ran out; oxygen demand dropped, so DO rose."
2. **Oxygen limitation:** `DO < 20 %` while `mu` is falling → insight: increase rpm or vvm.
3. **Acid production:** pH falls with growth; base pump engages.
4. **Temperature stress:** `T` outside `Topt ± 3 °C` slows growth.

## 3. Parameters, initial conditions and units (v2)
**Canonical implementation: `ref/sim_reference.mjs`. Port it to TypeScript line by line. Do not re-derive equations or invent values.** Every value below is ILLUSTRATIVE and must be labelled so in the UI.
| Param | E. coli (aerobic, glucose) | S. cerevisiae (aerobic, glucose) |
|---|---|---|
| `mumax` (1/h) | 0.80 | 0.40 |
| `Ks` (g/L) | 0.05 | 0.10 |
| `Yxs` (g/g) | 0.45 | 0.50 |
| `Yxo` (g/mg O2) | 0.00125 | 0.00110 |
| `Ko2` (mg/L) | 0.2 | 0.2 |
| `Xmax` (g/L) | 20 | 20 |
| `Cstar` (mg/L) | 7.0 | 7.5 |
| `Tmin / Topt / Tmax` (C) | 8 / 37 / 47 | 5 / 30 / 40 |
| `pHmin / pHopt / pHmax` | 4.5 / 7.0 / 9.0 | 2.5 / 5.0 / 8.0 |
| `kd`, `ms`, `mo`, `alpha` | 0.02, 0.04, 15, 0.4 | 0.01, 0.02, 10, 0.2 |
| `X0`, `S0` (g/L) | 0.05, 10 | 0.2, 10 |
**Vessel:** `V0` = 2.0 L; `Sin` = 500 g/L; `kLa = k0*(rpm/rpm_ref)^a*(vvm/vvm_ref)^b` with `k0`=400 1/h, `a`=1.2, `b`=0.5, `rpm_ref`=400, `vvm_ref`=1.0; `beta`=2.5 pH/h at full pump; `tauT`=0.1 h; `gen`=1.0; PI controller `Kp`=2.0, `Ki`=4.0 with anti-windup.
**Initial state:** `C0 = Cstar`, `pH0 = pHset`, `T0 = Tset`.
**Units:** the UI feed in mL/h becomes `F = feed/1000` L/h inside the model. Time is in hours; `dt` = 2 s = 2/3600 h; the solver adds RK4 substeps (max 64) automatically when the oxygen term is stiff.

## 4. Numerics
- **RK4** fixed step `dt = 2 s` of simulated time (≈ 0.00056 h). `kLa` of ~100 h⁻¹ is stiff-ish (time constant ~36 s), so keep `dt ≤ 5 s`.
- Per animation frame: `steps = ceil(speed · frameDt / dt)` (cap at 200) so 3600× stays responsive.
- Clamp all states to physical bounds each step (`X,S,C ≥ 0`, `pH ∈ [0,14]`, `T ∈ [0,100]`).
- **PI controller for pH:** `u = clamp(Kp·e + Ki·∫e, 0, 1)`, `e = pHset − pH`, anti-windup; `dpH/dt += beta·u`.
- Speed presets: 1×, 60× (1 s = 1 min), 600× (default; 12 h batch ≈ 72 s), 3600×.
- **Determinism:** no `Math.random()` in the model. Any "noise" uses a seeded PRNG and is off by default.

## 5. Unit tests (Vitest) — acceptance
| Test | Expectation |
|---|---|
| `fT(Topt) = 1`, `fT(Tmin) = 0`, `fT(Tmax) = 0`, monotone up to Topt | pass |
| `fpH(pHopt) = 1`, zero at limits | pass |
| Non-negativity | all states ≥ 0 over a 24 h run at extreme controls |
| Mass-balance sanity | with `feed=0`, `S` never increases; `X` increase ≤ `Yxs·(S0−S)` + tolerance |
| Growth shape | default batch shows lag→exp→stationary; between t = 1.5 h and 3 h (S >> Ks, crowd >= 0.9) the measured doubling time ≈ `ln2/(mu-kd)` within 10 % |
| Oxygen limitation | `rpm`/`vvm` very low → `DO` < 10 % at peak demand and `mu` drops vs. normal |
| Substrate exhaustion | `DO` rises within 10 simulated min after `S` < 0.05 |
| Determinism | same inputs → identical outputs |
| Controller | pH stays within ±0.3 of setpoint in the default run |

## 6. Control ranges (UI limits and server clamps)
| Control | Min | Max | Step | Default (E. coli) |
|---|---|---|---|---|
| Temperature `Tset` (°C) | 20 | 45 | 0.5 | 37 |
| pH `pHset` | 5.0 | 8.5 | 0.1 | 7.0 |
| Agitation `rpm` | 100 | 1000 | 10 | 400 |
| Aeration `vvm` | 0.1 | 2.0 | 0.1 | 1.0 |
| Feed (mL/h) | 0 | 50 | 1 | 0 |
Yeast defaults: `Tset 30`, `pHset 5.0`, `rpm 300`, `vvm 0.8`.

## 7. Snapshot schema (shared by charts, alarms, AI)
```ts
type Snapshot = { t_h: number; X: number; S: number; DO: number; pH: number; T: number; V: number;
                  mu: number; kLa: number; OUR: number; baseDuty: number; doublingTime_h: number | null };
```
Alarm ids: `do_low` (warn <20, crit <10), `ph_drift` (|Δ|>0.3), `temp_drift` (|Δ|>1.5), `substrate_out` (info).

## 8. Optional Tier-3: fault injection ("challenge mode")
Faults: *agitator stall* (rpm→0), *air supply drop* (vvm×0.3), *pH probe drift* (+0.5 offset in displayed pH but not true pH), *cooling failure* (tauT×5 and +heat). User must diagnose using curves/AI. Score = time to correct. Deterministic and testable.

## 9. UI mapping to visuals (see 08)
`rpm → impeller angular speed`, `vvm → bubble rate`, `X (normalised) → liquid colour/turbidity + cell count`, `T → jacket glow tint`, `DO/pH → probe node colour`, `alarms → label pulse`.

## 10. Reference implementation and calibration (generated)
`ref/sim_reference.mjs` is the frozen canonical model; `ref/calibrate.mjs` checks it. The TypeScript port must reproduce this output (small rounding differences are fine). If any check says FAIL, fix the TypeScript port or its tests first. Do not alter the reference merely to make a port pass; any reference-model change requires documented scientific justification and updated calibration evidence.
```
PASS ecoli: fT(Topt)=1, fT(Tmin)=fT(Tmax)=0
PASS ecoli: fpH(pHopt)=1, zero at limits
PASS ecoli: non-negative, pH in [0,14]
PASS ecoli: S never increases (feed=0)
PASS ecoli: biomass gain <= Yxs*(S0-S)+0.05
PASS ecoli: lag then exp phase seen
PASS ecoli: doubling time within 10% (measured 0.93 h, predicted 0.93 h)
PASS ecoli: DO rises after substrate runs out (77% -> 98%)
PASS ecoli: low rpm/vvm gives DO<10% and lower average mu
PASS ecoli: pH within +-0.3 of setpoint after 1 h
PASS ecoli: deterministic

ecoli default run (h | X g/L | S g/L | DO % | pH | mu 1/h)
 0 | 0.05 | 10.00 | 100 | 7.00 | 0.772
 2 | 0.22 | 9.59 | 95 | 7.00 | 0.764
 4 | 0.96 | 7.86 | 79 | 6.99 | 0.730
 6 | 3.59 | 1.68 | 37 | 6.97 | 0.592
 8 | 4.15 | 0.00 | 98 | 7.11 | 0.000
10 | 3.98 | 0.00 | 98 | 7.11 | 0.000
12 | 3.82 | 0.00 | 98 | 7.11 | 0.000
peak X 4.29 g/L, S<0.05 at 6.35 h, min DO 35 %

PASS yeast: fT(Topt)=1, fT(Tmin)=fT(Tmax)=0
PASS yeast: fpH(pHopt)=1, zero at limits
PASS yeast: non-negative, pH in [0,14]
PASS yeast: S never increases (feed=0)
PASS yeast: biomass gain <= Yxs*(S0-S)+0.05
PASS yeast: lag then exp phase seen
PASS yeast: doubling time within 10% (measured 1.89 h, predicted 1.89 h)
PASS yeast: DO rises after substrate runs out (76% -> 97%)
PASS yeast: low rpm/vvm gives DO<10% and lower average mu
PASS yeast: pH within +-0.3 of setpoint after 1 h
PASS yeast: deterministic

yeast default run (h | X g/L | S g/L | DO % | pH | mu 1/h)
 0 | 0.20 | 10.00 | 100 | 5.00 | 0.382
 2 | 0.42 | 9.54 | 92 | 5.00 | 0.377
 4 | 0.86 | 8.60 | 84 | 5.00 | 0.367
 6 | 1.73 | 6.76 | 70 | 5.00 | 0.347
 8 | 3.28 | 3.46 | 50 | 5.00 | 0.308
10 | 4.86 | 0.00 | 97 | 5.03 | 0.000
12 | 4.77 | 0.00 | 98 | 5.03 | 0.000
peak X 4.88 g/L, S<0.05 at 9.52 h, min DO 41 %

ALL CHECKS PASSED
```
