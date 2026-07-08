import { Pool } from "pg";
const pool = new Pool({ connectionString: process.env.DATABASE_URL || "postgresql://openshield:openshield@localhost:5432/openshield" });
const result = await pool.query("SELECT name, permissions FROM custom_roles");
console.log(JSON.stringify(result.rows, null, 2));
await pool.end();
