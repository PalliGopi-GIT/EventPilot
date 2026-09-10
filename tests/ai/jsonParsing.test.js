const assert = require("assert");

function extractJsonFromText(rawText) {
  if (!rawText) throw new Error("Empty response");
  const trimmed = rawText.trim();
  try {
    return JSON.parse(trimmed);
  } catch {}

  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch && codeBlockMatch[1]) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {}
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const candidate = trimmed.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch {}
  }

  throw new Error("Failed to parse valid JSON");
}

console.log("Running AI JSON Parsing Test Suite...");

// Test 1: Direct JSON
const json1 = '{"name": "AI Workshop", "confidence": 0.95}';
const res1 = extractJsonFromText(json1);
assert.strictEqual(res1.name, "AI Workshop");
console.log("✓ Test 1 Passed: Direct JSON parsed.");

// Test 2: Markdown fence ```json ... ```
const json2 = 'Here is the extracted data:\n```json\n{\n  "title": "Feedback Form",\n  "questions": []\n}\n```\nHope this helps!';
const res2 = extractJsonFromText(json2);
assert.strictEqual(res2.title, "Feedback Form");
console.log("✓ Test 2 Passed: Markdown fenced JSON parsed.");

// Test 3: Extraneous prefix and suffix text without code blocks
const json3 = 'Sure! Here is the JSON output: {"sourceType": "event_poster", "eventDetected": true} Thank you!';
const res3 = extractJsonFromText(json3);
assert.strictEqual(res3.eventDetected, true);
console.log("✓ Test 3 Passed: Extraneous text JSON parsed.");

console.log("All AI JSON parsing tests passed successfully!\n");
