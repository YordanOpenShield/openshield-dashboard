/**
 * ─── Zip Utilities ──────────────────────────────────────────────────────────
 *
 * Handles extraction of plugin zip archives. Uses adm-zip for cross-platform
 * zip extraction.
 */

import AdmZip from "adm-zip";

export interface ExtractedZip {
  files: Record<string, Buffer>;
}

/**
 * Extract a zip buffer into a flat map of file paths to buffers.
 *
 * @param zipBuffer - The raw zip file contents
 * @returns A map of relative file paths to their buffer contents
 */
export async function extractZip(zipBuffer: Buffer): Promise<ExtractedZip> {
  const zip = new AdmZip(zipBuffer);
  const entries = zip.getEntries();
  const files: Record<string, Buffer> = {};

  for (const entry of entries) {
    // Skip directories
    if (entry.isDirectory) continue;

    // Normalize path to use forward slashes
    const entryPath = entry.entryName.replace(/\\/g, "/");

    files[entryPath] = entry.getData();
  }

  return { files };
}
