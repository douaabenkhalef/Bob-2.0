"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const MANUAL_MINUTES = 45;

function ReportInner() {
  const params = useSearchParams();
  const router = useRouter();
  const project = params.get("project");

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
  if (!project) return;
  fetch(`/api/run?project=${encodeURIComponent(project)}`)
    .then((r) => r.json())
    .then(setData)
    .catch((e) => setError(String(e)));
}, [project]);
 

  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;
  if (!data) return <div className="p-8">Loading report…</div>;

  const seconds = (data.totalMs / 1000).toFixed(2);
  const factor = Math.round((MANUAL_MINUTES * 60) / (data.totalMs / 1000));

  return (
    <main className="min-h-screen p-10 bg-gray-50">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Report for</p>
            <h1 className="text-3xl font-bold">{project}</h1>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
            data.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}>
            {data.success ? "✓ Fixed & Verified" : "✗ Unresolved"}
          </span>
        </header>

        <section className="bg-black text-white rounded-2xl p-8 text-center">
          <p className="text-sm uppercase tracking-wider opacity-70">Time to fix</p>
          <p className="text-4xl font-bold mt-2">
            Manual: {MANUAL_MINUTES} min → Agent: {seconds} sec
          </p>
          <p className="text-sm opacity-70 mt-3">
            {factor}× faster • {data.attempts} attempt{data.attempts > 1 ? "s" : ""}
          </p>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-3">🔍 Root cause</h2>
          <p className="text-gray-800">{data.diagnosis?.rootCause}</p>
          {data.diagnosis?.evidence?.length > 0 && (
            <ul className="mt-3 text-sm text-gray-500 list-disc list-inside">
              {data.diagnosis.evidence.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-3">🔧 Files patched</h2>
          {(data.fix?.patches || []).map((p, i) => (
            <div key={i} className="mb-4">
              <p className="font-mono text-sm text-blue-700">{p.file}</p>
              <pre className="bg-gray-100 rounded p-3 text-xs overflow-x-auto mt-1">
                {p.newContent}
              </pre>
            </div>
          ))}
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-3">✅ Verification</h2>
          <p className={data.verification?.passed ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
            {data.verification?.passed ? "Tests PASSED" : "Tests FAILED"}
          </p>
          <pre className="bg-gray-900 text-gray-100 rounded p-4 text-xs mt-3 overflow-x-auto">
            {data.verification?.stdout || data.verification?.stderr || "(no output)"}
          </pre>
        </section>

        <button
          onClick={() => router.push("/")}
          className="bg-black text-white px-6 py-3 rounded-lg font-medium"
        >
          ← Run another project
        </button>
      </div>
    </main>
  );
}

export default function Report() {
  return (
    <Suspense fallback={<div className="p-8">Loading…</div>}>
      <ReportInner />
    </Suspense>
  );
}
