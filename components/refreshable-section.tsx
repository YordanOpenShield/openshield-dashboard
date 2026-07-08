"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  title: string;
  children: React.ReactNode;
}

export function RefreshableSection({ title, children }: Props) {
  const router = useRouter();
  const [spinning, setSpinning] = useState(false);

  const handleRefresh = () => {
    setSpinning(true);
    router.refresh();
    // Spinner stops when React re-renders after refresh
    setTimeout(() => setSpinning(false), 1500);
  };

  return (
    <div className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
          {title}
        </h2>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          title="Refresh"
        >
          <svg
            className={`w-3.5 h-3.5 ${spinning ? "animate-spin" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
            />
          </svg>
          Refresh
        </button>
      </div>
      {children}
    </div>
  );
}
