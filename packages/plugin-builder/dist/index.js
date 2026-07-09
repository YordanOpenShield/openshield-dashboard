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
import path from "path";
import fs from "fs";
import * as esbuild from "esbuild";
import AdmZip from "adm-zip";
// ─── Build ──────────────────────────────────────────────────────────────────
export async function buildPlugin(config = {}) {
    const srcDir = path.resolve(config.srcDir ?? process.cwd());
    const outDir = path.resolve(config.outDir ?? path.join(srcDir, "dist"));
    console.log(`\n  Building plugin from: ${srcDir}`);
    console.log(`  Output to: ${outDir}\n`);
    // Ensure output directory exists
    fs.mkdirSync(outDir, { recursive: true });
    // ── Step 1: Generate manifest.json ──────────────────────────────────────
    console.log("  [1/5] Generating manifest.json...");
    const manifest = await generateManifest(srcDir, outDir);
    if (!manifest) {
        throw new Error("Could not generate manifest.json. Create either manifest.ts or manifest.json in the source directory.");
    }
    const pluginId = manifest.id;
    const pluginVersion = manifest.version;
    console.log(`         Plugin: ${manifest.name} v${manifest.version}`);
    // ── Step 2: Compile server bundle ───────────────────────────────────────
    const serverSrc = path.join(srcDir, "src", "server");
    const serverOut = path.join(outDir, "server", "index.js");
    if (fs.existsSync(serverSrc)) {
        console.log("  [2/5] Compiling server bundle...");
        await compileServer(serverSrc, serverOut);
    }
    else {
        console.log("  [2/5] No server source found, skipping.");
    }
    // ── Step 3: Compile client bundle ───────────────────────────────────────
    const clientSrc = path.join(srcDir, "src", "client");
    const clientOut = path.join(outDir, "client", "ui.js");
    if (fs.existsSync(clientSrc)) {
        console.log("  [3/5] Compiling client bundle...");
        await compileClient(clientSrc, clientOut, manifest.id);
    }
    else {
        console.log("  [3/5] No client source found, skipping.");
    }
    // ── Step 4: Copy migrations ─────────────────────────────────────────────
    const migrationsSrc = path.join(srcDir, "src", "server", "migrations");
    const migrationsOut = path.join(outDir, "migrations");
    if (fs.existsSync(migrationsSrc)) {
        console.log("  [4/5] Copying migrations...");
        copyDirectory(migrationsSrc, migrationsOut);
    }
    else {
        console.log("  [4/5] No migrations found, skipping.");
    }
    // ── Step 5: Copy assets ─────────────────────────────────────────────────
    const assetsSrc = path.join(srcDir, "assets");
    const assetsOut = path.join(outDir, "assets");
    if (fs.existsSync(assetsSrc)) {
        console.log("  [5/5] Copying assets...");
        copyDirectory(assetsSrc, assetsOut);
    }
    else {
        console.log("  [5/5] No assets found, skipping.");
    }
    // ── Package ─────────────────────────────────────────────────────────────
    if (!config.skipZip) {
        const zipName = `plugin-${pluginId}-${pluginVersion}.zip`;
        const zipPath = path.join(outDir, "..", zipName);
        console.log(`\n  Packaging: ${zipName}...`);
        packageZip(outDir, zipPath);
        console.log(`  Created: ${zipPath}`);
    }
    console.log(`\n  ✅ Build complete!\n`);
}
// ─── Manifest Generation ────────────────────────────────────────────────────
async function generateManifest(srcDir, outDir) {
    const jsonPath = path.join(srcDir, "manifest.json");
    const tsPath = path.join(srcDir, "manifest.ts");
    // Prefer manifest.json (no compilation needed)
    if (fs.existsSync(jsonPath)) {
        const raw = fs.readFileSync(jsonPath, "utf-8");
        const manifest = JSON.parse(raw);
        fs.writeFileSync(path.join(outDir, "manifest.json"), raw);
        return manifest;
    }
    // Fall back to manifest.ts (requires tsx or ts-node)
    if (fs.existsSync(tsPath)) {
        try {
            // Try using tsx to evaluate the TypeScript file
            const { execSync } = await import("child_process");
            const result = execSync(`npx --yes tsx -e "import m from '${tsPath.replace(/\\/g, "/")}'; console.log(JSON.stringify(m.default ?? m))"`, { cwd: srcDir, encoding: "utf-8", timeout: 30000 });
            const manifest = JSON.parse(result.trim());
            fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));
            return manifest;
        }
        catch (err) {
            console.warn(`    Warning: Could not compile manifest.ts (${err}). Falling back to raw JSON...`);
            // Try to parse as raw JSON (in case it's a .json file named .ts)
            try {
                const raw = fs.readFileSync(tsPath, "utf-8");
                // Strip export default and extract JSON-like object
                const jsonStr = raw
                    .replace(/^import\s.*;?\s*$/gm, "")
                    .replace(/^export\s+default\s+/, "")
                    .replace(/;\s*$/, "")
                    .trim();
                const manifest = JSON.parse(jsonStr);
                fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));
                return manifest;
            }
            catch {
                return null;
            }
        }
    }
    return null;
}
// ─── Compilation ────────────────────────────────────────────────────────────
async function compileServer(srcDir, outFile) {
    const entryPoint = findEntryPoint(srcDir);
    if (!entryPoint) {
        throw new Error(`No entry point found in ${srcDir}. Create index.ts, index.js, or main.ts.`);
    }
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    await esbuild.build({
        entryPoints: [entryPoint],
        outfile: outFile,
        bundle: true,
        platform: "node",
        target: ["node18"],
        format: "cjs",
        // No externals — bundle everything including the SDK,
        // since the dashboard doesn't have @openshield/plugin-sdk installed.
        sourcemap: false,
        minify: false,
    });
    const size = fs.statSync(outFile).size;
    console.log(`         ${path.basename(outFile)} (${formatSize(size)})`);
}
async function compileClient(srcDir, outFile, pluginId) {
    const entryPoint = findEntryPoint(srcDir);
    if (!entryPoint) {
        throw new Error(`No entry point found in ${srcDir}. Create index.tsx, index.ts, index.jsx, or index.js.`);
    }
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    // Compile to a temp file first, then wrap with registration
    const tempOut = outFile + ".tmp";
    await esbuild.build({
        entryPoints: [entryPoint],
        outfile: tempOut,
        bundle: true,
        platform: "browser",
        target: ["es2020"],
        format: "iife",
        globalName: "__plugin_bundle",
        jsx: "transform",
        jsxFactory: "React.createElement",
        jsxFragment: "React.Fragment",
        // Externalize "react" so the bundle doesn't ship its own copy. At runtime
        // the global "React" object (set up by <PluginGlobals />) is used.
        // "react/jsx-runtime" is NOT externalized — we use a plugin below to
        // resolve it to a tiny stub that re-exports jsx/jsxs/Fragment from the
        // global React object (available in React 19+).
        external: ["react"],
        plugins: [
            {
                name: "react-jsx-runtime-alias",
                setup(build) {
                    // Intercept imports of "react/jsx-runtime" and redirect to a
                    // virtual module that wraps the global React object.
                    build.onResolve({ filter: /^react\/jsx-runtime$/ }, () => {
                        return { path: "react-jsx-runtime-stub", namespace: "plugin-builder" };
                    });
                    // Provide the virtual module content.
                    build.onLoad({ filter: /^react-jsx-runtime-stub$/, namespace: "plugin-builder" }, () => ({
                        contents: [
                            // The SDK's pre-compiled components call jsx/jsxs with the
                            // signature (type, props, key). React.createElement uses
                            // (type, props, ...children) instead.
                            //
                            // jsxs is used when there are multiple children. The automatic
                            // runtime passes them as an array in props.children. However
                            // React's dev-mode key warning fires when it sees an array in
                            // props.children without element keys. To avoid that we spread
                            // the children array as positional arguments to createElement,
                            // which React treats as positional (no key warning).
                            `var R = globalThis.React;`,
                            `export function jsx(type, props, key) {`,
                            `  return key != null`,
                            `    ? R.createElement(type, props !== null ? { ...props, key } : { key })`,
                            `    : R.createElement(type, props);`,
                            `}`,
                            `export function jsxs(type, props, key) {`,
                            `  var children = props != null ? props.children : void 0;`,
                            `  if (Array.isArray(children)) {`,
                            `    // Extract children from props and spread as positional args`,
                            `    var rest = { ...props };`,
                            `    delete rest.children;`,
                            `    var args = [type, key != null ? { ...rest, key } : rest];`,
                            `    for (var i = 0; i < children.length; i++) args.push(children[i]);`,
                            `    return R.createElement.apply(R, args);`,
                            `  }`,
                            `  return key != null`,
                            `    ? R.createElement(type, props !== null ? { ...props, key } : { key })`,
                            `    : R.createElement(type, props);`,
                            `}`,
                            `export const Fragment = R.Fragment;`,
                            `export default { jsx, jsxs, Fragment };`,
                        ].join("\n"),
                        loader: "js",
                    }));
                },
            },
        ],
        sourcemap: false,
        minify: true,
    });
    // Read the compiled bundle and wrap it with __registerPlugin
    const bundle = fs.readFileSync(tempOut, "utf-8");
    const wrapped = `(function(){${bundle}
var _module = typeof __plugin_bundle !== "undefined" ? __plugin_bundle.default ?? __plugin_bundle : null;
if (_module && typeof window !== "undefined" && window.__registerPlugin) {
  window.__registerPlugin("${pluginId}", _module);
}
})();`;
    fs.writeFileSync(outFile, wrapped);
    fs.unlinkSync(tempOut);
    const size = fs.statSync(outFile).size;
    console.log(`         ${path.basename(outFile)} (${formatSize(size)})`);
}
// ─── Helpers ────────────────────────────────────────────────────────────────
function findEntryPoint(dir) {
    const candidates = ["index.ts", "index.tsx", "index.js", "index.jsx", "main.ts", "main.tsx"];
    for (const candidate of candidates) {
        const fullPath = path.join(dir, candidate);
        if (fs.existsSync(fullPath))
            return fullPath;
    }
    return null;
}
function copyDirectory(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDirectory(srcPath, destPath);
        }
        else {
            fs.copyFileSync(srcPath, destPath);
            console.log(`         ${entry.name}`);
        }
    }
}
function packageZip(sourceDir, outputPath) {
    const zip = new AdmZip();
    const addDirToZip = (dir, zipPath) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const zipEntryPath = zipPath ? `${zipPath}/${entry.name}` : entry.name;
            if (entry.isDirectory()) {
                addDirToZip(fullPath, zipEntryPath);
            }
            else {
                zip.addLocalFile(fullPath, path.dirname(zipEntryPath));
            }
        }
    };
    addDirToZip(sourceDir, "");
    zip.writeZip(outputPath);
}
function pathToFileURL(filePath) {
    // Simple implementation to avoid URL import issues
    const absPath = path.resolve(filePath);
    return new URL(`file:///${absPath.replace(/\\/g, "/")}`);
}
function formatSize(bytes) {
    if (bytes < 1024)
        return `${bytes} B`;
    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
//# sourceMappingURL=index.js.map