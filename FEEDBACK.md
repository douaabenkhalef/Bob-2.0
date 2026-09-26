# Feedback on IBM Bob 2.0

Written after building **AutoFix AI**, a self-healing debug agent powered by Bob's inference API, during the LabLab IBM Bob 2.0 Hackathon.

## What worked really well

- **Inference quality.** Bob's `premium` model handled code analysis and patch generation cleanly. It correctly identified subtle bugs — a wrong comparison operator (`=` vs `===`), a wrong boolean (`&&` vs `||`), an off-by-one in a Python loop — without hand-holding.
- **OpenAI-compatible API.** Using the standard `/chat/completions` shape meant zero learning curve. Our wrapper took ~10 lines of code.
- **Full repo context.** Bob handled 120KB prompts without truncation. It reasoned over the entire repository, not just isolated snippets — which is exactly what a real debugger needs.

## What was painful

- **API key scoping is confusing.** "General" keys silently require a `Team ID` header we didn't know about. "Inference" keys work directly but aren't obvious from the docs. We created three keys before understanding the difference.
- **Cloudflare User-Agent gate.** Requests fail with `403` unless the header `User-Agent: ibm-bob-openwiki-provider` is set exactly. Not documented in the main API docs — we found it by trial and error.
- **`402 budget exceeded` mid-demo.** After a few dozen test runs, the account hit its credit limit. Both our lablab-challenge account and a teammate's returned the same error. We had to fall back to a mock mode for the demo.
- **`team user not found` error.** Same `402` code, but this message appeared when a key was valid but the user wasn't recognized as part of the team. The error message didn't explain what to fix.
- **No public status / dashboard for inference usage.** It wasn't obvious where to see remaining budget before the API started rejecting calls.

## Feature requests

- **A sandbox execution mode.** Bob could run our tests safely, so the verification step doesn't depend on the host environment's `child_process`.
- **Structured tool-calling.** Instead of prompting Bob to return JSON, a native function-call API would make agent orchestration cleaner and more reliable.
- **Streaming tokens.** `stream: true` for progressive responses — it would make the pipeline UI feel more alive.
- **Per-key budget visibility.** An endpoint to query remaining credits, so a hackathon app can warn the user *before* hitting `402`.
- **Rate-limit headers.** Standard `X-RateLimit-Remaining` would help us back off gracefully.

## Minor doc improvements

- Add a **"Inference vs General key"** page with a side-by-side comparison.
- Document the **required User-Agent** header prominently.
- Add a **troubleshooting** section for `402`, `403`, and `401` errors with what each one actually means.
- Show a **complete working curl example** on the API Keys page after a key is created.

## What we'd build next with Bob

- **Multi-file refactors** — not just fixes, but architecture changes ("convert this to async/await").
- **Test generation** — Bob writes the tests it will later run against.
- **GitHub App integration** — AutoFix as a PR bot: Bob watches for failing CI, diagnoses, opens a fix PR.
- **Persistent learning** — remember which fixes worked on similar repos and bias future diagnoses.

## Summary

Bob 2.0's inference quality is strong enough to power a real autonomous agent. The main friction was **onboarding**: key scoping, WAF headers, and budget visibility were all things we had to discover the hard way. Fix those three and Bob becomes genuinely production-ready for agent workflows.

We'd use it again.

— Douaa Benkhalef
LabLab IBM Bob 2.0 HackathonT
