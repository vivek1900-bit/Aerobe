# 03 — Architecture (v2: Vercel + SVG-first)

## 1. Scope and deployment

Ship one Vite/React static site on **Vercel**, with two same-origin serverless functions:

```
Browser: Vite static build
  ├─ short three-chapter intro; Skip and #app open the console
  ├─ console: controls, deterministic browser simulation, SVG charts and ReactorSVG
  ├─ advisor client: 3 s client cooldown and 8 s request abort
  └─ offline rules advisor and heuristic plan fallback
                         │ POST, same origin
                         ▼
Vercel functions: /api/advisor and /api/plan
                         │ GEMINI_API_KEY only in Vercel environment variables
                         ▼
                     Gemini API
```

There is no separate application server, `/healthz` probe, server-side in-memory rate limiter, daily in-memory budget, or 3D requirement. A 3D reactor, bloom and dive interactions are bonus work only after all required gates pass.

## 2. Product modes and fallbacks

`boot` routes straight to `app` for `#app`, `?mode=app`, or a saved skip preference; otherwise it opens `intro`. The visible **SKIP INTRO → BIOREACTOR** button, keyboard flow, `#app`, and `?mode=app` must work from the first frame. `REPLAY TOUR` returns from the console to the intro.

`ReactorSVG` is the primary reactor view. It uses named, focusable parts and binds rpm, vvm, biomass and temperature to visual state. Lite mode and reduced motion keep this view fully functional; they remove nonessential animation rather than changing product behaviour.

| Failure | Required behaviour |
|---|---|
| Gemini request fails, times out, returns invalid output, quota is unavailable, or no key exists | Return to the offline rules advisor; for planning use the deterministic organism preset and explain that it is a fallback. |
| Vercel function is unavailable | Console and simulation continue in the browser. |
| Lite mode / reduced motion | No WebGL dependency; use stacked static intro sections and functional SVG reactor. |

## 3. State and boundaries

The deterministic simulation is pure TypeScript in `src/sim/`. It writes snapshots, charts, alarms and visual bindings locally. AI may explain snapshots and propose bounded slider values; it never changes a run without an explicit Apply action and never makes safety decisions.

```ts
type Controls = { Tset: number; pHset: number; rpm: number; vvm: number; feed: number };
type Snapshot = {
  t_h: number; X: number; S: number; DO: number; pH: number; T: number; V: number;
  mu: number; kLa: number; OUR: number; baseDuty: number; doublingTime_h: number | null;
};
```

`signals` carries non-reactive visual values; the Zustand store carries UI state, controls, snapshots, history, alarms, advisor status, quality, and motion preferences. The plan endpoint clamps output to the control ranges in 06 §6 before it reaches the client.

## 4. Repository manifest

```
aerobe/
├─ AGENTS.md
├─ docs/blueprint/               # these specifications
├─ api/                          # advisor.ts, plan.ts
├─ lib/                          # gemini.ts, limits.ts
├─ ref/                          # canonical simulation and calibration script
├─ src/
│  ├─ app/ core/ sim/ console/ ui/ story/ reactor/ styles/
│  └─ main.tsx App.tsx
├─ index.html  vite.config.ts  package.json
└─ .env.example  .gitignore
```

Person 1 owns `src/reactor/**`, `src/story/**`, `src/core/**`, styling and deployment. Person 2 owns `src/sim/**`, `src/console/**`, `src/app/**`, `api/**`, `lib/**`, `ref/**`, tests, README and AI log. Shared contracts are frozen together in Block A: `src/core/signals.ts`, store types and `src/reactor/partsContract.ts`.

## 5. Required gates

1. Vercel preview deploys a Vite build and both people can open it.
2. Simulation tests and the reference calibration pass.
3. Controls, charts, alarms, ReactorSVG, offline advisor, advisor endpoint, and basic goal-to-sliders flow work.
4. The three-chapter intro, Skip, deep links, lite mode and reduced motion work on the live URL.
5. Live smoke test, accessibility checks, README, AI log and video are complete.
6. Only then may the team begin optional 3D work.
