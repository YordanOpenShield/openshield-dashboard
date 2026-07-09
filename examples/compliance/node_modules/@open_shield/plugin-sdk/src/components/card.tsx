/**
 * ─── UI Components: Card ─────────────────────────────────────────────────────
 *
 * Glassmorphism card container. Uses CSS custom properties from the dashboard
 * so it automatically picks up theme changes.
 */

import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
  hover?: boolean;
}

const paddingMap = {
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export function Card({ children, className = "", padding = "md", hover = false }: CardProps) {
  return (
    <div
      className={`bg-[var(--bg-secondary)]/80 backdrop-blur-md border border-[var(--border-default)] rounded-lg ${paddingMap[padding]} ${
        hover ? "transition-all duration-200 hover:border-[var(--border-hover)]" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider">{title}</h2>
      {action && <div>{action}</div>}
    </div>
  );
}
