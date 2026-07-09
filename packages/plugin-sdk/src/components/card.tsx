/**
 * ─── UI Components: Card ─────────────────────────────────────────────────────
 *
 * Glassmorphism card container used throughout the dashboard.
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
      className={`bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-lg ${paddingMap[padding]} ${
        hover ? "transition-all duration-200 hover:border-white/20" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</h2>
      {action && <div>{action}</div>}
    </div>
  );
}
