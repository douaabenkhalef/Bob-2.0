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

// ---------------------------------------------------------------------------
// MOCK MODE — deterministic responses per detected bug so the demo works
// end-to-end without a real Bob key.
// ---------------------------------------------------------------------------
function mockInfer(systemPrompt, userPrompt) {
  const isDiagnose = systemPrompt.includes("Diagnosis Agent");
  const isFix      = systemPrompt.includes("Fix Agent");

  // Detect which sample project we're handling by looking at the inputs
  const isLogicBug = userPrompt.includes("isAdult") || userPrompt.includes("canDrive");

  if (isDiagnose && isLogicBug) {
    return JSON.stringify({
      rootCause: "isAdult uses assignment (=) instead of strict equality (===), and canDrive uses AND (&&) instead of OR (||)",
      evidence: ["calculator.js:3", "calculator.js:7"],
      confidence: 0.94,
    });
  }

  if (isFix && isLogicBug) {
    return JSON.stringify({
      patches: [
        {
          file: "calculator.js",
          newContent: `// Fixed: use === for comparison, || for OR\nexport function isAdult(age) {\n  return age >= 18;\n}\n\nexport function canDrive(hasLicense, hasPermit) {\n  return hasLicense || hasPermit;\n}\n`,
        },
      ],
      rationale: "Replaced assignment with comparison, and AND with OR.",
    });
  }

  // Default: broken-node (missing left-pad dependency)
  if (isDiagnose) {
    return JSON.stringify({
      rootCause: "Missing dependency 'left-pad' imported in src/index.js but not listed in package.json",
      evidence: ["src/index.js:3", "package.json"],
      confidence: 0.92,
    });
  }
  if (isFix) {
    return JSON.stringify({
      patches: [
        {
          file: "package.json",
          newContent: '{"name":"broken-node","version":"1.0.0","type":"module","dependencies":{"left-pad":"^1.3.0"},"scripts":{"test":"node test.js"}}',
        },
      ],
      rationale: "Added missing left-pad dependency.",
    });
  }
  return "mock response";
}
