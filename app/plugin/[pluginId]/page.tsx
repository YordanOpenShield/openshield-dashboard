/**
 * ─── Plugin Root Page ──────────────────────────────────────────────────────
 *
 * Handles /plugin/[pluginId] (no slug) — renders the plugin's root page.
 * Delegates to the catch-all handler with an empty slug.
 */

import PluginPage from "./[...slug]/page";

interface PageProps {
  params: Promise<{ pluginId: string }>;
}

export default async function PluginRootPage({ params }: PageProps) {
  const { pluginId } = await params;
  // Delegate to the catch-all page with empty slug array
  return PluginPage({ params: Promise.resolve({ pluginId, slug: [] }) });
}
