/**
 * ─── Plugin SDK Type Definitions ────────────────────────────────────────────
 *
 * These types define the contract between the dashboard host and all plugins.
 * Plugin authors use these to build type-safe plugins.
 *
 * These mirror the types in the dashboard's lib/plugins/types.ts.
 */
export type NavItemType = "main" | "admin";
export interface PluginNavigationItem {
    type: NavItemType;
    label: string;
    href: string;
    icon?: string;
    permission?: string;
}
export interface PluginPageDef {
    component: string;
    title: string;
    permission?: string;
}
export interface PluginApiDef {
    methods: string[];
}
export type HookLocation = "agent-detail-toolbar" | "agent-detail-tabs" | "dashboard-widgets" | "job-detail-toolbar" | "query-result-actions" | "user-detail-toolbar";
export interface PluginActionHook {
    location: HookLocation;
    label: string;
    icon?: string;
    permission?: string;
    action: {
        type: "navigate";
        page: string;
        params?: Record<string, string>;
    } | {
        type: "open-modal";
        component: string;
    } | {
        type: "call-api";
        endpoint: string;
        method?: string;
    };
}
export interface PluginManifest {
    id: string;
    name: string;
    version: string;
    description?: string;
    icon?: string;
    requires?: string;
    permissions?: Record<string, string[]>;
    navigation?: PluginNavigationItem[];
    pages?: Record<string, PluginPageDef>;
    api?: Record<string, PluginApiDef>;
    hooks?: PluginActionHook[];
    settingsSchema?: Record<string, unknown>;
    uninstallable?: boolean;
}
export interface RequestContext {
    db: any;
    auth: any;
    permissions: {
        require: (resource: string, action: string) => Promise<boolean>;
    };
    pluginConfig: Record<string, unknown>;
}
export interface PluginServerModule {
    install?: (context: RequestContext) => Promise<void>;
    uninstall?: (context: RequestContext) => Promise<void>;
    api?: Record<string, (request: Request, context: RequestContext) => Promise<Response>>;
    dataFetchers?: Record<string, (params: Record<string, string>, context: RequestContext) => Promise<unknown>>;
}
export interface PluginClientRegistry {
    registerPage: (name: string, component: React.ComponentType<any>) => void;
    registerNavItem: (item: PluginNavigationItem) => void;
    registerActionHook: (hook: PluginActionHook) => void;
    registerAdminSettingsComponent: (component: React.ComponentType<any>) => void;
}
export interface PluginClientModule {
    name: string;
    initialize: (registry: PluginClientRegistry) => void;
    uninitialize?: () => void;
}
//# sourceMappingURL=types.d.ts.map