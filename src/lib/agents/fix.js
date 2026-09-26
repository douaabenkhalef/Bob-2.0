import { bobInfer } from "../bob/index.js";

const SYSTEM = `You are the Fix Agent.

Given a root-cause diagnosis and the repository files, produce a minimal patch.

Return ONLY valid JSON, no markdown fences:

{
  "patches": [
    { "file": "relative/path.ext", "newContent": "full file contents after fix" }
  ],
  "rationale": "one sentence explaining the fix"
}

CRITICAL RULES:
- LANGUAGE PRIORITY:
  * If "requirements.txt" exists, this is a PYTHON project — patch .py files ONLY.
    Never touch package.json.
  * If "package.json" exists without requirements.txt, this is a NODE project —
    patch .js / .json files.
- Output the FULL new contents of each changed file, not a diff.
- Only touch SOURCE files. Never touch lockfiles, node_modules, or .venv.
- Keep the existing style and structure.
- If you cannot determine a fix, return { "patches": [], "rationale": "explanation" }.`;

export async function fix({ diagnosis, repoFiles }) {
  const user = `# Diagnosis\n${JSON.stringify(diagnosis, null, 2)}\n\n# Repo files\n${repoFiles}`;
  const raw = await bobInfer(SYSTEM, user);

  try {
    const cleaned = raw.replace(/^```json\s*|\s*```$/g, "").trim();
    const parsed  = JSON.parse(cleaned);

    // Guard: strip any lockfile patches the model sneaks in
    if (Array.isArray(parsed.patches)) {
      parsed.patches = parsed.patches.filter(
        (p) => !/(package-lock\.json|yarn\.lock|pnpm-lock\.yaml)/.test(p.file)
      );
    }
    return parsed;
  } catch {
    return { patches: [], rationale: raw };
  }
}
