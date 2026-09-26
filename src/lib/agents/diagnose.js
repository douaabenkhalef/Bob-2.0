import { bobInfer } from "../bob/index.js";

const SYSTEM = `You are the Diagnosis Agent.

Analyze the ENTIRE repository, not just snippets. Identify the single root cause of failure.
Return ONLY valid JSON, no markdown fences, no commentary:

{
  "rootCause": "one sentence describing the underlying bug",
  "evidence": ["file:line", "file:line"],
  "confidence": 0.0-1.0
}`;

/**
 * @param {object} args
 * @param {string} args.repoFiles - Concatenated file contents (with headers)
 * @param {string} args.errorLog  - Test failure output
 * @returns {Promise<{rootCause:string, evidence:string[], confidence:number}>}
 */
export async function diagnose({ repoFiles, errorLog }) {
  const user = `# Repo files\n${repoFiles}\n\n# Error log\n${errorLog || "(no error log provided)"}`;
  const raw = await bobInfer(SYSTEM, user);

  try {
    const cleaned = raw.replace(/^```json\s*|\s*```$/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return { rootCause: raw, evidence: [], confidence: 0 };
  }
}
