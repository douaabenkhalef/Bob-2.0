# Problem & Solution Statement

## The Problem

Modern AI coding assistants (Cursor, GitHub Copilot, Codex) stop at **diagnosis**. They tell you "here's the bug" — then it's on you to:

1. Read the diagnosis
2. Apply the fix manually
3. Run the test suite
4. Discover the fix broke something else
5. Start over

That's still 30–60 minutes of manual work per bug. Worse, there's no safety net: the assistant never verifies its own fix, so you only find out it was wrong after you've committed it.

## Our Solution

AutoFix AI closes the loop. It's an autonomous agent that doesn't just find bugs — it fixes and verifies them, in a loop, until the tests pass.

### The pipeline

1. **Diagnosis Agent** — reads the entire repository (not just searched snippets), identifies the root cause, cites file:line evidence
2. **Fix Agent** — writes a minimal patch as full-file rewrites
3. **Verification Agent** — applies the patch and runs the real test suite (npm test / pytest) inside the project
4. **Head Agent** — orchestrates all three, snapshots the project before each attempt, retries up to 3 times if verification fails

### Why this matters

- No silent breakage — every fix is tested against the full suite before it's accepted
- Whole-repo reasoning — Bob sees all files, no tunnel vision
- Self-correcting — if the first patch doesn't work, the loop runs again with the new error output
- Real verification — we shell out to npm test or pytest and read the exit code, no simulation

### Scope

AutoFix works on Node.js (package.json + test script) and Python (requirements.txt + pytest). Three input modes:

- Seeded sample project (broken-node, broken-logic, broken-python)
- Clone any public GitHub URL
- Upload source files directly

Every run is logged to Supabase (submissions, agent_logs, results).
