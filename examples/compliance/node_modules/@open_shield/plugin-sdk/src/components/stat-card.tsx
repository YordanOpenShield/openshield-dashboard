/**
 * ─── UI Components: StatCard ────────────────────────────────────────────────
 */

import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  icon?: ReactNode;
}

export function StatCard({ label, value, sub, color = "text-gray-200", icon }: StatCardProps) {
  return (
    <div className="bg-[var(--bg-secondary)]/80 backdrop-blur-md border border-[var(--border-default)] rounded-lg p-5 transition-all duration-200 hover:border-[var(--border-hover)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--text-muted)] mb-1">{label}</p>
          <p className={`text-2xl font-semibold ${color}`}>{value}</p>
          {sub && <p className="text-xs text-[var(--text-muted)] mt-1">{sub}</p>}
        </div>
        {icon && (
          <div className="w-9 h-9 rounded-lg bg-[var(--bg-muted)] border border-[var(--border-default)] flex items-center justify-center shrink-0">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
