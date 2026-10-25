// Selectable chip (07 §6): active = signal border + glowing dot. Keyboard-focusable radio button.
// Arrow-key roving between chips is handled by the parent group, not this primitive.
import { motion } from 'framer-motion';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

export function Chip({ label, selected = false, onClick, disabled = false }: ChipProps) {
  return (
    <motion.button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onClick}
      layout
      transition={{ duration: 0.15 }}
      className={`inline-flex h-9 items-center gap-2 border px-3 font-mono text-xs uppercase tracking-label transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
        selected
          ? 'border-signal bg-panel2 text-text'
          : 'border-line text-muted hover:border-signal/60 hover:bg-panel2 hover:text-text'
      }`}
    >
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full transition-shadow duration-200 ${
          selected ? 'bg-signal shadow-[0_0_8px_#2F8CFF]' : 'bg-muted/40'
        }`}
      />
      {label}
    </motion.button>
  );
}
