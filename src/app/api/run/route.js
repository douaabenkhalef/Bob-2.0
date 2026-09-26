import { runPipeline } from "@/lib/agents/headAgent";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req) {
  const { projectName } = await req.json();
  if (!projectName) {
    return Response.json({ error: "projectName required" }, { status: 400 });
  }

  const workDir = path.join(process.cwd(), "sample-projects", projectName);

  // Guard against path traversal
  if (!workDir.startsWith(path.join(process.cwd(), "sample-projects"))) {
    return Response.json({ error: "invalid projectName" }, { status: 400 });
  }

  // Concatenate all repo files for context (skip node_modules, .git)
  const files = await fs.readdir(workDir, { recursive: true }).catch(() => []);
  let repoFiles = "";
  for (const f of files) {
    if (typeof f !== "string") continue;
    if (f.includes("node_modules") || f.startsWith(".git")) continue;
    const full = path.join(workDir, f);
    const stat = await fs.stat(full).catch(() => null);
    if (!stat || !stat.isFile()) continue;
    const content = await fs.readFile(full, "utf8").catch(() => "");
    repoFiles += `\n--- ${f} ---\n${content}\n`;
  }

  const errorLog = await fs
    .readFile(path.join(workDir, "error.log"), "utf8")
    .catch(() => "");

  const timeline = [];
  const result = await runPipeline({
    repoFiles, errorLog, workDir,
    onStep: (e) => timeline.push({ ...e, at: Date.now() }),
  });

  return Response.json({ ...result, liveTimeline: timeline });
}
