import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function Navbar() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-indigo-600">
              OpenShield
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {session ? (
              <>
                <span className="text-gray-700">{session.user.name}</span>
                <form
                  action={async () => {
                    "use server";
                    await auth.api.signOut({ headers: await headers() });
                    redirect("/login");
                  }}
                >
                  <button
                    type="submit"
                    className="text-gray-700 hover:text-indigo-600"
                  >
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-indigo-600"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
