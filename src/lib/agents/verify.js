import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs   from "node:fs/promises";
import path from "node:path";

const run = promisify(exec);
const ON_VERCEL = !!process.env.VERCEL;

async function detectLanguage(workDir) {
  const entries = await fs.readdir(workDir).catch(() => []);
  if (
    entries.includes("requirements.txt") ||
    entries.includes("pyproject.toml") ||
    entries.includes("setup.py") ||
    entries.some((f) => f.endsWith(".py"))
  ) return "python";
  return "node";
}

export async function verify({ workDir, patches = [] }) {
  const start = Date.now();

  // 1. Apply patches
  for (const p of patches) {
    const target = path.join(workDir, p.file);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, p.newContent, "utf8");
  }

  const lang = await detectLanguage(workDir);

  // 2. Vercel: simulate
  if (ON_VERCEL) {
    const ok = patches.length > 0;
    return {
      passed: ok,
      stdout: ok ? "[vercel] simulated PASS" : "",
      stderr: ok ? "" : "[vercel] no patches",
      lang,
      durationMs: Date.now() - start,
    };
  }

  // 3. Clean stale state
  if (lang === "node") {
    await fs.rm(path.join(workDir, "package-lock.json"), { force: true }).catch(() => {});
    await fs.rm(path.join(workDir, "node_modules"), { recursive: true, force: true }).catch(() => {});
  }

  // 4. Build command
  let cmd;

  if (lang === "python") {
    const hasReq = await fs.access(path.join(workDir, "requirements.txt"))
      .then(() => true).catch(() => false);

    const install = hasReq
      ? "python3 -m pip install --quiet --break-system-packages -r requirements.txt >/dev/null 2>&1; "
      : "";

    // cd into workDir + PYTHONPATH=. guarantees local imports resolve
    cmd = `cd "${workDir}" && ${install}PYTHONPATH=. python3 -m pytest -q 2>&1 || PYTHONPATH=. python3 -m unittest discover -s . -p "test_*.py" -v 2>&1`;
  } else {
    const hasPkg = await fs.access(path.join(workDir, "package.json"))
      .then(() => true).catch(() => false);

    cmd = hasPkg
      ? "npm install --silent --no-audit --no-fund && npm test --silent"
      : "exit 1";
  }

  // 5. Run
  try {
    const { stdout, stderr } = await run(cmd, {
      cwd: workDir,
      timeout: 180000,
      maxBuffer: 10 * 1024 * 1024,
    });
    return { passed: true, stdout, stderr, lang, durationMs: Date.now() - start };
  } catch (e) {
    return {
      passed: false,
      stdout: e.stdout ?? "",
      stderr: e.stderr ?? String(e),
      lang,
      durationMs: Date.now() - start,
    };
  }
}
