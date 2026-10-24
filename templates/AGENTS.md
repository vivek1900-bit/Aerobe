# AGENTS.md — AEROBE v2 coding rules

Read the named blueprint section before changing code. One coding assistant may implement the work directly from these specifications; OpenCode and Antigravity are optional tools, never required roles.

## Scope

Ship Theme 3: a virtual bioprocess lab for students without lab access. Required scope is a deterministic browser simulation, console, SVG reactor, offline advisor, small AI goal-to-sliders flow, three-chapter intro, accessibility, and Vercel deployment. 3D, bloom and dive effects are bonus work only after the live Tier 1 gates pass.

## Stack and deployment

Vite + React + TypeScript; Tailwind 3.4; Zustand; GSAP; Vitest; hand-written SVG charts; Vercel functions in `api/` with helpers in `lib/`. The functions proxy Gemini with `GEMINI_API_KEY` and `GEMINI_MODEL` stored only in Vercel environment variables. Deploy only through Vercel; do not add a separate application server, server-side in-memory rate limiting, or a daily in-memory budget.

## Non-negotiable behaviour

1. The simulation is pure deterministic TypeScript; port `ref/sim_reference.mjs` line by line and keep all non-sourced values labelled illustrative.
2. AI only explains supplied simulated values or proposes clamped controls. It never applies a plan without an explicit user action and never claims real-world validation.
3. Client requests use a cooldown, small output-token cap, and 8 s abort. Any missing key, failure, timeout, invalid output or unavailable server uses the offline rules advisor or deterministic preset.
4. The **SKIP INTRO → BIOREACTOR** button, `#app`, `?mode=app`, keyboard navigation, lite mode and reduced motion must all work.
5. `ReactorSVG` is the primary reactor. Do not require WebGL for any required feature.
6. Use semantic HTML, visible focus, labelled controls, contrast of at least 4.5:1, and `prefers-reduced-motion` support.

## Ownership and verification

Person 1 owns `src/reactor/**`, `src/story/**`, `src/core/**`, styling and deployment. Person 2 owns `src/sim/**`, `src/console/**`, `src/app/**`, `api/**`, `lib/**`, `ref/**`, tests and docs. Shared contracts are changed only by agreement.

Finish each task with the narrowest relevant verification: `npm run build`, `npm test`, `node ref/calibrate.mjs`, or live Vercel smoke checks. Never put keys in code, logs, or git.
