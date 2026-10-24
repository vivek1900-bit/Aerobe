// Decorative HUD corner ticks (07 §6). Thin L-shaped brackets, 12 px each side.
// `tone` maps to the design-token border colours; no dynamic class construction.

type Tone = 'signal' | 'line' | 'broth' | 'muted';

const toneBorder: Record<Tone, string> = {
  signal: 'border-signal',
  line: 'border-line',
  broth: 'border-broth',
  muted: 'border-muted',
};

export interface BracketsProps {
  tone?: Tone;
  className?: string;
}

export function Brackets({ tone = 'signal', className = '' }: BracketsProps) {
  const c = toneBorder[tone];
  const seg = `pointer-events-none absolute h-3 w-3 ${c}`;
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 ${className}`}>
      <span className={`${seg} left-0 top-0 border-l border-t`} />
      <span className={`${seg} right-0 top-0 border-r border-t`} />
      <span className={`${seg} bottom-0 left-0 border-b border-l`} />
      <span className={`${seg} bottom-0 right-0 border-b border-r`} />
    </div>
  );
}
