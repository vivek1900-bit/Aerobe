// Small keycap for keyboard shortcuts (07 §6).
import type { ReactNode } from 'react';

export interface KbdProps {
  children: ReactNode;
  className?: string;
}

export function Kbd({ children, className = '' }: KbdProps) {
  return (
    <kbd
      className={`inline-flex min-w-6 items-center justify-center border border-line bg-panel2 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-label text-muted ${className}`}
    >
      {children}
    </kbd>
  );
}
