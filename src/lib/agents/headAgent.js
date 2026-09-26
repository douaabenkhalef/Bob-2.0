import { diagnose } from "./diagnose.js";
import { fix }      from "./fix.js";
import { verify }   from "./verify.js";

const MAX_ATTEMPTS = 3;

export async function runPipeline({ repoFiles, errorLog, workDir, onStep }) {
  const timeline = [];
  const startedAt = Date.now();
  let currentError = errorLog;
  let diagnosis, fixResult, verification;

  onStep?.({ step: "diagnose", status: "working" });
  diagnosis = await diagnose({ repoFiles, errorLog: currentError });
  onStep?.({ step: "diagnose", status: "done", payload: diagnosis });
  timeline.push({ step: "diagnose", at: Date.now() - startedAt, diagnosis });

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    onStep?.({ step: "fix", status: "working", attempt });
    fixResult = await fix({ diagnosis, repoFiles });
    onStep?.({ step: "fix", status: "done", attempt, payload: fixResult });
    timeline.push({ step: "fix", attempt, at: Date.now() - startedAt, fixResult });

    onStep?.({ step: "verify", status: "working", attempt });
    verification = await verify({ workDir, patches: fixResult.patches });
    onStep?.({
      step: "verify",
      status: verification.passed ? "done" : "failed",
      attempt,
      payload: verification,
    });
    timeline.push({ step: "verify", attempt, at: Date.now() - startedAt, verification });

    if (verification.passed) {
      return {
        success: true,
        attempts: attempt,
        diagnosis, fix: fixResult, verification, timeline,
        totalMs: Date.now() - startedAt,
      };
    }

    // Prepare next attempt — only log retry if we'll actually try again
    currentError = verification.stderr || verification.stdout;
    const willRetry = attempt < MAX_ATTEMPTS;
    if (willRetry) {
      onStep?.({ step: "diagnose", status: "retry", attempt: attempt + 1 });
      diagnosis = await diagnose({ repoFiles, errorLog: currentError });
      timeline.push({ step: "diagnose", attempt: attempt + 1, at: Date.now() - startedAt, diagnosis });
    }
  }

  return {
    success: false,
    attempts: MAX_ATTEMPTS,
    diagnosis, fix: fixResult, verification, timeline,
    totalMs: Date.now() - startedAt,
  };
}
