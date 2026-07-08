/**
 * ─── Plugin System Barrel Export ────────────────────────────────────────────
 *
 * Import everything from a single path:
 *   import { PluginRegistry, installPlugin, ... } from "@/lib/plugins"
 */

export * from "./types";
export { getPluginRegistry, resetPluginRegistry, ManifestSchema } from "./registry";
export {
  installPluginFromZip,
  uninstallPlugin,
  listInstalledPlugins,
  getPluginConfig,
  updatePluginConfig,
} from "./loader";
export { getHooksForLocation, getActiveHookLocations, executeHookAction } from "./hooks";
