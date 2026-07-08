/**
 * ─── Admin Plugin Management Page ──────────────────────────────────────────
 *
 * Lists all installed plugins with status, version, and actions.
 * Allows uploading new plugins via zip and uninstalling existing ones.
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface PluginInfo {
  id: string;
  name: string;
  version: string;
  description: string | null;
  enabled: boolean;
  installedAt: string;
  hasServer: boolean;
  hasClient: boolean;
}

// ─── Toast ──────────────────────────────────────────────────────────────────

function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor =
    type === "success"
      ? "bg-green-500/10 border-green-500/20 text-green-400"
      : "bg-red-500/10 border-red-500/20 text-red-400";

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-md shadow-xl"
      style={{ animation: "slideIn 0.3s ease-out" }}
    >
      <style jsx>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className={`${bgColor} px-4 py-2.5 rounded-lg text-sm font-medium`}>
        {message}
      </div>
    </div>
  );
}

// ─── Uninstall Confirm Modal ────────────────────────────────────────────────

function ConfirmModal({
  open,
  onClose,
  title,
  message,
  confirmLabel = "Uninstall",
  loading,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  loading: boolean;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-[#111111] border border-white/10 rounded-xl shadow-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-200 mb-2">{title}</h3>
        <p className="text-sm text-gray-400 mb-6">{message}</p>
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function AdminPluginsPage() {
  const [plugins, setPlugins] = useState<PluginInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uninstalling, setUninstalling] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Fetch plugins ─────────────────────────────────────────────────────────

  const fetchPlugins = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/plugins");
      if (!res.ok) throw new Error("Failed to fetch plugins");
      const data = await res.json();
      setPlugins(data.plugins ?? []);
    } catch {
      setToast({ message: "Failed to load plugins", type: "error" });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlugins();
  }, [fetchPlugins]);

  // ─── Upload plugin ─────────────────────────────────────────────────────────

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("plugin", file);

      const res = await fetch("/api/admin/plugins/install", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Installation failed");
      }

      setToast({ message: `Plugin "${data.name}" installed successfully`, type: "success" });
      fetchPlugins();
    } catch (err: any) {
      setToast({ message: err.message || "Installation failed", type: "error" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ─── Uninstall plugin ──────────────────────────────────────────────────────

  const [confirmUninstall, setConfirmUninstall] = useState<string | null>(null);

  const handleUninstall = async () => {
    if (!confirmUninstall) return;
    setUninstalling(confirmUninstall);
    try {
      const res = await fetch(`/api/admin/plugins/${confirmUninstall}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Uninstall failed");
      }

      setToast({ message: "Plugin uninstalled successfully", type: "success" });
      setConfirmUninstall(null);
      fetchPlugins();
    } catch (err: any) {
      setToast({ message: err.message || "Uninstall failed", type: "error" });
    } finally {
      setUninstalling(null);
    }
  };

  // ─── Toggle plugin enabled/disabled ────────────────────────────────────────

  const handleToggle = async (pluginId: string, enabled: boolean) => {
    try {
      const res = await fetch(`/api/admin/plugins/${pluginId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to update plugin");
      }

      setPlugins((prev) =>
        prev.map((p) => (p.id === pluginId ? { ...p, enabled } : p))
      );
      setToast({
        message: `Plugin ${enabled ? "enabled" : "disabled"} successfully`,
        type: "success",
      });
    } catch (err: any) {
      setToast({ message: err.message || "Failed to update plugin", type: "error" });
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 p-6 sm:p-8 lg:p-10">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Plugins</h1>
          <p className="text-gray-400 text-sm mt-1">
            Install and manage dashboard plugins
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            onChange={handleUpload}
            className="hidden"
            id="plugin-upload"
          />
          <label
            htmlFor="plugin-upload"
            className={`inline-flex items-center gap-2 bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50 cursor-pointer ${
              uploading ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Installing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                Upload Plugin
              </>
            )}
          </label>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-400">
          <span className="font-semibold">Plugins extend the dashboard with new features.</span>{" "}
          Upload a plugin archive (.zip) to install. Changes take effect after a server restart.
          Plugins are developed independently using the{" "}
          <code className="text-xs bg-blue-500/20 px-1 py-0.5 rounded">@openshield/plugin-sdk</code>.
        </p>
      </div>

      {/* Plugin Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-lg p-5">
              <div className="h-5 bg-white/5 rounded w-2/3 mb-3 animate-pulse" />
              <div className="h-4 bg-white/5 rounded w-1/3 mb-2 animate-pulse" />
              <div className="h-4 bg-white/5 rounded w-full animate-pulse" />
            </div>
          ))}
        </div>
      ) : plugins.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.94 5.94a2.12 2.12 0 01-3-3l5.94-5.94M13 3l6 6m-5-1v10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-400 mb-2">No plugins installed</h3>
          <p className="text-sm text-gray-600 max-w-md mx-auto">
            Upload a plugin archive (.zip) to get started. Plugins add new features like
            compliance management, EDR integration, and more.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plugins.map((plugin) => (
            <div
              key={plugin.id}
              className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-lg p-5 transition-all duration-200 hover:border-white/20"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-violet-500/20 to-blue-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400 font-semibold text-sm shrink-0">
                    {plugin.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-200">{plugin.name}</h3>
                    <p className="text-xs text-gray-600">v{plugin.version}</p>
                  </div>
                </div>
                {/* Status toggle */}
                <button
                  type="button"
                  onClick={() => handleToggle(plugin.id, !plugin.enabled)}
                  className={`relative w-10 h-5 rounded-full transition-all duration-200 ${
                    plugin.enabled ? "bg-violet-500" : "bg-white/10"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200 ${
                      plugin.enabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Description */}
              <p className="text-xs text-gray-500 mb-4 line-clamp-2">
                {plugin.description || "No description"}
              </p>

              {/* Capabilities */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {plugin.hasServer && (
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Server
                  </span>
                )}
                {plugin.hasClient && (
                  <span className="text-xs px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">
                    UI
                  </span>
                )}
                {!plugin.hasServer && !plugin.hasClient && (
                  <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                    Manifest only
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setConfirmUninstall(plugin.id)}
                  disabled={uninstalling === plugin.id}
                  className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2.5 py-1.5 rounded-md transition-all duration-200 disabled:opacity-50"
                >
                  {uninstalling === plugin.id ? "Removing..." : "Uninstall"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Uninstall Confirmation */}
      <ConfirmModal
        open={!!confirmUninstall}
        onClose={() => setConfirmUninstall(null)}
        title="Uninstall Plugin"
        message={`Are you sure you want to uninstall "${confirmUninstall}"? This will remove all plugin files and associated data. This action cannot be undone.`}
        confirmLabel="Uninstall"
        loading={uninstalling === confirmUninstall}
        onConfirm={handleUninstall}
      />

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
