import { getTasksList } from "@/lib/manager-client";
import { AssignTaskForm } from "./assign-task-form";

// ─── Status Badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING: "bg-gray-500/10 border-gray-500/30 text-gray-400",
    RUNNING: "bg-blue-500/10 border-blue-500/30 text-blue-400",
    COMPLETED: "bg-green-500/10 border-green-500/30 text-green-400",
    FAILED: "bg-red-500/10 border-red-500/30 text-red-400",
  };
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${colors[status] ?? colors.PENDING}`}>
      {status}
    </span>
  );
}

// ─── Tasks Page ──────────────────────────────────────────────────────────────

export default async function TasksPage() {
  const tasks = await getTasksList().catch(() => []);

  // Sort by most recent first
  const sorted = [...tasks].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <>
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Tasks</h1>
          <p className="text-gray-400 mt-1">
            {tasks.length} task{tasks.length !== 1 ? "s" : ""}
            &middot; {tasks.filter((t) => t.status === "PENDING").length} pending
            &middot; {tasks.filter((t) => t.status === "RUNNING").length} running
            &middot; {tasks.filter((t) => t.status === "FAILED").length} failed
          </p>
        </div>
        <AssignTaskForm />
      </div>

      {/* Task List */}
      {sorted.length === 0 ? (
        <div className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-lg p-12 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-300 mb-2">No Tasks</h2>
          <p className="text-sm text-gray-600 max-w-sm mx-auto">
            Assign a job to an agent to create a task. Tasks track execution status and results.
          </p>
        </div>
      ) : (
        <div className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">ID</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Job</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Agent</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Status</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sorted.map((task) => (
                <tr key={task.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3 text-sm font-mono text-gray-400">
                    {task.id.slice(0, 8)}…
                  </td>
                  <td className="px-5 py-3 text-sm font-mono text-gray-400">
                    {task.job_id.slice(0, 8)}…
                  </td>
                  <td className="px-5 py-3 text-sm font-mono text-gray-400">
                    {task.agent_id.slice(0, 8)}…
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={task.status} />
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500">
                    {new Date(task.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Result details for completed/failed tasks */}
      {sorted.filter((t) => t.result).length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Task Results</h2>
          <div className="space-y-3">
            {sorted.filter((t) => t.result).map((task) => (
              <details key={task.id} className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-lg">
                <summary className="px-5 py-3 cursor-pointer text-sm text-gray-300 hover:text-white transition-colors">
                  Task {task.id.slice(0, 8)}… — <StatusBadge status={task.status} />
                </summary>
                <pre className="px-5 pb-4 text-sm text-gray-400 font-mono whitespace-pre-wrap overflow-x-auto max-h-96">
                  {task.result}
                </pre>
              </details>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
