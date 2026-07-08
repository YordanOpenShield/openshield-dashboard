import Link from "next/link";
import { getGroupsList } from "@/lib/manager-client";
import { CreateGroupForm } from "./create-group-form";

// ─── Groups Page ─────────────────────────────────────────────────────────────

export default async function GroupsPage() {
  const groups = await getGroupsList().catch(() => []);

  return (
    <>
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Agent Groups</h1>
          <p className="text-gray-400 mt-1">
            {groups.length} group{groups.length !== 1 ? "s" : ""}
          </p>
        </div>
        <CreateGroupForm />
      </div>

      {/* Group List */}
      {groups.length === 0 ? (
        <div className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-lg p-12 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-300 mb-2">No Groups</h2>
          <p className="text-sm text-gray-600 max-w-sm mx-auto">
            Create groups to organize agents for targeted job execution and querying.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {groups.map((group) => (
            <Link
              key={group.id}
              href={`/groups/${group.id}`}
              className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-lg p-5 hover:border-white/20 transition-all duration-200 group"
            >
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-200 group-hover:text-white transition-colors">
                      {group.name}
                    </h3>
                    {group.is_dynamic && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-blue-500/10 border-blue-500/30 text-blue-400">
                        Dynamic
                      </span>
                    )}
                  </div>
                  {group.description && (
                    <p className="text-sm text-gray-500 mt-1">{group.description}</p>
                  )}
                  {group.tags && group.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {group.tags.map((tag) => (
                        <span key={tag} className="text-xs text-gray-600 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <svg className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors shrink-0 mt-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
