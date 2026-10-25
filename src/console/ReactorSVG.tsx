// Animated SVG bioreactor — industrial P&ID / CAD vessel (04 §4.6, ANTIGRAVITY_UI_PROMPT §4).
// Impeller + bubbles animate ONLY when isRunning && t_h < 24. Stationary otherwise.
// Features: bolted headplate, motor housing, dual Rushton turbines, sparger ring,
// cooling jacket, graduation marks, culture broth gradient, sensor leader lines with pills.
import { useConsoleStore } from './store';
import { useState, useEffect, useRef } from 'react';

const C = {
  ink: '#050B14',
  panel2: '#0F1A28',
  line: '#162436',
  signal: '#2F8CFF',
  broth: '#F2A93B',
  ok: '#22C55E',
  danger: '#EF4444',
  warn: '#F59E0B',
  muted: '#7F92A3',
  text: '#E8EEF3',
};

function lerpHex(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const r = Math.round(((pa >> 16) & 255) + (((pb >> 16) & 255) - ((pa >> 16) & 255)) * t);
  const g = Math.round(((pa >> 8) & 255) + (((pb >> 8) & 255) - ((pa >> 8) & 255)) * t);
  const bl = Math.round((pa & 255) + ((pb & 255) - (pa & 255)) * t);
  return `#${((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1)}`;
}

interface SensorPillProps {
  x: number;
  y: number;
  label: string;
  value: string;
  ok: boolean;
  prevValue: string;
}

function SensorPill({ x, y, label, value, ok, prevValue }: SensorPillProps) {
  const [flash, setFlash] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (value !== prevValue) {
      setFlash(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setFlash(false), 400);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, prevValue]);

  const pillW = 56;
  const pillH = 18;
  const dotColor = ok ? C.ok : C.danger;
  const glowFilter = flash ? 'url(#pill-glow)' : undefined;

  return (
    <g>
      {/* Leader line */}
      <line x1={x - 8} y1={y} x2={260} y2={y} stroke={C.muted} strokeWidth="1" strokeDasharray="3 2" opacity="0.5" />
      {/* Pill background */}
      <rect
        x={x - pillW - 12}
        y={y - pillH / 2}
        width={pillW}
        height={pillH}
        rx="3"
        fill={C.panel2}
        stroke={flash ? C.signal : C.line}
        strokeWidth="1"
        filter={glowFilter}
      />
      {/* Status dot */}
      <circle cx={x - pillW - 4} cy={y} r="3" fill={dotColor} />
      {/* Label */}
      <text x={x - pillW - 12 + 8} y={y + 3.5} fontSize="8" fill={C.muted} fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.08em">
        {label}
      </text>
      {/* Value */}
      <text x={x - 18} y={y + 3.5} fontSize="8" fill={C.text} fontFamily="'IBM Plex Mono', monospace" textAnchor="end" letterSpacing="0.04em">
        {value}
      </text>
    </g>
  );
}

interface ReactorSVGProps {
  isRunning?: boolean;
}

