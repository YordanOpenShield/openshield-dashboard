interface StatusBadgeProps {
  status: string;
  className?: string;
}

const colors: Record<string, string> = {
  // Agent states
  CONNECTED: "bg-green-500/10 border-green-500/30 text-green-400",
  DISCONNECTED: "bg-gray-500/10 border-gray-500/30 text-gray-400",

  // Task / Query / Bulk statuses
  PENDING: "bg-gray-500/10 border-gray-500/30 text-gray-400",
  RUNNING: "bg-blue-500/10 border-blue-500/30 text-blue-400",
  COMPLETED: "bg-green-500/10 border-green-500/30 text-green-400",
  FAILED: "bg-red-500/10 border-red-500/30 text-red-400",
  CANCELLED: "bg-amber-500/10 border-amber-500/30 text-amber-400",
  PARTIAL: "bg-amber-500/10 border-amber-500/30 text-amber-400",

  // Service states
  running: "bg-green-500/10 border-green-500/30 text-green-400",
  stopped: "bg-gray-500/10 border-gray-500/30 text-gray-400",

  // Job types
  COMMAND: "bg-blue-500/10 border-blue-500/30 text-blue-400",
  SCRIPT: "bg-amber-500/10 border-amber-500/30 text-amber-400",
};

const dots: Record<string, string> = {
  CONNECTED: "bg-green-500",
  DISCONNECTED: "bg-gray-500",
  PENDING: "bg-gray-500",
  RUNNING: "bg-blue-500",
  COMPLETED: "bg-green-500",
  FAILED: "bg-red-500",
  CANCELLED: "bg-amber-500",
  PARTIAL: "bg-amber-500",
  running: "bg-green-500",
  stopped: "bg-gray-500",
};

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const colorClass = colors[status] ?? "bg-gray-500/10 border-gray-500/30 text-gray-400";
  const dotClass = dots[status] ?? "bg-gray-500";

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${colorClass} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
      {status}
    </span>
  );
}
