"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SidebarNavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  /** If true, rendered with admin/violet styling */
  isAdmin?: boolean;
}

export interface SidebarSection {
  id: string;
  label?: string;
  items: SidebarNavItem[];
}

// ─── Icons ───────────────────────────────────────────────────────────────────

export function DashboardIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
}

export function AgentsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
    </svg>
  );
}

export function JobsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.75a3 3 0 00-6 0m6 0a3 3 0 016 0m-6 0v3m0-3h-6m6 0h6m-3 3v3m0 0h-3m3 0h3m-6 0H9m3 0h3m-6 0a3 3 0 01-3 3m0 0a3 3 0 01-3-3m3 3v6m0-6H3m3 0h3m3 0h3m3 0h3m-3 0v6m0-6h3" />
    </svg>
  );
}

export function TasksIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.045 3.35 8.1 4.515 8.1 5.65V6M3 9h3.75m-3.75 6h3.75m-3.75 3h3.75" />
    </svg>
  );
}

export function QueriesIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.568 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.582 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
    </svg>
  );
}

export function GroupsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
  );
}

export function BulkOpsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
    </svg>
  );
}

export function UsersIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

export function RolesIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

export function SSOIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}

export function PluginsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.94 5.94a2.12 2.12 0 01-3-3l5.94-5.94M13 3l6 6m-5-1v10" />
    </svg>
  );
}

export function DefaultPluginIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.94 5.94a2.12 2.12 0 01-3-3l5.94-5.94M13 3l6 6m-5-1v10" />
    </svg>
  );
}

export function CollapseIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
    </svg>
  );
}

export function ExpandIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

// ─── Sidebar Client Component ────────────────────────────────────────────────

const STORAGE_KEY = "openshield-sidebar-collapsed";

export function SidebarClient({
  sections,
  adminItems,
  userName,
  userInitial,
}: {
  sections: SidebarSection[];
  adminItems: SidebarNavItem[];
  userName?: string;
  userInitial?: string;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [hovered, setHovered] = useState(false);

  // Load initial state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "true") {
      setCollapsed(true);
    }
  }, []);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  // Sync MainContent margin after render via a side-effect, not during render
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("sidebar-toggle", { detail: collapsed }));
  }, [collapsed]);

  const isExpanded = !collapsed || hovered;
  const effectiveWidth = isExpanded ? "var(--sidebar-width-expanded)" : "var(--sidebar-width-collapsed)";

  function isActive(href: string): boolean {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <aside
      className="fixed left-0 top-16 bottom-0 z-40 flex flex-col bg-[#111111]/90 backdrop-blur-md border-r border-white/10 transition-all duration-300 ease-in-out overflow-hidden"
      style={{ width: effectiveWidth }}
      onMouseEnter={() => collapsed && setHovered(true)}
      onMouseLeave={() => collapsed && setHovered(false)}
    >
      {/* Sidebar Header */}
      <div className="flex items-center h-14 px-4 border-b border-white/10 shrink-0">
        {isExpanded ? (
          <span className="text-sm font-semibold bg-gradient-to-r from-violet-500 to-blue-500 bg-clip-text text-transparent whitespace-nowrap">
            OpenShield
          </span>
        ) : (
          <span className="text-sm font-bold bg-gradient-to-r from-violet-500 to-blue-500 bg-clip-text text-transparent mx-auto">
            OS
          </span>
        )}
      </div>

      {/* Scrollable Nav Area */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2 space-y-4 scrollbar-none">
        {sections.map((section) => (
          <div key={section.id}>
            {section.label && isExpanded && (
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-600 select-none">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      active
                        ? item.isAdmin
                          ? "bg-violet-500/10 border border-violet-500/20 text-violet-400"
                          : "bg-white/10 text-white"
                        : item.isAdmin
                        ? "text-violet-400/70 hover:text-violet-300 hover:bg-violet-500/10"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                    title={!isExpanded ? item.label : undefined}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    {isExpanded && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Admin Footer Section */}
      {adminItems.length > 0 && (
        <div className="border-t border-white/10 py-2 px-2 space-y-0.5">
          {isExpanded && (
            <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-violet-500/60 select-none">
              Administration
            </p>
          )}
          {adminItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  active
                    ? "bg-violet-500/10 border border-violet-500/20 text-violet-400"
                    : "text-violet-400/70 hover:text-violet-300 hover:bg-violet-500/10"
                }`}
                title={!isExpanded ? item.label : undefined}
              >
                <span className="shrink-0">{item.icon}</span>
                {isExpanded && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </div>
      )}

      {/* User & Collapse Footer */}
      <div className="border-t border-white/10 py-2 px-2 shrink-0">
        {/* User info (expanded only) */}
        {isExpanded && userName && (
          <div className="flex items-center gap-2 px-3 py-2 mb-1 rounded-lg">
            <div className="w-7 h-7 rounded-full bg-gradient-to-r from-violet-500 to-blue-500 flex items-center justify-center text-white font-semibold text-xs shrink-0">
              {userInitial ?? "?"}
            </div>
            <span className="text-sm text-gray-400 truncate">{userName}</span>
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={toggle}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:text-white hover:bg-white/5 transition-all duration-200"
          title={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          <span className="shrink-0">{collapsed ? <ExpandIcon /> : <CollapseIcon />}</span>
          {isExpanded && <span className="truncate">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}