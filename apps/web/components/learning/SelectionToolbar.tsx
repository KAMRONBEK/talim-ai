'use client';

interface SelectionToolbarProps {
  position: { top: number; left: number } | null;
  label: string;
  onAsk: () => void;
}

export function SelectionToolbar({ position, label, onAsk }: SelectionToolbarProps) {
  if (!position) return null;

  return (
    <button
      type="button"
      className="absolute z-20 flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-lg"
      style={{ top: position.top, left: Math.max(8, position.left) }}
      onClick={onAsk}
    >
      {label}
    </button>
  );
}
