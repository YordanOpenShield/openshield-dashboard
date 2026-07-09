import { CardSkeleton } from "@/components/loading-skeleton";

export default function AgentDetailLoading() {
  return (
    <div className="flex flex-col flex-1 bg-[#0a0a0a]">
      <main className="flex-1 w-full p-6 sm:p-8 lg:p-10">
        <div className="h-4 w-32 bg-white/10 rounded animate-pulse mb-6" />
        <div className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-lg p-6 mb-6 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/10" />
            <div>
              <div className="h-6 w-48 bg-white/10 rounded mb-2" />
              <div className="h-4 w-64 bg-white/10 rounded" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><CardSkeleton /></div>
          <CardSkeleton />
        </div>
      </main>
    </div>
  );
}
