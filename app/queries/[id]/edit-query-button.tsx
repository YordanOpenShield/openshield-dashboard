"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { SqlEditor } from "@/components/sql-editor";
import { updateQuery } from "@/lib/manager-client";
import type { Query } from "@/lib/manager-types";

interface Props {
  query: Query;
}

export function EditQueryButton({ query }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const bodyRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
    bodyRef.current = document.body;
  }, []);

  const [name, setName] = useState(query.name);
  const [description, setDescription] = useState(query.description ?? "");
  const [sql, setSql] = useState(query.sql);
  const [platform, setPlatform] = useState(query.platform);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await updateQuery(query.id, {
        name,
        description: description || undefined,
        sql,
        platform: platform || undefined,
      });
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update query");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => {
          // Reset form to current values when opening
          setName(query.name);
          setDescription(query.description ?? "");
          setSql(query.sql);
          setPlatform(query.platform);
          setOpen(true);
        }}
        className="bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white font-medium px-4 py-2 rounded-md text-sm transition-all duration-200"
      >
        Edit
      </button>

      {open && mounted && bodyRef.current && createPortal(
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 pb-8 px-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="relative z-10 w-full max-w-2xl bg-[#111111] border border-white/10 rounded-xl shadow-2xl p-6 overflow-y-auto" style={{ maxHeight: "calc(100vh - 10rem)" }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-200">Edit Query</h2>
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
                />
              </div>

              <div>
                <SqlEditor value={sql} onChange={setSql} />
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
                  {loading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        bodyRef.current
      )}
    </>
  );
}
