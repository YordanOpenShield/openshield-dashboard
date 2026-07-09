/**
 * ─── UI Components: Toggle ───────────────────────────────────────────────────
 */

interface ToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Toggle({ value, onChange, label, disabled = false }: ToggleProps) {
  return (
    <label className={`flex items-center gap-3 ${disabled ? "opacity-50" : "cursor-pointer"}`}>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => !disabled && onChange(!value)}
        className={`relative w-10 h-5 rounded-full transition-all duration-200 ${
          value ? "bg-violet-500" : "bg-white/10"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200 ${
            value ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
      {label && <span className="text-sm text-gray-400 select-none">{label}</span>}
    </label>
  );
}
