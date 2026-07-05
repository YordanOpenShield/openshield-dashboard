import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-center py-32 px-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to OpenShield
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            A Next.js app with Better Auth and PostgreSQL
          </p>

          {session ? (
            <div className="space-y-4">
              <p className="text-green-600 font-medium">
                You are signed in as {session.user.email}
              </p>
              <div className="flex justify-center gap-4">
                <Link
                  href="/dashboard"
                  className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700"
                >
                  Go to Dashboard
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex justify-center gap-4">
              <Link
                href="/login"
                className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="bg-white text-indigo-600 border border-indigo-600 px-6 py-3 rounded-md hover:bg-gray-50"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
