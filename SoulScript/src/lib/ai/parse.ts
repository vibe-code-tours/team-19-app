export function parseJsonResponse<T>(content: string): T {
  // Strip markdown code blocks if present
  const cleaned = content
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  // Try direct parse first
  try {
    return JSON.parse(cleaned);
  } catch {
    // Reasoning models may embed JSON in explanatory text — extract it
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error(`No valid JSON found in: ${cleaned.slice(0, 200)}`);
  }
}
