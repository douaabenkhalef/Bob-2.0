import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import path from "node:path";

const run = promisify(exec);

export async function verify({ workDir, patches = [] }) {
  const start = Date.now();

  // 1. Apply patches
  for (const p of patches) {
    const target = path.join(workDir, p.file);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, p.newContent, "utf8");
  }

  // 2. Nuke any stale lockfile / node_modules so npm install starts clean
  await fs.rm(path.join(workDir, "package-lock.json"), { force: true }).catch(() => {});
  await fs.rm(path.join(workDir, "node_modules"), { recursive: true, force: true }).catch(() => {});

  // 3. Build test command
  const hasPkg = await fs.access(path.join(workDir, "package.json"))
    .then(() => true).catch(() => false);

  const cmd = hasPkg
    ? "npm install --silent --no-audit --no-fund && npm test --silent"
    : "exit 1";

  try {
    const { stdout, stderr } = await run(cmd, {
      cwd: workDir,
      timeout: 120000,
      maxBuffer: 10 * 1024 * 1024,
    });
    return { passed: true, stdout, stderr, durationMs: Date.now() - start };
  } catch (e) {
    return {
      passed: false,
      stdout: e.stdout ?? "",
      stderr: e.stderr ?? String(e),
      durationMs: Date.now() - start,
    };
  }
}
