import { notFound } from "next/navigation";
import Link from "next/link";
import { getAgentDetails, getAgentTasks, getAgentTools } from "@/lib/manager-client";
import { ExecuteToolButton } from "./execute-tool-button";
import { ActionHookToolbar } from "@/components/action-hooks";

// ─── Agent Detail Page ───────────────────────────────────────────────────────

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [details, tasks, tools] = await Promise.all([
    getAgentDetails(id).catch(() => null),
    getAgentTasks(id).catch(() => []),
    getAgentTools(id).catch(() => []),
  ]);

  if (!details) notFound();

  const { agent, addresses, services } = details;

  return (
    <>
      {/* Back link */}
      <Link
        href="/agents"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to Agents
      </Link>

      {/* Agent Header */}
      <div className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
              agent.state === "CONNECTED"
                ? "bg-green-500/10 border border-green-500/30"
                : "bg-gray-500/10 border border-gray-500/30"
            }`}>
              <svg className={`w-7 h-7 ${
                agent.state === "CONNECTED" ? "text-green-400" : "text-gray-500"
              }`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-100">{agent.device_id}</h1>
              <p className="text-sm text-gray-500 font-mono mt-1">{agent.id}</p>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full border ${
            agent.state === "CONNECTED"
              ? "bg-green-500/10 border-green-500/30 text-green-400"
              : "bg-gray-500/10 border-gray-500/30 text-gray-400"
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              agent.state === "CONNECTED" ? "bg-green-500" : "bg-gray-500"
            }`} />
            {agent.state}
          </span>
        </div>
      </div>

      {/* Plugin Action Hooks */}
      <div className="mb-6 flex flex-wrap gap-2">
        <ActionHookToolbar location="agent-detail-toolbar" contextParams={{ agentId: id }} />
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Agent Details */}
        <div className="lg:col-span-2 bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-lg p-5">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Details</h2>
          <div className="space-y-3">
            {[
              { label: "Device ID", value: agent.device_id },
              { label: "Primary Address", value: agent.address },
              { label: "Last Seen", value: new Date(agent.last_seen).toLocaleString() },
              { label: "Token", value: agent.token.slice(0, 8) + "…" },
            ].map((f) => (
              <div key={f.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-b-0">
                <span className="text-sm text-gray-500">{f.label}</span>
                <span className="text-sm text-gray-200 font-mono">{f.value}</span>
              </div>
            ))}
          </div>

          {/* Addresses */}
          {addresses.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">All Addresses</h3>
              <div className="flex flex-wrap gap-2">
                {addresses.map((addr, i) => (
                  <span key={i} className="text-xs font-mono px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-gray-400">
                    {addr.address}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Services */}
        <div className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-lg p-5">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
            Services ({services.length})
          </h2>
          {services.length === 0 ? (
            <p className="text-sm text-gray-600">No services reported</p>
          ) : (
            <div className="space-y-2">
              {services.map((svc) => (
                <div key={svc.name} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/[0.02] border border-white/5">
                  <span className="text-sm text-gray-300">{svc.name}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    svc.state === "running" ? "bg-green-500/10 text-green-400" : "bg-gray-500/10 text-gray-400"
                  }`}>{svc.state}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tools Section */}
      <div className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-lg p-5 mb-6">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
          Available Tools ({tools.length})
        </h2>
        {tools.length === 0 ? (
          <p className="text-sm text-gray-600 py-4 text-center">No tools available for this agent</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool) => (
              <div key={tool.name} className="bg-white/[0.02] border border-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-violet-500" />
                  <h3 className="text-sm font-medium text-gray-200">{tool.name}</h3>
                </div>
                <div className="space-y-1.5">
                  {tool.actions.map((action) => (
                    <div key={action.name} className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">{action.name}</span>
                      <ExecuteToolButton
                        agentId={agent.id}
                        toolName={tool.name}
                        actionName={action.name}
                        opts={action.opts ?? undefined}
                      />
                    </div>
                  ))}
                </div>
                {tool.os && tool.os.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-white/5">
                    {tool.os.map((os) => (
                      <span key={os} className="text-xs text-gray-600 px-1.5 py-0.5 rounded bg-white/5">{os}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tasks Section */}
      <div className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-lg p-5">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
          Tasks ({tasks.length})
        </h2>
        {tasks.length === 0 ? (
          <p className="text-sm text-gray-600 py-4 text-center">No tasks assigned to this agent</p>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    task.status === "COMPLETED" ? "bg-green-500" :
                    task.status === "FAILED" ? "bg-red-500" :
                    task.status === "RUNNING" ? "bg-blue-500" : "bg-gray-500"
                  }`} />
                  <span className="text-sm text-gray-300 font-mono text-xs">{task.id.slice(0, 8)}…</span>
                  <span className="text-xs text-gray-600">job: {task.job_id.slice(0, 8)}…</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    task.status === "COMPLETED" ? "bg-green-500/10 text-green-400" :
                    task.status === "FAILED" ? "bg-red-500/10 text-red-400" :
                    task.status === "RUNNING" ? "bg-blue-500/10 text-blue-400" :
                    "bg-gray-500/10 text-gray-400"
                  }`}>{task.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
