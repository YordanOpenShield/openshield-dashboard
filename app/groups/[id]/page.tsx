import { notFound } from "next/navigation";
import Link from "next/link";
import { getGroupDetails, getAgentsList } from "@/lib/manager-client";
import { ManageGroupAgents } from "./manage-group-agents";

// ─── Group Detail Page ───────────────────────────────────────────────────────

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [data, agents] = await Promise.all([
    getGroupDetails(id).catch(() => null),
    getAgentsList().catch(() => []),
  ]);

  if (!data) notFound();
  const { group, agent_ids: memberAgentIds } = data;

  return (
    <>
      {/* Back link */}
      <Link
        href="/groups"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to Groups
      </Link>

      {/* Group Header */}
      <div className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-100">{group.name}</h1>
              {group.is_dynamic && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-blue-500/10 border-blue-500/30 text-blue-400">
                  Dynamic
                </span>
              )}
            </div>
            {group.description && (
              <p className="text-sm text-gray-500 mt-1">{group.description}</p>
            )}
          </div>
        </div>

        {/* Tags */}
        {group.tags && group.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {group.tags.map((tag) => (
              <span key={tag} className="text-xs text-gray-400 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Dynamic Criteria Info */}
      {group.is_dynamic && group.criteria && (
        <div className="bg-[#111111]/80 backdrop-blur-md border border-blue-500/20 rounded-lg p-5 mb-6">
          <h2 className="text-sm font-medium text-blue-400 uppercase tracking-wider mb-3">Dynamic Criteria</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {group.criteria.os && (
              <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">OS</p>
                <div className="flex flex-wrap gap-1">
                  {group.criteria.os.map((os) => (
                    <span key={os} className="text-xs text-gray-400 px-2 py-0.5 rounded bg-white/5">{os}</span>
                  ))}
                </div>
              </div>
            )}
            {group.criteria.state && (
              <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">State</p>
                <p className="text-sm text-gray-300">{group.criteria.state.join(", ")}</p>
              </div>
            )}
            {group.criteria.last_seen_within && (
              <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Last Seen Within</p>
                <p className="text-sm text-gray-300">{group.criteria.last_seen_within}s</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Agent Membership Management */}
      <ManageGroupAgents
        groupId={group.id}
        allAgents={agents}
        memberAgentIds={memberAgentIds}
      />

      {/* Group Metadata */}
      <div className="mt-6 bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-lg p-5">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Metadata</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <span className="text-sm text-gray-500">Group ID</span>
            <span className="text-sm text-gray-300 font-mono">{group.id}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <span className="text-sm text-gray-500">Created</span>
            <span className="text-sm text-gray-300">{new Date(group.created_at).toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-500">Updated</span>
            <span className="text-sm text-gray-300">{new Date(group.updated_at).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </>
  );
}
