"use client";

import { useState } from "react";
import { addAgentsToGroup, removeAgentsFromGroup } from "@/lib/manager-client";
import type { Agent } from "@/lib/manager-types";

interface Props {
  groupId: string;
  allAgents: Agent[];
  memberAgentIds: string[];
}

export function ManageGroupAgents({ groupId, allAgents, memberAgentIds }: Props) {
  const [selectedAdd, setSelectedAdd] = useState<string[]>([]);
  const [selectedRemove, setSelectedRemove] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const memberSet = new Set(memberAgentIds);
  const nonMemberAgents = allAgents.filter((a) => !memberSet.has(a.id));
  const memberAgents = allAgents.filter((a) => memberSet.has(a.id));

  const handleAdd = async () => {
    if (selectedAdd.length === 0) return;
    setAdding(true);
    setError(null);
    try {
      await addAgentsToGroup(groupId, selectedAdd);
      setSelectedAdd([]);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add agents");
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async () => {
    if (selectedRemove.length === 0) return;
    setRemoving(true);
    setError(null);
    try {
      await removeAgentsFromGroup(groupId, selectedRemove);
      setSelectedRemove([]);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove agents");
    } finally {
      setRemoving(false);
    }
  };

  const toggleAdd = (id: string) => {
    setSelectedAdd((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const toggleRemove = (id: string) => {
    setSelectedRemove((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  return (
    <>
      {error && (
        <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add Agents */}
        <div className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-lg p-5">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Add Agents ({nonMemberAgents.length} available)</h2>
          {nonMemberAgents.length === 0 ? (
            <p className="text-sm text-gray-600">No agents available to add</p>
          ) : (
            <>
              <div className="max-h-64 overflow-y-auto space-y-1 mb-4 border border-white/10 rounded-lg p-2">
                {nonMemberAgents.map((agent) => (
                  <label
                    key={agent.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/[0.02] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAdd.includes(agent.id)}
                      onChange={() => toggleAdd(agent.id)}
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
              <button
                onClick={handleAdd}
                disabled={adding || selectedAdd.length === 0}
                className="w-full bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 text-white font-medium px-4 py-2 rounded-md text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {adding ? "Adding..." : `Add ${selectedAdd.length > 0 ? `(${selectedAdd.length})` : "Agents"}`}
              </button>
            </>
          )}
        </div>

        {/* Remove Agents */}
        <div className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-lg p-5">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Remove Agents ({memberAgents.length} members)</h2>
          {memberAgents.length === 0 ? (
            <p className="text-sm text-gray-600">No agents in this group yet</p>
          ) : (
            <>
              <div className="max-h-64 overflow-y-auto space-y-1 mb-4 border border-white/10 rounded-lg p-2">
                {memberAgents.map((agent) => (
                  <label
                    key={agent.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-white/[0.02] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRemove.includes(agent.id)}
                      onChange={() => toggleRemove(agent.id)}
                      className="w-4 h-4 rounded border-white/20 bg-[#0d0d0d] text-red-400 focus:ring-red-500/50 focus:ring-2"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-300 truncate">{agent.device_id}</p>
                      <p className="text-xs text-gray-600 font-mono">{agent.address}</p>
                    </div>
                  </label>
                ))}
              </div>
              <button
                onClick={handleRemove}
                disabled={removing || selectedRemove.length === 0}
                className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-medium px-4 py-2 rounded-md text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {removing ? "Removing..." : `Remove ${selectedRemove.length > 0 ? `(${selectedRemove.length})` : "Agents"}`}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
