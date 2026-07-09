/**
 * ─── Plugin SDK: Entry Point ────────────────────────────────────────────────
 *
 * Plugin authors import core APIs from the main entry:
 *
 *   import { definePlugin, createPluginUI, createManifest } from "@open_shield/plugin-sdk";
 *   import { Card, Button } from "@open_shield/plugin-sdk/components";
 *   import type { PluginManifest, PluginServerModule } from "@open_shield/plugin-sdk";
 */
export { definePlugin } from "./server.js";
export { createPluginUI } from "./client.js";
export { createManifest } from "./manifest.js";
//# sourceMappingURL=index.js.map