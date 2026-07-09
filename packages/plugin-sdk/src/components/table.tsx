/**
 * ─── UI Components: Table ────────────────────────────────────────────────────
 */

import type { ReactNode } from "react";

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
}

export function Table<T extends Record<string, any>>({
  columns,
  data,
  keyExtractor,
  emptyMessage = "No data available.",
}: TableProps<T>) {
  return (
    <div className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/10">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${col.className ?? ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-gray-600 text-sm">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr key={keyExtractor(item)} className="hover:bg-white/[0.02] transition-colors duration-150">
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 text-sm ${col.className ?? "text-gray-200"}`}>
                    {col.render ? col.render(item) : item[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
