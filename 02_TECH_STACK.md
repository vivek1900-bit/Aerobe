# 02 - Tech Stack (v2, all free or open source)
**Version policy:** install latest stable, commit `package-lock.json` immediately, no upgrades mid-sprint.
| Layer | Tool | Use | Owner |
|---|---|---|---|
| Runtime / build | Node LTS, **Vite**, React + TypeScript | App + build | both |
| Styling | **Tailwind CSS 3.4** (pin v3) | Utilities + tokens | P1 |
| App state | **Zustand** | Mode, controls, snapshots, alarms | P2 |
| Hot values | plain `signals` object | Non-reactive per-frame values | P1 |
| Animation | **GSAP** + ScrollTrigger + `@gsap/react` | Intro chapters, transitions | P1 |
| Smooth scroll | `lenis` | OPTIONAL | P1 |
| Simulation | TypeScript port of `ref/sim_reference.mjs` (RK4) | Model | P2 |
| Tests | **Vitest** | Model tests | P2 |
| Charts | Hand-written SVG | Live curves | P2 |
| Fonts / icons | Fontsource (Barlow Condensed, IBM Plex Sans/Mono), `lucide-react` | Type + icons | P1 |
| AI | **Gemini API** via REST `fetch` from a Vercel serverless function | Advisor + planner | P2 |
| Hosting | **Vercel** (Hobby/free) + GitHub | Public URL, auto deploy | P1 |
| Recording | OBS Studio | Pitch video | P2 |
| Audit | Chrome DevTools + Lighthouse | Perf/a11y | both |
| 3D (BONUS) | three, @react-three/fiber, drei | Only after all required live-release gates pass | P1 |
**Not used in the shipped app:** a separate application server, containers, chart libraries, UI kits, or local models.
**Env vars:** `GEMINI_API_KEY` (secret), `GEMINI_MODEL` (read from the AI Studio model list). Keep all packages in `dependencies`.
**Gemini note:** the student plan is for the Gemini app; the API key for the website comes from Google AI Studio. Check current free limits there. The offline advisor covers quota exhaustion.
