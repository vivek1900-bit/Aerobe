---
name: Obsidian Telemetry
colors:
  surface: '#121315'
  surface-dim: '#121315'
  surface-bright: '#38393b'
  surface-container-lowest: '#0d0e10'
  surface-container-low: '#1b1c1e'
  surface-container: '#1f2022'
  surface-container-high: '#292a2c'
  surface-container-highest: '#343537'
  on-surface: '#e3e2e5'
  on-surface-variant: '#b9cbbd'
  inverse-surface: '#e3e2e5'
  inverse-on-surface: '#303033'
  outline: '#849588'
  outline-variant: '#3b4a40'
  surface-tint: '#00e293'
  primary: '#cdffde'
  on-primary: '#003921'
  primary-container: '#00f5a0'
  on-primary-container: '#006b43'
  inverse-primary: '#006c44'
  secondary: '#a5e7ff'
  on-secondary: '#003543'
  secondary-container: '#00d2ff'
  on-secondary-container: '#00566a'
  tertiary: '#fff1e0'
  on-tertiary: '#412d00'
  tertiary-container: '#ffd07c'
  on-tertiary-container: '#7b5700'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#50ffaf'
  primary-fixed-dim: '#00e293'
  on-primary-fixed: '#002111'
  on-primary-fixed-variant: '#005232'
  secondary-fixed: '#b6ebff'
  secondary-fixed-dim: '#47d6ff'
  on-secondary-fixed: '#001f28'
  on-secondary-fixed-variant: '#004e60'
  tertiary-fixed: '#ffdea8'
  tertiary-fixed-dim: '#ffba20'
  on-tertiary-fixed: '#271900'
  on-tertiary-fixed-variant: '#5e4200'
  background: '#121315'
  on-background: '#e3e2e5'
  surface-variant: '#343537'
  surface-bento: '#121316'
  surface-bento-elevated: '#181A1F'
  border-hairline: rgba(255, 255, 255, 0.08)
  border-subtle: rgba(255, 255, 255, 0.04)
  glow-emerald: rgba(0, 245, 160, 0.15)
  glow-cyan: rgba(0, 210, 255, 0.15)
  critical-red: '#FF453A'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 3.5rem
    fontWeight: '700'
    lineHeight: 4rem
    letterSpacing: -0.03em
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 2.25rem
    fontWeight: '600'
    lineHeight: 2.75rem
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.75rem
    fontWeight: '600'
    lineHeight: 2.25rem
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.5rem
    fontWeight: '600'
    lineHeight: 2rem
    letterSpacing: -0.01em
  title-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.125rem
    fontWeight: '600'
    lineHeight: 1.5rem
    letterSpacing: '0'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.375rem
    letterSpacing: 0.01em
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.75rem
    fontWeight: '400'
    lineHeight: 1.125rem
    letterSpacing: 0.01em
  telemetry-lg:
    fontFamily: JetBrains Mono
    fontSize: 1.75rem
    fontWeight: '500'
    lineHeight: 2rem
    letterSpacing: -0.02em
  telemetry-md:
    fontFamily: JetBrains Mono
    fontSize: 1rem
    fontWeight: '500'
    lineHeight: 1.25rem
    letterSpacing: '0'
  telemetry-sm:
    fontFamily: JetBrains Mono
    fontSize: 0.75rem
    fontWeight: '400'
    lineHeight: 1rem
    letterSpacing: 0.02em
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 0.6875rem
    fontWeight: '600'
    lineHeight: 0.875rem
    letterSpacing: 0.08em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system establishes a high-precision, mission-control environment tailored for bioprocess engineering, continuous fermentation monitoring, and interactive 3D digital twins. It addresses the operational cognitive load of biochemical engineers, operators, and automation specialists managing complex bioreactor cascades. 

The aesthetic marries **Dark Minimalism** with **Glassmorphic HUD Instrumentation**:
- **Tonal Substratum:** A deep obsidian base eliminates eye strain during sustained low-light monitoring.
- **Bento Modular Architecture:** Clean, isolated compartments compartmentalize density, allowing streaming sensor curves, vessel CAD twins, and volumetric balances to live symbiotically.
- **Bioluminescent Signaling:** Emerald, cyan, and amber emit targeted functional luminescences against pitch surfaces, mimicking organic enzymatic reactions and laboratory lasers.
- **Aerospace-Grade Precision:** Clean hairline strokes, micro-borders, and high-density tabular typography convey uncompromising measurement accuracy and strict containment reliability.

## Colors

The chromatic structure relies on high-contrast spectral beacons against void-black matrices:
- **Canvas & Surfaces:** The root viewport is anchored at `#0B0C0E`. Bento cells sit at `#121316`, while nested panels or active state containers step up to `#181A1F`.
- **Primary Telemetry (`#00F5A0`):** Represents optimal nominal conditions, healthy microbial proliferation, live telemetry streams, and verified bioprocess parameters.
- **Secondary Flux (`#00D2FF`):** Denotes oxygenation dynamics, agitation vectors, pneumatic mass flows, and 3D digital twin mesh contours.
- **Tertiary Advisory (`#FFB800`):** Flags thermal drift, metabolic lag, calibration deltas, and consumable threshold alerts without escalating to structural failure.
- **Critical Diagnostics (`#FF453A`):** Dedicated purely to contamination alerts, pressure limits, and emergency kill-switch actuators.
- **Hairline Restraint:** Outlines and structural dividers use `rgba(255, 255, 255, 0.08)` and `rgba(255, 255, 255, 0.04)` to sculpt modules without hard visual boundaries.

