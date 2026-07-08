"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { createQuery } from "@/lib/manager-client";

export function CreateQueryForm() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sql, setSql] = useState("");
  const [platform, setPlatform] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createQuery({
        name,
        description: description || undefined,
        sql,
        platform: platform || undefined,
      });
      setName("");
      setDescription("");
      setSql("");
      setPlatform("");
      setOpen(false);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create query");
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
        + Create Query
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 pb-8 px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-2xl bg-[#111111] border border-white/10 rounded-xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-200">Create Query</h2>
              <button type="button" onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-300 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-[#0d0d0d] border border-white/10 rounded-md px-3 py-2 text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200"
                  placeholder="e.g., List Running Processes"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">SQL</label>
                <textarea
                  value={sql}
                  onChange={(e) => setSql(e.target.value)}
                  required
                  rows={5}
                  className="w-full bg-[#0d0d0d] border border-white/10 rounded-md px-3 py-2 text-gray-200 font-mono text-sm placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200 resize-none"
                  placeholder="SELECT * FROM processes"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Platform (optional)</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full bg-[#0d0d0d] border border-white/10 rounded-md px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200"
                >
                  <option value="">All platforms</option>
                  <option value="linux">Linux</option>
                  <option value="windows">Windows</option>
                  <option value="darwin">macOS</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Description (optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-[#0d0d0d] border border-white/10 rounded-md px-3 py-2 text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200 resize-none"
                  placeholder="What does this query do?"
                />
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
                  disabled={loading}
                  className="bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 text-white font-medium px-4 py-2 rounded-md text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
