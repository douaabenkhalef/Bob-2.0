import { cloneRepo } from "@/lib/cloneRepo";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime     = "nodejs";
export const maxDuration = 120;

export async function POST(req) {
  try {
    const { repoUrl } = await req.json();

    if (!repoUrl || !/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/.test(repoUrl)) {
      return Response.json({ error: "Only public github.com URLs are supported" }, { status: 400 });
    }

    if (process.env.VERCEL) {
      return Response.json({ error: "Cloning is disabled on Vercel (no writable filesystem)" }, { status: 400 });
    }

    const repoName = repoUrl.replace(/\/$/, "").split("/").pop().replace(/\.git$/, "");
    const safeName = `clone-${repoName}-${Date.now()}`;
    const target   = path.join(process.cwd(), "sample-projects", safeName);

    await cloneRepo(repoUrl, target);

    // Capture initial test failure for the pipeline's error.log
    let errLog = "(no test failures captured)";
    try {
      const hasPkg = await fs.access(path.join(target, "package.json")).then(() => true).catch(() => false);
      const hasReq = await fs.access(path.join(target, "requirements.txt")).then(() => true).catch(() => false);

      if (hasPkg || hasReq) {
        const { exec } = await import("node:child_process");
        const { promisify } = await import("node:util");
        const run = promisify(exec);
        const cmd = hasPkg
          ? "npm install --silent --no-audit --no-fund && npm test"
          : "pip install -q -r requirements.txt && python3 -m pytest -q";
        try {
          await run(cmd, { cwd: target, timeout: 90000 });
        } catch (e) {
          errLog = `${e.stdout || ""}\n${e.stderr || ""}` || "(empty)";
        }
      }
    } catch { /* ignore */ }

    await fs.writeFile(path.join(target, "error.log"), errLog, "utf8");

    return Response.json({ projectName: safeName });
  } catch (err) {
    return Response.json({ error: err.message || "Clone failed" }, { status: 500 });
  }
}
