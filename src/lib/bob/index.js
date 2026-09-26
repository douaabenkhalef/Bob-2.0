// Single point of contact for all Bob 2.0 API calls.
// Uses node:https instead of fetch — undici (Node's built-in fetch)
// rewrites/collapses headers in ways Cloudflare's WAF rejects.

import https from "node:https";

const BOB_API_URL = process.env.BOB_API_URL || "https://api.us-east.bob.ibm.com/inference/v1";
const BOB_API_KEY = process.env.BOB_API_KEY;
const BOB_MOCK    = process.env.BOB_MOCK === "true";
const BOB_MODEL   = process.env.BOB_MODEL || "premium";

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
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Apikey ${BOB_API_KEY}`,
          "User-Agent": "ibm-bob-openwiki-provider",
          "Accept": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = "";
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
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function mockInfer(systemPrompt, userPrompt) {
  const isDiagnose = systemPrompt.includes("Diagnosis Agent");
  const isFix      = systemPrompt.includes("Fix Agent");
  const isLogicBug = userPrompt.includes("isAdult") || userPrompt.includes("canDrive");

  if (isDiagnose && isLogicBug) {
    return JSON.stringify({
      rootCause: "isAdult uses = instead of ===, and canDrive uses && instead of ||",
      evidence: ["calculator.js:3", "calculator.js:7"],
      confidence: 0.94,
    });
  }
  if (isFix && isLogicBug) {
    return JSON.stringify({
      patches: [{ file: "calculator.js", newContent: "export function isAdult(age){return age>=18;}\nexport function canDrive(a,b){return a||b;}\n" }],
      rationale: "Fixed operators.",
    });
  }
  if (isDiagnose) {
    return JSON.stringify({
      rootCause: "Missing dependency left-pad",
      evidence: ["src/index.js:3"],
      confidence: 0.92,
    });
  }
  if (isFix) {
    return JSON.stringify({
      patches: [{ file: "package.json", newContent: '{"name":"broken-node","version":"1.0.0","type":"module","dependencies":{"left-pad":"^1.3.0"},"scripts":{"test":"node test.js"}}' }],
      rationale: "Added left-pad.",
    });
  }
  return "mock response";
}
