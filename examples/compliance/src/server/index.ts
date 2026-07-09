import { definePlugin } from "@open_shield/plugin-sdk";

export default definePlugin({
  async install(context) {
    await context.db.query(`
      CREATE TABLE IF NOT EXISTS compliance_risks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        risk_level VARCHAR(20) NOT NULL DEFAULT 'medium'
          CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
        score INTEGER NOT NULL DEFAULT 0,
        agent_id TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'open'
          CHECK (status IN ('open', 'mitigated', 'accepted', 'false_positive')),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await context.db.query(`
      CREATE TABLE IF NOT EXISTS compliance_assets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        agent_id TEXT NOT NULL,
        compliance_score INTEGER NOT NULL DEFAULT 100,
        last_scanned_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  },

  async uninstall(context) {
    await context.db.query("DROP TABLE IF EXISTS compliance_risks");
    await context.db.query("DROP TABLE IF EXISTS compliance_assets");
  },

  api: {
    "risks:GET": async (request, context) => {
      const result = await context.db.query(
        "SELECT * FROM compliance_risks ORDER BY score DESC, created_at DESC"
      );
      return Response.json({ risks: result.rows });
    },

    "risks:POST": async (request, context) => {
      const body = await request.json();
      if (!body.name || !body.risk_level) {
        return Response.json({ error: "name and risk_level are required" }, { status: 400 });
      }
      const result = await context.db.query(
        `INSERT INTO compliance_risks (name, description, risk_level, score, agent_id, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [body.name, body.description ?? null, body.risk_level, body.score ?? 0, body.agent_id ?? null, "open"]
      );
      return Response.json(result.rows[0], { status: 201 });
    },

    "risks/[id]:GET": async (request, context) => {
      const url = new URL(request.url);
      const id = url.pathname.split("/").pop();
      const result = await context.db.query(
        "SELECT * FROM compliance_risks WHERE id = $1",
        [id]
      );
      if (result.rows.length === 0) {
        return Response.json({ error: "Risk not found" }, { status: 404 });
      }
      return Response.json(result.rows[0]);
    },

    "risks/[id]:PATCH": async (request, context) => {
      const url = new URL(request.url);
      const id = url.pathname.split("/").pop();
      const body = await request.json();

      const fields: string[] = [];
      const values: any[] = [];
      let idx = 1;

      for (const [key, value] of Object.entries(body)) {
        if (["name", "description", "risk_level", "score", "status", "agent_id"].includes(key)) {
          fields.push(`${key} = $${idx++}`);
          values.push(value);
        }
      }

      if (fields.length === 0) {
        return Response.json({ error: "No valid fields to update" }, { status: 400 });
      }

      fields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);

      const result = await context.db.query(
        `UPDATE compliance_risks SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        return Response.json({ error: "Risk not found" }, { status: 404 });
      }
      return Response.json(result.rows[0]);
    },

    "risks/[id]:DELETE": async (request, context) => {
      const url = new URL(request.url);
      const id = url.pathname.split("/").pop();
      const result = await context.db.query(
        "DELETE FROM compliance_risks WHERE id = $1 RETURNING id",
        [id]
      );
      if (result.rows.length === 0) {
        return Response.json({ error: "Risk not found" }, { status: 404 });
      }
      return Response.json({ deleted: true });
    },

    "assets:GET": async (request, context) => {
      const result = await context.db.query(
        "SELECT * FROM compliance_assets ORDER BY name ASC"
      );
      return Response.json({ assets: result.rows });
    },
  },

  dataFetchers: {
    risks: async (_params, context) => {
      const result = await context.db.query(
        "SELECT * FROM compliance_risks ORDER BY score DESC"
      );
      return result.rows;
    },
    assets: async (_params, context) => {
      const result = await context.db.query(
        "SELECT * FROM compliance_assets ORDER BY name ASC"
      );
      return result.rows;
    },
  },
});
