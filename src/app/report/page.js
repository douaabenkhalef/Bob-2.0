"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const MANUAL_MINUTES = 45;

function ReportInner() {
  const params  = useSearchParams();
  const router  = useRouter();
  const project = params.get("project");

  const [data, setData]   = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!project) return;
    fetch(`/api/run?project=${encodeURIComponent(project)}`)
      .then((r) => r.json())
      .then(setData)
      .catch((e) => setError(String(e)));
  }, [project]);

  if (error) return (
    <div style={{ minHeight: "100vh", background: "#020817", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", color: "#f87171" }}>
        <p style={{ fontWeight: 600, fontSize: "1.1rem" }}>Failed to load report</p>
        <p style={{ color: "#6b7fa8", fontSize: "0.85rem", marginTop: 6 }}>{error}</p>
        <button onClick={() => router.push("/")} style={{
          marginTop: 16, background: "linear-gradient(135deg,#1067ff,#7c3aed)",
          color: "white", border: "none", padding: "0.55rem 1.2rem",
          borderRadius: 10, fontWeight: 600, cursor: "pointer",
        }}>← Back to Home</button>
      </div>
    </div>
  );

  if (!data) return (
    <div style={{ minHeight: "100vh", background: "#020817", display: "flex", alignItems: "center", justifyContent: "center", color: "#5a7499" }}>
      Loading report…
    </div>
  );

  const seconds = (data.totalMs / 1000).toFixed(1);
  const factor  = Math.round((MANUAL_MINUTES * 60) / (data.totalMs / 1000));

  // ── Helper styles ──────────────────────────────────────────────────────────
  const card = {
    background: "#0f1629", border: "1px solid #1a2d55",
    borderRadius: 20, padding: "1.25rem 1.5rem",
  };
  const label = { fontSize: "0.7rem", color: "#5a7499", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700, marginBottom: 8 };
  const pre   = {
    background: "#0d1425", border: "1px solid #1a2d55",
    borderRadius: 12, padding: "1rem 1.1rem",
    fontSize: "0.75rem", color: "#8899bb",
    fontFamily: "monospace", overflowX: "auto",
    whiteSpace: "pre-wrap", lineHeight: 1.6,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#020817", display: "flex", flexDirection: "column" }}>

      {/* ── Nav ──────────────────────────────────────────────────────── */}
      <header style={{
        height: 52, borderBottom: "1px solid #1a2d55",
        background: "rgba(2,8,23,0.85)", backdropFilter: "blur(12px)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 1.5rem", position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: data.success ? "#4ade80" : "#f87171" }} />
          <span style={{ color: "white", fontSize: "0.875rem", fontWeight: 600 }}>{project}</span>
          <span style={{
            fontSize: "0.7rem", fontWeight: 600, padding: "2px 8px", borderRadius: 6,
            background: data.success ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.12)",
            border: data.success ? "1px solid rgba(74,222,128,0.35)" : "1px solid rgba(248,113,113,0.35)",
            color: data.success ? "#4ade80" : "#f87171",
          }}>
            {data.success ? "✓ Fixed & Verified" : "✗ Unresolved"}
          </span>
        </div>
        <button onClick={() => router.push("/")} style={{
          background: "none", border: "1px solid #1a2d55", color: "#5a7499",
          padding: "0.35rem 0.85rem", borderRadius: 8, fontSize: "0.78rem", cursor: "pointer",
        }}>← Run Another</button>
      </header>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem", maxWidth: 860, margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

        {/* Hero stat */}
        <div style={{
          background: "linear-gradient(135deg, rgba(16,103,255,0.15), rgba(124,58,237,0.15))",
          border: "1px solid rgba(16,103,255,0.25)", borderRadius: 20, padding: "1.5rem 2rem",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "3rem", flexWrap: "wrap",
        }}>
          {[
            { label: "Manual", value: `${MANUAL_MINUTES} min`, color: "#f87171" },
            { label: "",       value: "→",                     color: "#1a2d55" },
            { label: "AutoFix AI", value: `${seconds}s`,       color: "#4ade80" },
            { label: "Speedup",value: `${factor}×`,            color: "#60a5fa" },
          ].map(({ label: l, value, color }, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              {l && <p style={{ fontSize: "0.7rem", color: "#5a7499", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{l}</p>}
              <p style={{ fontSize: "2.2rem", fontWeight: 800, color, lineHeight: 1 }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Root cause */}
        <div style={card}>
          <p style={label}>🔍 Root Cause</p>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
            <div style={{
              flexShrink: 0, width: 28, height: 28, borderRadius: 12, marginTop: 2,
              background: "linear-gradient(135deg, #1067ff, #7c3aed)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.7rem", fontWeight: 700, color: "white",
            }}>A</div>
            <div style={{
              background: "#0d1425", border: "1px solid #1e2d50",
              borderRadius: "16px 16px 16px 4px", padding: "0.75rem 1rem",
              fontSize: "0.875rem", color: "#b0bdd8", lineHeight: 1.65, flex: 1,
            }}>
              {data.diagnosis?.rootCause || "No diagnosis available."}
            </div>
          </div>
          {data.diagnosis?.evidence?.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12, paddingLeft: 40 }}>
              {data.diagnosis.evidence.map((e, i) => (
                <span key={i} style={{
                  fontFamily: "monospace", fontSize: "0.72rem",
                  background: "rgba(16,103,255,0.1)", border: "1px solid rgba(16,103,255,0.25)",
                  color: "#60a5fa", padding: "2px 8px", borderRadius: 6,
                }}>{e}</span>
              ))}
            </div>
          )}
        </div>

        {/* Files patched */}
        <div style={card}>
          <p style={label}>🔧 Files Patched</p>
          {(data.fix?.patches || []).length === 0 && (
            <p style={{ color: "#3d5080", fontSize: "0.85rem" }}>No patches applied.</p>
          )}
          {(data.fix?.patches || []).map((p, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <span style={{
                fontFamily: "monospace", fontSize: "0.75rem",
                background: "rgba(16,103,255,0.1)", border: "1px solid rgba(16,103,255,0.25)",
                color: "#60a5fa", padding: "2px 8px", borderRadius: 6, display: "inline-block", marginBottom: 8,
              }}>{p.file}</span>
              <pre style={pre}>{p.newContent}</pre>
            </div>
          ))}
          {data.fix?.rationale && (
            <p style={{ color: "#5a7499", fontSize: "0.78rem", fontStyle: "italic", marginTop: 8, borderTop: "1px solid #1a2d55", paddingTop: 8 }}>
              {data.fix.rationale}
            </p>
          )}
        </div>

        {/* Verification */}
        <div style={card}>
          <p style={label}>✅ Verification Output</p>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "3px 10px", borderRadius: 8, marginBottom: 12, fontSize: "0.78rem", fontWeight: 600,
            background: data.verification?.passed ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.12)",
            border: data.verification?.passed ? "1px solid rgba(74,222,128,0.35)" : "1px solid rgba(248,113,113,0.35)",
            color: data.verification?.passed ? "#4ade80" : "#f87171",
          }}>
            {data.verification?.passed ? "✓ All Tests Passed" : "✗ Tests Failed"}
          </div>
          <pre style={pre}>
            {data.verification?.stdout || data.verification?.stderr || "(no output)"}
          </pre>
        </div>

      </div>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <div style={{ borderTop: "1px solid #1a2d55", padding: "0.6rem 1.5rem" }}>
        <p style={{ color: "#33517a", fontSize: "0.72rem" }}>AutoFix AI · IBM Bob 2.0 · Autonomous debug pipeline</p>
      </div>
    </div>
  );
}

export default function Report() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#020817", display: "flex", alignItems: "center", justifyContent: "center", color: "#5a7499" }}>
        Loading…
      </div>
    }>
      <ReportInner />
    </Suspense>
  );
}
