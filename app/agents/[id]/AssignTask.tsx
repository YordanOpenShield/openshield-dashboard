"use client";
import { useState } from "react";

export default function AssignTask({ agentId, jobs }: { agentId: string; jobs: { id: string; name: string }[] }) {
  const [jobId, setJobId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/agents/${agentId}/tasks/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: jobId }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Task assigned successfully!");
      } else {
        setMessage(data.error || "Failed to assign task.");
      }
    } catch {
      setMessage("Server error.");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleAssign} className="mb-8 flex items-end gap-4">
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="job">
          Assign Job
        </label>
        <select
          id="job"
          className="border rounded px-3 py-2"
          value={jobId}
          onChange={e => setJobId(e.target.value)}
          required
        >
          <option value="">Select a job...</option>
          {jobs.map(job => (
            <option key={job.id} value={job.id}>
              {job.name}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        disabled={loading || !jobId}
      >
        {loading ? "Assigning..." : "Assign"}
      </button>
      {message && (
        <span className="ml-4 text-sm">{message}</span>
      )}
    </form>
  );
}