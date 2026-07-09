/**
 * ─── Plugin Builder: Scaffold ───────────────────────────────────────────────
 *
 * Generates a new plugin project with the recommended directory structure,
 * SDK dependency, and example source files.
 */

import path from "path";
import fs from "fs";

export interface ScaffoldOptions {
  name?: string;
  dir?: string;
}

export async function scaffoldPlugin(options: ScaffoldOptions = {}): Promise<void> {
  const pluginName = options.name ?? "my-plugin";
  const pluginDir = options.dir ?? path.join(process.cwd(), pluginName);

  if (fs.existsSync(pluginDir)) {
    throw new Error(`Directory "${pluginDir}" already exists. Choose a different name or target.`);
  }

  console.log(`\n  Scaffolding plugin: ${pluginName}`);
  console.log(`  Location: ${pluginDir}\n`);

  // Create directory structure
  const dirs = [
    "src/server/migrations",
    "src/client",
    "assets",
  ];
  for (const d of dirs) {
    fs.mkdirSync(path.join(pluginDir, d), { recursive: true });
  }

  // package.json
  const pkgJson = {
    name: `openshield-plugin-${pluginName}`,
    version: "1.0.0",
    private: true,
    type: "module",
    scripts: {
      build: "plugin-builder build",
      dev: "plugin-builder build --skip-zip",
    },
    dependencies: {
      "@open_shield/plugin-sdk": "^1.0.2",
    },
    devDependencies: {
      "@open_shield/plugin-builder": "^1.0.1",
      "typescript": "^5.0.0",
    },
  };
  fs.writeFileSync(
    path.join(pluginDir, "package.json"),
    JSON.stringify(pkgJson, null, 2)
  );

  // tsconfig.json
  const tsconfig = {
    compilerOptions: {
      target: "ES2020",
      module: "ES2020",
      moduleResolution: "bundler",
      strict: true,
      esModuleInterop: true,
      jsx: "react-jsx",
      skipLibCheck: true,
    },
    include: ["src/**/*", "manifest.ts"],
  };
  fs.writeFileSync(
    path.join(pluginDir, "tsconfig.json"),
    JSON.stringify(tsconfig, null, 2)
  );

  // manifest.ts (for type-checking during development)
  const manifestTs = `import { createManifest } from "@open_shield/plugin-sdk";

export default createManifest({
  id: "${pluginName}",
  name: "${pluginName.charAt(0).toUpperCase() + pluginName.slice(1)} Plugin",
  version: "1.0.0",
  description: "Description of ${pluginName}",
  icon: "assets/icon.svg",
  requires: "^1.0.0",

  permissions: {
    "${pluginName}": ["read"],
  },

  navigation: [
    { type: "main", label: "${pluginName.charAt(0).toUpperCase() + pluginName.slice(1)}", href: "/plugin/${pluginName}" },
  ],

  pages: {
    "": { component: "Dashboard", title: "${pluginName.charAt(0).toUpperCase() + pluginName.slice(1)}" },
  },

  api: {
    "data": { methods: ["GET"] },
  },
});
`;
  fs.writeFileSync(path.join(pluginDir, "manifest.ts"), manifestTs);

  // manifest.json (for the builder — read directly without compilation)
  const manifestJson = JSON.stringify({
    id: pluginName,
    name: pluginName.charAt(0).toUpperCase() + pluginName.slice(1) + " Plugin",
    version: "1.0.0",
    description: "Description of " + pluginName,
    icon: "assets/icon.svg",
    requires: "^1.0.0",
    permissions: { [pluginName]: ["read"] },
    navigation: [
      { type: "main", label: pluginName.charAt(0).toUpperCase() + pluginName.slice(1), href: "/plugin/" + pluginName },
    ],
    pages: {
      "": { component: "Dashboard", title: pluginName.charAt(0).toUpperCase() + pluginName.slice(1) },
    },
    api: {
      data: { methods: ["GET"] },
    },
  }, null, 2);
  fs.writeFileSync(path.join(pluginDir, "manifest.json"), manifestJson);
  fs.writeFileSync(path.join(pluginDir, "manifest.ts"), manifestTs);

  const safePluginName = pluginName.replace(/-/g, "_");

  // Server entry
  const serverIndex = `import { definePlugin } from "@open_shield/plugin-sdk";

export default definePlugin({
  async install(context) {
    // Create database tables
    await context.db.query(\`
      CREATE TABLE IF NOT EXISTS ${safePluginName}_data (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    \`);
  },

  async uninstall(context) {
    await context.db.query(\`DROP TABLE IF EXISTS ${safePluginName}_data\`);
  },

  api: {
    "data:GET": async (request, context) => {
      const result = await context.db.query(\`SELECT * FROM ${safePluginName}_data\`);
      return Response.json(result.rows);
    },
  },
});
`;
  fs.writeFileSync(path.join(pluginDir, "src", "server", "index.ts"), serverIndex);

  // Client entry
  const clientIndex = `import { createPluginUI } from "@open_shield/plugin-sdk";
import { Card, Heading, Text } from "@open_shield/plugin-sdk/components";

function Dashboard({ initialData }: { initialData: unknown }) {
  return (
    <div className="space-y-6">
      <Card>
        <Heading>${pluginName.charAt(0).toUpperCase() + pluginName.slice(1)} Dashboard</Heading>
        <Text variant="secondary">
          This is the ${pluginName} plugin. Edit <code>src/client/index.tsx</code> to get started.
        </Text>
      </Card>
    </div>
  );
}

export default createPluginUI({
  name: "${pluginName.charAt(0).toUpperCase() + pluginName.slice(1)} Plugin",
  initialize(registry) {
    registry.registerPage("Dashboard", Dashboard);
  },
});
`;
  fs.writeFileSync(path.join(pluginDir, "src", "client", "index.tsx"), clientIndex);

  // Migration example
  const migration = `-- ${pluginName}_data table
CREATE TABLE IF NOT EXISTS ${pluginName}_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`;
  fs.writeFileSync(path.join(pluginDir, "src", "server", "migrations", "001_create_tables.sql"), migration);

  // SVG icon
  const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M11.42 15.17l-5.94 5.94a2.12 2.12 0 01-3-3l5.94-5.94M13 3l6 6m-5-1v10"/>
</svg>`;
  fs.writeFileSync(path.join(pluginDir, "assets", "icon.svg"), icon);

  // .gitignore
  fs.writeFileSync(path.join(pluginDir, ".gitignore"), "node_modules/\ndist/\n*.zip\n");

  console.log("  ✅ Plugin scaffolded successfully!");
  console.log(`\n  Next steps:\n`);
  console.log(`    cd ${pluginName}`);
  console.log(`    npm install`);
  console.log(`    npm run build`);
  console.log(`    # Output: plugin-${pluginName}-1.0.0.zip\n`);
}
