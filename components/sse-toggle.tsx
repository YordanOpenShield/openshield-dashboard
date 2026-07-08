"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { SSEEvent } from "@/lib/manager-types";

type SSECallback = (event: SSEEvent) => void;

interface SSEConnection {
  subscribe: (path: string, callback: SSECallback) => () => void;
  isConnected: boolean;
  toggle: () => void;
  enabled: boolean;
}

// ─── Global singleton state ──────────────────────────────────────────────────
// Only one EventSource connection per path is maintained across the app.

const listeners = new Map<string, Set<SSECallback>>();
let eventSource: EventSource | null = null;
let globalEnabled = false;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

function startConnection() {
  if (eventSource || !globalEnabled) return;

  // We connect to a wildcard path; the manager sends all events.
  // Individual callbacks filter by event type.
  eventSource = new EventSource("/events/agents");

  eventSource.onopen = () => {
    console.info("[SSE] Connected to /events/agents");
  };

  eventSource.onmessage = (msg) => {
    try {
      const event: SSEEvent = JSON.parse(msg.data);
      const pathListeners = listeners.get(event.type + "s"); // "agents", "tasks", "queries"
      if (pathListeners) {
        pathListeners.forEach((cb) => cb(event));
      }
      // Also notify wildcard listeners
      const allListeners = listeners.get("*");
      if (allListeners) {
        allListeners.forEach((cb) => cb(event));
      }
    } catch {
      // ignore parse errors
    }
  };

  eventSource.onerror = () => {
    console.warn("[SSE] Connection error, will retry...");
    closeConnection();
    if (globalEnabled) {
      reconnectTimer = setTimeout(startConnection, 3000);
    }
  };
}

function closeConnection() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useSSE(path: string, callback: SSECallback) {
  const cbRef = useRef(callback);
  cbRef.current = callback;

  useEffect(() => {
    const wrapped: SSECallback = (event) => cbRef.current(event);

    if (!listeners.has(path)) {
      listeners.set(path, new Set());
    }
    listeners.get(path)!.add(wrapped);

    return () => {
      listeners.get(path)?.delete(wrapped);
    };
  }, [path]);
}

// ─── Toggle Button ───────────────────────────────────────────────────────────

export function SSEToggle() {
  const [enabled, setEnabled] = useState(globalEnabled);

  const handleToggle = useCallback(() => {
    const next = !enabled;
    setEnabled(next);
    globalEnabled = next;

    if (next) {
      startConnection();
    } else {
      closeConnection();
    }
  }, [enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't disconnect on unmount — keep global state
    };
  }, []);

  return (
    <button
      onClick={handleToggle}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium border transition-all duration-200 ${
        enabled
          ? "bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20"
          : "bg-white/5 border-white/10 text-gray-500 hover:text-gray-300 hover:bg-white/10"
      }`}
    >
      <span className={`w-2 h-2 rounded-full ${enabled ? "bg-green-500 animate-pulse" : "bg-gray-600"}`} />
      {enabled ? "Live" : "Off"}
    </button>
  );
}
