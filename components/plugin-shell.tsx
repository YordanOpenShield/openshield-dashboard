/**
 * ─── Plugin Shell Layout ────────────────────────────────────────────────────
 *
 * Reusable wrapper for all plugin pages. Provides:
 *   - Plugin name header with icon
 *   - Sub-navigation tabs (from plugin's declared pages)
 *   - Consistent glassmorphism styling
 */

import Link from "next/link";

interface Tab {
  slug: string;
  title: string;
  href: string;
}

export async function PluginShell({
  pluginName,
  pluginIcon,
  pageTitle,
  tabs,
  currentTabSlug,
  children,
}: {
  pluginName: string;
  pluginIcon?: string;
  pageTitle: string;
  tabs: Tab[];
  currentTabSlug?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#0a0a0a]">
      {/* Plugin Header */}
      <div className="border-b border-white/10 bg-[#111111]/50">
        <div className="px-6 py-4">
          <div className="flex items-center gap-3 mb-3">
            {pluginIcon && (
              <img
                src={`/plugins/${pluginIcon}`}
                alt=""
                className="w-6 h-6"
              />
            )}
            <h1 className="text-lg font-semibold text-gray-100">{pluginName}</h1>
            <span className="text-gray-500 text-sm">/</span>
            <span className="text-sm text-gray-400">{pageTitle}</span>
          </div>

          {/* Sub-navigation tabs */}
          {tabs.length > 0 && (
            <nav className="flex gap-1 -mb-px">
              {tabs.map((tab) => {
                const isActive = tab.slug === currentTabSlug;
                return (
                  <Link
                    key={tab.slug}
                    href={tab.href}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-200 ${
                      isActive
                        ? "text-violet-400 border-b-2 border-violet-500 bg-[#0a0a0a]"
                        : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                    }`}
                  >
                    {tab.title}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
      </div>

      {/* Page Content */}
      <div className="flex-1">
        <div className="px-6 py-6">
          {children}
        </div>
      </div>
    </div>
  );
}
