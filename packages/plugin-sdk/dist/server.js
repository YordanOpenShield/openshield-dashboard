/**
 * ─── Plugin SDK: Server Helpers ─────────────────────────────────────────────
 *
 * Provides `definePlugin()` for creating type-safe server bundles.
 *
 * Usage:
 *
 *   import { definePlugin } from "@openshield/plugin-sdk";
 *
 *   export default definePlugin({
 *     install: async (ctx) => {
 *       await ctx.db.query("CREATE TABLE ...");
 *     },
 *     api: {
 *       "risks:GET": async (req, ctx) => {
 *         const result = await ctx.db.query("SELECT * FROM risks");
 *         return Response.json(result.rows);
 *       },
 *     },
 *   });
 */
export function definePlugin(config) {
    // Basic validation at "build time" via TypeScript types.
    // Additional runtime validation happens on the dashboard side via Zod.
    return config;
}
//# sourceMappingURL=server.js.map