import { CardSkeleton } from "@/components/loading-skeleton";

export default function BulkOpDetailLoading() {
  return (
    <div className="flex flex-col flex-1 bg-[#0a0a0a] pt-16">
      <main className="flex-1 w-full max-w-6xl mx-auto p-6 sm:p-8 lg:p-10">
        <div className="h-4 w-48 bg-white/10 rounded animate-pulse mb-6" />
        <div className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-lg p-6 mb-6 animate-pulse">
          <div className="h-8 w-48 bg-white/10 rounded mb-2" />
          <div className="h-4 w-64 bg-white/10 rounded mb-4" />
          <div className="grid grid-cols-3 gap-3">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
        <CardSkeleton />
      </main>
    </div>
  );
}
