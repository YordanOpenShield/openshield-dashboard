/**
 * ─── UI Components: Button ───────────────────────────────────────────────────
 */

import type { ReactNode, ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: ReactNode;
}

const variantClasses: Record<string, string> = {
  primary:
    "bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 text-white",
  secondary:
    "bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white",
  danger:
    "bg-red-500 hover:bg-red-600 text-white",
  ghost:
    "text-gray-400 hover:text-white hover:bg-white/5",
};

const sizeClasses: Record<string, string> = {
  sm: "px-2.5 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className = "",
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center gap-2 font-medium rounded-lg transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-violet-500/50
        disabled:opacity-50 disabled:pointer-events-none
        ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
