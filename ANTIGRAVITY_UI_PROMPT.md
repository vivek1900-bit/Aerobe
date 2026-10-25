# AEROBE Product Console — Production-Grade UI/UX Polish Specification

## 1. Strict Color Palette & Typography Tokens (`07_UIUX_DESIGN_SYSTEM.md`)
- **Background Void (`ink`):** `#050B14`
- **Primary Instrument Surface (`panel`):** `#0A121C`
- **Elevated / Input Surface (`panel2`):** `#0F1A28`
- **Structural Hairline Borders (`line`):** `#162436` (hover state: `#243B56`)
- **Primary Telemetry Accent (`signal`):** `#2F8CFF`
- **Bioprocess / Culture Accent (`broth`):** `#F2A93B`
- **Status Tokens:** Nominal `#22C55E` | Warning `#F59E0B` | Critical `#EF4444`
- **Typography:** Load Google Fonts in `index.html` (`Barlow Condensed` 600/700 for uppercase tracked headers, `IBM Plex Sans` 400/500 for labels, `IBM Plex Mono` 400/600 with `tabular-nums` for all live numerical readouts).

## 2. Micro-Interactions, Button Hover Animations & Tactile Controls
- **Buttons (`src/ui/Button.tsx`):**
  - Implement a crisp left-to-right signal sweep fill animation (`before:absolute before:inset-0 before:bg-signal/15 before:translate-x-[-100%] hover:before:translate-x-0 before:transition-transform before:duration-200`) with border illumination (`hover:border-signal hover:shadow-[0_0_16px_rgba(47,140,255,0.25)]`) and tactile press feedback (`active:scale-[0.98]`).
- **Chips (`src/ui/Chip.tsx`):**
  - Add smooth hover border transitions (`hover:border-signal/60 hover:bg-panel2`), a glowing indicator dot (`shadow-[0_0_8px_#2F8CFF]`) when active, and Framer Motion layout transitions.
- **Sliders (`src/ui/Slider.tsx`):**
  - Upgrade the slider track with a live percentage gradient fill (`#2F8CFF`), a precision machined thumb that scales and glows on hover/focus (`hover:scale-110 hover:shadow-[0_0_10px_#2F8CFF] transition-all`), and a compact inline numeric input box with `focus:border-signal`.
- **Panels (`src/ui/Panel.tsx`):**
  - Add subtle top-edge specular highlight (`border-t-[#1E324A]`), crisp `12px` corner HUD brackets (`#2F8CFF/40` transitioning to `#2F8CFF/80` on panel hover), and structured header bars with a subtle bottom hairline (`border-b border-[#162436] bg-[#070E17]`).

## 3. Fix Viewport Clipping & Layout Density (`Console.tsx` & `ControlPanel.tsx`)
- Fix the main 3-column grid height (`h-[calc(100vh-6.75rem)] overflow-hidden`) so the layout fits a `1440x900` viewport with zero page-level vertical overflow.
- Inside `ControlPanel.tsx`, make the slider stack scrollable if needed (`flex-1 overflow-y-auto pr-1`) and pin the `START / PAUSE / RESET` action bar cleanly at the bottom of the panel (`pt-3 border-t border-[#162436] mt-auto`) so buttons are NEVER clipped by the bottom `SimBar`.

## 4. Fix Impeller & Bubble State Bug + CAD Upgrade (`ReactorSVG.tsx` & `ReactorPanel.tsx`)
- **State Gate Bug:** Impeller rotation and rising sparger bubbles MUST ONLY animate when `isRunning === true` and the batch is active (`snapshot.t_h < 24`). When in `STANDBY` (`t = 0.00h`), `PAUSED`, or `COMPLETE`, the impeller and bubbles must remain 100% stationary.
- **Visual CAD Upgrade:**
  - Add a subtle radial blueprint grid background (`1px` lines at `rgba(47,140,255,0.05)`) inside the reactor viewport.
  - Render an industrial P&ID / CAD vessel: bolted stainless top headplate, motor drive shaft housing, dual 6-blade Rushton turbine impellers, bottom sparger ring, outer thermal cooling jacket walls, volume graduation tick marks (`0.5L` to `2.0L`), and multi-stop SVG gradients for the culture broth (`#F2A93B`) so it looks like a precision scientific instrument.
  - Add floating sensor leader lines (`pH`, `DO`, `TEMP`) with live pill badges that glow on value change.

## 5. Always-On Telemetry Rack (`LiveCharts.tsx`)
- Replace the collapsed/empty `▸ DATA` boxes in the right column with 5 always-visible, high-density SVG sparkline/area charts (`Biomass`, `Substrate`, `Dissolved O₂`, `pH`, `Temperature`).
- Each chart card must display:
  - Channel title + live `tabular-nums` readout + unit in the top row.
  - A dark recessed chart canvas (`bg-[#060C14] border border-[#121F30] h-16`) with horizontal dashed reference gridlines, a setpoint/threshold line, and a glowing SVG path + gradient area fill under the curve (even at `t = 0.00h`, render the initial baseline horizon so the rack looks alive).
  - Interactive hover crosshair readout over the sparkline.
