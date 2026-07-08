/**
 * Common osquery table schemas for SQL autocomplete and reference.
 *
 * Based on the well-documented osquery schema used by FleetDM and similar tools.
 * Tables and columns are a subset of what a typical osquery agent exposes.
 */

export interface OsqueryColumn {
  name: string;
  type: string;
  description: string;
}

export interface OsqueryTable {
  name: string;
  description: string;
  columns: OsqueryColumn[];
}

export const OSQUERY_SCHEMA: OsqueryTable[] = [
  {
    name: "system_info",
    description: "System information and hardware details",
    columns: [
      { name: "hostname", type: "TEXT", description: "System hostname" },
      { name: "computer_name", type: "TEXT", description: "Friendly computer name" },
      { name: "local_hostname", type: "TEXT", description: "Local hostname (macOS)" },
      { name: "uuid", type: "TEXT", description: "Hardware UUID" },
      { name: "cpu_brand", type: "TEXT", description: "CPU brand string" },
      { name: "cpu_type", type: "TEXT", description: "CPU type" },
      { name: "cpu_subtype", type: "TEXT", description: "CPU subtype" },
      { name: "cpu_logical_cores", type: "INTEGER", description: "Number of logical cores" },
      { name: "cpu_physical_cores", type: "INTEGER", description: "Number of physical cores" },
      { name: "cpu_microcode", type: "TEXT", description: "CPU microcode version" },
      { name: "cpu_sockets", type: "INTEGER", description: "Number of CPU sockets" },
      { name: "physical_memory", type: "BIGINT", description: "Total physical memory in bytes" },
      { name: "hardware_vendor", type: "TEXT", description: "Hardware vendor" },
      { name: "hardware_model", type: "TEXT", description: "Hardware model" },
      { name: "hardware_version", type: "TEXT", description: "Hardware version" },
      { name: "hardware_serial", type: "TEXT", description: "Hardware serial number" },
      { name: "board_vendor", type: "TEXT", description: "Motherboard vendor" },
      { name: "board_model", type: "TEXT", description: "Motherboard model" },
      { name: "board_version", type: "TEXT", description: "Motherboard version" },
      { name: "board_serial", type: "TEXT", description: "Motherboard serial number" },
    ],
  },
  {
    name: "processes",
    description: "Running processes",
    columns: [
      { name: "pid", type: "BIGINT", description: "Process ID" },
      { name: "name", type: "TEXT", description: "Process name" },
      { name: "path", type: "TEXT", description: "Path to executable" },
      { name: "cmdline", type: "TEXT", description: "Full command line" },
      { name: "state", type: "TEXT", description: "Process state" },
      { name: "cwd", type: "TEXT", description: "Current working directory" },
      { name: "root", type: "TEXT", description: "Root directory" },
      { name: "uid", type: "BIGINT", description: "User ID" },
      { name: "gid", type: "BIGINT", description: "Group ID" },
      { name: "euid", type: "BIGINT", description: "Effective user ID" },
      { name: "egid", type: "BIGINT", description: "Effective group ID" },
      { name: "suid", type: "BIGINT", description: "Saved user ID" },
      { name: "sgid", type: "BIGINT", description: "Saved group ID" },
      { name: "on_disk", type: "INTEGER", description: "Is the process binary on disk" },
      { name: "wired_size", type: "BIGINT", description: "Wired memory size" },
      { name: "resident_size", type: "BIGINT", description: "Resident memory size" },
      { name: "total_size", type: "BIGINT", description: "Total virtual memory size" },
      { name: "user_time", type: "BIGINT", description: "CPU time in user mode" },
      { name: "system_time", type: "BIGINT", description: "CPU time in kernel mode" },
      { name: "disk_bytes_read", type: "BIGINT", description: "Bytes read from disk" },
      { name: "disk_bytes_written", type: "BIGINT", description: "Bytes written to disk" },
      { name: "start_time", type: "BIGINT", description: "Process start time" },
      { name: "parent", type: "BIGINT", description: "Parent process ID" },
      { name: "pgroup", type: "BIGINT", description: "Process group" },
      { name: "threads", type: "INTEGER", description: "Number of threads" },
      { name: "nice", type: "INTEGER", description: "Nice value" },
    ],
  },
  {
    name: "users",
    description: "Local user accounts",
    columns: [
      { name: "uid", type: "BIGINT", description: "User ID" },
      { name: "gid", type: "BIGINT", description: "Default group ID" },
      { name: "uid_sid", type: "TEXT", description: "User SID (Windows)" },
      { name: "username", type: "TEXT", description: "Username" },
      { name: "description", type: "TEXT", description: "User description" },
      { name: "shell", type: "TEXT", description: "Login shell" },
      { name: "is_hidden", type: "INTEGER", description: "Is account hidden" },
      { name: "uuid", type: "TEXT", description: "User UUID (macOS)" },
    ],
  },
  {
    name: "groups",
    description: "Local group accounts",
    columns: [
      { name: "gid", type: "BIGINT", description: "Group ID" },
      { name: "gid_sid", type: "TEXT", description: "Group SID (Windows)" },
      { name: "groupname", type: "TEXT", description: "Group name" },
      { name: "description", type: "TEXT", description: "Group description" },
      { name: "is_hidden", type: "INTEGER", description: "Is group hidden" },
    ],
  },
  {
    name: "interface_addresses",
    description: "Network interface addresses",
    columns: [
      { name: "interface", type: "TEXT", description: "Interface name" },
      { name: "address", type: "TEXT", description: "IP address" },
      { name: "mask", type: "TEXT", description: "Network mask" },
      { name: "broadcast", type: "TEXT", description: "Broadcast address" },
      { name: "point_to_point", type: "TEXT", description: "Point-to-point address" },
      { name: "type", type: "TEXT", description: "Address type" },
      { name: "friendly_name", type: "TEXT", description: "Friendly interface name" },
    ],
  },
  {
    name: "routes",
    description: "Routing table",
    columns: [
      { name: "destination", type: "TEXT", description: "Destination network" },
      { name: "netmask", type: "INTEGER", description: "Netmask length" },
      { name: "gateway", type: "TEXT", description: "Gateway address" },
      { name: "source", type: "TEXT", description: "Source address" },
      { name: "flags", type: "INTEGER", description: "Route flags" },
      { name: "interface", type: "TEXT", description: "Route interface" },
      { name: "mtu", type: "INTEGER", description: "MTU size" },
      { name: "metric", type: "INTEGER", description: "Route metric" },
      { name: "type", type: "TEXT", description: "Route type" },
    ],
  },
  {
    name: "programs",
    description: "Installed software (Windows)",
    columns: [
      { name: "name", type: "TEXT", description: "Software name" },
      { name: "version", type: "TEXT", description: "Software version" },
      { name: "install_location", type: "TEXT", description: "Install location" },
      { name: "install_source", type: "TEXT", description: "Install source" },
      { name: "language", type: "TEXT", description: "Language" },
      { name: "publisher", type: "TEXT", description: "Publisher" },
      { name: "uninstall_string", type: "TEXT", description: "Uninstall command" },
      { name: "install_date", type: "TEXT", description: "Install date" },
      { name: "identifying_number", type: "TEXT", description: "Product code (MSI)" },
    ],
  },
  {
    name: "services",
    description: "System services / daemons",
    columns: [
      { name: "name", type: "TEXT", description: "Service name" },
      { name: "display_name", type: "TEXT", description: "Display name" },
      { name: "status", type: "TEXT", description: "Service status (running/stopped)" },
      { name: "path", type: "TEXT", description: "Path to executable" },
      { name: "pid", type: "BIGINT", description: "Process ID" },
      { name: "start_type", type: "TEXT", description: "Start type (auto/manual/disabled)" },
      { name: "user_account", type: "TEXT", description: "Run as user" },
    ],
  },
  {
    name: "startup_items",
    description: "Startup items and applications",
    columns: [
      { name: "name", type: "TEXT", description: "Item name" },
      { name: "path", type: "TEXT", description: "Item path" },
      { name: "args", type: "TEXT", description: "Arguments" },
      { name: "type", type: "TEXT", description: "Startup type" },
      { name: "source", type: "TEXT", description: "Source (registry, startup_folder, etc.)" },
      { name: "status", type: "TEXT", description: "Status (enabled/disabled)" },
      { name: "username", type: "TEXT", description: "User the item runs as" },
    ],
  },
  {
    name: "kernel_info",
    description: "Kernel information",
    columns: [
      { name: "version", type: "TEXT", description: "Kernel version string" },
      { name: "arguments", type: "TEXT", description: "Kernel boot arguments" },
      { name: "path", type: "TEXT", description: "Kernel path" },
      { name: "device", type: "TEXT", description: "Device identifier" },
    ],
  },
  {
    name: "os_version",
    description: "Operating system version",
    columns: [
      { name: "name", type: "TEXT", description: "OS name" },
      { name: "version", type: "TEXT", description: "Full version string" },
      { name: "major", type: "INTEGER", description: "Major version number" },
      { name: "minor", type: "INTEGER", description: "Minor version number" },
      { name: "patch", type: "INTEGER", description: "Patch version number" },
      { name: "build", type: "TEXT", description: "Build number" },
      { name: "platform", type: "TEXT", description: "OS platform" },
      { name: "platform_like", type: "TEXT", description: "Platform family" },
      { name: "codename", type: "TEXT", description: "Release codename" },
      { name: "install_date", type: "TEXT", description: "OS install date" },
    ],
  },
  {
    name: "uptime",
    description: "System uptime",
    columns: [
      { name: "days", type: "INTEGER", description: "Uptime in days" },
      { name: "hours", type: "INTEGER", description: "Hours component" },
      { name: "minutes", type: "INTEGER", description: "Minutes component" },
      { name: "seconds", type: "INTEGER", description: "Seconds component" },
      { name: "total_seconds", type: "BIGINT", description: "Total uptime in seconds" },
    ],
  },
  {
    name: "listening_ports",
    description: "Listening network ports",
    columns: [
      { name: "pid", type: "BIGINT", description: "Process ID" },
      { name: "port", type: "INTEGER", description: "Port number" },
      { name: "protocol", type: "INTEGER", description: "Protocol (6=TCP, 17=UDP)" },
      { name: "family", type: "INTEGER", description: "Address family (2=IPv4, 10=IPv6)" },
      { name: "address", type: "TEXT", description: "Bind address" },
      { name: "fd", type: "BIGINT", description: "File descriptor" },
      { name: "socket", type: "BIGINT", description: "Socket handle" },
      { name: "path", type: "TEXT", description: "Unix socket path" },
      { name: "net_namespace", type: "TEXT", description: "Network namespace (Linux)" },
    ],
  },
  {
    name: "network_connections",
    description: "Active network connections",
    columns: [
      { name: "pid", type: "BIGINT", description: "Process ID" },
      { name: "fd", type: "BIGINT", description: "File descriptor" },
      { name: "family", type: "INTEGER", description: "Address family" },
      { name: "protocol", type: "INTEGER", description: "Protocol" },
      { name: "local_address", type: "TEXT", description: "Local IP address" },
      { name: "remote_address", type: "TEXT", description: "Remote IP address" },
      { name: "local_port", type: "INTEGER", description: "Local port" },
      { name: "remote_port", type: "INTEGER", description: "Remote port" },
      { name: "state", type: "TEXT", description: "Connection state" },
    ],
  },
  {
    name: "disk_encryption",
    description: "Disk encryption status",
    columns: [
      { name: "encrypted", type: "INTEGER", description: "Is encrypted" },
      { name: "type", type: "TEXT", description: "Encryption type" },
      { name: "uid", type: "TEXT", description: "User UUID" },
      { name: "user_uuid", type: "TEXT", description: "User UUID (macOS)" },
      { name: "name", type: "TEXT", description: "Volume name" },
      { name: "device", type: "TEXT", description: "Device path" },
      { name: "filevault_status", type: "TEXT", description: "FileVault status (macOS)" },
    ],
  },
  {
    name: "crontab",
    description: "Cron job definitions",
    columns: [
      { name: "event", type: "TEXT", description: "Cron schedule" },
      { name: "command", type: "TEXT", description: "Command to execute" },
      { name: "minute", type: "TEXT", description: "Minute field" },
      { name: "hour", type: "TEXT", description: "Hour field" },
      { name: "day_of_month", type: "TEXT", description: "Day of month" },
      { name: "month", type: "TEXT", description: "Month field" },
      { name: "day_of_week", type: "TEXT", description: "Day of week" },
      { name: "username", type: "TEXT", description: "User running the cron" },
      { name: "path", type: "TEXT", description: "Crontab path" },
    ],
  },
  {
    name: "logged_in_users",
    description: "Currently logged-in users",
    columns: [
      { name: "type", type: "TEXT", description: "Login type" },
      { name: "user", type: "TEXT", description: "Username" },
      { name: "tty", type: "TEXT", description: "TTY device" },
      { name: "host", type: "TEXT", description: "Remote host" },
      { name: "time", type: "BIGINT", description: "Login timestamp" },
      { name: "pid", type: "BIGINT", description: "Process ID" },
      { name: "sid", type: "TEXT", description: "Session ID (Windows)" },
      { name: "registry_hive", type: "TEXT", description: "Registry hive (Windows)" },
    ],
  },
];

