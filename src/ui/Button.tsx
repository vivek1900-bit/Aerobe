// Button (07 §6): 40 px tall, mono UPPERCASE label, 1px border variants.
// `primary` = signal border/text + a left→right sweep fill on hover.
import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'ghost' | 'danger';

const variantClass: Record<Variant, string> = {
  primary: 'border-signal text-signal',
  ghost: 'border-line text-muted hover:border-signal hover:text-text',
  danger: 'border-danger text-danger',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = 'primary', className = '', children, ...rest }: ButtonProps) {
  return (
    <button
      className={`group relative inline-flex h-10 items-center justify-center gap-2 overflow-hidden border bg-transparent px-5 font-mono text-xs uppercase tracking-label transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${variantClass[variant]} ${className}`}
      {...rest}
    >
      {variant === 'primary' ? (
        <span
          aria-hidden="true"
          className="absolute inset-0 origin-left scale-x-0 bg-signal/10 transition-transform duration-300 group-hover:scale-x-100"
        />
      ) : null}
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </button>
  );
}
