import { createClient } from "@supabase/supabase-js";

// Support both names: Vercel renames NEXT_PUBLIC_* keys to plain names
// when it detects a credential, so we read both variants.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

export const supabase = url && key ? createClient(url, key) : null;

/**
 * Persist a full pipeline run.
 * Best-effort: never throws, never blocks the pipeline.
 */
export async function logRun({ projectName, result }) {
  if (!supabase) return;
  try {
    const { data: sub, error: subErr } = await supabase
      .from("submissions")
      .insert({
        project_name: projectName,
        success: result.success,
        attempts: result.attempts,
        total_ms: result.totalMs,
      })
      .select("id")
      .single();

    if (subErr || !sub) {
      console.warn("Supabase submissions insert failed:", subErr?.message);
      return;
    }

    if (Array.isArray(result.timeline)) {
      await supabase.from("agent_logs").insert(
        result.timeline.map((ev) => ({
          submission_id: sub.id,
          step: ev.step,
          attempt: ev.attempt ?? null,
          status: ev.status ?? null,
          payload:
            ev.payload ?? ev.diagnosis ?? ev.fixResult ?? ev.verification ?? null,
          at_ms: ev.at ?? null,
        }))
      );
    }

    await supabase.from("results").insert({
      submission_id: sub.id,
      root_cause: result.diagnosis?.rootCause ?? null,
      patches: result.fix?.patches ?? [],
      verification_passed: result.verification?.passed ?? null,
      verification_stdout: (result.verification?.stdout ?? "").slice(0, 10000),
    });
  } catch (e) {
    console.warn("Supabase logRun failed (non-fatal):", e.message);
  }
}

/**
 * Fetch the most recent pipeline run for a project from Supabase.
 */
export async function getLastRun(projectName) {
  if (!supabase) return null;
  try {
    const { data: sub } = await supabase
      .from("submissions")
      .select("id, project_name, success, attempts, total_ms, created_at")
      .eq("project_name", projectName)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!sub) return null;

    const { data: res } = await supabase
      .from("results")
      .select("root_cause, patches, verification_passed, verification_stdout")
      .eq("submission_id", sub.id)
      .single();

    return {
      success: sub.success,
      attempts: sub.attempts,
      totalMs: sub.total_ms,
      diagnosis: { rootCause: res?.root_cause ?? null, evidence: [], confidence: null },
      fix: { patches: res?.patches ?? [], rationale: null },
      verification: {
        passed: res?.verification_passed ?? null,
        stdout: res?.verification_stdout ?? "",
        stderr: "",
      },
      timeline: [],
    };
  } catch (e) {
    console.warn("getLastRun failed:", e.message);
    return null;
  }
}
