import { notFound } from "next/navigation";
import Link from "next/link";
import { getQueryExecutionDetails, getQueryDetails } from "@/lib/manager-client";
import { RefreshableSection } from "@/components/refreshable-section";

// ─── Status Badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING: "bg-gray-500/10 border-gray-500/30 text-gray-400",
    RUNNING: "bg-blue-500/10 border-blue-500/30 text-blue-400",
    COMPLETED: "bg-green-500/10 border-green-500/30 text-green-400",
    FAILED: "bg-red-500/10 border-red-500/30 text-red-400",
    CANCELLED: "bg-amber-500/10 border-amber-500/30 text-amber-400",
  };
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${colors[status] ?? colors.PENDING}`}>
      {status}
    </span>
  );
}

// ─── Execution Detail Page ───────────────────────────────────────────────────

export default async function ExecutionDetailPage({
  params,
}: {
  params: Promise<{ id: string; executionId: string }>;
}) {
  const { id, executionId } = await params;

  const [execDetails, query] = await Promise.all([
    getQueryExecutionDetails(executionId).catch(() => null),
    getQueryDetails(id).catch(() => null),
  ]);

  if (!execDetails || !query) notFound();

  const { execution, results } = execDetails;

  return (
    <>
      {/* Back link */}
      <Link
        href={`/queries/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to Query
      </Link>

      {/* Execution Info */}
      <div className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Execution Details</h1>
            <p className="text-sm text-gray-500 mt-1">Query: {query.name}</p>
          </div>
          <StatusBadge status={execution.status} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Execution ID</p>
            <p className="text-sm text-gray-300 font-mono">{execution.id.slice(0, 12)}…</p>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Created</p>
            <p className="text-sm text-gray-300">{new Date(execution.created_at).toLocaleString()}</p>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Completed</p>
            <p className="text-sm text-gray-300">
              {execution.completed_at ? new Date(execution.completed_at).toLocaleString() : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Per-Agent Results */}
      <RefreshableSection title={`Results (${results.length})`}>
        {results.length === 0 ? (
          <p className="text-sm text-gray-600 py-4 text-center">No results yet.</p>
        ) : (
          <div className="space-y-4">
            {results.map((result) => (
              <div key={result.id} className="bg-white/[0.02] border border-white/5 rounded-lg overflow-hidden">
                {/* Result header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${
                      result.status === "COMPLETED" ? "bg-green-500" :
                      result.status === "FAILED" ? "bg-red-500" :
                      "bg-gray-500"
                    }`} />
                    <span className="text-sm font-mono text-gray-300">
                      Agent: {result.agent_id.slice(0, 12)}…
                    </span>
                  </div>
                  <StatusBadge status={result.status} />
                </div>

                {/* Timing */}
                <div className="flex gap-4 px-4 py-2 border-b border-white/5 bg-white/[0.01]">
                  {result.started_at && (
                    <span className="text-xs text-gray-600">
                      Started: {new Date(result.started_at).toLocaleString()}
                    </span>
                  )}
                  {result.completed_at && (
                    <span className="text-xs text-gray-600">
                      Completed: {new Date(result.completed_at).toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Result data */}
                {result.result_json && (
                  <pre className="text-xs text-gray-300 font-mono p-4 overflow-x-auto max-h-96 bg-[#0d0d0d] border-t border-white/5 leading-relaxed">
                    {formatJson(result.result_json)}
                  </pre>
                )}

                {/* Error */}
                {result.error && (
                  <div className="px-4 py-3 bg-red-500/5 border-t border-red-500/10">
                    <p className="text-xs text-red-400 font-mono">{result.error}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </RefreshableSection>
    </>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatJson(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}
