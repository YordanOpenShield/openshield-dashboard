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
//# sourceMappingURL=index.js.map