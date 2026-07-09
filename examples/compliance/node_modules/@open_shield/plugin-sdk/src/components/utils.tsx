/**
 * ─── UI Components: Utility Components ───────────────────────────────────────
 */

import type { ReactNode } from "react";

// ─── Loading Spinner ────────────────────────────────────────────────────────

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
}

const spinnerSizes = { sm: "w-4 h-4", md: "w-8 h-8", lg: "w-12 h-12" };

export function LoadingSpinner({ size = "md", label }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div
        className={`${spinnerSizes[size]} border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin`}
      />
      {label && <p className="text-sm text-gray-500">{label}</p>}
    </div>
  );
}

// ─── Empty State ────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-16">
      {icon && (
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-400 mb-2">{title}</h3>
      {description && <p className="text-sm text-gray-600 max-w-md mx-auto mb-6">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}

// ─── Typography ─────────────────────────────────────────────────────────────

interface HeadingProps {
  level?: 1 | 2 | 3;
  children: React.ReactNode;
  className?: string;
}

const headingClasses: Record<number, string> = {
  1: "text-2xl font-bold text-gray-100",
  2: "text-lg font-semibold text-gray-200",
  3: "text-sm font-medium text-gray-300",
};

export function Heading({ level = 2, children, className = "" }: HeadingProps) {
  const cls = `${headingClasses[level]} ${className}`;
  switch (level) {
    case 1: return <h1 className={cls}>{children}</h1>;
    case 3: return <h3 className={cls}>{children}</h3>;
    default: return <h2 className={cls}>{children}</h2>;
  }
}

interface TextProps {
  variant?: "body" | "secondary" | "muted" | "label";
  children: ReactNode;
  className?: string;
}

const textClasses: Record<string, string> = {
  body: "text-sm text-gray-200",
  secondary: "text-sm text-gray-400",
  muted: "text-xs text-gray-600",
  label: "text-sm text-gray-500",
};

export function Text({ variant = "body", children, className = "" }: TextProps) {
  return <p className={`${textClasses[variant]} ${className}`}>{children}</p>;
}

// ─── Divider ────────────────────────────────────────────────────────────────

export function Divider({ className = "" }: { className?: string }) {
  return <hr className={`border-white/5 ${className}`} />;
}
