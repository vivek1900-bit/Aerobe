# 04 — Frontend Specification

Scope: everything in `src/` except `sim/` (06) and the 3D internals (08). Visual language is in 07.

## 1. App shell (`App.tsx`, `app/`)
- On load: `initQuality()`, read deep link (`#app`, `?mode=app`, `?q=lite|low|high`, `?debug=1`), set `store.mode`.
- Render order: `<Preloader/>` (intro only), `<Stage/>` (unless `lite`), `<Nav/>`, then `<Story/>` **or** `<Console/>`.
- `mode` changes go through `app/skip.ts` (`skipIntro`, `replayTour`) so animation + state stay consistent.
- Persistence (optional, try/catch): `localStorage['aerobe.skip']='1'` after the first skip; honour it on next load; the console shows "Replay tour".

## 2. Navigation (`Nav.tsx`)
Layout (desktop): logo left · centre: chapter links **WHY IT MATTERS · HOW IT WORKS · RUN A BATCH** (intro only) · right: **[SKIP INTRO → BIOREACTOR]** (primary, accent border), **SETTINGS**.
In console: centre links become **CONSOLE · REPORT**; right: **REPLAY TOUR**, **SETTINGS**.
Mobile: logo + skip button + burger. The skip button is **never hidden** behind the burger.

Requirements:
- Skip button is a real `<button>` with visible label, focus ring, `aria-label="Skip the introduction and open the bioreactor"`.
- Present during preloader (preloader must not cover it: nav z-index above preloader).
- Keyboard: `Enter/Space` activates; optional global shortcut `S` (ignored while typing in inputs).
- Chapter links call `lenis.scrollTo('#chapter-id')` (or `element.scrollIntoView` if reduced motion).
- Active chapter highlighted via ScrollTrigger `onToggle`; progress hairline under nav.

## 3. Story (`story/`)
`chapters.ts` is the single content source:
```ts
export type Chapter = {
  id: 'why'|'how'|'run';
  rail: 'WHY IT MATTERS'|'HOW IT WORKS'|'RUN A BATCH';
  kicker: string; headline: string; body?: string;
  heightVh: number;          // ghost height
  pin?: boolean;
  facts?: { label: string; value: string; note?: 'illustrative' }[];
};
```

### Chapter plan (copy: scientifically accurate, max 8-word headline, max 35-word body; numbers labelled "illustrative")
| id | Rail | Headline (example) | What the viewer sees | Height |
|---|---|---|---|---|
| `why` | WHY IT MATTERS | "A LAB IN EVERY BROWSER." | The access problem, illustrative teaching boundary, and the visible Skip action. | 100vh |
| `how` | HOW IT WORKS | "CHANGE, RUN, OBSERVE." | Controls, named SVG reactor parts, curves, alarms, AI advice and offline fallback. | 110vh |
| `run` | RUN A BATCH | "TRY A SIMULATED RUN." | Organism choice, illustrative slider values, charts and CTA to enter the console. | 110vh |

### Overlay rules
- Text blocks `position: sticky` or absolutely placed inside the ghost section; reveal with masked word/line animation (07 motion).
- Max 1 idea per viewport; macro headlines; mono labels for data.
- **Progress rail:** three labelled blocks, `.is-active` follows chapter, click scrolls.
- **Reduced motion / lite:** disable pinning and scrub; chapters become stacked sections with simple fade-in; the SVG reactor remains the primary view.

## 4. Console (`console/`)
Desktop layout (min 1280 px): 3-column grid with bottom bar.
```
┌ Nav ────────────────────────────────────────────────────────────────┐
│ ControlPanel (left, 320px) │       ReactorSVG             │ Charts + Alarms (right, 380px) │
│  organism • setpoints      │   labels on probes          │  Biomass / Substrate / DO / pH / T │
│  start/pause/reset         │   live readouts             │  Alarms & insights                 │
├────────────────────────────┴─────────────────────────────┴────────────────────────────────┤
│ SimBar: time • speed (1×,60×,600×,3600×) • phase chip • scrubber                           │
└──────────────────────────────────────────────────────────────────────────────────────────┘
AdvisorPanel = right drawer / tab: "Ask AEROBE" + "Plan from goal"
```
Tablet/mobile: single column with tabs **Controls · Charts · Advisor**; reactor view collapsed to a small card.

