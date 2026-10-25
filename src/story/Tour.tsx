import { useCallback, useEffect, useRef } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { ReactorDigitalTwin } from '../scene/ReactorDigitalTwin';
import { BOUNDARIES, WINDOW, smootherstep, easeInOutCubic, SECTION_VH } from '../scene/scroll';
import { useSimulation } from '../console/useSimulation';
import { useConsoleStore } from '../console/store';

// ─────────────────────────────────────────────────────────────────────────────
// Aerobe Scrollytelling Tour — full-screen hero (min-h-svh) + 3 sticky chapters.
// Hero carries eyebrow / H1 (word reveal) / sub / buttons / footer, with the 3D
// reactor behind it. Chapters 02–04 keep the sticky 180vh scrollytelling. A
// silent 600× sim runs at hero load and feeds the live telemetry card.
// ─────────────────────────────────────────────────────────────────────────────

type Accent = 'blue' | 'amber' | 'green';

interface SpecCard {
  accent: Accent;
  title: string;
  subtitle: string;
  badge: string;
}

interface Chapter {
  nav: string;
  dock: string;
  pill: string;
  h1a: string;
  h1b: string;
  para: string;
  cards: SpecCard[];
}

const CHAPTERS: Chapter[] = [
  {
    nav: '01 Overview',
    dock: '01: OVERVIEW',
    pill: '01 · Overview',
    h1a: 'Next-Gen Bioprocess',
    h1b: 'Digital Twin & Control',
    para: '',
    cards: [],
  },
  {
    nav: '02 Exploded view',
    dock: '02: EXPLODED VIEW',
    pill: '02 · Exploded view',
    h1a: 'Kinematic',
    h1b: 'Exploded Assembly',
    para:
      'Precision volumetric separation lifts the sanitary headplate along the z-axis while optical dip-tubes and baffles translate outward radially.',
    cards: [
      { accent: 'blue', title: '316L HEADPLATE', subtitle: 'Eight Tri-Clamp ports with an EPDM seal (illustrative)', badge: '+420 mm' },
      { accent: 'amber', title: 'DUAL RUSHTON', subtitle: 'Six flat blades per hub for high-shear gas dispersion', badge: 'Di/Dt 0.38' },
      { accent: 'green', title: 'OPTICAL PROBES', subtitle: 'Luminescent DO, digital pH and Pt100 RTD bundle', badge: '25 mm' },
      { accent: 'blue', title: 'VESSEL CAPACITY', subtitle: 'Borosilicate 3.3 glass — 300 L working volume (illustrative)', badge: '300 L' },
      { accent: 'amber', title: 'AGITATION DRIVE', subtitle: 'Dual Rushton impellers, 100–1,000 RPM (illustrative)', badge: 'RPM' },
      { accent: 'green', title: 'SENSOR BUS', subtitle: 'Luminescent DO, pH and Pt100 sampled at 10 Hz', badge: '10 Hz' },
    ],
  },
  {
    nav: '03 Model',
    dock: '03: MODEL',
    pill: '03 · Model',
    h1a: 'Volumetric Flow &',
    h1b: 'Biochemical Kinetics',
    para:
      'A real-time differential solver predicts substrate saturation and specific growth rate alongside turbulent energy dissipation fields.',
    cards: [
      { accent: 'blue', title: 'MAX GROWTH μ_max', subtitle: 'Specific growth-rate ceiling (illustrative)', badge: '0.68 h⁻¹' },
      { accent: 'amber', title: 'SUBSTRATE K_s', subtitle: 'Monod half-saturation constant (illustrative)', badge: '0.12 g/L' },
      { accent: 'green', title: 'BIOMASS YIELD Y_xs', subtitle: 'Cells formed per substrate consumed (illustrative)', badge: '0.48 g/g' },
    ],
  },
  {
    nav: '04 Console',
    dock: '04: CONSOLE',
    pill: '04 · Console',
    h1a: 'Bioprocess',
    h1b: 'Control Mission Console',
    para:
      'Take the controls — setpoints, live charts and alarms for a full simulated fed-batch run.',
    cards: [
      { accent: 'blue', title: 'DISSOLVED O₂', subtitle: 'Cascade PID, target 95% (illustrative)', badge: '96.8%' },
      { accent: 'amber', title: 'AGITATION', subtitle: 'Setpoint 100–1,000 RPM (illustrative)', badge: '420 RPM' },
      { accent: 'green', title: 'TEMP / pH', subtitle: '37.0 °C · pH 7.00 (illustrative)', badge: 'OK' },
    ],
  },
];

