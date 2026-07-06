import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AdminSidebarNav } from "@/components/admin-sidebar-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const role = (session.user as any).role ?? "user";
  const isAdmin = role === "admin" || role === "owner";

  if (!isAdmin) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-1 bg-[#0a0a0a] pt-16">
      {/* Admin Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-white/10 bg-[#111111]/50">
        <div className="p-4 border-b border-white/10">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Admin Panel
          </p>
        </div>

        <AdminSidebarNav />

        <div className="px-3 pb-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 text-sm font-medium transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        {/* Sidebar footer */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-violet-500 to-blue-500 flex items-center justify-center text-white font-semibold text-xs">
              {session.user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-300 truncate">{session.user.name}</p>
              <p className="text-xs text-violet-400 truncate">Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {children}
      </main>
    </div>
  );
}
