import { CardSkeleton, ListSkeleton } from "@/components/loading-skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col flex-1 bg-[#0a0a0a]">
      <main className="flex-1 w-full p-6 sm:p-8 lg:p-10">
        <div className="mb-8">
          <div className="h-8 w-48 bg-white/10 rounded animate-pulse mb-2" />
          <div className="h-4 w-64 bg-white/10 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ListSkeleton count={3} />
          <ListSkeleton count={3} />
        </div>
      </main>
    </div>
  );
}
