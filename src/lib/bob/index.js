// Single point of contact for all Bob 2.0 API calls.
// Every agent imports from here — never call Bob directly.

const BOB_API_URL = process.env.BOB_API_URL || "https://api.bob.ibm.com/v1";
const BOB_API_KEY = process.env.BOB_API_KEY;
const BOB_MOCK    = process.env.BOB_MOCK === "true";

export async function bobInfer(systemPrompt, userPrompt) {
  if (BOB_MOCK) return mockInfer(systemPrompt, userPrompt);
  if (!BOB_API_KEY) throw new Error("BOB_API_KEY missing in .env.local");

  const res = await fetch(`${BOB_API_URL}/inference`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${BOB_API_KEY}`,
    },
    body: JSON.stringify({
      model: "bob-2.0",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userPrompt },
      ],
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Bob API ${res.status}: ${text}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? data.output ?? "";
}

function mockInfer(systemPrompt, userPrompt) {
  if (systemPrompt.includes("Diagnosis Agent")) {
    return JSON.stringify({
      rootCause: "Missing dependency 'left-pad' imported in src/index.js but not listed in package.json",
      evidence: ["src/index.js:3", "package.json"],
      confidence: 0.92,
    });
  }
  if (systemPrompt.includes("Fix Agent")) {
    return JSON.stringify({
      patches: [
        { file: "package.json", newContent: '{"name":"demo","version":"1.0.0","dependencies":{"left-pad":"^1.3.0"},"scripts":{"test":"node test.js"}}' },
      ],
      rationale: "Added missing left-pad dependency.",
    });
  }
  return "mock response";
}
