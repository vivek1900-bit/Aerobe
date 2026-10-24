// Flat structural panel (07 §6): `panel` bg, 1px `line` border, optional corner brackets,
// header row with mono index number. No glassmorphism blur.
import type { ReactNode } from 'react';
import { Brackets } from './Brackets';

type Tone = 'signal' | 'line';

const panelBorder: Record<Tone, string> = {
  signal: 'border-signal',
  line: 'border-line',
};

export interface PanelProps {
  title?: string;
  index?: string;
  tone?: Tone;
  brackets?: boolean;
  className?: string;
  children: ReactNode;
}

export function Panel({
  title,
  index,
  tone = 'line',
  brackets = true,
  className = '',
  children,
}: PanelProps) {
  return (
    <section className={`relative border bg-panel ${panelBorder[tone]} ${className}`}>
      {brackets ? <Brackets tone={tone === 'signal' ? 'signal' : 'line'} /> : null}
      {(title || index) ? (
        <header className="flex items-center justify-between border-b border-line px-4 py-2">
          <h3 className="font-mono text-[11px] uppercase tracking-label text-muted">{title}</h3>
          {index ? (
            <span className="font-mono text-[11px] uppercase tracking-label text-muted">{index}</span>
          ) : null}
        </header>
      ) : null}
      <div className="p-4">{children}</div>
    </section>
  );
}
