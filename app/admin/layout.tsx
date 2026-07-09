import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { hasAnyAdminPermission } from "@/lib/permissions";

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

  const hdrs = await headers();

  // Gate admin access — show if user has ANY admin-level permission
  const canAccess = await hasAnyAdminPermission(hdrs);
  if (!canAccess) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col flex-1 bg-[#0a0a0a]">
      {/* Admin header bar */}
      <div className="border-b border-white/10 bg-[#111111]/50 px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-violet-500 to-blue-500 flex items-center justify-center text-white font-semibold text-xs shrink-0">
            {session.user.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm text-gray-300">Admin Panel</p>
            <p className="text-xs text-violet-400">{session.user.name}</p>
          </div>
        </div>
      </div>

      {/* Main Content — pages handle their own padding */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
