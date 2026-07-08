import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/permissions";
import {
  getAgentsList,
  getJobsList,
  getTasksList,
  getQueriesList,
  getQueryExecutionsList,
  getGroupsList,
} from "@/lib/manager-client";
import Link from "next/link";

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  color = "text-gray-200",
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-lg p-5 transition-all duration-200 hover:border-white/20">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className={`text-2xl font-semibold ${color}`}>{value}</p>
          {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
        </div>
        {icon && (
          <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Quick Action Button ─────────────────────────────────────────────────────

function QuickAction({
  href,
  label,
  desc,
}: {
  href: string;
  label: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-4 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/5 hover:border-white/10 transition-all duration-200 group"
    >
      <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-violet-500 to-blue-500 flex items-center justify-center shrink-0">
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">{label}</p>
        <p className="text-xs text-gray-600">{desc}</p>
      </div>
    </Link>
  );
}

// ─── Dashboard Page ──────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) redirect("/login");

  const hdrs = await headers();
  const canViewUsers = (await requirePermission({ user: ["list"] }, hdrs)).authorized;
  const roles = ((session.user as any).role?.split(",").filter(Boolean) ?? []) as string[];

  // Fetch manager stats in parallel (fail gracefully for each)
  const [
    agents,
    jobs,
    tasks,
    queries,
    executions,
    groups,
  ] = await Promise.allSettled([
    getAgentsList().catch(() => [] as never[]),
    getJobsList().catch(() => [] as never[]),
    getTasksList().catch(() => [] as never[]),
    getQueriesList().catch(() => [] as never[]),
    getQueryExecutionsList().catch(() => [] as never[]),
    getGroupsList().catch(() => [] as never[]),
  ]);

  const agentList = agents.status === "fulfilled" ? agents.value : [];
  const jobList = jobs.status === "fulfilled" ? jobs.value : [];
  const taskList = tasks.status === "fulfilled" ? tasks.value : [];
  const queryList = queries.status === "fulfilled" ? queries.value : [];
  const execList = executions.status === "fulfilled" ? executions.value : [];
  const groupList = groups.status === "fulfilled" ? groups.value : [];

  const connectedCount = agentList.filter((a) => a.state === "CONNECTED").length;
  const pendingTasks = taskList.filter((t) => t.status === "PENDING").length;
  const runningTasks = taskList.filter((t) => t.status === "RUNNING").length;
  const failedTasks = taskList.filter((t) => t.status === "FAILED").length;
  const completedExecs = execList.filter((e) => e.status === "COMPLETED").length;
  const failedExecs = execList.filter((e) => e.status === "FAILED").length;

  // Recent activity — last 5 tasks + last 5 executions
  const recentTasks = [...taskList]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const recentExecs = [...execList]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className="flex flex-col flex-1 bg-[#0a0a0a] pt-16">
      <main className="flex-1 w-full max-w-6xl mx-auto p-6 sm:p-8 lg:p-10">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-100">Dashboard</h1>
            <p className="text-gray-400 mt-1">
              Welcome back, {session.user.name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-wrap gap-1">
              {roles.length === 0 ? (
                <span className="text-xs text-gray-600">No roles</span>
              ) : (
                roles.map((r) => (
                  <span
                    key={r}
                    className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                      r === "admin" || canViewUsers
                        ? "bg-violet-500/10 border-violet-500/30 text-violet-400"
                        : "bg-blue-500/10 border-blue-500/30 text-blue-400"
                    }`}
                  >
                    {r}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Manager Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Agents"
            value={agentList.length}
            sub={`${connectedCount} connected`}
            color="text-green-400"
            icon={
              <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
              </svg>
            }
          />
          <StatCard
            label="Tasks"
            value={taskList.length}
            sub={
              pendingTasks > 0
                ? `${pendingTasks} pending, ${runningTasks} running`
                : runningTasks > 0
                ? `${runningTasks} running`
                : "All settled"
            }
            color={failedTasks > 0 ? "text-red-400" : "text-blue-400"}
            icon={
              <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />
          <StatCard
            label="Queries"
            value={queryList.length}
            sub={`${completedExecs} completed, ${failedExecs} failed`}
            color="text-violet-400"
            icon={
              <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75" />
              </svg>
            }
          />
          <StatCard
            label="Groups"
            value={groupList.length}
            sub={`${jobList.length} jobs available`}
            color="text-amber-400"
            icon={
              <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            }
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <QuickAction href="/agents" label="View Agents" desc="Monitor connected agents" />
            <QuickAction href="/jobs" label="Create Job" desc="Define a new job template" />
            <QuickAction href="/tasks" label="Assign Task" desc="Assign jobs to agents" />
            <QuickAction href="/queries" label="Run Query" desc="Execute a FleetDM-style query" />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Tasks */}
          <div className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Recent Tasks</h2>
              <Link href="/tasks" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                View all
              </Link>
            </div>
            {recentTasks.length === 0 ? (
              <p className="text-sm text-gray-600 py-4 text-center">No tasks yet</p>
            ) : (
              <div className="space-y-2">
                {recentTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        task.status === "COMPLETED" ? "bg-green-500" :
                        task.status === "FAILED" ? "bg-red-500" :
                        task.status === "RUNNING" ? "bg-blue-500" :
                        "bg-gray-500"
                      }`} />
                      <span className="text-sm text-gray-300 truncate font-mono text-xs">
                        {task.id.slice(0, 8)}…
                      </span>
                      <span className="text-xs text-gray-600">
                        agent: {task.agent_id.slice(0, 8)}…
                      </span>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      task.status === "COMPLETED" ? "bg-green-500/10 text-green-400" :
                      task.status === "FAILED" ? "bg-red-500/10 text-red-400" :
                      task.status === "RUNNING" ? "bg-blue-500/10 text-blue-400" :
                      "bg-gray-500/10 text-gray-400"
                    }`}>
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Query Executions */}
          <div className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Recent Query Executions</h2>
              <Link href="/queries" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                View all
              </Link>
            </div>
            {recentExecs.length === 0 ? (
              <p className="text-sm text-gray-600 py-4 text-center">No executions yet</p>
            ) : (
              <div className="space-y-2">
                {recentExecs.map((exec) => (
                  <div key={exec.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/[0.02] border border-white/5">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        exec.status === "COMPLETED" ? "bg-green-500" :
                        exec.status === "FAILED" ? "bg-red-500" :
                        exec.status === "RUNNING" ? "bg-blue-500" :
                        "bg-gray-500"
                      }`} />
                      <span className="text-sm text-gray-300 truncate">{exec.query?.name ?? "Unknown query"}</span>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      exec.status === "COMPLETED" ? "bg-green-500/10 text-green-400" :
                      exec.status === "FAILED" ? "bg-red-500/10 text-red-400" :
                      exec.status === "RUNNING" ? "bg-blue-500/10 text-blue-400" :
                      "bg-gray-500/10 text-gray-400"
                    }`}>
                      {exec.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* User Info Card */}
        <div className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-lg p-6 transition-all duration-200 hover:border-white/20 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-violet-500 to-blue-500 flex items-center justify-center text-white font-semibold text-sm">
              {session.user.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-200">User Information</h2>
              <p className="text-sm text-gray-500">Your account details</p>
            </div>
          </div>
          <div className="space-y-4">
            {[
              { label: "Name", value: session.user.name },
              { label: "Email", value: session.user.email },
              { label: "Roles", value: roles.length > 0 ? roles.join(", ") : "—" },
              { label: "User ID", value: session.user.id },
            ].map((field) => (
              <div key={field.label} className="flex items-center justify-between py-3 border-b border-white/5 last:border-b-0">
                <span className="text-sm text-gray-500">{field.label}</span>
                <span className="text-sm text-gray-200 font-mono">{field.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Admin Controls — visible to users with admin permissions */}
        {canViewUsers && (
          <div className="bg-[#111111]/80 backdrop-blur-md border border-violet-500/20 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/30 flex items-center justify-center">
                <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-200">Admin Controls</h2>
                <p className="text-sm text-gray-500">You have user management access</p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { action: "Manage users", desc: "Create, update, and delete users", href: "/admin/users" },
                { action: "Manage roles", desc: "Configure role permissions", href: "/admin/roles" },
                { action: "SSO settings", desc: "Configure OIDC and SAML providers", href: "/admin/sso" },
              ].map((item) => (
                <Link key={item.action} href={item.href}>
                  <div className="flex items-center gap-3 py-2.5 px-4 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/5 transition-colors cursor-pointer">
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                    <div>
                      <p className="text-sm text-gray-300">{item.action}</p>
                      <p className="text-xs text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
