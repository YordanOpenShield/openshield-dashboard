import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function JobsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) redirect("/login");

  return (
    <div className="flex flex-col flex-1 bg-[#0a0a0a]">
      <main className="flex-1 w-full p-6 sm:p-8 lg:p-10">
        {children}
      </main>
    </div>
  );
}
