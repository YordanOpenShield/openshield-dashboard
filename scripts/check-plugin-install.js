const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://openshield:openshield@localhost:5432/openshield",
});

async function main() {
  // Check plugin registry
  const reg = await pool.query("SELECT id, name, version, enabled, installed_at FROM plugin_registry");
  console.log("Plugin Registry:");
  for (const row of reg.rows) {
    console.log(`  ${row.id} v${row.version} enabled=${row.enabled} at ${row.installed_at}`);
  }

  // Check tables
  const tables = await pool.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'compliance%'"
  );
  console.log("\nCompliance tables:");
  for (const row of tables.rows) {
    console.log(`  ${row.table_name}`);
  }

  // Check rows
  for (const table of tables.rows) {
    const count = await pool.query(`SELECT COUNT(*) FROM "${table.table_name}"`);
    console.log(`  → ${count.rows[0].count} rows`);
  }

  await pool.end();
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
