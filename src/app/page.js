"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Landing() {
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((d) => {
        setProjects(d.projects || []);
        if (d.projects?.length) setSelected(d.projects[0]);
      })
      .catch(() => {});
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-8">
      <div className="text-center space-y-3">
        <h1 className="text-5xl font-bold tracking-tight">Self-Healing Debug Agent</h1>
        <p className="text-gray-500 text-lg">
          Broken code goes in. Fixed code comes out. Bob-powered, fully autonomous.
        </p>
      </div>

      <div className="flex flex-col gap-4 w-96">
        <label className="text-sm font-medium text-gray-700">Pick a broken project</label>
        <select
          className="border rounded-lg px-4 py-3 bg-white"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          {projects.length === 0 && <option>(no sample projects found)</option>}
          {projects.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>

        <button
          className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-40"
          disabled={!selected}
          onClick={() => router.push(`/pipeline?project=${encodeURIComponent(selected)}`)}
        >
          Run Agent Pipeline →
        </button>
      </div>

      <p className="text-xs text-gray-400 mt-4">Diagnose → Fix → Verify → Retry (max 3)</p>
    </main>
  );
}
