"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function StatusDot({ status }) {
  const colors = {
    idle: "bg-gray-300",
    working: "bg-blue-500 animate-pulse",
    done: "bg-green-500",
    failed: "bg-red-500",
    retry: "bg-yellow-500",
  };
  return <span className={`inline-block w-4 h-4 rounded-full ${colors[status] || colors.idle}`} />;
}

function PipelineInner() {
  const params = useSearchParams();
  const router = useRouter();
  const project = params.get("project");

  const [steps, setSteps] = useState({
    diagnose: { status: "idle", attempt: null, payload: null },
    fix:      { status: "idle", attempt: null, payload: null },
    verify:   { status: "idle", attempt: null, payload: null },
  });
  const [attempt, setAttempt] = useState(1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!project) return;
    let cancelled = false;

    (async () => {
      try {
        // NOTE: this endpoint returns only when the pipeline finishes.
        // We simulate step-by-step animation on the client so the UI feels live.
        const simulate = ["diagnose", "fix", "verify"];
        for (const s of simulate) {
          if (cancelled) return;
          setSteps((prev) => ({ ...prev, [s]: { ...prev[s], status: "working" } }));
          await new Promise((r) => setTimeout(r, 400));
        }

        const res = await fetch("/api/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectName: project }),
        });
        const data = await res.json();
        if (cancelled) return;

        // Replay the live timeline we got back
        const finalSteps = { diagnose: { status: "done" }, fix: { status: "done" }, verify: {} };
        for (const ev of data.liveTimeline || []) {
          const s = ev.step;
          if (s === "diagnose") finalSteps.diagnose = { status: "done", payload: ev.payload };
          if (s === "fix") finalSteps.fix = { status: "done", attempt: ev.attempt, payload: ev.payload };
          if (s === "verify") finalSteps.verify = {
            status: ev.status === "done" ? "done" : "failed",
            attempt: ev.attempt,
            payload: ev.payload,
          };
        }
        setSteps(finalSteps);
        setAttempt(data.attempts || 1);
        setResult(data);
      } catch (e) {
        if (!cancelled) setError(String(e));
      }
    })();

    return () => { cancelled = true; };
  }, [project]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-10 p-8 bg-gray-50">
      <div className="text-center">
        <p className="text-sm text-gray-500">Project</p>
        <h1 className="text-2xl font-semibold">{project}</h1>
        <p className="text-xs text-gray-400 mt-1">Attempt {attempt} of 3</p>
      </div>

      <div className="flex items-center gap-6">
        {["diagnose", "fix", "verify"].map((name, i) => (
          <div key={name} className="flex items-center gap-6">
            <div className="flex flex-col items-center gap-3 w-40">
              <StatusDot status={steps[name].status} />
              <div className="text-center">
                <p className="font-semibold capitalize">{name}</p>
                <p className="text-xs text-gray-500">{steps[name].status}</p>
              </div>
            </div>
            {i < 2 && <div className="text-gray-300 text-2xl">→</div>}
          </div>
        ))}
      </div>

      {result && (
        <div className="text-center space-y-2">
          <p className={`text-lg font-semibold ${result.success ? "text-green-600" : "text-red-600"}`}>
            {result.success ? "✓ Fixed and verified" : "✗ Could not fix within 3 attempts"}
          </p>
          <p className="text-sm text-gray-500">Total time: {result.totalMs} ms</p>
          <button
            className="mt-4 bg-black text-white px-6 py-2 rounded-lg"
            onClick={() => router.push(`/report?project=${encodeURIComponent(project)}`)}
          >
            View Report →
          </button>
        </div>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}
    </main>
  );
}

export default function Pipeline() {
  return (
    <Suspense fallback={<div className="p-8">Loading…</div>}>
      <PipelineInner />
    </Suspense>
  );
}
