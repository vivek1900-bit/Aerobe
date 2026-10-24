# 09 - Team, Git and Roadmap (v2: fits about 8.5 working hours per person)

## 1. Roles and ownership
| | **Person 1: Visuals & Motion** | **Person 2: Simulation, App & AI** |
|---|---|---|
| Laptop | RTX 3050 (can test 3D) | Integrated graphics (use `?q=lite` or the Vercel preview URL) |
| Owns | `src/reactor/**` `src/story/**` `src/core/**` `src/styles/**` `src/ui/Nav*` `index.html` | `src/sim/**` `src/console/**` `src/app/**` `api/**` `lib/**` `ref/**` tests, `README.md`, `docs/AI-LOG.md` |
| Main jobs | Design tokens, Nav + Skip, SVG reactor + bindings, 3-chapter intro, lite/reduced motion, deploy, Lighthouse | Port + test simulation, store loop, controls, charts, alarms, offline advisor, `/api/*`, advisor + planner UI, README, video |
Shared contracts (edit only together, in Block A, then frozen): `src/core/signals.ts`, `src/app/store.ts` (types), `src/reactor/partsContract.ts`.

## 2. Git rules
Branches: `main` (always deployable; Vercel deploys it), `p1/visuals`, `p2/app`.
1. Never work on `main` after Block A. Start of session: `git checkout <branch> && git fetch origin && git merge origin/main`.
2. Commit every 20-30 min: `git add -A && git commit -m "sim: port step()"` then `git push`.
3. Merge to `main` only at gates, via Pull Request that the OTHER person merges, and only if `npm run build` passes with no console errors.
4. Only the folder owner edits those files. Need a change? Send a REQUEST BLOCK.
5. One person installs packages at a time (say so in chat). Lockfile conflict: `git checkout origin/main -- package-lock.json && npm install`.
6. Never commit `.env`, keys, `node_modules`, `dist`. Never `git push --force`.
7. Every branch push gets a Vercel preview URL: Person 2 uses it to see 3D/visual work.

## 3. Time plan (confirmed submission deadline: Sun 25 Oct 2026, 5:00 PM IST)
| Block | Person 1 | Person 2 | Gate |
|---|---|---|---|
| **A. Foundations (0.75 h, together)** | Vite+Tailwind scaffold, fonts, GitHub repo, **Vercel "Hello" deploy**, contracts | Gemini key from AI Studio, `.env`, `store` types, copy `ref/` into repo | Live Vercel URL; both can pull; contracts on `main` |
| **B. Core (2 h)** | Design tokens, Nav + **Skip**, `ReactorSVG` (static named parts) | Port `ref/sim_reference.mjs` to TS + Vitest, store loop, ControlPanel | `npm test` passes; sliders move numbers; reactor shows |
| **C. Console + AI (2 h)** | Required 3-chapter intro (hero, how it works, run), `?q=lite`, reduced motion | LiveCharts, alarms, offline rules advisor, `api/advisor.ts` | Curves move; advisor answers online AND offline |
| **D. Planner + bindings (1.5 h)** | Reactor bindings (rpm to impeller, vvm to bubbles, X to colour, T to tint), skip transition | `api/plan.ts` + goal box that fills the sliders, AdvisorPanel | Goal text fills sliders; reactor reacts |
| **E. Integration (1 h)** | Mobile layout, Lighthouse | A11y pass, copy review, empty/error states | Section 12 gates green on the **live** URL |
| **F. Submission (1.25 h)** | Cross-device test, bug bash | README, AI-LOG, record video, submit | URL + video + repo submitted before the deadline |
| **G. BONUS** | 3D reactor, exploded view (08) | - | Only if A-F are done and merged |

## 4. Cut-lines (apply in order)
1. Drop Block G, then Lenis and nonessential intro polish; retain all three short intro chapters.
2. Drop `/api/plan` UI polish (keep a basic version).
3. **Never cut:** simulation + console, skip button, offline advisor, deployment, lite mode, video.

## 5. Rhythm
5-minute sync every 90 min. After every merge, open the LIVE URL on the other person's laptop and a phone. Bugs go in `docs/BUGS.md` (steps, screenshot, owner). Blocked more than 20 min: paste the exact error + file to the assistant.
