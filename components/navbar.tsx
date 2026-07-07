import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { SignOutButton } from "./sign-out-button";
import { hasAnyAdminPermission } from "@/lib/permissions";

export async function Navbar() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Check if user has any admin permission to show the Admin link
  const canAccessAdmin = session
    ? await hasAnyAdminPermission(await headers())
    : false;

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
              <div className="hidden md:flex ml-10 space-x-4">
                <Link
                  href="/dashboard"
                  className="text-gray-400 hover:text-white hover:bg-white/5 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200"
                >
                  Dashboard
                </Link>
                {canAccessAdmin && (
                  <Link
                    href="/admin/users"
                    className="text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200"
                  >
                    Admin
                  </Link>
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
