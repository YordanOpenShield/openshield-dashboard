import { CardSkeleton } from "@/components/loading-skeleton";

export default function QueryDetailLoading() {
  return (
    <div className="flex flex-col flex-1 bg-[#0a0a0a]">
      <main className="flex-1 w-full p-6 sm:p-8 lg:p-10">
        <div className="h-4 w-32 bg-white/10 rounded animate-pulse mb-6" />
        <div className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-lg p-6 mb-6 animate-pulse">
          <div className="h-8 w-48 bg-white/10 rounded mb-2" />
          <div className="h-4 w-96 bg-white/10 rounded mb-4" />
          <div className="h-24 w-full bg-white/10 rounded" />
        </div>
        <CardSkeleton />
      </main>
    </div>
  );
}
