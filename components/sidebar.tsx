import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasAnyAdminPermission, requirePermission } from "@/lib/permissions";
import { getPluginRegistry } from "@/lib/plugins";
import {
  SidebarClient,
  DashboardIcon,
  AgentsIcon,
  JobsIcon,
  TasksIcon,
  QueriesIcon,
  GroupsIcon,
  BulkOpsIcon,
  UsersIcon,
  RolesIcon,
  SSOIcon,
  PluginsIcon,
  DefaultPluginIcon,
  type SidebarSection,
  type SidebarNavItem,
} from "./sidebar-client";

// ─── Core Nav Items ─────────────────────────────────────────────────────────

interface CoreNavItemDef {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const coreMainNav: CoreNavItemDef[] = [
  { href: "/dashboard", label: "Dashboard", icon: <DashboardIcon /> },
  { href: "/agents", label: "Agents", icon: <AgentsIcon /> },
  { href: "/jobs", label: "Jobs", icon: <JobsIcon /> },
  { href: "/tasks", label: "Tasks", icon: <TasksIcon /> },
  { href: "/queries", label: "Queries", icon: <QueriesIcon /> },
  { href: "/groups", label: "Groups", icon: <GroupsIcon /> },
  { href: "/bulk-operations", label: "Bulk Ops", icon: <BulkOpsIcon /> },
];

const adminNavDefs: CoreNavItemDef[] = [
  { href: "/admin/users", label: "Users", icon: <UsersIcon /> },
  { href: "/admin/roles", label: "Roles", icon: <RolesIcon /> },
  { href: "/admin/sso", label: "SSO Settings", icon: <SSOIcon /> },
  { href: "/admin/plugins", label: "Plugins", icon: <PluginsIcon /> },
];

// ─── Sidebar Server Component ───────────────────────────────────────────────

export async function Sidebar() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return null;

  const hdrs = await headers();

  // Check admin access
  const canAccessAdmin = await hasAnyAdminPermission(hdrs);

  // Get user roles for admin bypass
  const userRoles: string[] = ((session.user as any).role ?? "")
    .split(",")
    .map((r: string) => r.trim())
    .filter(Boolean);
  const isAdmin = userRoles.includes("admin");

  // ── Build main section ──────────────────────────────────────────────────

  const mainItems: SidebarNavItem[] = coreMainNav.map((item) => ({
    href: item.href,
    label: item.label,
    icon: item.icon,
  }));

  // ── Plugin nav items (main) ─────────────────────────────────────────────

  const registry = await getPluginRegistry();
  const pluginMainNav = await registry.getNavItems("main");

  for (const pluginItem of pluginMainNav) {
    // Permission check
    if (pluginItem.permission && !isAdmin) {
      const [resource, action] = pluginItem.permission.split(":");
      if (resource && action) {
        const perm = await requirePermission({ [resource]: [action] }, hdrs);
        if (!perm.authorized) continue;
      }
    }
    mainItems.push({
      href: pluginItem.href,
      label: pluginItem.label,
      icon: <DefaultPluginIcon />,
    });
  }

  const sections: SidebarSection[] = [
    {
      id: "main",
      label: "Navigation",
      items: mainItems,
    },
  ];

  // ── Build admin section ─────────────────────────────────────────────────

  const adminItems: SidebarNavItem[] = [];

  if (canAccessAdmin) {
    // Check each admin item's specific permission
    const [canViewUsers, canViewRoles, canManageSettings, canManagePlugins] = await Promise.all([
      requirePermission({ user: ["list"] }, hdrs),
      requirePermission({ roles: ["list"] }, hdrs),
      requirePermission({ sso: ["read"] }, hdrs),
      requirePermission({ roles: ["list"] }, hdrs),
    ]);

    const adminVisibility = {
      users: canViewUsers.authorized,
      roles: canViewRoles.authorized,
      sso: canManageSettings.authorized,
      plugins: canManagePlugins.authorized,
    };

    const adminCoreItems: { href: string; label: string; icon: React.ReactNode; key: string }[] = [
      { href: "/admin/users", label: "Users", icon: <UsersIcon />, key: "users" },
      { href: "/admin/roles", label: "Roles", icon: <RolesIcon />, key: "roles" },
      { href: "/admin/sso", label: "SSO Settings", icon: <SSOIcon />, key: "sso" },
      { href: "/admin/plugins", label: "Plugins", icon: <PluginsIcon />, key: "plugins" },
    ];

    for (const item of adminCoreItems) {
      if (isAdmin || adminVisibility[item.key as keyof typeof adminVisibility]) {
        adminItems.push({
          href: item.href,
          label: item.label,
          icon: item.icon,
          isAdmin: true,
        });
      }
    }

    // Plugin admin nav items
    const pluginAdminNav = await registry.getNavItems("admin");
    for (const pluginItem of pluginAdminNav) {
      if (pluginItem.permission && !isAdmin) {
        const [resource, action] = pluginItem.permission.split(":");
        if (resource && action) {
          const perm = await requirePermission({ [resource]: [action] }, hdrs);
          if (!perm.authorized) continue;
        }
      }
      adminItems.push({
        href: pluginItem.href,
        label: pluginItem.label,
        icon: <DefaultPluginIcon />,
        isAdmin: true,
      });
    }
  }

  return (
    <SidebarClient
      sections={sections}
      adminItems={adminItems}
      userName={session.user.name ?? undefined}
      userInitial={session.user.name?.charAt(0).toUpperCase()}
    />
  );
}