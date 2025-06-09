"use client";
import { useState } from "react";

function ResultModal({ result, onClose }: { result: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-gray-900 rounded-lg shadow-lg max-w-lg w-full p-6 relative">
        <button
          className="absolute top-2 right-3 text-gray-400 hover:text-white text-xl"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <h3 className="text-lg font-semibold text-white mb-4">Task Result</h3>
        <pre className="bg-black text-green-400 rounded p-4 overflow-x-auto text-sm max-h-96 whitespace-pre-wrap">
          {result}
        </pre>
      </div>
    </div>
  );
}

export default function TasksTable({ tasks, jobNames }: { tasks: any[]; jobNames: Record<string, string> }) {
  const [modalResult, setModalResult] = useState<string | null>(null);

  return (
    <>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Job</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Updated</th>
            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Result</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {tasks.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-4 text-center text-gray-400 italic">
                No tasks found for this agent.
              </td>
            </tr>
          ) : (
            tasks.map((task: any) => (
              <tr key={task.id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-2 font-mono">{jobNames[task.job_id] || task.job_id}</td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                      task.status === "COMPLETED"
                        ? "bg-green-100 text-green-800"
                        : task.status === "FAILED"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {task.status}
                  </span>
                </td>
                <td className="px-4 py-2">{task.created_at ? new Date(task.created_at).toLocaleString() : "-"}</td>
                <td className="px-4 py-2">{task.updated_at ? new Date(task.updated_at).toLocaleString() : "-"}</td>
                <td className="px-4 py-2 text-center">
                  <button
                    className="text-blue-600 hover:text-blue-900"
                    title="View Result"
                    onClick={() => setModalResult(task.result || "No result")}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="inline w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {modalResult !== null && (
        <ResultModal result={modalResult} onClose={() => setModalResult(null)} />
      )}
    </>
  );
}