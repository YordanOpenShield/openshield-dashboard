import { notFound } from "next/navigation";
import Link from "next/link";
import { getQueryDetails, getQueryExecutionsList } from "@/lib/manager-client";
import { RunQueryButton } from "./run-query-button";
import { DeleteQueryButton } from "./delete-query-button";
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

// ─── Query Detail Page ───────────────────────────────────────────────────────

export default async function QueryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [query, allExecutions] = await Promise.all([
    getQueryDetails(id).catch(() => null),
    getQueryExecutionsList().catch(() => []),
  ]);

  if (!query) notFound();

  const executions = allExecutions
    .filter((e) => e.query_id === id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <>
      {/* Back link */}
      <Link
        href="/queries"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to Queries
      </Link>

      {/* Query Header */}
      <div className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-100">{query.name}</h1>
              {query.platform && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-white/5 border-white/10 text-gray-400">
                  {query.platform}
                </span>
              )}
            </div>
            {query.description && (
              <p className="text-sm text-gray-500 mt-1">{query.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <RunQueryButton queryId={query.id} />
            <DeleteQueryButton queryId={query.id} />
          </div>
        </div>

        {/* SQL Display */}
        <div className="mt-4">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">SQL</label>
          <pre className="text-sm text-gray-200 font-mono bg-[#0d0d0d] border border-white/10 rounded-lg p-4 overflow-x-auto leading-relaxed whitespace-pre-wrap break-all">
            {query.sql}
          </pre>
        </div>
      </div>

      {/* Execution History */}
      <RefreshableSection title={`Execution History (${executions.length})`}>
        {executions.length === 0 ? (
          <p className="text-sm text-gray-600 py-4 text-center">No executions yet. Click &quot;Run&quot; to execute this query against agents.</p>
        ) : (
          <div className="space-y-2">
            {executions.map((exec) => (
              <Link
                key={exec.id}
                href={`/queries/${query.id}/executions/${exec.id}`}
                className="flex items-center justify-between py-3 px-4 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/5 hover:border-white/10 transition-all duration-200 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    exec.status === "COMPLETED" ? "bg-green-500" :
                    exec.status === "FAILED" ? "bg-red-500" :
                    exec.status === "RUNNING" ? "bg-blue-500" :
                    exec.status === "CANCELLED" ? "bg-amber-500" :
                    "bg-gray-500"
                  }`} />
                  <span className="text-sm text-gray-300 font-mono text-xs">
                    {exec.id.slice(0, 8)}…
                  </span>
                  <span className="text-xs text-gray-600">
                    {new Date(exec.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={exec.status} />
                  <svg className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </RefreshableSection>
    </>
  );
}
