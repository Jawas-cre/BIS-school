import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * The version of this copy, as recorded by the zip and the automatic updater (scripts/update.mjs).
 * Null in a developer checkout, which has no version file.
 */
export async function installedVersion() {
  try {
    const v = JSON.parse(await readFile(path.join(process.cwd(), ".bis-version.json"), "utf8"));
    return {
      sha: String(v.sha).slice(0, 7),
      committedAt: v.committedAt ? new Date(v.committedAt) : null,
      installedAt: v.installedAt ? new Date(v.installedAt) : null,
      updates: process.env.BIS_UPDATES !== "off",
    };
  } catch {
    return null;
  }
}
