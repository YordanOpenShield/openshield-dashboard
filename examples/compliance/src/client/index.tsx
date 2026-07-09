import { createPluginUI } from "@open_shield/plugin-sdk";

// ─── Dashboard Page ─────────────────────────────────────────────────────────

function Dashboard({ initialData }: { initialData: unknown }) {
  return (
    <div className="space-y-6">
      <div className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-100 mb-2">Compliance Dashboard</h2>
        <p className="text-sm text-gray-400">
          Overview of compliance risks and asset posture across your fleet.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total Risks" value="—" color="text-red-400" />
        <StatCard label="Assets Scanned" value="—" color="text-green-400" />
        <StatCard label="Avg Compliance" value="—%" color="text-blue-400" />
      </div>
    </div>
  );
}

// ─── Risks Page ─────────────────────────────────────────────────────────────

function RisksPage({ initialData }: { initialData: unknown }) {
  const risks = Array.isArray(initialData) ? initialData : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-100">Risk Management</h2>
        <button className="bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200">
          Add Risk
        </button>
      </div>

      <div className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Level</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Score</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {risks.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-gray-600 text-sm">
                  No risks found. Run a compliance scan to identify risks.
                </td>
              </tr>
            ) : (
              risks.map((risk: any) => (
                <tr key={risk.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-sm text-gray-200">{risk.name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex text-xs px-2 py-0.5 rounded font-medium ${
                      risk.risk_level === "critical" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                      risk.risk_level === "high" ? "bg-orange-500/10 text-orange-400 border border-orange-500/20" :
                      risk.risk_level === "medium" ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" :
                      "bg-green-500/10 text-green-400 border border-green-500/20"
                    }`}>
                      {risk.risk_level}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">{risk.score}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{risk.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Assets Page ────────────────────────────────────────────────────────────

function AssetsPage({ initialData }: { initialData: unknown }) {
  const assets = Array.isArray(initialData) ? initialData : [];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-100">Asset Inventory</h2>

      <div className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Compliance</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Last Scanned</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {assets.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-gray-600 text-sm">
                  No assets found.
                </td>
              </tr>
            ) : (
              assets.map((asset: any) => (
                <tr key={asset.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-sm text-gray-200">{asset.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{asset.type}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex text-xs px-2 py-0.5 rounded font-medium ${
                      asset.compliance_score >= 80 ? "bg-green-500/10 text-green-400" :
                      asset.compliance_score >= 50 ? "bg-yellow-500/10 text-yellow-400" :
                      "bg-red-500/10 text-red-400"
                    }`}>
                      {asset.compliance_score}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {asset.last_scanned_at
                      ? new Date(asset.last_scanned_at).toLocaleDateString()
                      : "Never"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Stat Card Component ────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-lg p-5">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}

// ─── Plugin Entry ───────────────────────────────────────────────────────────

export default createPluginUI({
  name: "Compliance Manager",

  initialize(registry) {
    registry.registerPage("Dashboard", Dashboard);
    registry.registerPage("RisksPage", RisksPage);
    registry.registerPage("AssetsPage", AssetsPage);
  },
});
