import fs     from "node:fs/promises";
import path   from "node:path";
import os     from "node:os";
import crypto from "node:crypto";

export const runtime     = "nodejs";
export const maxDuration = 60;
export const dynamic     = "force-dynamic";

const REGISTRY_PATH = path.join(os.tmpdir(), "bob-uploads-registry.json");

async function readRegistry() {
  try {
    return JSON.parse(await fs.readFile(REGISTRY_PATH, "utf8"));
  } catch { return {}; }
}

async function writeRegistry(obj) {
  await fs.writeFile(REGISTRY_PATH, JSON.stringify(obj), "utf8");
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const files    = formData.getAll("files");

    if (!files.length) return Response.json({ error: "No files uploaded" }, { status: 400 });

    const tmpDir    = await fs.mkdtemp(path.join(os.tmpdir(), "bob-upload-"));
    const fileNames = [];

    for (const file of files) {
      if (typeof file === "string") continue;
      const bytes    = await file.arrayBuffer();
      const safeName = path.basename(file.name);
      if (!safeName) continue;
      const dest = path.join(tmpDir, safeName);
      if (!dest.startsWith(tmpDir)) continue;
      await fs.mkdir(path.dirname(dest), { recursive: true });
      await fs.writeFile(dest, Buffer.from(bytes));
      fileNames.push(safeName);
    }

    if (!fileNames.length) return Response.json({ error: "No valid files" }, { status: 400 });

    const token = crypto.randomBytes(8).toString("hex");
    const reg   = await readRegistry();
    reg[token]  = tmpDir;
    await writeRegistry(reg);

    console.log(`[upload] token=${token} dir=${tmpDir} files=${fileNames.join(",")}`);
    return Response.json({ uploadId: token, fileNames });
  } catch (err) {
    console.error("[upload] error:", err);
    return Response.json({ error: err.message || "Upload failed" }, { status: 500 });
  }
}

// Helper for /api/run to resolve a token across module boundaries
export async function resolveUploadId(token) {
  const reg = await readRegistry();
  const dir = reg[token];
  if (dir) {
    delete reg[token];
    await writeRegistry(reg).catch(() => {});
  }
  return dir || null;
}
