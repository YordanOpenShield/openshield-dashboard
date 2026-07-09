# @openshield/plugin-builder

CLI tool for compiling and packaging OpenShield Dashboard plugins.

## Installation

```bash
npm install -g @open_shield/plugin-builder
# or
npx @open_shield/plugin-builder <command>
```

## Usage

### Create a new plugin

```bash
plugin-builder init --name my-plugin
cd my-plugin
npm install
```

This scaffolds a complete plugin project with:
- TypeScript configuration
- Manifest template
- Server boilerplate (API routes, DB migrations)
- Client boilerplate (React components)
- Plugin icon

### Build a plugin

```bash
cd my-plugin
plugin-builder build
```

Output: `plugin-my-plugin-1.0.0.zip`

The build process:
1. Generates `manifest.json` from `manifest.ts` (or reads existing `manifest.json`)
2. Compiles `src/server/` → `server/index.js` (Node.js, CommonJS, all deps bundled)
3. Compiles `src/client/` → `client/ui.js` (Browser, IIFE, React/ReactDOM externalized)
4. Copies `src/server/migrations/*.sql` → `migrations/`
5. Copies `assets/*` → `assets/`
6. Packages everything into a `.zip` archive

### Build options

```bash
plugin-builder build                          # Build from current directory
plugin-builder build --src ./plugin           # Custom source directory
plugin-builder build --out ./dist             # Custom output directory
plugin-builder build --skip-zip               # Skip .zip creation (for development)
```

## Plugin Structure

```
my-plugin/
├── manifest.ts              # Plugin manifest (or manifest.json)
├── package.json
├── tsconfig.json
├── src/
│   ├── server/
│   │   ├── index.ts         # Server entry — API handlers, lifecycle hooks
│   │   └── migrations/      # SQL migration files
│   └── client/
│       └── index.tsx        # Client entry — React components
└── assets/
    └── icon.svg             # Plugin icon
```

## Requirements

- Node.js 18+
- The plugin project must have `@openshield/plugin-sdk` as a dependency
