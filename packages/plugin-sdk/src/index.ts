/**
 * ─── Plugin SDK: Entry Point ────────────────────────────────────────────────
 *
 * Plugin authors import everything from "@openshield/plugin-sdk":
 *
 *   import { definePlugin, createPluginUI, createManifest } from "@openshield/plugin-sdk";
 */

export { definePlugin } from "./server.js";
export { createPluginUI } from "./client.js";
export { createManifest } from "./manifest.js";

export type { PluginManifest, PluginServerModule, PluginClientModule, PluginClientRegistry, RequestContext, PluginNavigationItem, PluginPageDef, PluginApiDef, PluginActionHook, HookLocation } from "./types.js";
