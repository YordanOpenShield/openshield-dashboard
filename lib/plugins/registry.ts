/**
 * ─── Plugin Registry ────────────────────────────────────────────────────────
 *
 * Singleton that discovers, validates, loads, and serves plugins.
 *
 * Discovery flow:
 *   1. First call to getPluginRegistry() triggers discovery
 *   2. Scans `plugins/` directory for subdirectories with manifest.json
 *   3. Queries `plugin_registry` DB table for persisted install state
 *   4. Validates each manifest with Zod
 *   5. Returns combined in-memory registry
 *
 * Plugin server bundles are loaded lazily on first access.
 * The registry is rebuilt on server restart.
 *
 * This module uses Node.js APIs (fs, path, url) — server-side only.
 */

import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { z } from "zod";
import type {
  PluginManifest,
  PluginServerModule,
  LoadedPlugin,
  PluginState,
  PluginNavigationItem,
  PluginActionHook,
  HookLocation,
} from "./types";

// ─── Zod Schemas (Runtime Validation) ────────────────────────────────────────

const NavItemSchema = z.object({
  type: z.enum(["main", "admin"]),
  label: z.string().min(1),
  href: z.string().min(1),
  icon: z.string().optional(),
  permission: z.string().optional(),
});

const PageDefSchema = z.object({
  component: z.string().min(1),
  title: z.string().min(1),
  permission: z.string().optional(),
});

const ApiDefSchema = z.object({
  methods: z.array(z.string()),
});

const ActionHookSchema = z.object({
  location: z.string(),
  label: z.string().min(1),
  icon: z.string().optional(),
  permission: z.string().optional(),
  action: z.union([
    z.object({ type: z.literal("navigate"), page: z.string(), params: z.record(z.string(), z.string()).optional() }),
    z.object({ type: z.literal("open-modal"), component: z.string() }),
    z.object({ type: z.literal("call-api"), endpoint: z.string(), method: z.string().optional() }),
  ]),
});

const ManifestSchema = z.object({
  id: z.string().min(1).regex(/^[a-z0-9_-]+$/, "ID must be lowercase alphanumeric with hyphens/underscores"),
  name: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, "Must be semver (e.g. 1.0.0)"),
  description: z.string().optional(),
  icon: z.string().optional(),
  requires: z.string().optional(),
  permissions: z.record(z.string(), z.array(z.string())).optional(),
  navigation: z.array(NavItemSchema).optional(),
  pages: z.record(z.string(), PageDefSchema).optional(),
  api: z.record(z.string(), ApiDefSchema).optional(),
  hooks: z.array(ActionHookSchema).optional(),
  settingsSchema: z.record(z.string(), z.unknown()).optional(),
  uninstallable: z.boolean().optional(),
});

const ServerModuleSchema = z.object({
  install: z.function().optional(),
  uninstall: z.function().optional(),
  api: z.record(z.string(), z.function()).optional(),
  dataFetchers: z.record(z.string(), z.function()).optional(),
});

// ─── Registry ────────────────────────────────────────────────────────────────

const PLUGINS_DIR = path.join(process.cwd(), "plugins");
const HOST_VERSION = "1.0.0"; // Bump on breaking changes to the plugin contract

/**
 * Export the ManifestSchema for use by the loader and SDK.
 */
export { ManifestSchema };

class PluginRegistry {
  private plugins = new Map<string, LoadedPlugin>();
  private discovered = false;

  // Lazy cache for aggregated data
  private navCache: { main: PluginNavigationItem[]; admin: PluginNavigationItem[] } | null = null;
  private hookCache: Map<HookLocation, PluginActionHook[]> | null = null;

  // ── Discovery ───────────────────────────────────────────────────────────

  /**
   * Scan the plugins/ directory and DB, build the in-memory registry.
   * Called lazily on first access to any getter.
   */
  async discover(): Promise<void> {
    if (this.discovered) return;
    this.discovered = true;

    // 1. Read plugin_registry DB table for persisted state
    const dbPlugins = await this.loadFromDb();

    // 2. Scan plugins/ directory for manifests
    const dirPlugins = await this.scanDirectory();

    // 3. Merge: directory takes precedence over DB (directory is source of truth for code)
    //    DB provides enabled/disabled state, settings, and install metadata
    const allIds = new Set([...dirPlugins.keys(), ...dbPlugins.keys()]);

    for (const id of allIds) {
      const dirInfo = dirPlugins.get(id);
      const dbInfo = dbPlugins.get(id);

      if (!dirInfo) {
        // Plugin is in DB but directory was removed — mark as orphaned
        console.warn(`[plugins] Plugin "${id}" found in DB but missing from plugins/ directory`);
        continue;
      }

      const manifest = dirInfo.manifest;
      const enabled = dbInfo?.enabled ?? true;

      const loadedPlugin: LoadedPlugin = {
        manifest,
        server: null, // Loaded on demand
        state: "discovered",
        enabled,
      };

      this.plugins.set(id, loadedPlugin);
      console.info(`[plugins] Discovered: ${manifest.name} v${manifest.version} (enabled: ${enabled})`);
    }

    this.invalidateCache();
  }

