import { getQueriesList } from "@/lib/manager-client";
import { CreateQueryForm } from "./create-query-form";
import { QueryList } from "./query-list";

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
            {queries.length} {queries.length !== 1 ? "queries" : "query"} defined
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
        <QueryList queries={queries} />
      )}
    </>
  );
}
