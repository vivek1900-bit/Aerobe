// Shared scroll-progress constants + easing for the scrollytelling tour.
// Single source of truth used by BOTH the 3D engine (camera/explode/wireframe)
// and the Tour overlay (panel crossfade, nav-tab targets).
//
// Page height = CHAPTER_COUNT sections. Hero (chapter 0) is 200vh; the rest 180vh.
// Total = 200 + 180*3 = 740vh; scrollable = 740 - 100 = 640vh.

export const CHAPTER_COUNT = 4;
export const HERO_VH = 100;
export const SECTION_VH = 180;
export const TOTAL_VH = HERO_VH + SECTION_VH * (CHAPTER_COUNT - 1); // 740

/** Scroll position (vh) at the top of each section: [0, 200, 380, 560]. */
export const SECTION_START_VH = Array.from({ length: CHAPTER_COUNT }, (_, i) =>
  i === 0 ? 0 : HERO_VH + SECTION_VH * (i - 1),
);

/**
 * Chapter boundaries in p (0..1) — where chapter i ends and i+1 begins.
 * p = scrollY / (docHeight - innerHeight), docHeight = TOTAL_VH.
 * => [200/640, 380/640, 560/640] = [0.3125, 0.59375, 0.875]
 */
export const BOUNDARIES = SECTION_START_VH.slice(1).map((v) => v / (TOTAL_VH - 100));

/** Half-width of a state-transition window (0.12 wide ⇒ ±0.06). */
export const WINDOW = 0.06;

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** 5th-order smoothstep (C2-continuous) — the "smootherstep". */
export function smootherstep(min: number, max: number, value: number) {
  const x = clamp01((value - min) / (max - min));
  return x * x * x * (x * (x * 6 - 15) + 10);
}

/** easeInOutCubic for nav-tab scrolling. */
export function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
