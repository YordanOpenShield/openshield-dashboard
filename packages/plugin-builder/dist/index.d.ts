/**
 * ─── Plugin Builder Core ────────────────────────────────────────────────────
 *
 * Compiles and packages a plugin from source into a deployable .zip archive.
 *
 * Build steps:
 *   1. Read and validate manifest.ts → manifest.json
 *   2. Compile src/server/ → server/index.js (Node target, SDK externalized)
 *   3. Compile src/client/ → client/ui.js (Browser target, React + SDK externalized)
 *   4. Copy migrations/*.sql → migrations/
 *   5. Copy assets/* → assets/
 *   6. Package everything into plugin-{id}-{version}.zip
 */
export interface BuildConfig {
    /** Source directory (default: process.cwd()) */
    srcDir?: string;
    /** Output directory (default: ./dist) */
    outDir?: string;
    /** Whether to skip the zip packaging step */
    skipZip?: boolean;
}
interface PluginManifest {
    id: string;
    name: string;
    version: string;
    [key: string]: unknown;
}
export declare function buildPlugin(config?: BuildConfig): Promise<void>;
export { type PluginManifest };
//# sourceMappingURL=index.d.ts.map