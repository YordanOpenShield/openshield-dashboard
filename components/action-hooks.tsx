/**
 * ─── Action Hooks (Client Component) ───────────────────────────────────────
 *
 * Renders plugin-registered action hooks on host pages.
 *
 * Usage:
 *   <ActionHookToolbar location="agent-detail-toolbar" contextParams={{ agentId: id }} />
 *
 * This fetches hooks from the server registry and renders them as buttons.
 * Clicking a button executes the hook action (navigate, open-modal, call-api).
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { PluginActionHook, HookLocation } from "@/lib/plugins/types";

/**
 * Renders action hooks for a given location as toolbar buttons.
 */
export function ActionHookToolbar({
  location,
  contextParams = {},
}: {
  location: HookLocation;
  contextParams?: Record<string, string>;
}) {
  const [hooks, setHooks] = useState<PluginActionHook[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/hooks?location=${encodeURIComponent(location)}`)
      .then((res) => res.json())
      .then((data) => setHooks(data.hooks ?? []))
      .catch(() => setHooks([]))
      .finally(() => setLoading(false));
  }, [location]);

  if (loading || hooks.length === 0) return null;

  return (
    <>
      {hooks.map((hook, i) => (
        <button
          key={i}
          type="button"
          onClick={() => executeHook(hook, contextParams, router)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
            bg-violet-500/10 border border-violet-500/20 text-violet-400
            hover:bg-violet-500/20 hover:border-violet-500/30
            transition-all duration-200"
          title={hook.label}
        >
          {hook.icon && <HookIcon icon={hook.icon} />}
          {hook.label}
        </button>
      ))}
    </>
  );
}

/**
 * Renders action hooks for a given location as a dropdown menu.
 */
export function ActionHookMenu({
  location,
  contextParams = {},
}: {
  location: HookLocation;
  contextParams?: Record<string, string>;
}) {
  const [hooks, setHooks] = useState<PluginActionHook[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/hooks?location=${encodeURIComponent(location)}`)
      .then((res) => res.json())
      .then((data) => setHooks(data.hooks ?? []))
      .catch(() => setHooks([]))
      .finally(() => setLoading(false));
  }, [location]);

  if (loading || hooks.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {hooks.map((hook, i) => (
        <button
          key={i}
          type="button"
          onClick={() => executeHook(hook, contextParams, router)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm
            bg-white/5 hover:bg-white/10 border border-white/10
            text-gray-400 hover:text-white
            transition-all duration-200"
        >
          {hook.icon && <HookIcon icon={hook.icon} />}
          {hook.label}
        </button>
      ))}
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function HookIcon({ icon }: { icon: string }) {
  // Simple SVG icons mapped by name
  const icons: Record<string, React.ReactNode> = {
    shield: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    search: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
    alert: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
    ),
  };

  return (icons[icon] ?? null) as React.ReactElement;
}

function executeHook(
  hook: PluginActionHook,
  contextParams: Record<string, string>,
  router: ReturnType<typeof useRouter>
) {
  switch (hook.action.type) {
    case "navigate": {
      let path = hook.action.page;
      if (hook.action.params) {
        for (const [key, template] of Object.entries(hook.action.params)) {
          const value = contextParams[key] ?? template;
          path = path.replace(`{${key}}`, value);
        }
      }
      router.push(path);
      break;
    }
    case "open-modal":
      // TODO: implement modal system
      console.warn("[hooks] open-modal not implemented yet", hook);
      break;
    case "call-api":
      fetch(hook.action.endpoint, { method: hook.action.method ?? "GET" })
        .then((r) => r.json())
        .then((data) => console.info("[hooks] API response:", data))
        .catch((err) => console.error("[hooks] API call failed:", err));
      break;
  }
}
