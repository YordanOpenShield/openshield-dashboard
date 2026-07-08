import Link from "next/link";
import { getQueriesList } from "@/lib/manager-client";
import { CreateQueryForm } from "./create-query-form";

// ─── Queries Page ────────────────────────────────────────────────────────────

export default async function QueriesPage() {
  const queries = await getQueriesList().catch(() => []);

  return (
    <>
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Queries</h1>
          <p className="text-gray-400 mt-1">
            {queries.length} quer{queries.length !== 1 ? "ies" : "y"} defined
          </p>
        </div>
        <CreateQueryForm />
      </div>

      {/* Query List */}
      {queries.length === 0 ? (
        <div className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-lg p-12 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-300 mb-2">No Queries</h2>
          <p className="text-sm text-gray-600 max-w-sm mx-auto">
            Create SQL queries to run against agents. Queries use a FleetDM-compatible schema for system information.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {queries.map((query) => (
            <Link
              key={query.id}
              href={`/queries/${query.id}`}
              className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-lg p-5 hover:border-white/20 transition-all duration-200 group"
            >
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-200 group-hover:text-white transition-colors">
                      {query.name}
                    </h3>
                    {query.platform && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-white/5 border-white/10 text-gray-400">
                        {query.platform}
                      </span>
                    )}
                  </div>
                  {query.description && (
                    <p className="text-sm text-gray-500 mt-1">{query.description}</p>
                  )}
                  <pre className="text-xs text-gray-400 font-mono mt-2 bg-[#0d0d0d] border border-white/5 rounded-md p-2.5 overflow-x-auto leading-relaxed">
                    {query.sql}
                  </pre>
                </div>
                <div className="flex items-center gap-2 shrink-0 mt-2">
                  <svg className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
