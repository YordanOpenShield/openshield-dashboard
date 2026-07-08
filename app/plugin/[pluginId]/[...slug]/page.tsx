/**
 * ─── Catch-All Plugin Page ──────────────────────────────────────────────────
 *
 * Renders any plugin page at /plugin/[pluginId]/[...slug]
 *
 * This Server Component:
 *   1. Looks up the plugin in the registry
 *   2. Resolves the slug to a page definition from the manifest
 *   3. Checks the user's permission for this page
 *   4. Calls the plugin's server-side data fetcher (if any)
 *   5. Renders the PluginShell with PluginContent client component
 */

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { getPluginRegistry } from "@/lib/plugins";
import { requirePermission } from "@/lib/permissions";
import { PluginShell } from "@/components/plugin-shell";
import { PluginContent } from "@/components/plugin-content";
import type { PluginPageDef } from "@/lib/plugins/types";

interface PageProps {
  params: Promise<{ pluginId: string; slug: string[] }>;
}

export default async function PluginPage({ params }: PageProps) {
  const { pluginId, slug } = await params;

  // Authenticate
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  // Lookup plugin
  const registry = await getPluginRegistry();
  const plugin = await registry.getPlugin(pluginId);

  if (!plugin || !plugin.enabled) {
    notFound();
  }

  // Resolve the page definition from the manifest
  const pageSlug = slug?.join("/") ?? "";
  const pageDef: PluginPageDef | undefined = plugin.manifest.pages?.[pageSlug] ?? plugin.manifest.pages?.[""];

  if (!pageDef) {
    notFound();
  }

  // Check page-level permission
  if (pageDef.permission) {
    const [resource, action] = pageDef.permission.split(":");
    if (resource && action) {
      const auth = await requirePermission({ [resource]: [action] });
      if (!auth.authorized) {
        redirect("/dashboard");
      }
    }
  }

  // Load the server bundle and fetch initial data if a data fetcher exists
  let initialData: unknown = null;
  if (pageSlug) {
    const serverModule = await registry.loadServerBundle(pluginId);
    if (serverModule?.dataFetchers?.[pageSlug]) {
      try {
        initialData = await serverModule.dataFetchers[pageSlug]({}, {
          db: (await import("@/lib/db")).pgPool,
          auth: (await import("@/lib/auth")).auth,
          permissions: {
            require: async (res: string, act: string) => {
              const result = await requirePermission({ [res]: [act] });
              return result.authorized;
            },
          },
          pluginConfig: {},
        });
      } catch (err) {
        console.error(`[plugins] Data fetcher failed for "${pluginId}/${pageSlug}":`, err);
      }
    }
  }

  // Get all page tabs for the sub-navigation
  const pageTabs = Object.entries(plugin.manifest.pages ?? {})
    .filter(([slugKey]) => slugKey !== "")
    .map(([slugKey, def]) => ({
      slug: slugKey,
      title: def.title,
      href: `/plugin/${pluginId}/${slugKey}`,
    }));

  return (
    <PluginShell
      pluginName={plugin.manifest.name}
      pluginIcon={plugin.manifest.icon}
      pageTitle={pageDef.title}
      tabs={pageTabs}
      currentTabSlug={pageSlug}
    >
      <PluginContent
        pluginId={pluginId}
        componentName={pageDef.component}
        initialData={initialData}
      />
    </PluginShell>
  );
}
