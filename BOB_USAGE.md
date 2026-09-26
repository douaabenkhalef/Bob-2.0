# How IBM Bob Was Used to Build AutoFix AI

## Bob as the AI engine of the product

Bob 2.0 is not an assistant we used to write code — it's the inference engine at the core of AutoFix. Every diagnosis and every fix our product produces comes from a real call to Bob's premium model.

Our wrapper (src/lib/bob/index.js) is the single point of contact:

- Endpoint: https://api.us-east.bob.ibm.com/inference/v1/chat/completions
- Auth: Authorization: Apikey <key> (Inference-scoped)
- Required header: User-Agent: ibm-bob-openwiki-provider
- Model: premium
- Wire format: OpenAI-compatible chat completions

## The two Bob-powered agents

### Diagnosis Agent (src/lib/agents/diagnose.js)

Called once per pipeline run, and again on each retry with fresh error output. Bob receives the entire repository (~120 KB of file contents) plus the test failure log. Returns structured JSON: rootCause, evidence (file:line), confidence.

### Fix Agent (src/lib/agents/fix.js)

Receives the diagnosis plus the repo. Returns a JSON patch: full file contents for each file that must change. Strict rules prevent Bob from touching lockfiles or node_modules — the verifier handles those.

## Bob as a coding assistant during development

Beyond being the runtime engine, we also used Bob's IDE chat to scaffold parts of the project:

- Initial structure — Bob suggested the Next.js App Router layout that became src/app/api/run/route.js and the agent folder
- The retry loop — Bob helped design the headAgent.js flow: snapshot, fix, verify, restore-on-failure, retry
- Debugging CORS/WAF — Bob's chat was instrumental in figuring out the User-Agent: ibm-bob-openwiki-provider requirement after repeated 403s

## Screenshots of Bob task sessions

See screenshots/ folder for captures of Bob IDE sessions and Bob inference API test runs.

## Results

Across three sample projects (Node missing-dependency, Node logic-bugs, Python operator+range bugs), the full pipeline:

- Diagnosed the correct root cause in 1 attempt in every case
- Produced a passing test suite after 1 or 2 attempts
- Completed end-to-end in under 3 seconds (mock mode) or ~10 seconds with live Bob inference

Manual debugging baseline: ~45 minutes per bug.
AutoFix AI with Bob: under 15 seconds.
