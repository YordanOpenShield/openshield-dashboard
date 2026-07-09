/**
 * ─── Plugin Loader ──────────────────────────────────────────────────────────
 *
 * Handles filesystem operations for plugin installation, uninstallation,
 * and database migrations.
 *
 * All functions are server-side only (use Node.js fs, path, etc.).
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { z } from "zod";
import { pgPool } from "../db";
import { ManifestSchema } from "./registry";
import type { PluginManifest } from "./types";

// ─── Paths ──────────────────────────────────────────────────────────────────

const PLUGINS_DIR = path.join(process.cwd(), "plugins");
const PUBLIC_PLUGINS_DIR = path.join(process.cwd(), "public", "plugins");
const MIGRATIONS_DIR = "migrations";

// Re-export ManifestSchema for validation
export { ManifestSchema };

// ─── Install ────────────────────────────────────────────────────────────────

export interface InstallPluginResult {
  success: boolean;
  pluginId?: string;
  error?: string;
}

/**
 * Install a plugin from an uploaded zip buffer.
 *
 * Steps:
 *   1. Validate the zip structure
 *   2. Parse and validate manifest.json
 *   3. Check for ID conflicts
 *   4. Extract to plugins/<id>/
 *   5. Copy client bundle to public/plugins/<id>/
 *   6. Run SQL migrations
 *   7. Register in plugin_registry DB table
 *   8. Return the plugin info
 */
