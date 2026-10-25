# Aerobe — 300 L Bioreactor Digital Twin

A cinematic, browser-based digital twin of a 300 L stirred-tank bioreactor: a scrollytelling 3D tour, a live control console with **Standby / Active / Fault** states, analytics, and a GMP-style run report — plus a **Gemini-powered** process advisor and goal planner.

> **⚠️ Illustrative teaching simulation.** Every number, kinetic parameter, and readout is illustrative and simulated for teaching. This is **not** a validated process model and must not be used for real bioprocess control or GMP decisions.

## Live
🔗 https://<your-site-name>.netlify.app

## Features
- **Scrollytelling tour** — Three.js PBR reactor (borosilicate glass, 316L steel, golden-amber broth) with cinematic camera moves, exploded assembly, and live telemetry.
- **Live console** — Standby / Active / Fault states, X-Ray CAD toggle, real-time DO / pH / temperature charts, alarms, and a 600× accelerated deterministic ODE simulation.
- **AI advisor & planner** — Gemini process advisor (explains *why*) and **Goal & Plan** (recommends setpoints), served **server-side** so the API key never reaches the browser.
- **Analytics + Report** — kinetic model, phase trajectory, sensitivity, anomaly log, and a GMP summary with audit trail + e-signature.
- **Offline-safe** — the simulation runs entirely in-browser; AI features degrade gracefully to a deterministic local fallback.

## Run locally
```bash
npm install
npm run dev        # Vite dev server on :3000
npm run build      # type-check (tsc) + production build → dist/
npm test           # Vitest (40 tests)
```

To exercise the serverless AI endpoints locally:
```bash
npx vercel dev     # api/*  (Vercel)
netlify dev        # netlify/functions/*  (Netlify)
```

## Environment variables
Set these **server-side only** (never with a `VITE_` prefix — that would leak them into the client bundle):

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Google AI Studio API key (server-side). |
| `GEMINI_MODEL` | Gemini model name (default `gemini-1.5-flash`). |

Copy `.env.example` → `.env` and fill in your values. `.env` is gitignored.

## Deployment
- **Netlify** — `netlify.toml` builds to `dist/`; functions in `netlify/functions/` serve `/api/advisor` and `/api/plan`.
- **Vercel** — `api/*.ts` serve the same endpoints.

## Credits
- 3D reactor, scrollytelling tour, and Obsidian Bento UI built by hand with **Three.js**, **React 18**, **Tailwind CSS 3.4**, **Framer Motion**, and **Zustand**.
- AI advisor / planner powered by **Google Gemini**.
- AI-generated visual assets used during design are catalogued in [`docs/AI-LOG.md`](docs/AI-LOG.md).

## License
Private.
