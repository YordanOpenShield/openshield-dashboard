"use client";

import { useState } from "react";
import { executeTool } from "@/lib/manager-client";

interface Props {
  agentId: string;
  toolName: string;
  actionName: string;
  opts?: string[];
}

export function ExecuteToolButton({ agentId, toolName, actionName, opts }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedOpt, setSelectedOpt] = useState(opts?.[0] ?? "");

  const handleExecute = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await executeTool({
        agent_id: agentId,
        tool_name: toolName,
        tool_action: actionName,
        tool_options: opts && selectedOpt ? [selectedOpt] : [],
      });
      setResult(res.status);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Execution failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {opts && opts.length > 0 && (
        <select
          value={selectedOpt}
          onChange={(e) => setSelectedOpt(e.target.value)}
          className="text-xs bg-[#0d0d0d] border border-white/10 rounded px-1.5 py-0.5 text-gray-400 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
        >
          {opts.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      )}
      <button
        onClick={handleExecute}
        disabled={loading}
        className="text-xs font-medium px-2 py-1 rounded bg-violet-500/10 border border-violet-500/30 text-violet-400 hover:bg-violet-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "..." : "Run"}
      </button>
      {result && <span className="text-xs text-green-500">{result}</span>}
      {error && <span className="text-xs text-red-500" title={error}>Error</span>}
    </div>
  );
}
