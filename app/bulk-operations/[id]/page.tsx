import { notFound } from "next/navigation";
import Link from "next/link";
import { getBulkOperationDetails } from "@/lib/manager-client";
import { CancelBulkOpButton } from "./cancel-bulk-op-button";

// ─── Status Badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING: "bg-gray-500/10 border-gray-500/30 text-gray-400",
    RUNNING: "bg-blue-500/10 border-blue-500/30 text-blue-400",
    COMPLETED: "bg-green-500/10 border-green-500/30 text-green-400",
    PARTIAL: "bg-amber-500/10 border-amber-500/30 text-amber-400",
    FAILED: "bg-red-500/10 border-red-500/30 text-red-400",
    CANCELLED: "bg-gray-500/10 border-gray-500/30 text-gray-400",
  };
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${colors[status] ?? colors.PENDING}`}>
      {status}
    </span>
  );
}

// ─── Bulk Operation Detail Page ──────────────────────────────────────────────

export default async function BulkOperationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const op = await getBulkOperationDetails(id).catch(() => null);
  if (!op) notFound();

  const isActive = op.status === "PENDING" || op.status === "RUNNING";

  return (
    <>
      {/* Back link */}
      <Link
        href="/bulk-operations"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to Bulk Operations
      </Link>

      {/* Operation Header */}
      <div className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-100">{op.type.replace(/_/g, " ")}</h1>
            <p className="text-sm text-gray-500 mt-1">Bulk operation tracking</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={op.status} />
            {isActive && <CancelBulkOpButton operationId={op.id} />}
          </div>
        </div>

        {/* Target Info */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {op.target.agent_ids && op.target.agent_ids.length > 0 && (
            <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Target Agents</p>
              <p className="text-sm text-gray-300">{op.target.agent_ids.length} agents</p>
            </div>
          )}
          {op.target.group_id && (
            <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Target Group</p>
              <p className="text-sm text-gray-300 font-mono">{op.target.group_id.slice(0, 12)}…</p>
            </div>
          )}
          {op.target.all_connected && (
            <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Scope</p>
              <p className="text-sm text-gray-300">All Connected Agents</p>
            </div>
          )}
          <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Progress</p>
            <p className="text-sm text-gray-300">{op.progress.completed} / {op.progress.total}</p>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Created</p>
            <p className="text-sm text-gray-300">{new Date(op.created_at).toLocaleString()}</p>
          </div>
          {op.completed_at && (
            <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Completed</p>
              <p className="text-sm text-gray-300">{new Date(op.completed_at).toLocaleString()}</p>
            </div>
          )}
        </div>
      </div>

      {/* Per-Agent Results */}
      <div className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-lg p-5">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
          Results ({op.results.length})
        </h2>

        {op.results.length === 0 ? (
          <p className="text-sm text-gray-600 py-4 text-center">No results yet.</p>
        ) : (
          <div className="space-y-2">
            {op.results.map((result, i) => (
              <div key={i} className="flex items-start gap-3 py-3 px-4 rounded-lg bg-white/[0.02] border border-white/5">
                <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                  result.status === "success" ? "bg-green-500" :
                  result.status === "failed" ? "bg-red-500" :
                  "bg-gray-500"
                }`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-300 font-mono">
                    Agent: {result.agent_id.slice(0, 12)}…
                  </p>
                  {result.result && (
                    <pre className="text-xs text-gray-500 font-mono mt-1 whitespace-pre-wrap">
                      {result.result}
                    </pre>
                  )}
                  {result.error && (
                    <p className="text-xs text-red-400 mt-1">{result.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
