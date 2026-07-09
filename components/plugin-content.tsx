/**
 * ─── Plugin Content (Client Component) ──────────────────────────────────────
 *
 * Implements Mattermost-style script tag loading for plugin UI bundles.
 *
 * Flow:
 *   1. On mount, append a <script> tag for the plugin's ui.js
 *   2. The ui.js bundle calls window.registerPlugin(pluginId, pluginModule)
 *   3. The pluginModule.initialize(registry) method registers components
 *   4. Once registered, the requested component is rendered
 *
 * Plugin bundles must externalize React and ReactDOM — they use the
 * host application's copies at runtime.
 */

"use client";

import { useEffect, useState, useRef, useCallback } from "react";

import type { PluginNavigationItem, PluginActionHook, HookLocation } from "@/lib/plugins/types";

// ─── Plugin Client Registry ─────────────────────────────────────────────────

/**
 * Registry given to plugins so they can register UI extensions.
 * Plugins call these methods during their initialize() phase.
 */
export class PluginClientRegistry {
  private pages = new Map<string, React.ComponentType<any>>();
  private navItems: PluginNavigationItem[] = [];
  private actionHooks: PluginActionHook[] = [];
  private settingsComponent: React.ComponentType<any> | null = null;
  private _initialized = false;

  registerPage(name: string, component: React.ComponentType<any>): void {
    this.pages.set(name, component);
  }
  getPage(name: string): React.ComponentType<any> | undefined {
    return this.pages.get(name);
  }

  registerNavItem(item: PluginNavigationItem): void {
    this.navItems.push(item);
  }
  getNavItems(): PluginNavigationItem[] {
    return [...this.navItems];
  }

  registerActionHook(hook: PluginActionHook): void {
    this.actionHooks.push(hook);
  }
  getActionHooks(location?: HookLocation): PluginActionHook[] {
    if (location) return this.actionHooks.filter((h) => h.location === location);
    return [...this.actionHooks];
  }

  registerAdminSettingsComponent(component: React.ComponentType<any>): void {
    this.settingsComponent = component;
  }
  getAdminSettingsComponent(): React.ComponentType<any> | null {
    return this.settingsComponent;
  }

  get initialized(): boolean {
    return this._initialized;
  }
  markInitialized(): void {
    this._initialized = true;
  }
}

// ─── Global Registry ────────────────────────────────────────────────────────

interface PluginModule {
  name: string;
  initialize: (registry: PluginClientRegistry) => void;
  uninitialize?: () => void;
}

const pluginModules = new Map<string, PluginModule>();
const pluginRegistries = new Map<string, PluginClientRegistry>();
const pluginLoadCallbacks = new Map<string, Array<() => void>>();

/**
 * Register a plugin module (called by the plugin's ui.js bundle).
 * This is exposed globally so plugin bundles can call it.
 * Guarded with typeof check to avoid SSR errors.
 */
if (typeof window !== "undefined") {
  (window as any).__registerPlugin = (pluginId: string, module: PluginModule) => {
    pluginModules.set(pluginId, module);

    const registry = new PluginClientRegistry();
    try {
      module.initialize(registry);
      registry.markInitialized();
    } catch (err) {
      console.error(`[plugins] Failed to initialize "${pluginId}":`, err);
    }
    pluginRegistries.set(pluginId, registry);

    // Fire any pending load callbacks
    const callbacks = pluginLoadCallbacks.get(pluginId);
    if (callbacks) {
      for (const cb of callbacks) cb();
      pluginLoadCallbacks.delete(pluginId);
    }
  };
}

// ─── Hook ───────────────────────────────────────────────────────────────────

/**
 * Hook to load a plugin's UI bundle and get its registry.
 */
function usePluginBundle(pluginId: string): {
  loaded: boolean;
  registry: PluginClientRegistry | null;
  error: string | null;
} {
  const [loaded, setLoaded] = useState(pluginRegistries.has(pluginId));
  const [registry, setRegistry] = useState<PluginClientRegistry | null>(
    pluginRegistries.get(pluginId) ?? null
  );
  const [error, setError] = useState<string | null>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    // Already loaded
    if (pluginRegistries.has(pluginId)) {
      setLoaded(true);
      setRegistry(pluginRegistries.get(pluginId)!);
      return;
    }

    // Wait for existing load in progress
    if (pluginLoadCallbacks.has(pluginId)) {
      const cb = () => {
        setLoaded(true);
        setRegistry(pluginRegistries.get(pluginId)!);
      };
      pluginLoadCallbacks.get(pluginId)!.push(cb);
      return;
    }

    // Start loading
    const callbacks: Array<() => void> = [];
    pluginLoadCallbacks.set(pluginId, callbacks);

    const loadScript = async () => {
      const script = document.createElement("script");
      script.src = `/plugins/${pluginId}/ui.js`;
      script.async = true;
      script.onload = () => {
        // The plugin bundle calls __registerPlugin synchronously,
        // so by now the registry should be populated.
        if (pluginRegistries.has(pluginId)) {
          setLoaded(true);
          setRegistry(pluginRegistries.get(pluginId)!);
        } else {
          // Plugin didn't register itself
          setError(`Plugin "${pluginId}" loaded but did not register. Missing window.__registerPlugin() call.`);
        }
      };
      script.onerror = () => {
        setError(`Failed to load plugin bundle for "${pluginId}"`);
        pluginLoadCallbacks.delete(pluginId);
      };
      document.body.appendChild(script);
      scriptRef.current = script;
    };

    loadScript();

    return () => {
      // Cleanup: remove script tag if component unmounts before load
      if (scriptRef.current && document.body.contains(scriptRef.current)) {
        document.body.removeChild(scriptRef.current);
      }
      // If not loaded yet, remove from pending callbacks
      if (pluginLoadCallbacks.has(pluginId)) {
        const cbs = pluginLoadCallbacks.get(pluginId);
        if (cbs && cbs.length === 0) {
          pluginLoadCallbacks.delete(pluginId);
        }
      }
    };
  }, [pluginId]);

  return { loaded, registry, error };
}

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * Renders a plugin's page component.
 *
 * @param pluginId - The plugin ID
 * @param componentName - The component name registered by the plugin
 * @param initialData - Server-side data passed to the component
 */
export function PluginContent({
  pluginId,
  componentName,
  initialData,
}: {
  pluginId: string;
  componentName: string;
  initialData: unknown;
}) {
  const { loaded, registry, error } = usePluginBundle(pluginId);

  // Loading state
  if (!loaded && !error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading plugin...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
        <h3 className="text-red-400 font-medium mb-2">Plugin Error</h3>
        <p className="text-sm text-red-300">{error}</p>
      </div>
    );
  }

  // Plugin not found
  if (!registry) {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6">
        <p className="text-sm text-yellow-400">
          Plugin "{pluginId}" component "{componentName}" is not available.
        </p>
      </div>
    );
  }

  // Get the component
  const Component = registry.getPage(componentName);

  if (!Component) {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6">
        <p className="text-sm text-yellow-400">
          Component "{componentName}" not found in plugin "{pluginId}".
        </p>
      </div>
    );
  }

  // Render the plugin component
  return <Component initialData={initialData} />;
}
