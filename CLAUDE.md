# Bob 2.0 — Project Context

## Purpose
AI agent pipeline that diagnoses, fixes, and verifies broken repos.

## Stack
- Next.js (App Router)
- Supabase (DB)
- IBM Bob API (via src/lib/bob wrapper)

## Agent pipeline
diagnose → fix → verify → headAgent (orchestrator)

## Rules
- All Bob API calls MUST go through src/lib/bob
- Never commit .env.local
- Keep agent logic in src/lib/agents
