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
  default: "bg-white/5 text-gray-400 border border-white/10",
  success: "bg-green-500/10 text-green-400 border border-green-500/20",
  warning: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
  danger: "bg-red-500/10 text-red-400 border border-red-500/20",
  info: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  violet: "bg-violet-500/10 text-violet-400 border border-violet-500/20",
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
  connected: "bg-green-500",
  disconnected: "bg-gray-500",
  running: "bg-blue-500",
  completed: "bg-green-500",
  failed: "bg-red-500",
  pending: "bg-yellow-500",
};

export function StatusDot({ status, label }: StatusDotProps) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium">
      <span className={`w-2 h-2 rounded-full ${dotColors[status] ?? "bg-gray-500"}`} />
      {label && <span className="text-gray-400">{label}</span>}
    </span>
  );
}
