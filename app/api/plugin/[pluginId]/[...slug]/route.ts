/**
 * ─── Catch-All Plugin API Route ─────────────────────────────────────────────
 *
 * Handles all API calls to plugins at /api/plugin/[pluginId]/[...slug]
 *
 * Flow:
 *   1. Lookup plugin from registry
 *   2. Load server module (cached after first load)
 *   3. Resolve the endpoint from the slug + method
 *   4. Check permissions (if manifest declares them)
 *   5. Call the handler with request and context
 *   6. Return the response
 */

import { NextRequest, NextResponse } from "next/server";
import { getPluginRegistry } from "@/lib/plugins";
import { requirePermission } from "@/lib/permissions";
import type { RequestContext } from "@/lib/plugins/types";

interface RouteProps {
  params: Promise<{ pluginId: string; slug: string[] }>;
}

/**
 * Dispatch an API request to the appropriate plugin handler.
 */
async function handleRequest(
  request: NextRequest,
  props: RouteProps,
  method: string
): Promise<NextResponse> {
  const { pluginId, slug } = await props.params;

  // Lookup plugin
  const registry = await getPluginRegistry();
  const plugin = await registry.getPlugin(pluginId);

  if (!plugin || !plugin.enabled) {
    return NextResponse.json({ error: "Plugin not found" }, { status: 404 });
  }

  // Load the server bundle
  const serverModule = await registry.loadServerBundle(pluginId);
  if (!serverModule?.api) {
    return NextResponse.json(
      { error: "Plugin has no API handlers" },
      { status: 404 }
    );
  }

  // Resolve the handler: try exact path match first, then pattern match
  const pathPattern = slug?.join("/") ?? "";
  const handlerKey = `${pathPattern}:${method}`;
  let handler = serverModule.api[handlerKey];

  // If no exact match, try wildcard patterns
  if (!handler) {
    for (const [key, h] of Object.entries(serverModule.api)) {
      const [pattern, methodPattern] = key.split(":");
      if (methodPattern !== method) continue;

      // Simple pattern matching: convert {param} to regex
      const regex = new RegExp(
        "^" + pattern.replace(/\{([^}]+)\}/g, "([^/]+)") + "$"
      );
      const match = pathPattern.match(regex);
      if (match) {
        handler = h;
        break;
      }
    }
  }

  if (!handler) {
    return NextResponse.json(
      { error: `No handler for ${method} /api/plugin/${pluginId}/${pathPattern}` },
      { status: 404 }
    );
  }

  // Check API-level permission from manifest
  const apiDef = plugin.manifest.api?.[pathPattern];
  if (apiDef && !apiDef.methods.includes(method)) {
    return NextResponse.json(
      { error: `Method ${method} not allowed for this endpoint` },
      { status: 405 }
    );
  }

  // Build context
  const context: RequestContext = {
    db: (await import("@/lib/db")).pgPool,
    auth: (await import("@/lib/auth")).auth,
    permissions: {
      require: async (resource: string, action: string) => {
        const result = await requirePermission({ [resource]: [action] });
        return result.authorized;
      },
    },
    pluginConfig: {},
  };

  try {
    const response = await handler(request, context);
    return NextResponse.json(await response.json(), {
      status: response.status,
      headers: response.headers,
    });
  } catch (err: any) {
    console.error(`[plugins] API error for "${pluginId}/${pathPattern}":`, err);
    return NextResponse.json(
      { error: err?.message ?? "Internal plugin error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, props: RouteProps) {
  return handleRequest(request, props, "GET");
}

export async function POST(request: NextRequest, props: RouteProps) {
  return handleRequest(request, props, "POST");
}

export async function PATCH(request: NextRequest, props: RouteProps) {
  return handleRequest(request, props, "PATCH");
}

export async function PUT(request: NextRequest, props: RouteProps) {
  return handleRequest(request, props, "PUT");
}

export async function DELETE(request: NextRequest, props: RouteProps) {
  return handleRequest(request, props, "DELETE");
}
