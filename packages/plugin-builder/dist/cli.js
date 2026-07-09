#!/usr/bin/env node
/**
 * ─── Plugin Builder CLI ─────────────────────────────────────────────────────
 *
 * Command-line interface for building OpenShield plugins.
 *
 * Usage:
 *   plugin-builder build                 # Build from current directory
 *   plugin-builder build --src ./plugin   # Specify source directory
 *   plugin-builder build --out ./dist     # Specify output directory
 *   plugin-builder build --skip-zip       # Skip zip packaging
 *   plugin-builder init                   # Scaffold a new plugin
 *   plugin-builder init --name compliance # Scaffold with a name
 */
import { buildPlugin } from "./index.js";
import { scaffoldPlugin } from "./scaffold.js";
async function main() {
    const args = process.argv.slice(2);
    const command = args[0] ?? "build";
    switch (command) {
        case "build": {
            const srcIndex = args.indexOf("--src");
            const outIndex = args.indexOf("--out");
            const skipZip = args.includes("--skip-zip");
            const config = {
                srcDir: srcIndex >= 0 ? args[srcIndex + 1] : undefined,
                outDir: outIndex >= 0 ? args[outIndex + 1] : undefined,
                skipZip,
            };
            await buildPlugin(config);
            break;
        }
        case "init": {
            const nameIndex = args.indexOf("--name");
            const name = nameIndex >= 0 ? args[nameIndex + 1] : undefined;
            const dirIndex = args.indexOf("--dir");
            const dir = dirIndex >= 0 ? args[dirIndex + 1] : undefined;
            await scaffoldPlugin({ name, dir });
            break;
        }
        case "help":
        case "--help":
        case "-h":
            printHelp();
            break;
        default:
            console.error(`Unknown command: "${command}"`);
            printHelp();
            process.exit(1);
    }
}
function printHelp() {
    console.log(`
  OpenShield Plugin Builder

  Usage:
    plugin-builder build              Build the plugin in the current directory
    plugin-builder init               Scaffold a new plugin project
    plugin-builder help               Show this help message

  Build Options:
    --src <path>    Source directory (default: current directory)
    --out <path>    Output directory (default: ./dist)
    --skip-zip      Skip creating the .zip archive

  Init Options:
    --name <name>   Plugin name (default: my-plugin)
    --dir <path>    Target directory (default: ./<name>)

  Examples:
    plugin-builder build
    plugin-builder build --src ./my-plugin --out ./my-plugin/dist
    plugin-builder init --name compliance
  `);
}
main().catch((err) => {
    console.error("Build failed:", err.message);
    process.exit(1);
});
//# sourceMappingURL=cli.js.map