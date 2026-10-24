// Selectable chip (07 §6): active = signal border + dot. Keyboard-focusable radio button.
// Arrow-key roving between chips is handled by the parent group, not this primitive.
export interface ChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

export function Chip({ label, selected = false, onClick, disabled = false }: ChipProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-9 items-center gap-2 border px-3 font-mono text-xs uppercase tracking-label transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
        selected
          ? 'border-signal text-text'
          : 'border-line text-muted hover:border-signal/50 hover:text-text'
      }`}
    >
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full ${selected ? 'bg-signal' : 'bg-muted/40'}`}
      />
      {label}
    </button>
  );
}
