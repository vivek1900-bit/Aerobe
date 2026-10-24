# PROMPTS V2 — required run sheet

Prefix each task: “Read `00_START_HERE.md` and the named sections before changing code. I am Person <1|2>, step <ID>. Complete files only.” Verify each step before continuing.

| ID | Owner | Task | Acceptance |
|---|---|---|---|
| S-00 | both | Record the confirmed deadline: **Sun 25 Oct 2026, 5:00 PM IST**. Scaffold Vite, React, TS, Tailwind, `.gitignore`, and Vercel build script. | Vite build and preview deploy work. |
| S-01 | both | Freeze the shared signals, store and SVG part contracts. | Both branches can pull the same contracts. |
| S-02 | P2 | Port `ref/sim_reference.mjs` line by line; add §5 tests. | `npm test` and reference calibration pass. |
| S-03 | P2 | Add store loop, controls, SVG charts, alarms and offline rules advisor. | Browser simulation works without network. |
| S-04 | P2 | Implement `lib/gemini.ts`, `api/advisor.ts`, and `api/plan.ts`: clamps, max output tokens, 8 s abort, null-safe responses. | Valid online response; safe fallback for no key/error/invalid output. |
| S-05 | P2 | Add advisor and small goal-to-sliders UI with explicit Apply. | Goal fills only clamped sliders. |
| S-06 | P1 | Add nav, Skip, `#app`, `?mode=app`, Replay, and primary named `ReactorSVG` bindings. | Keyboard skip and SVG controls work. |
| S-07 | P1 | Build the three intro chapters: Why it matters, How it works, Run a batch. | Short readable tour; Skip works throughout. |
| S-08 | P1 | Add lite mode, reduced motion, responsive layout and accessibility pass. | No WebGL dependency; mobile and keyboard checks pass. |
| S-09 | both | Run `12` live gates, complete README/AI log, record video and submit. | Live URL, repo and video are ready. |

Optional 3D work is not a prompt queue. It may start only after S-09 passes, using 08 as a bonus reference.
