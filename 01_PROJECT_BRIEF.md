# 01 - Project Brief (v2): AEROBE, a virtual bioprocess lab

## 1. Hackathon facts
- Online, 23-25 Oct 2026. Day 2 = problem statements + build sprint. Day 3 = deploy + submit. **Confirmed submission deadline: Sun 25 Oct 2026, 5:00 PM IST.**
- Team 1-4. AI tools: full freedom. Deliverables: live public URL, 2-minute video, GitHub repo (treat all three as mandatory).
- **Hosting:** Vercel.
- Video formula: 0:30 problem / 0:45 live demo / 0:30 AI & tech / 0:15 impact.
- Rubric (100): AI & Prompt Integration 25 / UI-UX Polish 25 / Live Functionality 25 / Real-World Utility & Pitch 25.

## 2. Theme: Theme 3, "Beyond the Screen: Build for a Smarter, More Inclusive Future"
Framing: *"Most students never touch a bioreactor. AEROBE is a free virtual bioprocess lab: describe your goal, run a simulated batch, and get plain-language AI guidance, in any browser."*
Theme 3 also scores accessibility and responsible design. Evidence to show: keyboard-only use, visible focus, contrast >= 4.5:1, reduced-motion mode, lite mode (no WebGL), plain-language text, "illustrative / educational" labels, optional Telugu/English labels (stretch).

## 3. Product
Two modes: (1) a short **intro** that explains the service; (2) the **console**: choose organism (E. coli or yeast), set temperature / pH / agitation / aeration / feed, run a virtual batch, watch live curves (biomass, substrate, dissolved oxygen, pH, temperature), see alarms and insights, ask the **AI advisor** why something happened, or type a goal and let the AI **fill the sliders**.
**Navigation:** a "SKIP INTRO -> BIOREACTOR" button visible from the first frame; deep links `#app` or `?mode=app`; "REPLAY TOUR" inside the console.

## 4. Scope tiers (cut from the bottom)
| Tier | Contents |
|---|---|
| **1: must ship** | Ported + tested simulation / console (controls, live SVG charts, alarms) / SVG reactor bound to controls / offline rules advisor / `/api/advisor` / basic `/api/plan` goal-to-sliders / Vercel deploy / skip button + `#app` / lite + reduced-motion / **3-chapter intro** (hero, how it works, run) / README, AI-LOG, video |
| **Bonus only after all Tier 1 gates pass** | 3D reactor (R3F), exploded view, dive-inside, bloom, challenge mode, printable report (see `08`) |

## 5. Assumptions to confirm
Theme 3 / confirmed deadline Sun 25 Oct 2026, 5:00 PM IST / registration pass active / both can use GitHub and Vercel.

## 6. Success definition
A judge opens the URL on a stranger's laptop, understands the service in 10 seconds, clicks Skip, runs a batch, sees curves move, asks "why did oxygen drop?", gets a grounded answer; nothing crashes; the video explains it in two minutes.
