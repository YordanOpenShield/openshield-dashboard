/**
 * ─── Plugin SDK: Entry Point ────────────────────────────────────────────────
 *
 * Plugin authors import everything from "@open_shield/plugin-sdk":
 *
 *   import { definePlugin, createPluginUI, createManifest } from "@open_shield/plugin-sdk";
 *   import { Card, Button, Input, Table } from "@open_shield/plugin-sdk/components";
 */
export { definePlugin } from "./server.js";
export { createPluginUI } from "./client.js";
export { createManifest } from "./manifest.js";
export type { PluginManifest, PluginServerModule, PluginClientModule, PluginClientRegistry, RequestContext, PluginNavigationItem, PluginPageDef, PluginApiDef, PluginActionHook, HookLocation } from "./types.js";
//# sourceMappingURL=index.d.ts.map