export async function installPluginFromZip(
  zipBuffer: Buffer,
  filename: string
): Promise<InstallPluginResult> {
  try {
    // Ensure plugin tracking tables exist before proceeding
    await ensurePluginTables();

    // 1. Extract the zip to a temp directory to validate structure
    const { extractZip } = await import("./zip-utils");
    const extracted = await extractZip(zipBuffer);

    // 2. Find and validate manifest
    if (!extracted.files["manifest.json"]) {
      return { success: false, error: "Missing manifest.json in plugin archive" };
    }

    let manifest: PluginManifest;
    try {
      const raw = JSON.parse(extracted.files["manifest.json"].toString("utf-8"));
      const parsed = ManifestSchema.parse(raw);
      manifest = parsed as PluginManifest;
    } catch (err) {
      return {
        success: false,
        error: `Invalid manifest.json: ${err instanceof Error ? err.message : String(err)}`,
      };
    }

    // 3. Check for ID conflicts
    const pluginDir = path.join(PLUGINS_DIR, manifest.id);
    if (fs.existsSync(pluginDir)) {
      // Check if it's an upgrade (same ID, higher version?)
      const existingManifestPath = path.join(pluginDir, "manifest.json");
      if (fs.existsSync(existingManifestPath)) {
        try {
          const existingRaw = JSON.parse(fs.readFileSync(existingManifestPath, "utf-8"));
          if (existingRaw.version === manifest.version) {
            return {
              success: false,
              error: `Plugin "${manifest.id}" v${manifest.version} is already installed`,
            };
          }
          // Different version — proceed with upgrade
          console.info(`[plugins] Upgrading "${manifest.id}": ${existingRaw.version} → ${manifest.version}`);
        } catch {
          // Can't read existing manifest — overwrite
        }
      }
      // Remove existing for clean install
      fs.rmSync(pluginDir, { recursive: true, force: true });
    }

    // 4. Extract to plugins/<id>/
    fs.mkdirSync(pluginDir, { recursive: true });

    for (const [filePath, content] of Object.entries(extracted.files)) {
      // Skip client bundle (handled separately)
      if (filePath.startsWith("client/")) continue;

      const destPath = path.join(pluginDir, filePath);
      const destDir = path.dirname(destPath);
      fs.mkdirSync(destDir, { recursive: true });
      fs.writeFileSync(destPath, content);
    }

    // 5. Copy client bundle to public/plugins/<id>/
    if (extracted.files["client/ui.js"]) {
      const publicPluginDir = path.join(PUBLIC_PLUGINS_DIR, manifest.id);
      fs.mkdirSync(publicPluginDir, { recursive: true });
      fs.writeFileSync(
        path.join(publicPluginDir, "ui.js"),
        extracted.files["client/ui.js"]
      );
    }

    // 6. Copy static assets to public/plugins/<id>/assets/
    if (extracted.files["assets/icon.svg"]) {
      const publicAssetsDir = path.join(PUBLIC_PLUGINS_DIR, manifest.id, "assets");
      fs.mkdirSync(publicAssetsDir, { recursive: true });
      fs.writeFileSync(
        path.join(publicAssetsDir, "icon.svg"),
        extracted.files["assets/icon.svg"]
      );
    }

    // 7. Run SQL migrations
    const migrationFiles = Object.keys(extracted.files)
      .filter((f) => f.startsWith("migrations/") && f.endsWith(".sql"))
      .sort();

    if (migrationFiles.length > 0) {
      const migrationResults = await runMigrations(manifest.id, migrationFiles, extracted.files);
      if (!migrationResults.success) {
        // Clean up on migration failure
        fs.rmSync(pluginDir, { recursive: true, force: true });
        const publicPluginDir = path.join(PUBLIC_PLUGINS_DIR, manifest.id);
        if (fs.existsSync(publicPluginDir)) {
          fs.rmSync(publicPluginDir, { recursive: true, force: true });
        }
        return {
          success: false,
          error: `Migration failed: ${migrationResults.error}`,
        };
      }
    }

    // 8. Register in plugin_registry DB table
    try {
      const client = await pgPool.connect();
      try {
        await client.query(
          `INSERT INTO plugin_registry (id, name, version, description, manifest, enabled, settings)
           VALUES ($1, $2, $3, $4, $5, true, '{}')
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             version = EXCLUDED.version,
             description = EXCLUDED.description,
             manifest = EXCLUDED.manifest,
             updated_at = CURRENT_TIMESTAMP`,
          [
            manifest.id,
            manifest.name,
            manifest.version,
            manifest.description ?? null,
            JSON.stringify(manifest),
          ]
        );
      } finally {
        client.release();
      }
    } catch (dbErr) {
      console.error(`[plugins] DB registration failed for "${manifest.id}":`, dbErr);
      // Non-fatal — plugin is on disk but not in DB
    }

    console.info(`[plugins] Installed: ${manifest.name} v${manifest.version}`);
    return { success: true, pluginId: manifest.id };
  } catch (err) {
    return {
      success: false,
      error: `Installation failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// ─── Uninstall ──────────────────────────────────────────────────────────────

export interface UninstallPluginResult {
  success: boolean;
  error?: string;
}

/**
 * Uninstall a plugin: run rollback migrations, remove files, delete DB entry.
 */
export async function uninstallPlugin(pluginId: string): Promise<UninstallPluginResult> {
  try {
    const pluginDir = path.join(PLUGINS_DIR, pluginId);
    if (!fs.existsSync(pluginDir)) {
      return { success: false, error: `Plugin "${pluginId}" is not installed` };
    }

    // Read manifest to check if uninstallable
    const manifestPath = path.join(pluginDir, "manifest.json");
    if (fs.existsSync(manifestPath)) {
      try {
        const raw = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
        const parsed = ManifestSchema.parse(raw);
        if (parsed.uninstallable === false) {
          return { success: false, error: `Plugin "${pluginId}" does not allow uninstallation` };
        }
      } catch {
        // Can't read manifest — proceed anyway
      }
    }

    // Run rollback migrations if available
    const rollbackDir = path.join(pluginDir, "migrations", "rollback");
    if (fs.existsSync(rollbackDir)) {
      const rollbackFiles = fs.readdirSync(rollbackDir)
        .filter((f) => f.endsWith(".sql"))
        .sort()
        .reverse();

      for (const file of rollbackFiles) {
        const sql = fs.readFileSync(path.join(rollbackDir, file), "utf-8");
        try {
          const client = await pgPool.connect();
          try {
            await client.query(sql);
          } finally {
            client.release();
          }
        } catch (err) {
          console.error(`[plugins] Rollback migration "${file}" failed:`, err);
        }
      }
    }

    // Remove files from plugins/ directory
    fs.rmSync(pluginDir, { recursive: true, force: true });

    // Remove public assets
    const publicPluginDir = path.join(PUBLIC_PLUGINS_DIR, pluginId);
    if (fs.existsSync(publicPluginDir)) {
      fs.rmSync(publicPluginDir, { recursive: true, force: true });
    }

    // Delete from plugin_registry DB table
    try {
      const client = await pgPool.connect();
      try {
        await client.query(`DELETE FROM plugin_registry WHERE id = $1`, [pluginId]);
      } finally {
        client.release();
      }
    } catch (dbErr) {
      console.error(`[plugins] DB removal failed for "${pluginId}":`, dbErr);
    }

    // Delete migration tracking
    try {
      const client = await pgPool.connect();
      try {
        await client.query(`DELETE FROM plugin_migrations WHERE plugin_id = $1`, [pluginId]);
      } finally {
        client.release();
      }
    } catch {
      // Table might not exist
    }

    console.info(`[plugins] Uninstalled: ${pluginId}`);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: `Uninstall failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// ─── Migrations ─────────────────────────────────────────────────────────────

export interface MigrationResult {
  success: boolean;
  error?: string;
  executed: string[];
}

/**
 * Ensure the plugin tracking tables exist.
 * Called automatically by runMigrations and installPluginFromZip.
 */
async function ensurePluginTables(): Promise<void> {
  try {
    const client = await pgPool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS plugin_registry (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          version VARCHAR(50) NOT NULL,
          description TEXT,
          manifest JSONB NOT NULL,
          enabled BOOLEAN NOT NULL DEFAULT TRUE,
          installed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          settings JSONB DEFAULT '{}'
        )
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS plugin_migrations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          plugin_id VARCHAR(255) NOT NULL,
          filename VARCHAR(500) NOT NULL,
          hash VARCHAR(64) NOT NULL,
          executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(plugin_id, filename)
        )
      `);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("[plugins] Failed to ensure plugin tables:", err);
  }
}

/**
 * Run SQL migration files for a plugin.
 * Tracks execution in plugin_migrations table to prevent re-execution.
 */
export async function runMigrations(
  pluginId: string,
  migrationFiles: string[],
  fileContents: Record<string, Buffer>
): Promise<MigrationResult> {
  // Ensure plugin tracking tables exist (in case init-db wasn't run)
  await ensurePluginTables();

  const executed: string[] = [];

  for (const filename of migrationFiles.sort()) {
    const sql = fileContents[filename].toString("utf-8");

    // Skip empty migrations
    if (!sql.trim()) continue;

    // Check if this migration was already executed
    const alreadyRun = await wasMigrationExecuted(pluginId, filename);
    if (alreadyRun) {
      console.info(`[plugins] Migration "${filename}" already executed, skipping`);
      continue;
    }

    // Compute hash for tracking
    const hash = crypto.createHash("sha256").update(sql).digest("hex");

    try {
      const client = await pgPool.connect();
      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query(
          `INSERT INTO plugin_migrations (plugin_id, filename, hash)
           VALUES ($1, $2, $3)
           ON CONFLICT (plugin_id, filename) DO NOTHING`,
          [pluginId, filename, hash]
        );
        await client.query("COMMIT");
        executed.push(filename);
        console.info(`[plugins] Executed migration "${filename}" for "${pluginId}"`);
      } catch (sqlErr) {
        await client.query("ROLLBACK");
        throw sqlErr;
      } finally {
        client.release();
      }
    } catch (err) {
      return {
        success: false,
        error: `Migration "${filename}" failed: ${err instanceof Error ? err.message : String(err)}`,
        executed,
      };
    }
  }

  return { success: true, executed };
}

/**
 * Check if a migration has already been executed.
 */
async function wasMigrationExecuted(pluginId: string, filename: string): Promise<boolean> {
  try {
    const client = await pgPool.connect();
    try {
      const result = await client.query(
        `SELECT 1 FROM plugin_migrations WHERE plugin_id = $1 AND filename = $2`,
        [pluginId, filename]
      );
      return result.rows.length > 0;
    } finally {
      client.release();
    }
  } catch {
    // Table doesn't exist or DB unavailable
    return false;
  }
}

// ─── Plugin Config ──────────────────────────────────────────────────────────

/**
 * Get the settings/configuration for a plugin from the DB.
 */
export async function getPluginConfig(pluginId: string): Promise<Record<string, unknown>> {
  try {
    const client = await pgPool.connect();
    try {
      const result = await client.query(
        `SELECT settings FROM plugin_registry WHERE id = $1`,
        [pluginId]
      );
      if (result.rows.length === 0) return {};
      return result.rows[0].settings ?? {};
    } finally {
      client.release();
    }
  } catch {
    return {};
  }
}

/**
 * Update the settings/configuration for a plugin in the DB.
 */
export async function updatePluginConfig(
  pluginId: string,
  settings: Record<string, unknown>
): Promise<void> {
  try {
    const client = await pgPool.connect();
    try {
      await client.query(
        `UPDATE plugin_registry SET settings = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [JSON.stringify(settings), pluginId]
      );
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(`[plugins] Failed to update config for "${pluginId}":`, err);
  }
}

// ─── List Installed Plugins ─────────────────────────────────────────────────

export interface InstalledPluginInfo {
  id: string;
  name: string;
  version: string;
  description: string | null;
  enabled: boolean;
  installedAt: string;
  hasServer: boolean;
  hasClient: boolean;
}

/**
 * List all installed plugins from the filesystem.
 */
export async function listInstalledPlugins(): Promise<InstalledPluginInfo[]> {
  const plugins: InstalledPluginInfo[] = [];

  if (!fs.existsSync(PLUGINS_DIR)) return plugins;

  const entries = fs.readdirSync(PLUGINS_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith(".")) continue;

    const manifestPath = path.join(PLUGINS_DIR, entry.name, "manifest.json");
    if (!fs.existsSync(manifestPath)) continue;

    try {
      const raw = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
      const parsed = ManifestSchema.parse(raw);

      // Check DB for enabled state and install date
      let enabled = true;
      let installedAt = "";
      try {
        const client = await pgPool.connect();
        try {
          const dbResult = await client.query(
            `SELECT enabled, installed_at FROM plugin_registry WHERE id = $1`,
            [parsed.id]
          );
          if (dbResult.rows.length > 0) {
            enabled = dbResult.rows[0].enabled;
            installedAt = dbResult.rows[0].installed_at;
          }
        } finally {
          client.release();
        }
      } catch {
        // DB unavailable
      }

      plugins.push({
        id: parsed.id,
        name: parsed.name,
        version: parsed.version,
        description: parsed.description ?? null,
        enabled,
        installedAt,
        hasServer: fs.existsSync(path.join(PLUGINS_DIR, entry.name, "server", "index.js")),
        hasClient: fs.existsSync(path.join(PUBLIC_PLUGINS_DIR, parsed.id, "ui.js")),
      });
    } catch (err) {
      console.error(`[plugins] Invalid manifest in "${entry.name}":`, err);
    }
  }

  return plugins;
}