export function ReactorSVG({ isRunning: isRunningProp }: ReactorSVGProps) {
  const { snapshot, controls } = useConsoleStore();

  const X = snapshot?.X ?? 0;
  const V = snapshot?.V ?? 2.0;
  const rpm = controls.rpm;
  const vvm = controls.vvm;
  const t_h = snapshot?.t_h ?? 0;

  // Determine if animation should play: running AND batch active (t < 24h)
  const isRunning = isRunningProp !== undefined ? isRunningProp : (t_h > 0 && t_h < 24);
  const shouldAnimate = isRunning && t_h > 0 && t_h < 24;

  const density = Math.min(1, Math.max(0, X / 20));
  const liquid = lerpHex('#EFE3B0', '#B86E00', density);

  const tankTopY = 108;
  const tankBottomY = 380;
  const tankH = tankBottomY - tankTopY;
  const tankLeft = 110;
  const tankRight = 250;
  const tankW = tankRight - tankLeft;
  const cx = (tankLeft + tankRight) / 2;

  const levelPct = Math.min(95, Math.max(35, 35 + (V / 2.5) * 60));
  const liquidY = tankBottomY - (levelPct / 100) * tankH;

  const spinS = Math.max(0.25, 120 / Math.max(60, rpm));
  const bubbleCount = Math.max(3, Math.round(vvm * 6));
  const bubbleDur = Math.max(0.8, 2.4 - vvm * 0.4);

  const pHok = snapshot ? snapshot.pH >= 5 && snapshot.pH <= 8.5 : true;
  const DOok = snapshot ? snapshot.DO >= 20 : true;
  const Tok = snapshot ? snapshot.T >= 20 && snapshot.T <= 45 : true;

  const pHVal = snapshot ? snapshot.pH.toFixed(2) : '7.00';
  const DOVal = snapshot ? snapshot.DO.toFixed(1) : '0.0';
  const TVal = snapshot ? snapshot.T.toFixed(1) : '0.0';

  // Store prev values for flash detection
  const prevRef = useRef({ pH: pHVal, DO: DOVal, T: TVal });
  const prev = prevRef.current;
  useEffect(() => {
    prevRef.current = { pH: pHVal, DO: DOVal, T: TVal };
  });

  // Graduation marks (0.5L to 2.0L)
  const gradMarks = [0.5, 1.0, 1.5, 2.0];

  return (
    <svg
      viewBox="0 0 360 440"
      className="h-full w-full"
      role="img"
      aria-label="Animated bioreactor vessel schematic"
    >
      <defs>
        {/* Blueprint grid pattern */}
        <pattern id="bp-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(47,140,255,0.05)" strokeWidth="1" />
        </pattern>
        {/* Broth gradient */}
        <linearGradient id="broth-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={liquid} stopOpacity="0.7" />
          <stop offset="40%" stopColor={liquid} stopOpacity="0.85" />
          <stop offset="100%" stopColor={lerpHex(liquid, '#5A2800', 0.3)} stopOpacity="0.95" />
        </linearGradient>
        {/* Metal gradient for vessel */}
        <linearGradient id="vessel-metal" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0D1824" />
          <stop offset="20%" stopColor="#142030" />
          <stop offset="50%" stopColor="#182840" />
          <stop offset="80%" stopColor="#142030" />
          <stop offset="100%" stopColor="#0D1824" />
        </linearGradient>
        {/* Cooling jacket gradient */}
        <linearGradient id="jacket-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0A1520" />
          <stop offset="50%" stopColor="#0E1C2C" />
          <stop offset="100%" stopColor="#0A1520" />
        </linearGradient>
        {/* Pill glow filter */}
        <filter id="pill-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feFlood floodColor={C.signal} floodOpacity="0.4" />
          <feComposite in2="blur" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Tank clip path */}
        <clipPath id="aero-tank-clip">
          <rect x={tankLeft} y={tankTopY} width={tankW} height={tankH} rx="8" />
        </clipPath>
      </defs>

      {/* Blueprint grid background */}
      <rect width="360" height="440" fill="url(#bp-grid)" />

      {/* ---- Cooling jacket (outer walls) ---- */}
      <rect
        x={tankLeft - 10}
        y={tankTopY + 20}
        width={tankW + 20}
        height={tankH - 30}
        rx="12"
        fill="url(#jacket-grad)"
        stroke={C.line}
        strokeWidth="1"
        opacity="0.7"
      />
      {/* Jacket coolant flow arrows (decorative) */}
      <text x={tankLeft - 6} y={tankTopY + 60} fontSize="7" fill={C.signal} opacity="0.3" fontFamily="'IBM Plex Mono', monospace">▼</text>
      <text x={tankRight + 2} y={tankBottomY - 40} fontSize="7" fill={C.signal} opacity="0.3" fontFamily="'IBM Plex Mono', monospace">▲</text>

      {/* ---- Main vessel body ---- */}
      <rect
        x={tankLeft}
        y={tankTopY}
        width={tankW}
        height={tankH}
        rx="8"
        fill="url(#vessel-metal)"
        stroke={C.line}
        strokeWidth="1.5"
      />

      {/* ---- Bolted top headplate ---- */}
      <rect x={tankLeft - 15} y={tankTopY - 16} width={tankW + 30} height="16" rx="3" fill="#101820" stroke={C.line} strokeWidth="1.5" />
      {/* Bolts */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <circle
          key={`bolt-${i}`}
          cx={tankLeft - 10 + (i * (tankW + 20)) / 5}
          cy={tankTopY - 8}
          r="2.5"
          fill="#1A2A3E"
          stroke={C.muted}
          strokeWidth="0.5"
        />
      ))}

      {/* ---- Motor drive shaft housing ---- */}
      <rect x={cx - 12} y={tankTopY - 40} width="24" height="26" rx="3" fill="#101820" stroke={C.line} strokeWidth="1" />
      <rect x={cx - 8} y={tankTopY - 44} width="16" height="8" rx="2" fill="#182838" stroke={C.muted} strokeWidth="0.5" />
      {/* Motor label */}
      <text x={cx} y={tankTopY - 48} textAnchor="middle" fontSize="7" fill={C.muted} fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.1em">
        MOTOR
      </text>

      {/* ---- Liquid fill (clipped to tank) ---- */}
      <g clipPath="url(#aero-tank-clip)">
        <rect x={tankLeft} y={liquidY} width={tankW} height={tankBottomY - liquidY} fill="url(#broth-grad)" />
        {/* Liquid surface shimmer line */}
        <line x1={tankLeft + 4} y1={liquidY} x2={tankRight - 4} y2={liquidY} stroke={C.broth} strokeWidth="0.5" opacity="0.5" />
      </g>

      {/* ---- Bubbles (sparger aeration) ---- */}
      {shouldAnimate &&
        Array.from({ length: bubbleCount }).map((_, i) => (
          <circle
            key={i}
            cx={tankLeft + 12 + ((i * 37) % (tankW - 24))}
            cy={tankBottomY - 16}
            r={2 + (i % 3)}
            fill={C.text}
            opacity="0.4"
            style={{
              animation: `aerobe-rise ${bubbleDur}s linear ${((i * 0.37) % 1.6).toFixed(2)}s infinite`,
            }}
          />
        ))}

      {/* ---- Bottom sparger ring ---- */}
      <ellipse cx={cx} cy={tankBottomY - 14} rx={tankW / 2 - 18} ry="4" fill="none" stroke={C.muted} strokeWidth="1.5" strokeDasharray="4 3" />
      {/* Sparger holes */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <circle
          key={`sp-${i}`}
          cx={tankLeft + 20 + (i * (tankW - 40)) / 5}
          cy={tankBottomY - 14}
          r="1.5"
          fill={C.signal}
          opacity="0.4"
        />
      ))}

      {/* ---- Stirrer shaft ---- */}
      <line x1={cx} y1={tankTopY - 14} x2={cx} y2={tankBottomY - 40} stroke={C.muted} strokeWidth="3" />

      {/* ---- Dual Rushton turbine impellers ---- */}
      {/* Upper impeller */}
      <g
        style={shouldAnimate
          ? { animation: `aerobe-spin ${spinS}s linear infinite`, transformBox: 'fill-box', transformOrigin: 'center' }
          : { transformBox: 'fill-box', transformOrigin: 'center' }
        }
      >
        {/* 6-blade Rushton - upper */}
        {[0, 60, 120, 180, 240, 300].map((angle) => (
          <line
            key={`u-blade-${angle}`}
            x1={cx}
            y1={210}
            x2={cx + Math.cos((angle * Math.PI) / 180) * 30}
            y2={210 + Math.sin((angle * Math.PI) / 180) * 6}
            stroke={C.signal}
            strokeWidth="3"
            strokeLinecap="round"
          />
        ))}
        <circle cx={cx} cy={210} r="5" fill={C.signal} opacity="0.8" />
      </g>

      {/* Lower impeller */}
      <g
        style={shouldAnimate
          ? { animation: `aerobe-spin ${spinS * 1.1}s linear infinite`, transformBox: 'fill-box', transformOrigin: 'center' }
          : { transformBox: 'fill-box', transformOrigin: 'center' }
        }
      >
        {[0, 60, 120, 180, 240, 300].map((angle) => (
          <line
            key={`l-blade-${angle}`}
            x1={cx}
            y1={300}
            x2={cx + Math.cos((angle * Math.PI) / 180) * 28}
            y2={300 + Math.sin((angle * Math.PI) / 180) * 5}
            stroke={C.signal}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        ))}
        <circle cx={cx} cy={300} r="4" fill={C.signal} opacity="0.7" />
      </g>

      {/* ---- Volume graduation tick marks ---- */}
      {gradMarks.map((vol) => {
        const pct = 35 + (vol / 2.5) * 60;
        const gy = tankBottomY - (pct / 100) * tankH;
        return (
          <g key={`grad-${vol}`}>
            <line x1={tankRight - 1} y1={gy} x2={tankRight + 8} y2={gy} stroke={C.muted} strokeWidth="0.75" opacity="0.6" />
            <text x={tankRight + 11} y={gy + 3} fontSize="7" fill={C.muted} opacity="0.6" fontFamily="'IBM Plex Mono', monospace">
              {vol.toFixed(1)}L
            </text>
          </g>
        );
      })}

      {/* ---- Sensor leader lines with live pill badges ---- */}
      <SensorPill x={tankLeft} y={180} label="pH" value={pHVal} ok={pHok} prevValue={prev.pH} />
      <SensorPill x={tankLeft} y={220} label="DO" value={`${DOVal}%`} ok={DOok} prevValue={`${prev.DO}%`} />
      <SensorPill x={tankLeft} y={260} label="TEMP" value={`${TVal}°`} ok={Tok} prevValue={`${prev.T}°`} />

      {/* ---- Live biomass readout inside the vessel ---- */}
      <rect x={cx - 30} y={tankTopY + 6} width="60" height="16" rx="2" fill={C.panel2} stroke={C.line} strokeWidth="0.5" opacity="0.85" />
      <text
        x={cx}
        y={tankTopY + 17}
        textAnchor="middle"
        fontSize="9"
        fill={C.text}
        fontFamily="'IBM Plex Mono', monospace"
        letterSpacing="0.06em"
      >
        {X.toFixed(2)} g/L
      </text>
    </svg>
  );
}
