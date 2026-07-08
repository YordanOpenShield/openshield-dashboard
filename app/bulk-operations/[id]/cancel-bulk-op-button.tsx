"use client";

import { useState } from "react";
import { cancelBulkOperation } from "@/lib/manager-client";

interface Props {
  operationId: string;
}

export function CancelBulkOpButton({ operationId }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCancel = async () => {
    if (!window.confirm("Cancel this bulk operation?")) return;
    setLoading(true);
    setError(null);
    try {
      await cancelBulkOperation(operationId);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel operation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleCancel}
        disabled={loading}
        className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-medium px-3 py-1.5 rounded-md text-xs transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Cancelling..." : "Cancel"}
      </button>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </>
  );
}