/** All SQL keywords for autocomplete suggestions */
export const SQL_KEYWORDS = [
  "SELECT", "FROM", "WHERE", "AND", "OR", "NOT", "IN", "LIKE", "BETWEEN",
  "IS", "NULL", "AS", "ON", "JOIN", "LEFT", "RIGHT", "INNER", "OUTER",
  "CROSS", "FULL", "ORDER", "BY", "ASC", "DESC", "LIMIT", "OFFSET",
  "GROUP", "HAVING", "COUNT", "SUM", "AVG", "MIN", "MAX", "DISTINCT",
  "UNION", "ALL", "EXISTS", "CASE", "WHEN", "THEN", "ELSE", "END",
  "CAST", "COALESCE", "IFNULL", "NULLIF", "LIKE", "GLOB", "MATCH",
];

/** Flat list of all table and column names for quick matching */
export function getFlatSchema(): { label: string; type: "table" | "column"; table: string }[] {
  const items: { label: string; type: "table" | "column"; table: string }[] = [];
  for (const table of OSQUERY_SCHEMA) {
    items.push({ label: table.name, type: "table", table: table.name });
    for (const col of table.columns) {
      items.push({ label: col.name, type: "column", table: table.name });
    }
  }
  return items;
}

/** Find a table by name */
export function findTable(name: string): OsqueryTable | undefined {
  return OSQUERY_SCHEMA.find((t) => t.name === name);
}
