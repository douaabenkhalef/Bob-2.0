# AutoFix AI — Self-Healing Debug Agent

**Broken code goes in. Fixed, verified code comes out.**

Powered by IBM Bob, orchestrated by a Head Agent with a real retry loop that only stops when the tests pass.

## The problem

Every AI coding tool — Cursor, Copilot, Codex — stops at *"here's the bug."* You still have to apply the fix, run the tests, and hope nothing broke.

## What AutoFix does

A fully autonomous loop: **Diagnose → Fix → Verify → Retry**

- **Diagnosis Agent** — reads the *whole* repo (not just snippets), returns root cause + evidence
- **Fix Agent** — writes a minimal patch as full file rewrites
- **Verification Agent** — applies the patch, runs **real tests** (`npm test` / `pytest`)
- **Head Agent** — snapshots before each attempt, retries up to 3 times

## Three ways to run it

1. **Sample project** — pick from `broken-node`, `broken-logic`, `broken-python`
2. **GitHub URL** — clone any public repo
3. **Upload files** — drag-and-drop your own source files

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16 + Tailwind v4 |
| Backend | Next.js API routes (`/api/run`, `/api/upload`, `/api/clone`) |
| AI | IBM Bob inference API (model `premium`) |
| DB | Supabase (`submissions`, `agent_logs`, `results`) |
| Verification | `node:child_process` — real `npm test` / `pytest` |
| Streaming | Server-Sent Events |

## Run locally

```bash
git clone https://github.com/douaabenkhalef/Bob-2.0.git
cd Bob-2.0
npm install
cat > .env.local <<'ENV'
BOB_API_KEY=your_bob_inference_key
BOB_API_URL=https://api.us-east.bob.ibm.com/inference/v1
BOB_MOCK=false
BOB_MODEL=premium
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
ENV
npm run dev
# open http://localhost:3000
## Feedback for IBM

We documented our experience building on Bob in **[FEEDBACK.md](./FEEDBACK.md)**. Summary:

**Loved:**
- Bob's `premium` model correctly diagnosed subtle bugs (operator mistakes, off-by-one) without hand-holding.
- OpenAI-compatible API — zero learning curve.
- Handles 120KB repo-context prompts without truncation.

**Painful:**
- Key scoping confusion — "General" vs "Inference" keys behave differently, undocumented.
- Undocumented `User-Agent: ibm-bob-openwiki-provider` header required to bypass Cloudflare WAF.
- `402 budget exceeded` hit mid-hackathon, no dashboard to see remaining credits beforehand.
- `team user not found` error message doesn't explain what to fix.

**Requests:** per-key budget visibility, rate-limit headers, streaming tokens, structured tool-calling, and a sandbox execution mode for safe test running.

Full write-up in [FEEDBACK.md](./FEEDBACK.md).

---
