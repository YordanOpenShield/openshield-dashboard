import Link from "next/link";
import { getBulkOperationsList } from "@/lib/manager-client";
import type { BulkOperationStatus } from "@/lib/manager-types";

// ─── Status Badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: BulkOperationStatus }) {
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

// ─── Bulk Operations Page ────────────────────────────────────────────────────

export default async function BulkOperationsPage() {
  const ops = await getBulkOperationsList().catch(() => []);

  return (
    <>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-100">Bulk Operations</h1>
        <p className="text-gray-400 mt-1">
          {ops.length} operation{ops.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Operations List */}
      {ops.length === 0 ? (
        <div className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-lg p-12 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-300 mb-2">No Bulk Operations</h2>
          <p className="text-sm text-gray-600 max-w-sm mx-auto">
            Bulk operations track batch actions like assigning tasks or running queries across multiple agents.
          </p>
        </div>
      ) : (
        <div className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Type</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Status</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Progress</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Created</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Completed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {ops.map((op) => (
                <tr key={op.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3">
                    <Link href={`/bulk-operations/${op.id}`} className="text-sm text-violet-400 hover:text-violet-300 transition-colors">
                      {op.type.replace(/_/g, " ")}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={op.status} />
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-400">
                    {op.progress.completed}/{op.progress.total}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500">
                    {new Date(op.created_at).toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500">
                    {op.completed_at ? new Date(op.completed_at).toLocaleString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
