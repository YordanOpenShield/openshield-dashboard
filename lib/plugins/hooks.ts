/**
 * ─── Plugin Action Hooks ────────────────────────────────────────────────────
 *
 * Hooks are UI extension points that plugins can register — they appear as
 * buttons, tabs, or widgets on existing dashboard pages.
 *
 * This module provides the registry for hooks and utilities for rendering them.
 * Hooks are registered via plugin manifests and can be queried by location.
 */

import type { PluginActionHook, HookLocation } from "./types";

/**
 * Get all registered action hooks for a specific location.
 * This is the runtime query used by host page components to render hook UIs.
 *
 * @param location - The UI location to get hooks for
 * @returns Array of hooks registered for this location
 */
export async function getHooksForLocation(
  location: HookLocation
): Promise<PluginActionHook[]> {
  const { getPluginRegistry } = await import("./registry");
  const registry = await getPluginRegistry();
  return registry.getActionHooks(location);
}

/**
 * Get all unique hook locations that have at least one registered hook.
 */
export async function getActiveHookLocations(): Promise<HookLocation[]> {
  const { getPluginRegistry } = await import("./registry");
  const registry = await getPluginRegistry();
  const allLocations: Set<HookLocation> = new Set();

  const plugins = await registry.getPlugins();
  for (const plugin of plugins.values()) {
    if (!plugin.enabled || !plugin.manifest.hooks) continue;
    for (const hook of plugin.manifest.hooks) {
      allLocations.add(hook.location as HookLocation);
    }
  }

  return Array.from(allLocations);
}

/**
 * Execute a hook action. This interprets the action definition and
 * performs the appropriate navigation or API call.
 *
 * @param hook - The hook to execute
 * @param contextParams - Runtime parameters (e.g., agent ID, job ID)
 * @returns The action result
 */
export function executeHookAction(
  hook: PluginActionHook,
  contextParams: Record<string, string>
): { type: string; destination?: string; endpoint?: string } {
  switch (hook.action.type) {
    case "navigate": {
      // Replace template params like {agentId} with actual values
      let path = hook.action.page;
      if (hook.action.params) {
        for (const [key, template] of Object.entries(hook.action.params)) {
          const value = contextParams[key] ?? template;
          path = path.replace(`{${key}}`, value);
        }
      }
      return { type: "navigate", destination: path };
    }
    case "open-modal":
      return { type: "open-modal" };
    case "call-api":
      return {
        type: "call-api",
        endpoint: hook.action.endpoint,
      };
    default:
      return { type: "unknown" };
  }
}

export type { PluginActionHook, HookLocation };