const ACCENT: Record<Accent, { line: string; badge: string }> = {
  blue: { line: 'border-l-[#3b82f6]', badge: 'border-[#3b82f6]/30 bg-[#3b82f6]/10 text-[#3b82f6]' },
  amber: { line: 'border-l-[#f59e0b]', badge: 'border-[#f59e0b]/30 bg-[#f59e0b]/10 text-[#f59e0b]' },
  green: { line: 'border-l-[#34d399]', badge: 'border-[#34d399]/30 bg-[#34d399]/10 text-[#34d399]' },
};

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const wordVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

const H1A = ['Run', 'a', 'bioreactor.'];
const H1B = ['In', 'your', 'browser.'];

function TelemetryPanel() {
  const snapshot = useConsoleStore((s) => s.snapshot);
  const organism = useConsoleStore((s) => s.organism);

  const doVal = snapshot?.DO ?? 96.8;
  const pH = snapshot?.pH ?? 7.0;
  const temp = snapshot?.T ?? 37.0;
  const orgLabel = organism === 'ecoli' ? 'E. coli BL21(DE3)' : 'S. cerevisiae';

  const bars = [
    { label: 'DISSOLVED O₂', value: `${doVal.toFixed(1)}%`, pct: Math.max(0, Math.min(100, doVal)), color: '#38bdf8' },
    { label: 'MEDIUM pH', value: pH.toFixed(2), pct: Math.max(0, Math.min(100, ((pH - 5) / 3.5) * 100)), color: '#34d399' },
    { label: 'VESSEL TEMP', value: `${temp.toFixed(1)} °C`, pct: Math.max(0, Math.min(100, (temp / 50) * 100)), color: '#fbbf24' },
  ];

  return (
    <div className="tour-card space-y-4 p-5">
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
        <span className="flex items-center gap-2 font-jetbrains text-xs font-bold text-white">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#34d399]" />
          LIVE TELEMETRY
        </span>
        <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5 font-jetbrains text-[10px] text-white/40">
          {orgLabel}
        </span>
      </div>
      <div className="space-y-3">
        {bars.map((b) => (
          <div key={b.label}>
            <div className="flex justify-between font-jetbrains text-[11px] text-white/50">
              <span>{b.label}</span>
              <span className="tabular-nums" style={{ color: b.color }}>
                {b.value}
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full transition-[width] duration-300"
                style={{ width: `${b.pct}%`, background: b.color }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 font-jetbrains text-[11px] leading-relaxed text-white/60">
        <span className="font-bold text-[#34d399]">DEMO RUN</span> · {orgLabel}
        <br />
        All values illustrative — teaching twin.
      </div>
    </div>
  );
}

export function Tour({ onLaunch }: { onLaunch: () => void }) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const twinRef = useRef<ReactorDigitalTwin | null>(null);
  const reduced = useReducedMotion();

  const chapterEls = useRef<(HTMLDivElement | null)[]>([]);
  const navButtons = useRef<(HTMLButtonElement | null)[]>([]);
  const dotEls = useRef<(HTMLButtonElement | null)[]>([]);
  const dockLabel = useRef<HTMLSpanElement>(null);
  const rpmValue = useRef<HTMLSpanElement>(null);

  // Start the real simulation silently at hero load (ecoli defaults, 600×).
  const { start } = useSimulation();
  useEffect(() => {
    useConsoleStore.getState().setSpeed(600);
    start();
  }, [start]);

  // Per-frame chapter crossfade for chapters 02–04 + active-tab/dot highlight.
  const applyProgress = useCallback((p: number) => {
    const [b0, b1, b2] = BOUNDARIES;
    const w1 = smootherstep(b0 - WINDOW, b0 + WINDOW, p) * (1 - smootherstep(b1 - WINDOW, b1 + WINDOW, p));
    const w2 = smootherstep(b1 - WINDOW, b1 + WINDOW, p) * (1 - smootherstep(b2 - WINDOW, b2 + WINDOW, p));
    const w3 = smootherstep(b2 - WINDOW, b2 + WINDOW, p);
    const weights = [w1, w2, w3];

    chapterEls.current.forEach((el, idx) => {
      if (!el) return;
      el.style.opacity = weights[idx].toFixed(3);
    });

    let active = 0;
    if (p > b0) active = 1;
    if (p > b1) active = 2;
    if (p > b2) active = 3;

    if (dockLabel.current) dockLabel.current.textContent = CHAPTERS[active].dock;

    navButtons.current.forEach((btn, idx) => {
      if (!btn) return;
      if (idx === active) {
        btn.classList.add('bg-[#1a2433]', 'text-white');
        btn.classList.remove('text-white/50');
      } else {
        btn.classList.remove('bg-[#1a2433]', 'text-white');
        btn.classList.add('text-white/50');
      }
    });

    dotEls.current.forEach((dot, idx) => {
      if (!dot) return;
      const inner = dot.firstElementChild as HTMLElement | null;
      if (!inner) return;
      if (idx === active) {
        inner.classList.add('bg-white');
        inner.classList.remove('bg-white/10');
      } else {
        inner.classList.remove('bg-white');
        inner.classList.add('bg-white/10');
      }
    });
  }, []);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    let twin: ReactorDigitalTwin | null = null;
    try {
      twin = new ReactorDigitalTwin(el, { onProgress: applyProgress });
      twin.setRunning(true); // tour landing = live demo vessel
      twin.start();
      twinRef.current = twin;
    } catch (err) {
      console.error('[AEROBE] WebGL unavailable — 3D twin disabled', err);
    }
    return () => {
      twin?.dispose();
      twinRef.current = null;
    };
  }, [applyProgress]);

  // Nav tabs: eased 1.4 s (easeInOutCubic); instant under reduced motion.
  const jumpToChapter = (i: number) => {
    const el = document.getElementById(`chapter-${i}`);
    const target = el ? el.offsetTop : 0;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.scrollTo(0, target);
      return;
    }
    const start = window.scrollY;
    const delta = target - start;
    const duration = 1400;
    const t0 = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      window.scrollTo(0, start + delta * easeInOutCubic(t));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const adjustRpm = (delta: number) => {
    const twin = twinRef.current;
    if (!twin) return;
    twin.setRpm(twin.getRpm() + delta);
    if (rpmValue.current) rpmValue.current.textContent = `${twin.getRpm()} RPM`;
  };

  const ArrowRight = (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
    </svg>
  );
  const ArrowDown = (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path d="M12 4v16m0 0l-6-6m6 6l6-6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
    </svg>
  );

  return (
    <div className="relative font-jakarta">
      {/* Hero ambient glow — behind the canvas (z-0, earlier in DOM) */}
      <div className="hero-glow pointer-events-none fixed inset-0 z-0" aria-hidden="true" />

      {/* Fixed WebGL canvas */}
      <div ref={canvasRef} className="pointer-events-none fixed inset-0 z-0" aria-hidden="true" />

      {/* Mobile dark scrim behind the text (above canvas, below sections) */}
      <div
        className="pointer-events-none fixed inset-0 z-[1] lg:hidden"
        style={{ background: 'linear-gradient(to bottom, rgba(4,7,13,0.88), rgba(4,7,13,0.55))' }}
        aria-hidden="true"
      />

      {/* In-flow sections: hero (static) + chapters 02–04 (sticky) */}
      <main className="relative z-[5]">
        {/* Hero */}
        <section id="chapter-0" className="relative min-h-svh pb-28">
          <div className="flex min-h-svh flex-col justify-center px-6 pb-28 lg:w-[min(680px,50vw)] lg:pr-0">
            <p className="mb-5 font-jetbrains text-[11px] uppercase tracking-[0.18em] text-white/50">
              Virtual bioprocess lab · free · no install
            </p>

            <motion.h1
              variants={containerVariants}
              initial={reduced ? false : 'hidden'}
              animate="show"
              className="text-[clamp(2.5rem,5vw,4rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-white"
            >
              <span className="block">
                {H1A.map((w, i) => (
                  <motion.span key={i} variants={wordVariants} className="mr-[0.26em] inline-block">
                    {w}
                  </motion.span>
                ))}
              </span>
              <span className="block">
                {H1B.map((w, i) => (
                  <motion.span
                    key={i}
                    variants={wordVariants}
                    className="mr-[0.26em] inline-block bg-gradient-to-r from-[#3b82f6] to-[#38bdf8] bg-clip-text text-transparent"
                  >
                    {w}
                  </motion.span>
                ))}
              </span>
            </motion.h1>

            <p className="mt-6 max-w-[52ch] text-[18px] leading-relaxed text-[#9aa7b8]">
              Pick an organism, set temperature, pH and aeration, and watch cells, oxygen and sugar respond, with an AI
              coach that explains why.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#app"
                onClick={(e) => {
                  e.preventDefault();
                  onLaunch();
                }}
                className="btn-white-pill flex items-center gap-2 px-6 py-3 text-sm font-semibold"
              >
                Open the console
                {ArrowRight}
              </a>
              <button
                type="button"
                onClick={() => jumpToChapter(1)}
                className="flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white/80 transition hover:border-white/30 hover:text-white"
              >
                Take the tour
                {ArrowDown}
              </button>
            </div>

            <p className="mt-8 font-jetbrains text-[11px] text-white/40">
              E. coli · Yeast · Batch &amp; fed-batch · AI advisor · Works offline
            </p>
          </div>
        </section>

        {/* Chapters 02–04 — sticky scrollytelling */}
        {CHAPTERS.slice(1).map((c, idx) => {
          const i = idx + 1;
          return (
            <section key={c.nav} id={`chapter-${i}`} style={{ height: `${SECTION_VH}vh` }}>
              <div className="sticky top-0 h-screen">
                <div className="h-full px-6 pt-[160px] lg:w-[min(560px,42vw)] lg:pr-0">
                  <div
                    ref={(el) => {
                      chapterEls.current[idx] = el;
                    }}
                    className="space-y-6"
                    style={{ opacity: 0 }}
                  >
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-jetbrains text-[11px] uppercase tracking-widest text-white/60">
                      {c.pill}
                    </span>
                    <h1 className="text-[clamp(3rem,6vw,5.5rem)] font-extrabold leading-[1] tracking-[-0.03em] text-white">
                      {c.h1a}
                      <br />
                      <span className="bg-gradient-to-r from-[#3b82f6] to-[#38bdf8] bg-clip-text text-transparent">
                        {c.h1b}
                      </span>
                    </h1>
                    <p className="max-w-[52ch] text-[18px] leading-relaxed text-[#9aa7b8]">{c.para}</p>
                    <div className="space-y-3">
                      {c.cards.map((card) => (
                        <div
                          key={card.title}
                          className={`tour-card flex items-center justify-between gap-4 border-l-[3px] p-4 ${ACCENT[card.accent].line}`}
                        >
                          <div className="min-w-0">
                            <div className="font-jetbrains text-sm font-bold text-white">{card.title}</div>
                            <div className="mt-0.5 text-[14px] text-[#9aa7b8]">{card.subtitle}</div>
                          </div>
                          <span
                            className={`shrink-0 rounded-full border px-2.5 py-0.5 font-jetbrains text-[11px] tabular-nums ${ACCENT[card.accent].badge}`}
                          >
                            {card.badge}
                          </span>
                        </div>
                      ))}
                      {/* Mobile/tablet: telemetry panel in the flow */}
                      <div className="lg:hidden">
                        <TelemetryPanel />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </main>

      {/* Fixed HUD chrome */}
      <div className="pointer-events-none fixed inset-0 z-10 overflow-hidden">
        {/* Nav */}
        <header className="pointer-events-auto absolute left-6 right-6 top-5 z-30 mx-auto flex h-16 max-w-[1400px] items-center justify-between rounded-[20px] border border-[#1c2a3d] bg-[rgba(10,18,28,0.72)] px-4 backdrop-blur-[16px]">
          <button
            type="button"
            onClick={() => jumpToChapter(0)}
            className="flex min-w-0 items-center gap-3"
            aria-label="Aerobe — back to tour start"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#38bdf8] font-jetbrains text-sm font-bold text-white">
              Æ
            </span>
            <span className="hidden items-center gap-2 font-jetbrains text-sm font-semibold text-white sm:flex">
              Aerobe <span className="text-white/30">|</span> Bioreactor Studio
            </span>
            <span className="hidden items-center gap-1 rounded-full border border-[#34d399]/30 bg-[#34d399]/10 px-2 py-0.5 font-jetbrains text-[10px] font-semibold text-[#34d399] sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[#34d399]" />
              DEMO
            </span>
          </button>

          <nav className="hidden items-center gap-1 rounded-xl bg-white/[0.03] p-1 font-jetbrains text-[13px] md:flex">
            {CHAPTERS.map((c, i) => (
              <button
                key={c.nav}
                ref={(el) => {
                  navButtons.current[i] = el;
                }}
                onClick={() => jumpToChapter(i)}
                className={`rounded-lg px-3 py-1.5 transition-colors ${
                  i === 0 ? 'bg-[#1a2433] text-white' : 'text-white/50 hover:bg-white/5 hover:text-white'
                }`}
              >
                {c.nav}
              </button>
            ))}
          </nav>

          <button
            type="button"
            onClick={onLaunch}
            className="btn-white-pill flex items-center gap-1.5 px-4 py-2 text-xs font-semibold"
          >
            <span className="hidden sm:inline">Skip tour &amp; open console</span>
            <span className="sm:hidden">Skip</span>
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
            </svg>
          </button>
        </header>

        {/* Chapter dots (replaces the progress rail) */}
        <div className="absolute right-4 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center gap-4 lg:flex">
          {CHAPTERS.map((c, i) => (
            <button
              key={c.nav}
              type="button"
              ref={(el) => {
                dotEls.current[i] = el;
              }}
              onClick={() => jumpToChapter(i)}
              className="group relative flex items-center"
              aria-label={c.nav}
            >
              <span className="h-2.5 w-2.5 rounded-full border border-white/30 bg-white/10 transition group-hover:bg-white/70" />
              <span className="pointer-events-none absolute right-6 whitespace-nowrap rounded-md border border-white/10 bg-black/70 px-2 py-1 font-jetbrains text-[10px] text-white/70 opacity-0 transition group-hover:opacity-100">
                {c.nav}
              </span>
            </button>
          ))}
        </div>

        {/* Right data panel (desktop, fixed) */}
        <div className="absolute right-14 top-[40vh] z-20 hidden w-[400px] lg:block">
          <TelemetryPanel />
        </div>

        {/* Bottom bar */}
        <div className="pointer-events-auto fixed bottom-4 left-6 z-30 hidden items-center gap-3 sm:flex">
          <div className="tour-card flex items-center gap-3 px-4 py-2.5 font-jetbrains text-xs">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#34d399]" />
            <span className="font-bold text-white/90">ILLUSTRATIVE TWIN ACTIVE</span>
            <span className="text-white/20">|</span>
            <span ref={dockLabel} className="text-white/70">
              01: OVERVIEW
            </span>
          </div>
          <div className="tour-card flex items-center gap-3 px-4 py-2.5 font-jetbrains text-xs">
            <span className="text-white/50">AGITATION</span>
            <button
              type="button"
              onClick={() => adjustRpm(-10)}
              className="flex h-5 w-5 items-center justify-center rounded bg-white/10 font-bold text-white transition-colors hover:bg-white/20"
              aria-label="Decrease agitation"
            >
              -
            </button>
            <span ref={rpmValue} className="w-16 text-center font-bold tabular-nums text-[#f59e0b]">
              420 RPM
            </span>
            <button
              type="button"
              onClick={() => adjustRpm(10)}
              className="flex h-5 w-5 items-center justify-center rounded bg-white/10 font-bold text-white transition-colors hover:bg-white/20"
              aria-label="Increase agitation"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
