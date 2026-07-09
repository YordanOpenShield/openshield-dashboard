/**
 * ─── Plugin Builder: Scaffold ───────────────────────────────────────────────
 *
 * Generates a new plugin project with the recommended directory structure,
 * SDK dependency, and example source files.
 */
export interface ScaffoldOptions {
    name?: string;
    dir?: string;
}
export declare function scaffoldPlugin(options?: ScaffoldOptions): Promise<void>;
//# sourceMappingURL=scaffold.d.ts.map