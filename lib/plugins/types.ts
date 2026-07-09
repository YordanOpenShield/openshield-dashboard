/**
 * ─── Plugin Type Definitions ────────────────────────────────────────────────
 *
 * These types define the contract between the dashboard host and all plugins.
 * Both the registry (dashboard-side) and the SDK (plugin-author-side) use these.
 *
 * A plugin is distributed as a .zip archive or directory with:
 *   manifest.json          — metadata, nav items, permissions, pages, API, hooks
 *   server/index.js        — compiled server bundle (API handlers, migrations)
 *   client/ui.js           — compiled client bundle (React components)
 *   migrations/            — SQL migration files
 *   assets/                — static assets (icons, etc.)
 */

// ─── Manifest ───────────────────────────────────────────────────────────────

/** Where a nav item should appear */
export type NavItemType = "main" | "admin";

export interface PluginNavigationItem {
  /** main or admin sidebar */
  type: NavItemType;
  /** Display label */
  label: string;
  /** URL path (e.g. /plugin/compliance/risks) */
  href: string;
  /** Icon identifier or SVG name */
  icon?: string;
  /** Permission required to see this item: "resource:action" */
  permission?: string;
}

export interface PluginPageDef {
  /** Component name as exported by the client bundle */
  component: string;
  /** Page title shown in browser tab and breadcrumbs */
  title: string;
  /** Permission required: "resource:action" */
  permission?: string;
}

export interface PluginApiDef {
  /** Allowed HTTP methods for this path */
  methods: string[];
}

/** Where action hooks can appear in the UI */
export type HookLocation =
  | "agent-detail-toolbar"
  | "agent-detail-tabs"
  | "dashboard-widgets"
  | "job-detail-toolbar"
  | "query-result-actions"
  | "user-detail-toolbar";

export interface PluginActionHook {
  /** Where in the UI this hook renders */
  location: HookLocation;
  /** Button/tab label */
  label: string;
  /** Optional icon */
  icon?: string;
  /** Permission required to see/use this hook */
  permission?: string;
  /** What happens when triggered */
  action:
    | { type: "navigate"; page: string; params?: Record<string, string> }
    | { type: "open-modal"; component: string }
    | { type: "call-api"; endpoint: string; method?: string };
}

export interface PluginManifest {
  /** Unique plugin ID (e.g. "compliance", "edr") */
  id: string;
  /** Human-readable name */
  name: string;
  /** Semver version */
  version: string;
  /** Short description */
  description?: string;
  /** Path to icon within the plugin bundle (e.g. "assets/icon.svg") */
  icon?: string;
  /** Semver range of host compatibility (e.g. "^1.0.0") */
  requires?: string;
  /** Permission resources and actions this plugin adds */
  permissions?: Record<string, string[]>;
  /** Navigation items to inject into the dashboard */
  navigation?: PluginNavigationItem[];
  /** Page definitions keyed by slug ("" = root) */
  pages?: Record<string, PluginPageDef>;
  /** API endpoint definitions keyed by path */
  api?: Record<string, PluginApiDef>;
  /** UI action hooks */
  hooks?: PluginActionHook[];
  /** JSON Schema for plugin settings (shown in admin UI) */
  settingsSchema?: Record<string, unknown>;
  /** Whether this plugin can be uninstalled via UI (default true) */
  uninstallable?: boolean;
}

// ─── Server Module ──────────────────────────────────────────────────────────

/** Context passed to server-side plugin handlers */
export interface RequestContext {
  db: import("pg").Pool;
  auth: any;
  permissions: {
    require: (resource: string, action: string) => Promise<boolean>;
  };
  pluginConfig: Record<string, unknown>;
}

/** What a server bundle must export */
export interface PluginServerModule {
  /** Called when plugin is installed — run DB migrations, seed data */
  install?: (context: RequestContext) => Promise<void>;
  /** Called when plugin is uninstalled — cleanup */
  uninstall?: (context: RequestContext) => Promise<void>;
  /** API route handlers keyed by "path:HTTP_METHOD" */
  api?: Record<string, (request: Request, context: RequestContext) => Promise<Response>>;
  /** Data fetchers for pages keyed by page slug. Returns serializable data. */
  dataFetchers?: Record<string, (params: Record<string, string>, context: RequestContext) => Promise<unknown>>;
}

// ─── Client Module ──────────────────────────────────────────────────────────

/** What a client bundle must export (pre-compiled, no TSX) */
export interface PluginClientModule {
  /** Plugin name / identifier */
  name: string;
  /** Called on load — receives registry to register components */
  initialize: (registry: PluginClientRegistry) => void;
  /** Called on unload — cleanup */
  uninitialize?: () => void;
}

/** Registry given to plugins so they can register UI extensions */
export interface PluginClientRegistry {
  registerPage: (name: string, component: React.ComponentType<any>) => void;
  registerNavItem: (item: PluginNavigationItem) => void;
  registerActionHook: (hook: PluginActionHook) => void;
  registerAdminSettingsComponent: (component: React.ComponentType<any>) => void;
}

// ─── Loaded Plugin (internal registry) ──────────────────────────────────────

export type PluginState = "discovered" | "loading" | "active" | "failed" | "stopped";

export interface LoadedPlugin {
  manifest: PluginManifest;
  /** Loaded server module (null if not yet loaded or server bundle absent) */
  server: PluginServerModule | null;
  /** Current lifecycle state */
  state: PluginState;
  /** Error message if in "failed" state */
  error?: string;
  /** When the plugin was loaded */
  loadedAt?: Date;
  /** Whether the plugin is enabled in the DB */
  enabled: boolean;
}

// ─── DB Row Types ──────────────────────────────────────────────────────────

export interface PluginRegistryRow {
  id: string;
  name: string;
  version: string;
  description: string | null;
  manifest: PluginManifest;
  enabled: boolean;
  installed_at: string;
  updated_at: string;
  settings: Record<string, unknown>;
}

export interface PluginMigrationRow {
  plugin_id: string;
  filename: string;
  hash: string;
  executed_at: string;
}
