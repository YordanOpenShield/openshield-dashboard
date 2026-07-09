/**
 * ─── UI Components: Badge ────────────────────────────────────────────────────
 */

import type { ReactNode } from "react";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "violet";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: "sm" | "md";
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-[var(--bg-muted)] text-[var(--text-muted)] border border-[var(--border-default)]",
  success: "bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20",
  warning: "bg-[var(--warning)]/10 text-[var(--warning)] border border-[var(--warning)]/20",
  danger: "bg-[var(--error)]/10 text-[var(--error)] border border-[var(--error)]/20",
  info: "bg-[var(--info)]/10 text-[var(--info)] border border-[var(--info)]/20",
  violet: "bg-[var(--accent-from)]/10 text-[var(--accent-from)] border border-[var(--accent-from)]/20",
};

export function Badge({ children, variant = "default", size = "sm" }: BadgeProps) {
  const sizeClass = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-1";
  return (
    <span className={`inline-flex items-center font-medium rounded ${sizeClass} ${variantClasses[variant]}`}>
      {children}
    </span>
  );
}

interface StatusDotProps {
  status: "connected" | "disconnected" | "running" | "completed" | "failed" | "pending";
  label?: string;
}

const dotColors: Record<string, string> = {
  connected: "bg-[var(--success)]",
  disconnected: "bg-[var(--text-muted)]",
  running: "bg-[var(--info)]",
  completed: "bg-[var(--success)]",
  failed: "bg-[var(--error)]",
  pending: "bg-[var(--warning)]",
};

export function StatusDot({ status, label }: StatusDotProps) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium">
      <span className={`w-2 h-2 rounded-full ${dotColors[status] ?? "bg-[var(--text-muted)]"}`} />
      {label && <span className="text-[var(--text-secondary)]">{label}</span>}
    </span>
  );
}
