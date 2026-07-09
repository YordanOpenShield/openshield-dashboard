/**
 * ─── Plugin SDK: UI Components ──────────────────────────────────────────────
 *
 * Reusable UI components that follow the dashboard's design system.
 * Plugin authors use these to build consistent UIs without manually
 * specifying Tailwind classes.
 *
 * Usage:
 *   import { Card, Button, Input, Table, Badge, Toggle, StatCard } from "@open_shield/plugin-sdk/components";
 *
 * Or with the barrel export:
 *   import { components } from "@open_shield/plugin-sdk";
 */

export { Card, CardHeader } from "./card.js";
export { Button } from "./button.js";
export { Input, Textarea, Select } from "./input.js";
export { Table } from "./table.js";
export { Badge, StatusDot } from "./badge.js";
export { Toggle } from "./toggle.js";
export { StatCard } from "./stat-card.js";
export { LoadingSpinner, EmptyState, Heading, Text, Divider } from "./utils.js";
