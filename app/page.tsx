import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Redirect to dashboard if already logged in
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-[#0a0a0a] pt-16">
      {/* Subtle background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      <main className="relative flex flex-1 w-full max-w-4xl flex-col items-center justify-center py-32 px-6">
        <div className="text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-sm text-gray-400">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Secure Admin Dashboard
          </div>

          {/* Hero Title */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-violet-500 to-blue-500 bg-clip-text text-transparent">
              OpenShield
            </span>
            <br />
            <span className="text-gray-100">Dashboard</span>
          </h1>

          {/* Description */}
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Secure admin panel built with{" "}
            <span className="text-gray-200 font-medium">Better Auth</span> and{" "}
            <span className="text-gray-200 font-medium">PostgreSQL</span>.
            Manage your application with confidence.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/login"
              className="bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 shadow-[0_0_20px_rgba(139,92,246,0.15)] hover:shadow-[0_0_30px_rgba(139,92,246,0.3)]"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white px-8 py-3 rounded-lg font-medium transition-all duration-200"
            >
              Learn more
            </Link>
          </div>

          {/* Footer note */}
          <p className="text-sm text-gray-600 pt-8">
            Contact your administrator for account access
          </p>
        </div>
      </main>
    </div>
  );
}
