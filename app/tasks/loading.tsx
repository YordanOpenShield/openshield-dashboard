import { TableSkeleton } from "@/components/loading-skeleton";

export default function TasksLoading() {
  return (
    <div className="flex flex-col flex-1 bg-[#0a0a0a] pt-16">
      <main className="flex-1 w-full max-w-6xl mx-auto p-6 sm:p-8 lg:p-10">
        <div className="mb-8">
          <div className="h-8 w-24 bg-white/10 rounded animate-pulse mb-2" />
          <div className="h-4 w-48 bg-white/10 rounded animate-pulse" />
        </div>
        <TableSkeleton rows={5} />
      </main>
    </div>
  );
}
