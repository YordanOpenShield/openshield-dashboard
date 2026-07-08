import { createManifest } from "@openshield/plugin-sdk";

export default createManifest({
  id: "compliance",
  name: "Compliance Manager",
  version: "1.0.0",
  description: "Query agents for compliance data, manage risks and assets",
  icon: "assets/icon.svg",
  requires: "^1.0.0",

  permissions: {
    compliance: ["read", "manage-risks", "manage-assets"],
  },

  navigation: [
    {
      type: "main",
      label: "Compliance",
      href: "/plugin/compliance",
      permission: "compliance:read",
    },
  ],

  pages: {
    "": {
      component: "Dashboard",
      title: "Compliance Dashboard",
      permission: "compliance:read",
    },
    risks: {
      component: "RisksPage",
      title: "Risk Management",
      permission: "compliance:read",
    },
    assets: {
      component: "AssetsPage",
      title: "Asset Inventory",
      permission: "compliance:manage-assets",
    },
  },

  api: {
    risks: { methods: ["GET", "POST"] },
    "risks/[id]": { methods: ["GET", "PATCH", "DELETE"] },
    assets: { methods: ["GET"] },
  },

  hooks: [
    {
      location: "agent-detail-toolbar",
      label: "Run Compliance Scan",
      permission: "compliance:manage-risks",
      action: {
        type: "navigate",
        page: "scan",
        params: { agentId: "{agentId}" },
      },
    },
  ],

  settingsSchema: {
    type: "object",
    properties: {
      autoScanEnabled: { type: "boolean", default: true },
      scanInterval: { type: "number", default: 3600 },
    },
  },
});