  // ── Server Bundle Loading ───────────────────────────────────────────────

  /**
   * Load (or return cached) server bundle for a plugin.
   *
   * Uses eval('require') to bypass Next.js's bundler, which would otherwise
   * try to resolve dynamic require() paths at build time and fail.
   * This is the standard pattern for runtime module loading in Next.js.
   */
  async loadServerBundle(pluginId: string): Promise<PluginServerModule | null> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return null;
    if (plugin.server) return plugin.server;
    if (plugin.state === "failed") return null;

    const serverPath = path.join(PLUGINS_DIR, pluginId, "server", "index.js");
    if (!fs.existsSync(serverPath)) {
      plugin.server = null;
      return null;
    }

    plugin.state = "loading";

    try {
      let mod: any;

      // Use eval('require') to get the original Node.js require function,
      // bypassing Next.js/Turbopack's bundled module resolution.
      // This is necessary because plugin bundles are loaded at runtime
      // from paths unknown at build time.
      try {
        const _require = eval('require');
        mod = _require(serverPath);
      } catch (requireErr) {
        // Fallback: try ESM dynamic import via Function constructor
        // to prevent Turbopack from analyzing the dynamic path.
        try {
          const fileUrl = pathToFileURL(serverPath).href;
          const esmImport = new Function('url', 'return import(url)');
          mod = await esmImport(fileUrl);
        } catch (esmErr) {
          throw new Error(
            `Failed to load plugin "${pluginId}" server bundle: ${(requireErr as Error).message}`
          );
        }
      }

      // Extract default export or module.exports
      const raw: unknown = mod.default ?? mod;

      // Validate with Zod
      const result = ServerModuleSchema.safeParse(raw);
      if (!result.success) {
        throw new Error(
          `Plugin "${pluginId}" server module failed validation: ${result.error.message}`
        );
      }

      // Check host compatibility
      if (plugin.manifest.requires) {
        // TODO: implement semver check (could use semver package or simple comparison)
        console.info(
          `[plugins] Plugin "${pluginId}" requires host ${plugin.manifest.requires} (host: ${HOST_VERSION})`
        );
      }

      plugin.server = result.data as PluginServerModule;
      plugin.state = "active";
      plugin.loadedAt = new Date();

      console.info(`[plugins] Loaded server bundle for "${pluginId}"`);
      return plugin.server;
    } catch (err) {
      plugin.state = "failed";
      plugin.error = err instanceof Error ? err.message : String(err);
      console.error(`[plugins] Failed to load "${pluginId}": ${plugin.error}`);
      return null;
    }
  }

  // ── Getters ─────────────────────────────────────────────────────────────

  /** Get the entire registry */
  async getPlugins(): Promise<Map<string, LoadedPlugin>> {
    await this.discover();
    return this.plugins;
  }

  /** Get a single plugin by ID */
  async getPlugin(pluginId: string): Promise<LoadedPlugin | undefined> {
    await this.discover();
    return this.plugins.get(pluginId);
  }

  /** Get all active (enabled + successfully loaded) plugins */
  async getActivePlugins(): Promise<LoadedPlugin[]> {
    await this.discover();
    return Array.from(this.plugins.values()).filter((p) => p.enabled && p.state === "active");
  }

  /** Get navigation items for a given type */
  async getNavItems(type: "main" | "admin"): Promise<PluginNavigationItem[]> {
    if (this.navCache) {
      return type === "main" ? this.navCache.main : this.navCache.admin;
    }
    await this.discover();

    const main: PluginNavigationItem[] = [];
    const admin: PluginNavigationItem[] = [];

    for (const plugin of this.plugins.values()) {
      if (!plugin.enabled) continue;
      if (!plugin.manifest.navigation) continue;
      for (const item of plugin.manifest.navigation) {
        if (item.type === "main") main.push(item);
        if (item.type === "admin") admin.push(item);
      }
    }

    this.navCache = { main, admin };
    return type === "main" ? main : admin;
  }

  /** Get action hooks for a given location */
  async getActionHooks(location: HookLocation): Promise<PluginActionHook[]> {
    if (this.hookCache) {
      return this.hookCache.get(location) ?? [];
    }
    await this.discover();

    const cache = new Map<HookLocation, PluginActionHook[]>();
    for (const plugin of this.plugins.values()) {
      if (!plugin.enabled) continue;
      if (!plugin.manifest.hooks) continue;
      for (const hook of plugin.manifest.hooks) {
        const loc = hook.location as HookLocation;
        if (!cache.has(loc)) cache.set(loc, []);
        cache.get(loc)!.push(hook);
      }
    }

    this.hookCache = cache;
    return cache.get(location) ?? [];
  }

  /** Get all permission resources declared by plugins */
  async getPluginPermissions(): Promise<Record<string, string[]>> {
    await this.discover();
    const permissions: Record<string, string[]> = {};
    for (const plugin of this.plugins.values()) {
      if (!plugin.enabled || !plugin.manifest.permissions) continue;
      for (const [resource, actions] of Object.entries(plugin.manifest.permissions)) {
        if (!permissions[resource]) permissions[resource] = [];
        permissions[resource].push(...actions.filter((a) => !permissions[resource].includes(a)));
      }
    }
    return permissions;
  }

  /** Check if any active plugin has a specific permission resource */
  async hasPluginPermission(resource: string): Promise<boolean> {
    const perms = await this.getPluginPermissions();
    return resource in perms;
  }

  // ── Lifecycle Management ────────────────────────────────────────────────

  /** Register a plugin in memory (called after install) */
  register(manifest: PluginManifest, serverModule: PluginServerModule | null): void {
    this.plugins.set(manifest.id, {
      manifest,
      server: serverModule,
      state: "active",
      enabled: true,
      loadedAt: new Date(),
    });
    this.invalidateCache();
    console.info(`[plugins] Registered: ${manifest.name} v${manifest.version}`);
  }

  /** Unregister a plugin from memory (called after uninstall) */
  unregister(pluginId: string): void {
    this.plugins.delete(pluginId);
    this.invalidateCache();
    console.info(`[plugins] Unregistered: ${pluginId}`);
  }

  /** Mark a plugin as failed */
  markFailed(pluginId: string, error: string): void {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.state = "failed";
      plugin.error = error;
    }
  }

  /** Force re-discovery on next access */
  resetForTest(): void {
    this.plugins.clear();
    this.discovered = false;
    this.invalidateCache();
  }

  // ── Private Helpers ─────────────────────────────────────────────────────

  private invalidateCache(): void {
    this.navCache = null;
    this.hookCache = null;
  }

  /** Scan plugins/ directory for manifests */
  private async scanDirectory(): Promise<Map<string, { manifest: PluginManifest }>> {
    const result = new Map<string, { manifest: PluginManifest }>();

    if (!fs.existsSync(PLUGINS_DIR)) return result;

    const entries = fs.readdirSync(PLUGINS_DIR, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith(".")) continue; // Skip hidden dirs

      const manifestPath = path.join(PLUGINS_DIR, entry.name, "manifest.json");
      if (!fs.existsSync(manifestPath)) continue;

      try {
        const raw = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
        const parsed = ManifestSchema.parse(raw) as unknown as PluginManifest;
        result.set(parsed.id, { manifest: parsed });
      } catch (err) {
        console.error(
          `[plugins] Invalid manifest in "${entry.name}": ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    return result;
  }

  /** Query plugin_registry DB table for persisted state */
  private async loadFromDb(): Promise<Map<string, { enabled: boolean; settings: Record<string, unknown> }>> {
    const result = new Map<string, { enabled: boolean; settings: Record<string, unknown> }>();

    try {
      const { pgPool } = await import("../db");
      const client = await pgPool.connect();
      try {
        const dbResult = await client.query(
          `SELECT id, enabled, settings FROM plugin_registry`
        );
        for (const row of dbResult.rows) {
          result.set(row.id, {
            enabled: row.enabled,
            settings: row.settings ?? {},
          });
        }
      } finally {
        client.release();
      }
    } catch {
      // DB not available (e.g. during build) — skip DB loading
    }

    return result;
  }
}

// ─── Singleton Export ────────────────────────────────────────────────────────

let instance: PluginRegistry | null = null;

/**
 * Get the singleton plugin registry.
 * First call triggers discovery.
 */
export async function getPluginRegistry(): Promise<PluginRegistry> {
  if (!instance) {
    instance = new PluginRegistry();
    await instance.discover();
  }
  return instance;
}

/**
 * Reset the registry (for testing).
 */
export async function resetPluginRegistry(): Promise<void> {
  if (instance) {
    instance.resetForTest();
    instance = null;
  }
}
