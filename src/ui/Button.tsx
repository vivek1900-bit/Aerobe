// Button (07 §6): 40 px tall, mono UPPERCASE label, 1px border variants.
// `primary` = signal border/text + a left→right signal sweep fill on hover + tactile press.
import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'ghost' | 'danger';

const variantClass: Record<Variant, string> = {
  primary:
    'border-signal text-signal hover:border-signal hover:shadow-[0_0_16px_rgba(47,140,255,0.25)]',
  ghost: 'border-line text-muted hover:border-signal hover:text-text',
  danger: 'border-danger text-danger',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = 'primary', className = '', children, ...rest }: ButtonProps) {
  return (
    <button
      className={`group relative inline-flex h-10 items-center justify-center gap-2 overflow-hidden border bg-transparent px-5 font-mono text-xs uppercase tracking-label transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${variantClass[variant]} ${className}`}
      {...rest}
    >
      {variant === 'primary' ? (
        <span
          aria-hidden="true"
          className="absolute inset-0 -translate-x-full bg-signal/15 transition-transform duration-200 group-hover:translate-x-0"
        />
      ) : null}
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </button>
  );
}
