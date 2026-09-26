import { runPipeline } from "@/lib/agents/headAgent";
import { readRepo }    from "@/lib/readRepo";
import { logRun, getLastRun } from "@/lib/supabase/client";
import { cloneRepo }   from "@/lib/cloneRepo";
import { resolveUploadId } from "@/app/api/upload/route";
import fs   from "node:fs/promises";
import path from "node:path";
import os   from "node:os";

export const runtime    = "nodejs";
export const maxDuration = 300;

// ── GET — fetch last run from Supabase ────────────────────────────────────────
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const projectName = searchParams.get("project");
  if (!projectName) return Response.json({ error: "project required" }, { status: 400 });
  const last = await getLastRun(projectName);
  if (!last) return Response.json({ error: "no run found" }, { status: 404 });
  return Response.json(last);
}

// ── POST — run pipeline with SSE streaming ───────────────────────────────────
export async function POST(req) {
  const body = await req.json();
  const { projectName, githubUrl, uploadId } = body;

  if (!projectName && !githubUrl && !uploadId) {
    return Response.json({ error: "projectName, githubUrl, or uploadId required" }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream  = new TransformStream();
  const writer  = stream.writable.getWriter();

  let writerClosed = false;
  function send(event, data) {
    if (writerClosed) return;
    writer.write(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)).catch(() => {});
  }

  // Run pipeline in background, stream events to client
  (async () => {
    let workDir;
    let cleanupTmp = false;

    try {
      // ── Resolve work directory ──────────────────────────────────────────────
      if (githubUrl) {
        send("step", { step: "clone", status: "working", message: `Cloning ${githubUrl}…` });
        const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "bob-"));
        cleanupTmp = true;
        workDir = tmpDir;
        await cloneRepo(githubUrl, tmpDir);
        send("step", { step: "clone", status: "done", message: "Repository cloned." });
      } else if (uploadId) {
        // Resolve short token → actual tmp dir path
        const resolvedDir = await resolveUploadId(uploadId);
        if (!resolvedDir) throw new Error(`Upload session not found (token: ${uploadId}). Please re-upload.`);
        workDir    = resolvedDir;
        cleanupTmp = true;
      } else {
        const projectsRoot = path.join(process.cwd(), "sample-projects");
        workDir = path.join(projectsRoot, projectName);
        if (!workDir.startsWith(projectsRoot)) throw new Error("invalid projectName");
      }

      const label = githubUrl
        ? githubUrl.replace(/^https?:\/\/(www\.)?github\.com\//, "").replace(/\.git$/, "")
        : uploadId
          ? path.basename(uploadId)
          : projectName;

      const repoFiles = await readRepo(workDir);
      const errorLog  = await fs.readFile(path.join(workDir, "error.log"), "utf8").catch(() => "");

      // ── Run pipeline, emit SSE events per step ──────────────────────────────
      const result = await runPipeline({
        repoFiles, errorLog, workDir,
        onStep: (e) => send("step", e),
      });

      // ── Persist to Supabase ─────────────────────────────────────────────────
      await logRun({ projectName: label, result });

      send("done", { ...result, projectLabel: label });
    } catch (e) {
      send("error", { message: e.message });
    } finally {
      if (cleanupTmp && workDir) {
        await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});
      }
      if (!writerClosed) {
        writerClosed = true;
        writer.close().catch(() => {});
      }
    }
  })();

  return new Response(stream.readable, {
    headers: {
      "Content-Type":  "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection":    "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
