export function CardSkeleton() {
  return (
    <div className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-lg p-5 animate-pulse">
      <div className="h-3 w-24 bg-white/10 rounded mb-3" />
      <div className="h-6 w-16 bg-white/10 rounded" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden animate-pulse">
      <div className="border-b border-white/10 px-5 py-3">
        <div className="h-3 w-32 bg-white/10 rounded" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-white/5 last:border-b-0">
          <div className="h-2 w-2 rounded-full bg-white/10" />
          <div className="h-3 w-48 bg-white/10 rounded" />
          <div className="h-3 w-24 bg-white/10 rounded ml-auto" />
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-lg p-5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-white/10" />
            <div className="flex-1">
              <div className="h-4 w-48 bg-white/10 rounded mb-2" />
              <div className="h-3 w-32 bg-white/10 rounded" />
            </div>
            <div className="h-6 w-20 bg-white/10 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
