import fs from "node:fs/promises";
import path from "node:path";

export async function GET() {
  const dir = path.join(process.cwd(), "sample-projects");
  const entries = await fs.readdir(dir).catch(() => []);
  const projects = [];
  for (const e of entries) {
    if (e.startsWith(".")) continue;
    const stat = await fs.stat(path.join(dir, e)).catch(() => null);
    if (stat?.isDirectory()) projects.push(e);
  }
  return Response.json({ projects });
}
