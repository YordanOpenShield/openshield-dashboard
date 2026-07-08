"use client";

import { useState } from "react";
import { deleteQuery } from "@/lib/manager-client";
import { useRouter } from "next/navigation";

interface Props {
  queryId: string;
}

export function DeleteQueryButton({ queryId }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      await deleteQuery(queryId);
      router.push("/queries");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete query");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setConfirming(true)}
        className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-medium px-4 py-2 rounded-md text-sm transition-all duration-200"
      >
        Delete
      </button>

      {confirming && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 pb-8 px-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setConfirming(false)} />
          <div className="relative z-10 w-full max-w-md bg-[#111111] border border-white/10 rounded-xl shadow-2xl p-6 overflow-y-auto" style={{ maxHeight: "calc(100vh - 10rem)" }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-200">Delete Query</h2>
              <button type="button" onClick={() => setConfirming(false)} className="text-gray-500 hover:text-gray-300 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete this query? This action cannot be undone. All execution history will also be removed.
            </p>

            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2 mb-4">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white px-4 py-2 rounded-md text-sm transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-2 rounded-md text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
