# 07 — UI/UX Design System (EnduroSat-inspired, deliberately NOT "AI purple")

## 1. Design intent
A **deep-space instrument panel for a living machine**. Dark, calm, technical, precise. Big condensed type, thin lines, small mono data labels,
one cold accent for "instrument light" and one warm accent for "culture/liquid". The reactor is always the hero; UI is quiet around it.

**Reference mood (from the EnduroSat page):** near-black navy canvas, white macro headlines, thin guide lines, glowing blue nodes, bottom progress timeline,
numbers that count up, generous negative space. We borrow *structure and restraint*, not the exact look.

## 2. Palette (tokens)
| Token | Hex | Use |
|---|---|---|
| `ink` | `#050B14` | page background (deep navy-black) |
| `panel` | `#0A121C` | console panels, cards |
| `panel2` | `#101B28` | raised/hover surfaces |
| `line` | `#1B2A3A` | 1 px borders, guide lines |
| `text` | `#E8EEF3` | primary text |
| `muted` | `#7F92A3` | secondary text, labels |
| `signal` | `#2F8CFF` | primary accent: instrument light, active states, links, probe glow |
| `broth` | `#F2A93B` | warm accent: liquid/culture, "run" states, highlights |
| `ok` | `#3BD99F` | healthy values |
| `warn` | `#FFB547` | warnings (shares family with broth, always with an icon + word) |
| `danger` | `#FF5A4F` | critical alarms |

### Palette rules (hard)
- **Forbidden:** purple, violet, magenta, indigo-to-pink gradients (avoid hues ≈ 255°–330°), neon-on-glass "AI dashboard" looks.
- **No gradients** except (a) very soft radial glows that mimic a *light source* in the scene and (b) the liquid colour ramp (pale straw → deep amber) driven by biomass.
- No glassmorphism blur cards, no soft pastel pills, no emoji, no stock sparkle icons.
- Colour is never the only carrier of meaning (add words/icons/shape).
- Contrast: text on `ink`/`panel` ≥ 4.5:1 (verify `muted` on `panel`; lighten if it fails).

## 3. Typography
| Role | Font (Fontsource) | Notes |
|---|---|---|
| Display / headlines | **Barlow Condensed** 500/600, UPPERCASE, tracking −0.01em | macro size `clamp(3.25rem, 10vw, 9.5rem)`, line-height 0.9 |
| Body | **IBM Plex Sans** 400/500 | 16–18 px, line-height 1.55, max width 56ch |
| Data / labels | **IBM Plex Mono** 400 | 11–13 px, UPPERCASE, tracking +0.08em; tabular numbers |
Install the listed Fontsource packages only after they resolve in the project; otherwise use the declared system-font fallback. Import only weights actually used.

## 4. Layout and shape
- 12-column grid, 24 px gutters desktop, 16 px mobile; section padding `clamp(24px, 6vw, 96px)`.
- **Corners 2–4 px.** Panels are flat with 1 px `line` borders plus **corner brackets** (HUD ticks) on hero panels and the reactor frame.
- Hairline separators, dotted guide lines (leader lines from labels to parts), small index numbers (`01 / 05`).
- Vertical rhythm: 8-pt scale (8, 16, 24, 32, 48, 72, 120).

## 5. Tailwind tokens (v3.4) — `tailwind.config.js`
```js
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { ink:'#050B14', panel:'#0A121C', panel2:'#101B28', line:'#1B2A3A',
                text:'#E8EEF3', muted:'#7F92A3', signal:'#2F8CFF', broth:'#F2A93B',
                ok:'#3BD99F', warn:'#FFB547', danger:'#FF5A4F' },
      fontFamily: { display:['"Barlow Condensed"','sans-serif'],
                    sans:['"IBM Plex Sans"','system-ui','sans-serif'],
                    mono:['"IBM Plex Mono"','ui-monospace','monospace'] },
      borderRadius: { DEFAULT:'3px', sm:'2px', md:'4px' },
      letterSpacing: { label:'0.08em' },
    },
  },
  plugins: [],
};
```
`src/styles/index.css`: `@tailwind base; @tailwind components; @tailwind utilities;` + CSS variables mirroring tokens, `html{background:#050B14;color:#E8EEF3}`, `:focus-visible{outline:2px solid #2F8CFF;outline-offset:2px}`, print stylesheet for the report.
**Gotcha for AI tools:** this project uses **Tailwind 3.4** (`tailwind.config.js`, `@tailwind` directives), not v4's `@import "tailwindcss"`.

## 6. Components (all in `src/ui/`)
| Component | Spec |
|---|---|
| `Button` | variants: `primary` (1 px `signal` border, text `signal`, hover fill `signal/10` + sweep line), `ghost`, `danger`. Mono uppercase label, 40 px height, focus ring |
| `Chip` | selectable; active = `signal` border + dot; keyboard arrow navigation in groups |
| `Slider` | custom track (1 px line + `signal` fill), thumb 14 px square-ish, numeric input beside it, units, min/max ticks |
| `Readout` | label (mono, muted) over value (display font, large), unit small; flashes `broth` 300 ms on change |
| `Panel` | `panel` bg, `line` border, corner brackets, header row with index number |
| `Brackets` | decorative corner ticks (SVG, 12 px) |
| `Kbd` | small keycap for shortcuts |
| `Tooltip` | 1 px border, mono text, appears on focus and hover |

## 7. Motion tokens (GSAP)
| Token | Value |
|---|---|
| `ease.ui` | `power3.out` |
| `ease.scene` | `expo.inOut` (camera/mode changes) |
| `ease.reveal` | `power4.out` (masked text) |
| `dur.micro` | 0.2 s · `dur.ui` 0.4 s · `dur.reveal` 0.9 s · `dur.scene` 1.2 s |
| Stagger | 0.04–0.08 s per word/line/item |
| Scroll scrub | `scrub: 1` (1 s catch-up); Lenis `lerp: 0.1` |
Rules: **one easing family**, no bounce/elastic (except the impeller start-up), nothing moves without a reason, every animation has a reduced-motion alternative (opacity only).

## 8. Signature interactions (keep exactly these; more is not better)
1. **Masked headline reveal** (words rise from a clipping line).
2. **Leader-line labels** that draw from a part to its text (stroke-dashoffset).
3. **Counters** that count up on enter (illustrative values flagged).
4. **Bottom chapter rail** with active block + click-to-scroll.
5. **Skip transition**: camera glide into console, panels staggering in.
6. **Value flash** on console readouts.
7. **Blueprint (X-ray) swap** between solid and edge-line rendering (08).

## 9. Anti-"AI look" audit (run before submission; UX-09)
- [ ] No purple/indigo/magenta anywhere (search CSS for hues 255–330°).
- [ ] No gradient headlines, no glass cards, no oversized rounded corners.
- [ ] No generic stock icons in coloured circles; icons only where they add meaning.
- [ ] Copy is specific to bioprocess (no "revolutionize", "unlock", "seamless").
- [ ] Hierarchy: one focal point per viewport. Whitespace is intentional.
- [ ] Real numbers/labels (illustrative flagged), real part names, real units.
- [ ] Screenshot at 1440×900 shows: reactor + one headline + chapter rail + nothing else competing.

## 10. Responsive rules
- Breakpoints: 360, 768, 1280, 1920. Story overlays reflow to single column ≤ 768 px; reactor scale reduces; labels shorten.
- Console collapses to tabs ≤ 1024 px. Touch targets ≥ 44 px.
- Safe-area insets respected for fixed nav/rail on phones.
