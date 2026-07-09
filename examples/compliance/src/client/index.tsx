import { createPluginUI } from "@open_shield/plugin-sdk";
import { Card, Button, Badge, StatCard, Heading } from "@open_shield/plugin-sdk/components";

// ─── Dashboard Page ─────────────────────────────────────────────────────────

function Dashboard({ initialData }: { initialData: unknown }) {
  return (
    <div className="space-y-6">
      <Card padding="lg">
        <Heading>Compliance Dashboard</Heading>
        <p className="text-sm text-gray-400 mt-1">
          Overview of compliance risks and asset posture across your fleet.
        </p>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total Risks" value="—" color="text-red-400" />
        <StatCard label="Assets Scanned" value="—" color="text-green-400" />
        <StatCard label="Avg Compliance" value="—%" color="text-blue-400" />
      </div>
    </div>
  );
}

// ─── Risks Page ─────────────────────────────────────────────────────────────

const riskColumns = [
  { key: "name", header: "Name" },
  { key: "risk_level", header: "Level", render: (r: any) => (
    <Badge variant={r.risk_level === "critical" ? "danger" : r.risk_level === "high" ? "warning" : r.risk_level === "medium" ? "warning" : "success"}>
      {r.risk_level}
    </Badge>
  )},
  { key: "score", header: "Score" },
  { key: "status", header: "Status", className: "text-gray-400" },
];

function RisksPage({ initialData }: { initialData: unknown }) {
  const risks = Array.isArray(initialData) ? initialData : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Heading>Risk Management</Heading>
        <Button>Add Risk</Button>
      </div>

      <div className="bg-[#111111]/80 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              {riskColumns.map((col) => (
                <th key={col.key} className={`text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase ${col.className ?? ""}`}>
                  {col.header}
                </th>
              ))}
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
                    <Badge variant={risk.risk_level === "critical" ? "danger" : risk.risk_level === "high" ? "warning" : risk.risk_level === "medium" ? "warning" : "success"}>
                      {risk.risk_level}
                    </Badge>
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
      <Heading>Asset Inventory</Heading>

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
                <td colSpan={4} className="px-4 py-12 text-center text-gray-600 text-sm">No assets found.</td>
              </tr>
            ) : (
              assets.map((asset: any) => (
                <tr key={asset.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-sm text-gray-200">{asset.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{asset.type}</td>
                  <td className="px-4 py-3">
                    <Badge variant={asset.compliance_score >= 80 ? "success" : asset.compliance_score >= 50 ? "warning" : "danger"}>
                      {asset.compliance_score}%
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {asset.last_scanned_at ? new Date(asset.last_scanned_at).toLocaleDateString() : "Never"}
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

// ─── Plugin Entry ───────────────────────────────────────────────────────────

export default createPluginUI({
  name: "Compliance Manager",

  initialize(registry) {
    registry.registerPage("Dashboard", Dashboard);
    registry.registerPage("RisksPage", RisksPage);
    registry.registerPage("AssetsPage", AssetsPage);
  },
});

