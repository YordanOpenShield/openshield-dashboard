"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { OSQUERY_SCHEMA, SQL_KEYWORDS, findTable, type OsqueryTable } from "@/lib/osquery-schema";

interface SqlEditorProps {
  value: string;
  onChange: (value: string) => void;
}

/** SQL editor with inline schema reference and autocomplete suggestions */
export function SqlEditor({ value, onChange }: SqlEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showSchema, setShowSchema] = useState(false);
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionIndex, setSuggestionIndex] = useState(-1);
  const [suggestionPos, setSuggestionPos] = useState({ top: 0, left: 0, width: 0 });

  // ─── Autocomplete logic ──────────────────────────────────────────────

  const getWordBeforeCursor = useCallback((): { word: string; start: number } => {
    const ta = textareaRef.current;
    if (!ta) return { word: "", start: 0 };
    const pos = ta.selectionStart;
    const text = value.slice(0, pos);
    const match = text.match(/(\w+)$/);
    return match ? { word: match[1], start: pos - match[1].length } : { word: "", start: 0 };
  }, [value]);

  /** Position the dropdown below the textarea — simple and reliable */
  const positionBelowTextarea = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return { top: 0, left: 0, width: 0 };
    const rect = ta.getBoundingClientRect();
    return { top: rect.bottom + 2, left: rect.left, width: Math.min(rect.width, 480) };
  }, []);

  const updateSuggestions = useCallback(() => {
    const { word } = getWordBeforeCursor();
    if (word.length < 1) {
      setSuggestions([]);
      return;
    }

    const lower = word.toLowerCase();
    const matches: string[] = [];

    // Match table names
    for (const t of OSQUERY_SCHEMA) {
      if (t.name.includes(lower) && !matches.includes(t.name)) matches.push(t.name);
    }

    // Match column names
    const allColumns = new Set<string>();
    for (const t of OSQUERY_SCHEMA) {
      for (const c of t.columns) {
        if (c.name.includes(lower) && !allColumns.has(c.name)) {
          allColumns.add(c.name);
          matches.push(c.name);
        }
      }
    }

    // Match SQL keywords
    for (const kw of SQL_KEYWORDS) {
      if (kw.toLowerCase().includes(lower) && !matches.includes(kw)) matches.push(kw);
    }

    if (matches.length > 0 && matches.length < 30) {
      setSuggestions(matches.slice(0, 12));
      setSuggestionIndex(-1);
      setSuggestionPos(positionBelowTextarea());
    } else {
      setSuggestions([]);
    }
  }, [value, getWordBeforeCursor, positionBelowTextarea]);

  const applySuggestion = useCallback((suggestion: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const { word, start } = getWordBeforeCursor();
    const before = value.slice(0, start);
    const after = value.slice(ta.selectionStart);
    const newValue = before + suggestion + after;
    onChange(newValue);
    setSuggestions([]);
    // Set cursor after the inserted word
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + suggestion.length;
      ta.setSelectionRange(pos, pos);
    });
  }, [value, onChange, getWordBeforeCursor]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSuggestionIndex((i) => (i < suggestions.length - 1 ? i + 1 : 0));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSuggestionIndex((i) => (i > 0 ? i - 1 : suggestions.length - 1));
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        if (suggestionIndex >= 0) {
          e.preventDefault();
          applySuggestion(suggestions[suggestionIndex]);
          return;
        }
      }
      if (e.key === "Escape") {
        setSuggestions([]);
        return;
      }
    }
  };

  // Update suggestions on value change
  useEffect(() => {
    updateSuggestions();
  }, [value, updateSuggestions]);

  // ─── Schema panel ────────────────────────────────────────────────────

  const toggleTable = (name: string) => {
    setExpandedTables((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const insertSelectAll = (tableName: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const snippet = `SELECT * FROM ${tableName}`;
    const pos = ta.selectionStart;
    const before = value.slice(0, pos);
    const after = value.slice(pos);
    onChange(before + snippet + after);
    requestAnimationFrame(() => {
      ta.focus();
      const newPos = pos + snippet.length;
      ta.setSelectionRange(newPos, newPos);
    });
  };

  // ─── Render ──────────────────────────────────────────────────────────

  return (
    <div className="relative">
      {/* SQL Label + Schema Toggle */}
      <div className="flex items-center justify-between mb-1">
        <label className="block text-sm text-gray-400">SQL</label>
        <button
          type="button"
          onClick={() => setShowSchema(!showSchema)}
          className={`text-xs px-2 py-0.5 rounded border transition-all duration-200 ${
            showSchema
              ? "bg-violet-500/10 border-violet-500/30 text-violet-400"
              : "bg-white/5 border-white/10 text-gray-500 hover:text-gray-300"
          }`}
        >
          {showSchema ? "Hide Schema" : "Show Schema"}
        </button>
      </div>

      {/* SQL Textarea */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          required
          rows={6}
          className="w-full bg-[#0d0d0d] border border-white/10 rounded-md px-3 py-2 text-gray-200 font-mono text-sm placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200 resize-none"
          placeholder="SELECT * FROM processes"
          spellCheck={false}
          autoComplete="off"
        />
      </div>

      {/* Autocomplete dropdown */}
      {suggestions.length > 0 && (
        <div
          className="fixed z-[110] bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl py-1 max-h-52 overflow-y-auto"
          style={{ top: suggestionPos.top, left: suggestionPos.left, width: suggestionPos.width }}
        >
          {suggestions.map((s, i) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                applySuggestion(s);
              }}
              className={`block w-full text-left px-3 py-1.5 text-sm font-mono transition-colors ${
                i === suggestionIndex
                  ? "bg-violet-500/20 text-violet-300"
                  : "text-gray-300 hover:bg-white/5"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Schema Reference Panel */}
      {showSchema && (
        <div className="mt-2 bg-[#0d0d0d] border border-white/10 rounded-lg max-h-64 overflow-y-auto">
          <div className="p-2 text-xs text-gray-500 border-b border-white/5">
            Click a table to insert <span className="font-mono text-violet-400">SELECT * FROM &lt;table&gt;</span>
          </div>
          {OSQUERY_SCHEMA.map((table) => (
            <div key={table.name}>
              {/* Table header */}
              <div
                className="flex items-center gap-2 px-3 py-2 hover:bg-white/[0.02] cursor-pointer border-b border-white/5 last:border-b-0"
                onClick={() => toggleTable(table.name)}
              >
                {/* Expand/collapse */}
                <svg
                  className={`w-3 h-3 text-gray-600 transition-transform ${expandedTables.has(table.name) ? "rotate-90" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>

                {/* Table name */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    insertSelectAll(table.name);
                  }}
                  className="text-sm font-mono text-violet-400 hover:text-violet-300 transition-colors text-left"
                >
                  {table.name}
                </button>

                {/* Description */}
                <span className="text-xs text-gray-600 truncate flex-1">{table.description}</span>

                {/* Column count */}
                <span className="text-xs text-gray-600 shrink-0">{table.columns.length} cols</span>
              </div>

              {/* Expanded columns */}
              {expandedTables.has(table.name) && (
                <div className="bg-black/20 border-b border-white/5">
                  {table.columns.map((col) => (
                    <div key={col.name} className="flex items-start gap-2 px-6 py-1.5 text-xs">
                      <span className="font-mono text-gray-300 shrink-0 w-36 truncate">{col.name}</span>
                      <span className="text-gray-600 shrink-0 w-16">{col.type}</span>
                      <span className="text-gray-600 truncate">{col.description}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
