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
    <div className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-lg p-5 transition-all duration-200 hover:border-white/20">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className={`text-2xl font-semibold ${color}`}>{value}</p>
          {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
        </div>
        {icon && (
          <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
