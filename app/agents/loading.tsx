import { ListSkeleton } from "@/components/loading-skeleton";

export default function AgentsLoading() {
  return (
    <div className="flex flex-col flex-1 bg-[#0a0a0a] pt-16">
      <main className="flex-1 w-full max-w-6xl mx-auto p-6 sm:p-8 lg:p-10">
        <div className="mb-8">
          <div className="h-8 w-32 bg-white/10 rounded animate-pulse mb-2" />
          <div className="h-4 w-48 bg-white/10 rounded animate-pulse" />
        </div>
        <ListSkeleton count={4} />
      </main>
    </div>
  );
}