## Typography

Typography bifurcates into human narrative and computational precision:
- **Interface & Metadata (Plus Jakarta Sans):** Delivers clean, humanist geometry for vessel headers, modal dialogs, narrative statuses, and navigation labels. 
- **Telemetry & Readouts (JetBrains Mono):** Monospaced numeric layouts (`tnum`) ensure absolute tabular stability for streaming metrics (e.g., pH, dissolved oxygen, RPM, impeller torque, sparge rates). Numbers never jitter or re-flow during rapid millisecond refresh intervals.
- **Label Capitalization:** Analytical labels and diagnostic subheaders use uppercase micro-text (`label-caps`) with expanded tracking (+0.08em) for immediate recognition on dense instrument panels.

## Layout & Spacing

The layout is constructed around an asymmetric **Bento Grid Architecture**:
- **Grid Structure:** A 12-column fluid grid system with locked minimum cell spans. Large modules (such as the interactive 3D digital twin viewport) span 8 columns, while telemetry rails and sensor arrays stack cleanly across the remaining 4 columns.
- **Rhythm & Enclosure:** Internal element layouts maintain a strict 4px/8px incremental rhythm (`space-xs` through `space-xl`). 
- **Responsive Adaptations:**
  - **Desktop (>= 1280px):** Full multi-pane dashboard layout with persistent HUD navigation dock, 1.5rem (`gutter-desktop`) gutters, and dynamic 3D viewport canvas.
  - **Tablet (768px - 1279px):** Bento modules collapse into a 2-column stacked mosaic; sensor graphs collapse into swipeable cards.
  - **Mobile (< 768px):** Linear single-column flow with full-width cards, a collapsed sticky bottom telemetry ticker, and simplified 2D schematic toggles replacing heavy 3D twin rendering.

## Elevation & Depth

Visual hierarchy abandons traditional drop shadows in favor of **Tonal Containment and Luminescent Edge Refraction**:
- **Layer 0 (Canvas):** Pure matte `#0B0C0E`.
- **Layer 1 (Bento Cells):** `#121316` bounded by 1px borders using `rgba(255, 255, 255, 0.04)`.
- **Layer 2 (Overlays & HUD Tooltips):** Semi-transparent `#181A1F` with 16px background blur (`backdrop-filter: blur(16px)`), framed with a 1px border of `rgba(255, 255, 255, 0.08)`.
- **Active Telemetry Emission:** Focused interactive states and critical indicators deploy an ambient colored glow:
  - Nominal: `box-shadow: 0 0 20px rgba(0, 245, 160, 0.15)`
  - Active Link/Cyan: `box-shadow: 0 0 20px rgba(0, 210, 255, 0.15)`
  - Alert: `box-shadow: 0 0 24px rgba(255, 184, 0, 0.20)`
- **Spatial Separation:** Contrast is established through luminescence differentials rather than heavy elevation blurs.

## Shapes

The system balances industrial structural rigor with refined ergonomics:
- **Modular Enclosures:** Standard Bento compartments feature 0.5rem (8px) corner radii, maintaining tight corner alignment across multi-card compositions without creating dead canvas space.
- **Pill Geometry:** Status badges, operational mode chips, and interactive pill-buttons use full-radius caps (`rounded-full` / 9999px) to contrast against rectilinear Bento grids.
- **Inner Micro-Elements:** Internal data rows, nested input selectors, and graph overlays adopt a softer 4px radius (`rounded-sm`).

## Components

### Buttons & Actuators
- **Primary Operational:** High-visibility `#00F5A0` background, pure `#0B0C0E` semi-bold text, pill radius, with a subtle `glow-emerald` bloom on hover.
- **Secondary Diagnostic:** Glass surface `#181A1F` with a 1px border of `rgba(255, 255, 255, 0.08)`, white text, shifting to `#00D2FF` border and text on interaction.
- **Safety / Kill-Switch:** Deep crimson background `#FF453A` with high-contrast text; requires sustained press-and-hold interaction with visual depletion timer.

### Bento Compartments & HUD Cards
- Formed with `#121316` surface fill, 1px border using `border-subtle`, and 8px border radius.
- Cards feature a structural micro-header with uppercase `label-caps` tracking, an active status dot, and modular header actions.

### Telemetry Readouts & Gauges
- Dual-line display: upper micro-label (`label-caps`) in muted gray, lower mono readout (`telemetry-lg`) in pure white or active accent color.
- Sparklines sit embedded flush into the bottom margin of Bento cells, utilizing gradient fills tapering to zero opacity.

### Badges & Status Chips
- Sleek pill structures with height locked at 24px, inner padding `0.25rem 0.75rem`.
- Encapsulate a 6px pulsing glow dot paired with `telemetry-sm` text. Nominal: emerald; In-Flux: cyan; Calibration Warning: amber.

### Inputs & Parameter Sliders
- Background: `#0B0C0E` recessed inset with a 1px hairline border.
- Active focus state swaps border to `#00D2FF` with zero spread outline.
- Range scrubbers for agitation (RPM) and feed rates use thin 2px rails with glowing pill handles.

### 3D Digital Twin Viewport Overlay
- Glass HUD overlay containers pinned to corners of the 3D WebGL canvas.
- Incorporates technical crosshairs, axis gimbal indicators, and live multi-point temperature heat-map overlays framed in hairline borders.