/**
 * ─── UI Components: Input ────────────────────────────────────────────────────
 */

import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

const baseClass =
  "w-full bg-[var(--bg-tertiary)] border border-[var(--border-default)] rounded-lg px-3 py-2.5 text-[var(--text-primary)] " +
  "placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-from)]/50 " +
  "focus:border-[var(--accent-from)]/50 transition-all duration-200";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export function Input({ label, hint, className = "", id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm text-[var(--text-secondary)]">
          {label}
        </label>
      )}
      <input id={inputId} className={`${baseClass} ${className}`} {...props} />
      {hint && <p className="text-xs text-[var(--text-muted)]">{hint}</p>}
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({ label, className = "", id, ...props }: TextareaProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm text-[var(--text-secondary)]">
          {label}
        </label>
      )}
      <textarea id={inputId} className={`${baseClass} resize-y ${className}`} {...props} />
    </div>
  );
}

interface SelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, className = "", id, ...props }: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-sm text-[var(--text-secondary)]">
          {label}
        </label>
      )}
      <select id={selectId} className={`${baseClass} ${className}`} {...props}>
        <option value="">Select...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
