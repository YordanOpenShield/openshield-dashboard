/**
 * ─── UI Components: Input ────────────────────────────────────────────────────
 */

import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

const baseClass =
  "w-full bg-[#0d0d0d] border border-white/10 rounded-lg px-3 py-2.5 text-gray-200 " +
  "placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 " +
  "focus:border-violet-500/50 transition-all duration-200";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export function Input({ label, hint, className = "", id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm text-gray-400">
          {label}
        </label>
      )}
      <input id={inputId} className={`${baseClass} ${className}`} {...props} />
      {hint && <p className="text-xs text-gray-600">{hint}</p>}
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
        <label htmlFor={inputId} className="block text-sm text-gray-400">
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
        <label htmlFor={selectId} className="block text-sm text-gray-400">
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