### 4.1 ControlPanel
- Organism select (chips). Setpoint sliders with numeric input + units + valid ranges (06 §6): **Temperature, pH, Agitation (RPM), Aeration (vvm), Feed (mL/h)**.
- Buttons: **Start / Pause / Reset**, **Speed**.
- Every control: label, unit, value text, `aria-valuetext`, keyboard steps, disabled state while invalid. Value change flashes accent for 300 ms.
- Presets: "Optimal batch", "Oxygen-limited", "Cold stress" (educational).

### 4.2 LiveCharts
- 5 small multiples (SVG): biomass X, substrate S, dissolved oxygen DO, pH, temperature. Ring buffer ≤ 1500 points; 1 point per simulated minute.
- Shaded **phase bands** (lag/exp/stationary), threshold lines (DO 20 %), hover readout, `<details>` data table for accessibility.
- Redraw ≤ 4 Hz. No chart library.

### 4.3 AlarmsPanel
- Alarm list (severity icon + text + time): DO low, pH drift, T drift, substrate exhausted (insight: "carbon source exhausted, note the DO spike"), foam/none (not modelled).
- Never colour-only: severity word + icon.

### 4.4 AdvisorPanel (AI feature, 05)
- Tabs: **Ask** (free text, 300 chars, 3 suggested questions) · **Plan** (goal text → proposed setpoints → "Apply" button with diff) · **Summary** (end-of-run explanation).
- Status chips: `Gemini` / `Offline advisor`. Typewriter reveal client-side. Cooldown 3 s. Timeout 8 s. `aria-live="polite"`.
- Fallback uses `console/rulesAdvisor.ts` (pure function from `Snapshot` + alarms; also unit-tested).

### 4.5 RunReport
- Print-friendly view (`@media print` stylesheet) with parameters, final values, phase timings, doubling time, alarms, AI summary. "Print / Save as PDF" via `window.print()`.

### 4.6 ReactorSVG (lite fallback and logo-grade illustration)
- Side-view schematic with named part ids. Impeller animates (CSS rotate by rpm), bubbles (CSS/GSAP) by vvm, liquid fill colour by density, probe dots show live readouts. It is the primary view, not a fallback or stub.

## 5. Skip / replay transitions (`app/skip.ts`)
```
skipIntro():
 1 lenis.stop(); ScrollTrigger.getAll().forEach(t => t.kill())
 2 gsap.to('.story-overlay', {autoAlpha:0, duration:.35})
 3 gsap.to(signals, {cameraBlend:1, explode:0, xray:0, dive:0, duration:.9, ease:'expo.inOut'})
 4 at ~50%: store.setMode('app'); unmount <Story/>; window.scrollTo(0,0)
 5 mount console panels: gsap.from('.console-panel', {y:24, autoAlpha:0, stagger:.08, duration:.5})
 6 history.replaceState(null,'','#app'); focus console <h1>; aria-live "Bioreactor console opened"
replayTour(): reverse: setMode('intro'); scrollTo(0); recreate ScrollTriggers; lenis.start(); ScrollTrigger.refresh(); remove #app
```
If `reduceMotion` or `lite`: skip steps 2–3 (instant swap).

## 6. Accessibility & performance requirements
- Semantic landmarks (`header`, `nav`, `main`), one `h1` per mode, visible focus (2 px accent outline), contrast ≥ 4.5:1 for text.
- All interactive elements reachable by keyboard; canvas is `aria-hidden`; meaningful content duplicated in DOM text.
- `prefers-reduced-motion` honoured (Lenis off, no pinning/scrub, no bubble motion beyond a slow fade).
- No layout shift on font load (`font-display: swap` + `ScrollTrigger.refresh()` after `document.fonts.ready`).
- Bundle: lazy-load `scene/` (dynamic `import()`) so the console shell paints first; target initial JS < 400 KB gzip excluding three (three loaded on demand).
- No horizontal scroll at 360 px.

## 7. Definition of done (frontend)
`npm run build` passes · no console errors in intro, skip and console · skip works with WebGL off · console works at 1440×900 and 390×844 · Lighthouse mobile a11y ≥ 90 (tune later) · all copy has no placeholder text.
