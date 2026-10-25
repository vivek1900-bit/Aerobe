// Flat structural panel (07 §6): `panel` bg, 1px `line` border, subtle top-edge specular
// highlight, 12px corner HUD brackets, structured header bar with bottom hairline.
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
    <section
      className={`group/panel relative border border-t-[#1E324A] bg-panel ${panelBorder[tone]} ${className}`}
    >
      {brackets ? <Brackets tone={tone === 'signal' ? 'signal' : 'line'} /> : null}
      {(title || index) ? (
        <header className="flex items-center justify-between border-b border-line bg-[#070E17] px-4 py-2">
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
