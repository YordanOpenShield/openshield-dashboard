"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { runQuery, getAgentsList } from "@/lib/manager-client";
import type { Agent } from "@/lib/manager-types";

interface Props {
  queryId: string;
}

export function RunQueryButton({ queryId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      getAgentsList()
        .then((list) => setAgents(list))
        .catch(() => {});
    }
  }, [open]);

  const toggleAgent = (id: string) => {
    setSelectedAgents((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handleRun = async () => {
    if (selectedAgents.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await runQuery({
        query_id: queryId,
        agent_ids: selectedAgents,
      }) as any;
      setOpen(false);
      setSelectedAgents([]);

      // The API returns { execution_id, status, agent_count } — fetch
      // the full execution details to get both the query_id and execution id.
      const execId: string = res.execution_id;
      if (execId) {
        // Wait a moment for the DB write, then redirect to the execution page
        setTimeout(async () => {
          try {
            const detail = await (await fetch(`/api/query-executions/${execId}`)).json();
            const qid = detail?.execution?.query_id;
            if (qid) {
              router.push(`/queries/${qid}/executions/${execId}`);
              return;
            }
          } catch {}
          // Fallback: stay on current page and refresh
          router.refresh();
        }, 1200);
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run query");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 text-white font-medium px-4 py-2 rounded-md text-sm transition-all duration-200"
      >
        Run
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 pb-8 px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-lg bg-[#111111] border border-white/10 rounded-xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-200">Run Query</h2>
              <button type="button" onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-300 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Agent selection */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Target Agents ({selectedAgents.length} selected)
                </label>
                {agents.length === 0 ? (
                  <p className="text-sm text-gray-600">No agents available</p>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-1 border border-white/10 rounded-lg p-2">
                    {agents.map((agent) => (
                      <label
                        key={agent.id}
                        className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/[0.02] cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedAgents.includes(agent.id)}
                          onChange={() => toggleAgent(agent.id)}
                          className="w-4 h-4 rounded border-white/20 bg-[#0d0d0d] text-violet-500 focus:ring-violet-500/50 focus:ring-2"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-gray-300 truncate">{agent.device_id}</p>
                          <p className="text-xs text-gray-600 font-mono">{agent.address}</p>
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          agent.state === "CONNECTED"
                            ? "bg-green-500/10 text-green-400"
                            : "bg-gray-500/10 text-gray-400"
                        }`}>
                          {agent.state}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {error && (
                <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white px-4 py-2 rounded-md text-sm transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRun}
                  disabled={loading || selectedAgents.length === 0}
                  className="bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 text-white font-medium px-4 py-2 rounded-md text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Running..." : "Run"}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
