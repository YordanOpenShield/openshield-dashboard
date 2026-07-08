import Link from "next/link";
import { getAgentsList } from "@/lib/manager-client";

// ─── Status Badge ────────────────────────────────────────────────────────────

function StatusBadge({ state }: { state: string }) {
  const isConnected = state === "CONNECTED";
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
        isConnected
          ? "bg-green-500/10 border-green-500/30 text-green-400"
          : "bg-gray-500/10 border-gray-500/30 text-gray-400"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isConnected ? "bg-green-500" : "bg-gray-500"
        }`}
      />
      {state}
    </span>
  );
}

// ─── Agents Page ─────────────────────────────────────────────────────────────

export default async function AgentsPage() {
  const agents = await getAgentsList().catch(() => []);

  return (
    <>
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Agents</h1>
          <p className="text-gray-400 mt-1">
            {agents.length} agent{agents.length !== 1 ? "s" : ""} registered
            &middot; {agents.filter((a) => a.state === "CONNECTED").length} connected
          </p>
        </div>
      </div>

      {/* Agent List */}
      {agents.length === 0 ? (
        <div className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-lg p-12 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-300 mb-2">No Agents</h2>
          <p className="text-sm text-gray-600 max-w-sm mx-auto">
            No agents have registered with the manager yet. Agents will appear here once they connect.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {agents.map((agent) => (
            <Link
              key={agent.id}
              href={`/agents/${agent.id}`}
              className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-lg p-5 hover:border-white/20 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    agent.state === "CONNECTED"
                      ? "bg-green-500/10 border border-green-500/30"
                      : "bg-gray-500/10 border border-gray-500/30"
                  }`}>
                    <svg className={`w-5 h-5 ${
                      agent.state === "CONNECTED" ? "text-green-400" : "text-gray-500"
                    }`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
                    </svg>
                  </div>
                  {/* Info */}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-200 truncate group-hover:text-white transition-colors">
                      {agent.device_id}
                    </p>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">
                      {agent.id.slice(0, 8)}…{agent.id.slice(-6)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-xs text-gray-500 font-mono hidden sm:inline">
                    {agent.address}
                  </span>
                  <StatusBadge state={agent.state} />
                  <span className="text-xs text-gray-600 hidden md:inline">
                    {formatLastSeen(agent.last_seen)}
                  </span>
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatLastSeen(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
