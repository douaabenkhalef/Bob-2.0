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

Rules:
- Output the FULL new contents of each changed file, not a diff.
- Only touch files that must change.
- Keep the existing style and structure.`;

/**
 * @param {object} args
 * @param {{rootCause:string, evidence:string[], confidence:number}} args.diagnosis
 * @param {string} args.repoFiles
 * @returns {Promise<{patches:Array<{file:string,newContent:string}>, rationale:string}>}
 */
export async function fix({ diagnosis, repoFiles }) {
  const user = `# Diagnosis\n${JSON.stringify(diagnosis, null, 2)}\n\n# Repo files\n${repoFiles}`;
  const raw = await bobInfer(SYSTEM, user);

  try {
    const cleaned = raw.replace(/^```json\s*|\s*```$/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return { patches: [], rationale: raw };
  }
}
