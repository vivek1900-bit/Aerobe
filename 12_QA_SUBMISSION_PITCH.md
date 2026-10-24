# 12 — QA, Submission and Pitch (v2)

## 1. Live release gates

- [ ] Vercel serves the Vite build; `#app` and `?mode=app` open the console.
- [ ] Skip works from the first frame by keyboard, with reduced motion, and in lite mode.
- [ ] The deterministic simulation, charts, alarms, named `ReactorSVG` bindings, and `node ref/calibrate.mjs` pass.
- [ ] Advisor works with a valid key and shows the offline rules advisor when the key is missing, the function fails, quota is unavailable, or the 8 s client timeout expires.
- [ ] Goal-to-sliders returns only clamped values and needs an explicit Apply action; invalid AI output uses a deterministic preset.
- [ ] Three intro chapters work: Why it matters, How it works, Run a batch.
- [ ] Mobile portrait has no horizontal scroll; controls have labels and visible focus; contrast is at least 4.5:1; reduced motion and lite mode work.
- [ ] README, AI log, public URL and two-minute video identify the product as an illustrative teaching simulation.

## 2. Test matrix

| Test | Action | Expected result |
|---|---|---|
| Build | `npm run build` | Vite build succeeds. |
| Simulation | `npm test` and `node ref/calibrate.mjs` | Unit tests and reference calibration pass. |
| Offline | Remove the Vercel key or make the request fail | Console still runs; offline advisor answers. |
| Planner | Submit a goal and malformed response fixture | Valid values are clamped; malformed output falls back safely. |
| Navigation | Open `/`, `/#app`, `?mode=app`; use Skip and Replay | Correct mode and focus each time. |
| Accessibility | Keyboard-only and reduced-motion/lite checks | No trap, visible focus, readable static flow. |

## 3. Two-minute video

| Time | Content |
|---|---|
| 0:00–0:25 | Students without lab access need a safe way to see cause and effect in a bioprocess. |
| 0:25–0:55 | Show the three short intro chapters, then use Skip and open the console. |
| 0:55–1:25 | Set controls, run the illustrative simulation, show curves, alarms and the SVG reactor responding. |
| 1:25–1:45 | Ask the advisor; disconnect it to show the offline fallback; use goal-to-sliders and explicit Apply. |
| 1:45–2:00 | Show lite/reduced-motion access, Vercel URL, and the teaching-only / illustrative boundary. |

## 4. README manifest

Include: problem and users; features actually shipped; AI use and `docs/AI-LOG.md`; stack; local setup; test commands; Vercel deployment; teaching/illustrative limitations; credits; team. Do not list unshipped services, endpoints, tools, or 3D work as required product infrastructure.

## 5. Risk fallback

| Risk | Fallback |
|---|---|
| Gemini quota, key, model, function, or network unavailable | Offline advisor and deterministic planner preset. |
| Vercel deployment unavailable | Treat it as an immediate release blocker; do not introduce another host during submission. |
| Time pressure | Cut all bonus 3D first; do not cut simulation, SVG reactor, Skip, deep links, lite mode, offline advisor, or video. |
