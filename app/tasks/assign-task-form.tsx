"use client";

import { useState, useEffect } from "react";
import { assignTask, getJobsList, getAgentsList } from "@/lib/manager-client";
import type { Job, Agent } from "@/lib/manager-types";

export function AssignTaskForm() {
  const [open, setOpen] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedJob, setSelectedJob] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setFetching(true);
      Promise.all([
        getJobsList().catch(() => []),
        getAgentsList().catch(() => []),
      ]).then(([jobsList, agentsList]) => {
        setJobs(jobsList);
        setAgents(agentsList);
        setFetching(false);
      });
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob || !selectedAgent) return;
    setLoading(true);
    setError(null);
    try {
      await assignTask({
        job_id: selectedJob,
        agent_id: selectedAgent,
      });
      setSelectedJob("");
      setSelectedAgent("");
      setOpen(false);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign task");
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
        + Assign Task
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 pb-8 px-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-lg bg-[#111111] border border-white/10 rounded-xl shadow-2xl p-6 overflow-y-auto" style={{ maxHeight: "calc(100vh - 10rem)" }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-200">Assign Task</h2>
              <button type="button" onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-300 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {fetching ? (
              <div className="text-center py-8 text-sm text-gray-500">Loading...</div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Job</label>
                  <select
                    value={selectedJob}
                    onChange={(e) => setSelectedJob(e.target.value)}
                    required
                    className="w-full bg-[#0d0d0d] border border-white/10 rounded-md px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200"
                  >
                    <option value="">Select a job...</option>
                    {jobs.map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.name} ({job.type})
                      </option>
                    ))}
                  </select>
                  {jobs.length === 0 && (
                    <p className="text-xs text-gray-600 mt-1">No jobs available. Create one first.</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Target Agent</label>
                  <select
                    value={selectedAgent}
                    onChange={(e) => setSelectedAgent(e.target.value)}
                    required
                    className="w-full bg-[#0d0d0d] border border-white/10 rounded-md px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200"
                  >
                    <option value="">Select an agent...</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.device_id} ({agent.state}) — {agent.address}
                      </option>
                    ))}
                  </select>
                  {agents.length === 0 && (
                    <p className="text-xs text-gray-600 mt-1">No agents registered.</p>
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
                    type="submit"
                    disabled={loading || !selectedJob || !selectedAgent}
                    className="bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 text-white font-medium px-4 py-2 rounded-md text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Assigning..." : "Assign"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
