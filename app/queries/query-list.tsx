"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { deleteQuery } from "@/lib/manager-client";
import type { Query } from "@/lib/manager-types";

interface Props {
  queries: Query[];
}

export function QueryList({ queries }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === queries.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(queries.map((q) => q.id)));
    }
  };

  const handleBulkDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      const ids = [...selected];
      for (const id of ids) {
        await deleteQuery(id);
      }
      setSelected(new Set());
      setConfirming(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete queries");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="mb-4 flex items-center justify-between bg-[#111111]/80 backdrop-blur-md border border-violet-500/30 rounded-lg px-4 py-3">
          <span className="text-sm text-gray-300">
            {selected.size} {selected.size !== 1 ? "queries" : "query"} selected
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelected(new Set())}
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              Clear
            </button>
            <button
              onClick={() => setConfirming(true)}
              className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-medium px-3 py-1.5 rounded-md text-sm transition-all duration-200"
            >
              Delete Selected ({selected.size})
            </button>
          </div>
        </div>
      )}

      {/* Select all toggle */}
      {queries.length > 0 && (
        <label className="flex items-center gap-2 px-1 mb-3 cursor-pointer">
          <input
            type="checkbox"
            checked={selected.size === queries.length && queries.length > 0}
            onChange={toggleAll}
            className="w-4 h-4 rounded border-white/20 bg-[#0d0d0d] text-violet-500 focus:ring-violet-500/50 focus:ring-2"
          />
          <span className="text-xs text-gray-500">
            {selected.size === queries.length ? "Deselect all" : "Select all"}
          </span>
        </label>
      )}

      {/* Query cards */}
      <div className="grid gap-4">
        {queries.map((query) => {
          const isSelected = selected.has(query.id);
          return (
            <div
              key={query.id}
              className={`group flex items-start gap-3 bg-[#111111]/80 backdrop-blur-md border rounded-lg p-5 transition-all duration-200 ${
                isSelected
                  ? "border-violet-500/40 bg-violet-500/5"
                  : "border-white/10 hover:border-white/20"
              }`}
            >
              {/* Checkbox */}
              <div className="pt-1 shrink-0">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggle(query.id)}
                  className="w-4 h-4 rounded border-white/20 bg-[#0d0d0d] text-violet-500 focus:ring-violet-500/50 focus:ring-2"
                />
              </div>

              {/* Link wraps the content */}
              <Link href={`/queries/${query.id}`} className="min-w-0 flex-1 flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className={`text-lg font-semibold transition-colors ${
                      isSelected ? "text-violet-300" : "text-gray-200 group-hover:text-white"
                    }`}>
                      {query.name}
                    </h3>
                    {query.platform && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full border bg-white/5 border-white/10 text-gray-400">
                        {query.platform}
                      </span>
                    )}
                  </div>
                  {query.description && (
                    <p className="text-sm text-gray-500 mt-1">{query.description}</p>
                  )}
                  <pre className="text-xs text-gray-400 font-mono mt-2 bg-[#0d0d0d] border border-white/5 rounded-md p-2.5 overflow-x-auto leading-relaxed">
                    {query.sql}
                  </pre>
                </div>
                <svg className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors shrink-0 mt-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            </div>
          );
        })}
      </div>

      {/* Confirmation modal */}
      {confirming && createPortal(
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 pb-8 px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirming(false)} />
          <div className="relative z-10 w-full max-w-md bg-[#111111] border border-white/10 rounded-xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-200">Delete Queries</h2>
              <button type="button" onClick={() => setConfirming(false)} className="text-gray-500 hover:text-gray-300 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete {selected.size} {selected.size !== 1 ? "queries" : "query"}? This action cannot be undone. All execution history will also be removed.
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
                onClick={handleBulkDelete}
                disabled={deleting}
                className="bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-2 rounded-md text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? "Deleting..." : `Delete ${selected.size}`}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
