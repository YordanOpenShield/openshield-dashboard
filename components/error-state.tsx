"use client";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-8 text-center">
      <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center">
        <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-red-400 mb-2">Something went wrong</h2>
      <p className="text-sm text-red-300/70 max-w-sm mx-auto mb-6">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-medium px-4 py-2 rounded-md text-sm transition-all duration-200"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
