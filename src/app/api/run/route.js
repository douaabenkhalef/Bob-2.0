import { runPipeline } from "@/lib/agents/headAgent";
import { readRepo } from "@/lib/readRepo";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req) {
  const { projectName } = await req.json();
  if (!projectName) {
    return Response.json({ error: "projectName required" }, { status: 400 });
  }

  const projectsRoot = path.join(process.cwd(), "sample-projects");
  const workDir = path.join(projectsRoot, projectName);

  if (!workDir.startsWith(projectsRoot)) {
    return Response.json({ error: "invalid projectName" }, { status: 400 });
  }

  const repoFiles = await readRepo(workDir);
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
