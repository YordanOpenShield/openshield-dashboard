/**
 * ─── Admin Plugin Detail / Settings Page ────────────────────────────────────
 *
 * Shows plugin details and a dynamic settings form rendered from the
 * plugin manifest's settingsSchema.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { DynamicForm } from "@/components/dynamic-form";

// ─── Types ──────────────────────────────────────────────────────────────────

interface PluginInfo {
  id: string;
  name: string;
  version: string;
  description: string | null;
  enabled: boolean;
  hasServer: boolean;
  hasClient: boolean;
  manifest: {
    settingsSchema?: Record<string, unknown>;
    permissions?: Record<string, string[]>;
    pages?: Record<string, { title: string }>;
    api?: Record<string, { methods: string[] }>;
    hooks?: Array<{ location: string; label: string }>;
  };
}

// ─── Toast ──────────────────────────────────────────────────────────────────

function Toast({ message, type, onClose }: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className={`px-4 py-2.5 rounded-lg text-sm font-medium border backdrop-blur-md shadow-xl ${
        type === "success"
          ? "bg-green-500/10 border-green-500/20 text-green-400"
          : "bg-red-500/10 border-red-500/20 text-red-400"
      }`}>
        {message}
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function AdminPluginDetailPage() {
  const params = useParams();
  const router = useRouter();
  const pluginId = params.pluginId as string;

  const [plugin, setPlugin] = useState<PluginInfo | null>(null);
  const [settings, setSettings] = useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // ─── Fetch plugin info + settings ─────────────────────────────────────

  const fetchPlugin = useCallback(async () => {
    setIsLoading(true);
    try {
      // Get plugin info from the list endpoint
      const listRes = await fetch("/api/admin/plugins");
      if (!listRes.ok) throw new Error("Failed to fetch plugins");
      const listData = await listRes.json();
      const found = listData.plugins?.find((p: any) => p.id === pluginId);
      if (!found) throw new Error("Plugin not found");

      // Fetch settings separately
      const settingsRes = await fetch(`/api/admin/plugins/${pluginId}/settings`);
      let settingsData: Record<string, unknown> = {};
      if (settingsRes.ok) {
        const s = await settingsRes.json();
        settingsData = s.settings ?? {};
      }

      setPlugin(found as PluginInfo);
      setSettings(settingsData);
    } catch (err: any) {
      setToast({ message: err.message || "Failed to load plugin", type: "error" });
    } finally {
      setIsLoading(false);
    }
  }, [pluginId]);

  useEffect(() => {
    fetchPlugin();
  }, [fetchPlugin]);

  // ─── Save settings ─────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/plugins/${pluginId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to save settings");
      }

      setToast({ message: "Settings saved successfully", type: "success" });
    } catch (err: any) {
      setToast({ message: err.message || "Failed to save settings", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex-1 p-6 sm:p-8 lg:p-10">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/5 rounded w-1/3" />
          <div className="h-4 bg-white/5 rounded w-1/2" />
          <div className="h-40 bg-white/5 rounded" />
        </div>
      </div>
    );
  }

  if (!plugin) {
    return (
      <div className="flex-1 p-6 sm:p-8 lg:p-10">
        <p className="text-gray-500">Plugin not found.</p>
        <button
          onClick={() => router.push("/admin/plugins")}
          className="mt-4 text-sm text-violet-400 hover:text-violet-300 transition-colors"
        >
          ← Back to plugins
        </button>
      </div>
    );
  }

  const schema = plugin.manifest?.settingsSchema;

  return (
    <div className="flex-1 p-6 sm:p-8 lg:p-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <button
              onClick={() => router.push("/admin/plugins")}
              className="text-gray-500 hover:text-gray-300 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-100">{plugin.name}</h1>
            <span className="text-sm text-gray-600">v{plugin.version}</span>
          </div>
          {plugin.description && (
            <p className="text-sm text-gray-500 ml-7">{plugin.description}</p>
          )}
        </div>
      </div>

      {/* Plugin Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <InfoCard label="Capabilities" value={
          [plugin.hasServer ? "Server" : "", plugin.hasClient ? "UI" : ""].filter(Boolean).join(" + ") || "Manifest only"
        } />
        <InfoCard label="Permissions" value={Object.keys(plugin.manifest?.permissions ?? {}).length.toString()} />
        <InfoCard label="Pages" value={Object.keys(plugin.manifest?.pages ?? {}).length.toString()} />
        <InfoCard label="API Endpoints" value={Object.keys(plugin.manifest?.api ?? {}).length.toString()} />
      </div>

      {/* Settings Form */}
      <div className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-200 mb-6">Configuration</h2>
        <DynamicForm
          schema={schema}
          values={settings}
          onChange={setSettings}
        />
        {schema && typeof schema.properties === "object" && schema.properties !== null && Object.keys(schema.properties as Record<string, unknown>).length > 0 && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
            >
              {saving && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              Save Settings
            </button>
          </div>
        )}
      </div>

      {/* Manifest Info */}
      <div className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-200 mb-4">Plugin Details</h2>
        <div className="space-y-2 text-sm">
          <DetailRow label="ID" value={plugin.id} />
          <DetailRow label="Version" value={plugin.version} />
          <DetailRow label="Server bundle" value={plugin.hasServer ? "Loaded" : "None"} />
          <DetailRow label="Client bundle" value={plugin.hasClient ? "Loaded" : "None"} />
        </div>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}

// ─── Sub-Components ─────────────────────────────────────────────────────────

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-lg p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-lg font-semibold text-gray-200">{value}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-b-0">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-300 font-mono text-xs">{value}</span>
    </div>
  );
}
