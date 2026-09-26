import https from "node:https";

const BOB_API_URL = process.env.BOB_API_URL || "https://api.us-east.bob.ibm.com/inference/v1";
const BOB_API_KEY = process.env.BOB_API_KEY;
const BOB_MOCK    = process.env.BOB_MOCK === "true";
const BOB_MODEL   = process.env.BOB_MODEL || "premium";

// Persistent keep-alive agent — prevents Cloudflare from dropping
// long-running inference requests mid-stream.
const agent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 30000,
  maxSockets: 4,
  timeout: 120000,
});

export async function bobInfer(systemPrompt, userPrompt) {
  if (BOB_MOCK) return mockInfer(systemPrompt, userPrompt);
  if (!BOB_API_KEY) throw new Error("BOB_API_KEY missing in .env.local");

  const url  = new URL(`${BOB_API_URL}/chat/completions`);
  const body = JSON.stringify({
    model: BOB_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user",   content: userPrompt },
    ],
    temperature: 0.2,
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: "POST",
        agent,
        timeout: 120000,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Apikey ${BOB_API_KEY}`,
          "User-Agent": "ibm-bob-openwiki-provider",
          "Accept": "application/json",
          "Content-Length": Buffer.byteLength(body),
          "Connection": "keep-alive",
        },
      },
      (res) => {
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            return reject(new Error(`Bob API ${res.statusCode}: ${data.slice(0, 500)}`));
          }
          try {
            const parsed = JSON.parse(data);
            resolve(parsed.choices?.[0]?.message?.content ?? "");
          } catch (e) {
            reject(new Error(`Bob API parse error: ${e.message} | body: ${data.slice(0, 300)}`));
          }
        });
        res.on("error", (e) => reject(new Error(`Response stream error: ${e.message}`)));
      }
    );

    req.on("timeout", () => {
      req.destroy(new Error("Bob API request timed out after 120s"));
    });
    req.on("error", (e) => reject(new Error(`Request error: ${e.message} (code: ${e.code})`)));
    req.write(body);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// MOCK MODE — deterministic responses per detected bug so the demo works
// end-to-end without a real Bob key.
// ---------------------------------------------------------------------------
function mockInfer(systemPrompt, userPrompt) {
  const isDiagnose = systemPrompt.includes("Diagnosis Agent");
  const isFix      = systemPrompt.includes("Fix Agent");

  // Detect which kind of bug we're handling based on the prompt content
  const isPython   = userPrompt.includes("sum_positive") || userPrompt.includes("is_even");
  const isLogicBug = userPrompt.includes("isAdult") || userPrompt.includes("canDrive");
  const isNodeDep  = userPrompt.includes("left-pad") || userPrompt.includes("broken-node");

  // Extract the actual .py filename from the prompt (so we don't hardcode calculator.py)
  const pyFileMatch = userPrompt.match(/---\s+([^\n]+\.py)\s+---/);
  const pyFile      = pyFileMatch ? pyFileMatch[1].trim() : "calculator.py";

  // Extract the actual .js filename for logic bugs
  const jsFileMatch = userPrompt.match(/---\s+([^\n]+\.js)\s+---/);
  const jsFile      = jsFileMatch ? jsFileMatch[1].trim() : "calculator.js";

  // ── Python branch ────────────────────────────────────────────────────────
  if (isDiagnose && isPython) {
    return JSON.stringify({
      rootCause: `sum_positive starts its loop at index 1, skipping the first element. is_even uses n % 2 == 1 instead of n % 2 == 0.`,
      evidence: [`${pyFile}:3`, `${pyFile}:10`],
      confidence: 0.95,
    });
  }
  if (isFix && isPython) {
    return JSON.stringify({
      patches: [{
        file: pyFile,
        newContent: `def sum_positive(numbers):\n    total = 0\n    for i in range(len(numbers)):\n        if numbers[i] > 0:\n            total += numbers[i]\n    return total\n\n\ndef is_even(n):\n    return n % 2 == 0\n\n\ndef fahrenheit_to_celsius(f):\n    return (f - 32) * 5 / 9\n`,
      }],
      rationale: "Fixed the loop range and the is_even comparison.",
    });
  }

  // ── Node logic-bug branch (broken-logic) ────────────────────────────────
  if (isDiagnose && isLogicBug) {
    return JSON.stringify({
      rootCause: "isAdult uses assignment (=) instead of comparison (>=), and canDrive uses AND (&&) instead of OR (||).",
      evidence: [`${jsFile}:3`, `${jsFile}:7`],
      confidence: 0.94,
    });
  }
  if (isFix && isLogicBug) {
    return JSON.stringify({
      patches: [{
        file: jsFile,
        newContent: `function isAdult(age) {\n  return age >= 18;\n}\n\nfunction canDrive(hasLicense, hasPermit) {\n  return hasLicense || hasPermit;\n}\n\nmodule.exports = { isAdult, canDrive };\n`,
      }],
      rationale: "Fixed the comparison and boolean operators.",
    });
  }

  // ── Node missing-dependency branch (broken-node) ────────────────────────
  if (isDiagnose && isNodeDep) {
    return JSON.stringify({
      rootCause: "The package 'left-pad' is imported in index.js but not declared in package.json.",
      evidence: ["index.js:1", "package.json"],
      confidence: 0.92,
    });
  }
  if (isFix && isNodeDep) {
    return JSON.stringify({
      patches: [{
        file: "package.json",
        newContent: '{"name":"broken-node","version":"1.0.0","type":"module","dependencies":{"left-pad":"^1.3.0"},"scripts":{"test":"node test.js"}}',
      }],
      rationale: "Added missing left-pad dependency.",
    });
  }

  // ── Fallback (unknown project) — generic diagnosis ──────────────────────
  if (isDiagnose) {
    return JSON.stringify({
      rootCause: "The test suite is failing. Manual inspection required — no specific pattern detected in the repository.",
      evidence: [],
      confidence: 0.5,
    });
  }
  if (isFix) {
    return JSON.stringify({
      patches: [],
      rationale: "Unable to determine a fix automatically for this project shape.",
    });
  }

  return "mock response";
}
