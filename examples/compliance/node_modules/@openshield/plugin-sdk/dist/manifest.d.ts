/**
 * ─── Plugin SDK: Manifest Helper ────────────────────────────────────────────
 *
 * Provides `createManifest()` for generating manifest.json with type safety.
 *
 * Usage:
 *   import { createManifest } from "@openshield/plugin-sdk";
 *
 *   const manifest = createManifest({
 *     id: "compliance",
 *     name: "Compliance Manager",
 *     version: "1.0.0",
 *     permissions: { compliance: ["read", "manage-risks"] },
 *     pages: {
 *       "": { component: "Dashboard", title: "Dashboard" },
 *     },
 *   });
 *
 *   export default manifest;
 */
import type { PluginManifest } from "./types";
/**
 * Create a type-safe plugin manifest definition.
 *
 * At build time, the plugin-builder CLI will evaluate this and output
 * the manifest.json file. During development, this gives you full
 * TypeScript intellisense on the manifest shape.
 */
export declare function createManifest(config: PluginManifest): PluginManifest;
export { type PluginManifest };
//# sourceMappingURL=manifest.d.ts.map