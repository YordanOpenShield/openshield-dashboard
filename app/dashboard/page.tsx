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

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50">
      <main className="w-full max-w-4xl p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            User Information
          </h2>
          <div className="space-y-2">
            <p>
              <span className="font-medium text-gray-700">Name:</span>{" "}
              {session.user.name}
            </p>
            <p>
              <span className="font-medium text-gray-700">Email:</span>{" "}
              {session.user.email}
            </p>
            <p>
              <span className="font-medium text-gray-700">User ID:</span>{" "}
              {session.user.id}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
