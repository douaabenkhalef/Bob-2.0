# AutoFix AI — Self-Healing Debug Agent

**Broken code goes in. Fixed, verified code comes out.**

Powered by IBM Bob, orchestrated by a Head Agent with a real retry loop that only stops when tests pass.

## The problem

Every AI coding tool — Cursor, Copilot, Codex — stops at *"here's the bug."* You still have to apply the fix, run the tests, and hope nothing broke.

## What AutoFix does

Diagnose → Fix → Verify → Retry (max 3)

- **Diagnosis Agent** — reads the whole repo, returns root cause + evidence
- **Fix Agent** — writes a minimal patch as full file rewrites
- **Verification Agent** — applies the patch, runs real tests (`npm test` / `pytest`)
- **Head Agent** — snapshots before each attempt, retries up to 3 times

## Three ways to run it

1. **Sample project** — `broken-node`, `broken-logic`, `broken-python`
2. **GitHub URL** — clone any public repo
3. **Upload files** — drag-and-drop source files

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16 + Tailwind v4 |
| Backend | Next.js API routes |
| AI | IBM Bob inference API (model `premium`) |
| DB | Supabase (`submissions`, `agent_logs`, `results`) |
| Verification | `node:child_process` — real `npm test` / `pytest` |
| Streaming | Server-Sent Events |

## Run locally

```bash
git clone https://github.com/douaabenkhalef/Bob-2.0.git
cd Bob-2.0
npm install
# create .env.local with your keys (see docs)
npm run dev
