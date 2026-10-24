// Animated SVG bioreactor (04 §4.6). Impeller spins by rpm, bubbles rise by vvm,
// liquid level by volume, liquid colour by biomass density, probe dots by live state.
import { useConsoleStore } from './store';

const C = {
  panel2: '#101B28',
  line: '#1B2A3A',
  signal: '#2F8CFF',
  broth: '#F2A93B',
  ok: '#3BD99F',
  danger: '#FF5A4F',
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

export function ReactorSVG() {
  const { snapshot, controls } = useConsoleStore();

  const X = snapshot?.X ?? 0;
  const V = snapshot?.V ?? 2.0;
  const rpm = controls.rpm;
  const vvm = controls.vvm;

  const density = Math.min(1, Math.max(0, X / 20)); // 0..1 by biomass
  const liquid = lerpHex('#EFE3B0', '#B86E00', density); // pale straw → deep amber

  const tankTopY = 120;
  const tankBottomY = 400;
  const tankH = tankBottomY - tankTopY;
  const levelPct = Math.min(95, Math.max(35, 35 + (V / 2.5) * 60));
  const liquidY = tankBottomY - (levelPct / 100) * tankH;

  const spinS = Math.max(0.25, 120 / Math.max(60, rpm)); // seconds per revolution
  const bubbleCount = Math.max(3, Math.round(vvm * 6));
  const bubbleDur = Math.max(0.8, 2.4 - vvm * 0.4);

  const pHok = snapshot ? snapshot.pH >= 5 && snapshot.pH <= 8.5 : true;
  const DOok = snapshot ? snapshot.DO >= 20 : true;
  const Tok = snapshot ? snapshot.T >= 20 && snapshot.T <= 45 : true;

  return (
    <svg
      viewBox="0 0 360 440"
      className="h-full w-full"
      role="img"
      aria-label="Animated bioreactor vessel schematic"
    >
      {/* Tank body */}
      <rect x="110" y={tankTopY} width="140" height={tankH} rx="12" fill={C.panel2} stroke={C.line} />
      {/* Top plate */}
      <rect x="100" y={tankTopY - 14} width="160" height="14" rx="3" fill={C.panel2} stroke={C.line} />

      {/* Liquid fill (clipped to tank) */}
      <clipPath id="aero-tank-clip">
        <rect x="110" y={tankTopY} width="140" height={tankH} rx="12" />
      </clipPath>
      <g clipPath="url(#aero-tank-clip)">
        <rect x="110" y={liquidY} width="140" height={tankBottomY - liquidY} fill={liquid} opacity="0.9" />
      </g>

      {/* Bubbles rising from the sparger */}
      {Array.from({ length: bubbleCount }).map((_, i) => (
        <circle
          key={i}
          cx={122 + ((i * 37) % 116)}
          cy={tankBottomY - 12}
          r={2.5 + (i % 3)}
          fill={C.text}
          opacity="0.5"
          style={{ animation: `aerobe-rise ${bubbleDur}s linear ${((i * 0.37) % 1.6).toFixed(2)}s infinite` }}
        />
      ))}

      {/* Stirrer shaft */}
      <line x1="180" y1={tankTopY - 10} x2="180" y2="356" stroke={C.muted} strokeWidth="3" />
      {/* Impeller (rotating) */}
      <g style={{ animation: `aerobe-spin ${spinS}s linear infinite`, transformBox: 'fill-box', transformOrigin: 'center' }}>
        <rect x="150" y="352" width="60" height="8" fill={C.signal} />
        <rect x="176" y="344" width="8" height="24" fill={C.signal} />
      </g>

      {/* Probe leader lines + status dots */}
      <line x1="70" y1="180" x2="250" y2="180" stroke={C.muted} strokeWidth="2" />
      <circle cx="250" cy="180" r="6" fill={pHok ? C.ok : C.danger} />
      <text x="40" y="183" textAnchor="end" fontSize="9" fill={C.muted} style={{ letterSpacing: '0.08em' }}>
        pH
      </text>

      <line x1="70" y1="230" x2="250" y2="230" stroke={C.muted} strokeWidth="2" />
      <circle cx="250" cy="230" r="6" fill={DOok ? C.ok : C.danger} />
      <text x="40" y="233" textAnchor="end" fontSize="9" fill={C.muted} style={{ letterSpacing: '0.08em' }}>
        DO
      </text>

      <line x1="70" y1="280" x2="250" y2="280" stroke={C.muted} strokeWidth="2" />
      <circle cx="250" cy="280" r="6" fill={Tok ? C.ok : C.danger} />
      <text x="40" y="283" textAnchor="end" fontSize="9" fill={C.muted} style={{ letterSpacing: '0.08em' }}>
        T
      </text>

      {/* Live biomass readout inside the vessel */}
      <text
        x="180"
        y={tankTopY + 18}
        textAnchor="middle"
        fontSize="11"
        fill={C.text}
        style={{ letterSpacing: '0.08em' }}
      >
        {X.toFixed(2)} g/L
      </text>
    </svg>
  );
}
