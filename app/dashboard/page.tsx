import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const role = (session.user as any).role ?? "user";
  const isAdmin = role === "admin" || role === "owner";

  return (
    <div className="flex flex-col flex-1 bg-[#0a0a0a] pt-16">
      <main className="flex-1 w-full max-w-5xl mx-auto p-6 sm:p-8 lg:p-10">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-100">Dashboard</h1>
            <p className="text-gray-400 mt-1">
              Welcome back, {session.user.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
              isAdmin
                ? "bg-violet-500/10 border-violet-500/30 text-violet-400"
                : "bg-blue-500/10 border-blue-500/30 text-blue-400"
            }`}>
              {role}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Status", value: "Active", color: "text-green-400" },
            { label: "Role", value: role.charAt(0).toUpperCase() + role.slice(1), color: isAdmin ? "text-violet-400" : "text-blue-400" },
            { label: "Member Since", value: new Date(session.user.createdAt ?? "").toLocaleDateString(), color: "text-gray-400" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-lg p-5 transition-all duration-200 hover:border-white/20"
            >
              <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
              <p className={`text-lg font-semibold ${stat.color}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* User Information Card */}
        <div className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-lg p-6 transition-all duration-200 hover:border-white/20 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-violet-500 to-blue-500 flex items-center justify-center text-white font-semibold text-sm">
              {session.user.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-200">
                User Information
              </h2>
              <p className="text-sm text-gray-500">
                Your account details
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { label: "Name", value: session.user.name },
              { label: "Email", value: session.user.email },
              { label: "Role", value: role },
              { label: "User ID", value: session.user.id },
            ].map((field) => (
              <div
                key={field.label}
                className="flex items-center justify-between py-3 border-b border-white/5 last:border-b-0"
              >
                <span className="text-sm text-gray-500">{field.label}</span>
                <span className="text-sm text-gray-200 font-mono">
                  {field.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Admin Section — only visible to admins */}
        {isAdmin && (
          <div className="bg-[#111111]/80 backdrop-blur-md border border-violet-500/20 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/30 flex items-center justify-center">
                <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-200">
                  Admin Controls
                </h2>
                <p className="text-sm text-gray-500">
                  Full read/write access granted
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { action: "Manage users", desc: "Create, update, and delete users" },
                { action: "System settings", desc: "Configure application settings" },
                { action: "Audit logs", desc: "View activity and security logs" },
              ].map((item) => (
                <div
                  key={item.action}
                  className="flex items-center gap-3 py-2.5 px-4 rounded-lg bg-white/[0.02] border border-white/5"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                  <div>
                    <p className="text-sm text-gray-300">{item.action}</p>
                    <p className="text-xs text-gray-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
