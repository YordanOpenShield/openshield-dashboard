import { Pool } from "pg";
const pool = new Pool({ connectionString: process.env.DATABASE_URL || "postgresql://openshield:openshield@localhost:5432/openshield" });
const result = await pool.query('SELECT "providerId", "domain", "issuer", "oidcConfig", "samlConfig" FROM "ssoProvider"');
for (const row of result.rows) {
  console.log("providerId:", row.providerId);
  console.log("domain:", row.domain);
  console.log("issuer:", row.issuer);
  if (row.samlConfig) {
    const config = JSON.parse(row.samlConfig);
    console.log("samlConfig.spMetadata:", JSON.stringify(config.spMetadata, null, 2));
    console.log("samlConfig.entryPoint:", config.entryPoint);
    console.log("samlConfig.callbackUrl:", config.callbackUrl);
    console.log("samlConfig.audience:", config.audience);
  }
  console.log("---");
}
await pool.end();
