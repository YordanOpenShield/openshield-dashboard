import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { SignOutButton } from "./sign-out-button";
import { hasAnyAdminPermission, requirePermission } from "@/lib/permissions";
import { getPluginRegistry } from "@/lib/plugins";

// ─── Core navigation items (always present) ────────────────────────────────

interface CoreNavSection {
  label: string;
  href: string;
  /** If set, requires this permission to show */
  permission?: string;
  /** Admin-link style (violet color) */
  isAdmin?: boolean;
}

const coreMainNav: CoreNavSection[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Agents", href: "/agents" },
  { label: "Jobs", href: "/jobs" },
  { label: "Tasks", href: "/tasks" },
  { label: "Queries", href: "/queries" },
  { label: "Groups", href: "/groups" },
  { label: "Bulk Ops", href: "/bulk-operations" },
];

export async function Navbar() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const hdrs = await headers();

  // Check if user has any admin permission to show the Admin link
  const canAccessAdmin = session ? await hasAnyAdminPermission(hdrs) : false;

  // Get plugin navigation items
  const pluginNavItems = session
    ? (await getPluginRegistry()).getNavItems("main")
    : { main: [] as any[], admin: [] as any[] };
  // getNavItems returns an array, but we need to handle the async Map return
  // Actually getNavItems returns PluginNavigationItem[] directly
  const pluginNav: { label: string; href: string; permission?: string }[] = [];
  if (session) {
    const registry = await getPluginRegistry();
    const items = await registry.getNavItems("main");
    for (const item of items) {
      pluginNav.push({ label: item.label, href: item.href, permission: item.permission });
    }
  }

  // Permission check helper for nav items
  async function canSeeItem(item: { permission?: string }): Promise<boolean> {
    if (!item.permission) return true;
    if (!session) return false;
    const [resource, action] = item.permission.split(":");
    if (!resource || !action) return true;
    const result = await requirePermission({ [resource]: [action] }, hdrs);
    return result.authorized;
  }

  return (
    <nav className="fixed top-0 w-full bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/10 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link
              href="/"
              className="text-xl font-bold bg-gradient-to-r from-violet-500 to-blue-500 bg-clip-text text-transparent"
            >
              OpenShield
            </Link>
            {session && (
              <div className="hidden md:flex ml-8 space-x-1">
                {/* Core main nav */}
                {await Promise.all(
                  coreMainNav.map(async (item) => {
                    if (!(await canSeeItem(item))) return null;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="text-gray-400 hover:text-white hover:bg-white/5 px-2.5 py-2 rounded-md text-sm font-medium transition-all duration-200"
                      >
                        {item.label}
                      </Link>
                    );
                  })
                )}

                {/* Plugin nav items */}
                {pluginNav.length > 0 && (
                  <>
                    <span className="text-gray-600 self-center text-xs font-medium px-1 select-none">|</span>
                    {await Promise.all(
                      pluginNav.map(async (item) => {
                        if (!(await canSeeItem(item))) return null;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="text-gray-400 hover:text-white hover:bg-white/5 px-2.5 py-2 rounded-md text-sm font-medium transition-all duration-200"
                          >
                            {item.label}
                          </Link>
                        );
                      })
                    )}
                  </>
                )}

                {canAccessAdmin && (
                  <>
                    <span className="text-gray-600 self-center text-xs font-medium px-1 select-none">|</span>
                    <Link
                      href="/admin/users"
                      className="text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 px-2.5 py-2 rounded-md text-sm font-medium transition-all duration-200"
                    >
                      Admin
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {session ? (
              <>
                <span className="text-gray-400 text-sm">{session.user.name}</span>
                <SignOutButton />
              </>
            ) : (
              <Link
                href="/login"
                className="bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-all duration-200"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
