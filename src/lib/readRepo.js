import fs from "node:fs/promises";
import path from "node:path";

const IGNORE = new Set(["node_modules", ".git", ".next", "package-lock.json"]);

/**
 * Read all source files under `dir` into one string with ---FILE--- separators.
 * Caps total size to avoid blowing the model context.
 */
export async function readRepo(dir, maxBytes = 120_000) {
  let out = "";
  async function walk(d, prefix = "") {
    const entries = await fs.readdir(d, { withFileTypes: true }).catch(() => []);
    for (const e of entries) {
      if (IGNORE.has(e.name) || e.name.startsWith(".")) continue;
      const rel = prefix ? `${prefix}/${e.name}` : e.name;
      const full = path.join(d, e.name);
      if (e.isDirectory()) {
        await walk(full, rel);
      } else {
        const content = await fs.readFile(full, "utf8").catch(() => "");
        const chunk = `\n--- ${rel} ---\n${content}\n`;
        if ((out.length + chunk.length) > maxBytes) {
          out += `\n--- ${rel} --- (truncated, file too large)\n`;
        } else {
          out += chunk;
        }
      }
    }
  }
  await walk(dir);
  return out;
}
