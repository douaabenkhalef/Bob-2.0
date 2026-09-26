import { runPipeline } from "@/lib/agents/headAgent";
import { readRepo } from "@/lib/readRepo";
import { logRun, getLastRun } from "@/lib/supabase/client";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const projectName = searchParams.get("project");
  if (!projectName) return Response.json({ error: "project required" }, { status: 400 });

  const last = await getLastRun(projectName);
  if (!last) return Response.json({ error: "no run found" }, { status: 404 });
  return Response.json(last);
}

export async function POST(req) {
  const { projectName } = await req.json();
  if (!projectName) return Response.json({ error: "projectName required" }, { status: 400 });

  const projectsRoot = path.join(process.cwd(), "sample-projects");
  const workDir = path.join(projectsRoot, projectName);
  if (!workDir.startsWith(projectsRoot)) return Response.json({ error: "invalid projectName" }, { status: 400 });

  const repoFiles = await readRepo(workDir);
  const errorLog = await fs.readFile(path.join(workDir, "error.log"), "utf8").catch(() => "");

  const timeline = [];
  const result = await runPipeline({
    repoFiles, errorLog, workDir,
    onStep: (e) => timeline.push({ ...e, at: Date.now() }),
  });

  await logRun({ projectName, result: { ...result, timeline } });

  return Response.json({ ...result, liveTimeline: timeline });
}
