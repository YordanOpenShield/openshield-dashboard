/**
 * ─── Plugin SDK: Client Helpers ─────────────────────────────────────────────
 *
 * Provides `createPluginUI()` for creating type-safe client bundles.
 *
 * The client bundle is compiled separately (React externalized) and loaded
 * at runtime by the dashboard via script tag injection.
 *
 * Usage:
 *   import { createPluginUI } from "@openshield/plugin-sdk";
 *
 *   export default createPluginUI({
 *     name: "Compliance Manager",
 *     initialize(registry) {
 *       registry.registerPage("Dashboard", Dashboard);
 *       registry.registerPage("RisksPage", RisksPage);
 *     },
 *   });
 */
import type { PluginClientModule, PluginClientRegistry } from "./types";
export interface PluginUIConfig {
    name: string;
    initialize: (registry: PluginClientRegistry) => void;
    uninitialize?: () => void;
}
/**
 * Create a type-safe plugin client module.
 *
 * The returned module is what gets passed to window.__registerPlugin()
 * when the dashboard loads the plugin's ui.js bundle.
 */
export declare function createPluginUI(config: PluginUIConfig): PluginClientModule;
export { type PluginClientModule, type PluginClientRegistry };
//# sourceMappingURL=client.d.ts.map