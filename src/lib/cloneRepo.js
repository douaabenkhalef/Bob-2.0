import { exec } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";

const run = promisify(exec);

/**
 * Clone a GitHub repo into destDir.
 * Requires git to be installed on the system.
 */
export async function cloneRepo(githubUrl, destDir) {
  // Normalise URL — ensure it ends with .git and uses https
  const url = githubUrl.trim().replace(/\/$/, "");
  const cloneUrl = url.endsWith(".git") ? url : `${url}.git`;

  // Safety: only allow github.com URLs
  if (!cloneUrl.startsWith("https://github.com/")) {
    throw new Error("Only https://github.com/ URLs are supported.");
  }

  const cmd = `git clone --depth 1 "${cloneUrl}" "${path.join(destDir)}"`;
  try {
    await run(cmd, { timeout: 60_000 });
  } catch (e) {
    throw new Error(`git clone failed: ${e.stderr || e.message}`);
  }
}
