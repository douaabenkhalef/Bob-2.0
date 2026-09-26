import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs   from "node:fs/promises";
import path from "node:path";

const run = promisify(exec);

/**
 * Detect project language by inspecting files present.
 * Returns "python" | "node"
 */
async function detectLanguage(workDir) {
  const entries = await fs.readdir(workDir).catch(() => []);
  if (
    entries.includes("requirements.txt") ||
    entries.includes("setup.py") ||
    entries.includes("pyproject.toml") ||
    entries.some((f) => f.endsWith(".py"))
  ) return "python";
  return "node";
}

/**
 * Apply patches then run the test suite.
 * Supports Node.js (npm test) and Python (pytest or python -m unittest).
 */
export async function verify({ workDir, patches = [] }) {
  const start = Date.now();

  // 1. Apply patches
  for (const p of patches) {
    const target = path.join(workDir, p.file);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, p.newContent, "utf8");
  }

  const lang = await detectLanguage(workDir);

  // 2. Build test command per language
  let cmd;
  if (lang === "python") {
    // Prefer pytest, fall back to unittest discovery
    const hasPytest = await run("python3 -m pytest --version", { cwd: workDir })
      .then(() => true).catch(() => false);

    const hasRequirements = await fs.access(path.join(workDir, "requirements.txt"))
      .then(() => true).catch(() => false);

    const install = hasRequirements
      ? "pip install -q -r requirements.txt && "
      : "";

    cmd = hasPytest
      ? `${install}python3 -m pytest --tb=short -q`
      : `${install}python3 -m unittest discover -s . -p "test_*.py" -v`;
  } else {
    // Node.js — nuke stale lockfile / node_modules for clean install
    await fs.rm(path.join(workDir, "package-lock.json"), { force: true }).catch(() => {});
    await fs.rm(path.join(workDir, "node_modules"), { recursive: true, force: true }).catch(() => {});

    const hasPkg = await fs.access(path.join(workDir, "package.json"))
      .then(() => true).catch(() => false);

    cmd = hasPkg
      ? "npm install --silent --no-audit --no-fund && npm test --silent"
      : "exit 1";
  }

  try {
    const { stdout, stderr } = await run(cmd, {
      cwd:       workDir,
      timeout:   120_000,
      maxBuffer: 10 * 1024 * 1024,
    });
    return { passed: true, stdout, stderr, lang, durationMs: Date.now() - start };
  } catch (e) {
    return {
      passed:    false,
      stdout:    e.stdout ?? "",
      stderr:    e.stderr ?? String(e),
      lang,
      durationMs: Date.now() - start,
    };
  }
}
