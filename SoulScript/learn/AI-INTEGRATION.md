# AI Integration with OpenRouter

## Overview

SoulScript uses OpenRouter as an AI gateway, accessed via the OpenAI SDK. The AI performs two tasks: single-entry emotion analysis and monthly report generation. Both use structured JSON output.

## Client Setup (`src/lib/ai/client.ts`)

```typescript
import OpenAI from "openai";

export const openai = new OpenAI({
  baseURL: process.env.OPENROUTER_AI_URL || "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});
```

The OpenAI SDK works as a generic OpenAI-compatible client. By changing `baseURL`, you can point it at any OpenAI-compatible API (OpenRouter, Ollama, vLLM, etc.).

## Emotion Analysis (`src/lib/ai/analyze.ts`)

### System Prompt Design

The prompt instructs the AI to:
- Return emotion labels in English regardless of input language
- Return `primary_emotion` (1 word), `emoji` (1 char), `secondary_emotions` (1-3 terms), and `glow_theme` (Tailwind gradient class)
- Only return valid JSON (no markdown, no code blocks)
- Include allowed gradient values directly in the prompt

```typescript
const systemPrompt = `... Return ONLY a valid JSON object containing:
'primary_emotion' (1 word, in English), 'emoji' (1 character),
'secondary_emotions' (string array of 1-3 terms in English),
'glow_theme' (a valid Tailwind gradient class from the allowed mood themes:
${Object.values(MOOD_THEMES).join(", ")}).`;
```

### Validation

AI output is validated against an allowlist:

```typescript
export function validateResult(result: Partial<AnalysisResult>): AnalysisResult {
  return {
    primary_emotion: result.primary_emotion || "Uncertain",
    emoji: result.emoji || "💭",
    secondary_emotions: emotions,  // capped at 3, array check
    glow_theme: validateGlowTheme(result.glow_theme || ""),  // allowlist check
  };
}
```

The `validateGlowTheme()` function checks the returned gradient against `MOOD_THEMES` values. Unknown values fall back to the default theme.

## Monthly Report Generation (`src/lib/ai/report.ts`)

### Entry Summarization

Entries are summarized before sending to the AI (content truncated to 500 chars each):

```typescript
const entrySummaries = entries.map((e, i) =>
  `Entry ${i + 1}: Emotion=${e.primary_emotion} (${e.emoji}), Secondary=[${e.secondary_emotions.join(", ")}]\nContent: ${e.content.slice(0, 500)}`
).join("\n\n");
```

### Retry Logic

Reports use `response_format: { type: "json_object" }` and retry up to 3 times:

```typescript
for (let attempt = 0; attempt < 3; attempt++) {
  try {
    const response = await openai.chat.completions.create({
      response_format: { type: "json_object" },
      // ...
    });
    return parseJsonResponse(response.choices[0].message.content || "{}");
  } catch (error) {
    if (attempt === 2) throw error;
  }
}
```

## Response Parsing (`src/lib/ai/parse.ts`)

Free-tier models sometimes wrap JSON in markdown code blocks or embed it in explanatory text. `parseJsonResponse()` handles this:

1. Strip `` ```json `` and `` ``` `` markers
2. Try `JSON.parse()` directly
3. Fall back to regex extraction: `cleaned.match(/\{[\s\S]*\}/)`
4. Throw if no valid JSON found

```typescript
export function parseJsonResponse<T>(content: string): T {
  const cleaned = content
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    throw new Error(`No valid JSON found in: ${cleaned.slice(0, 200)}`);
  }
}
```

## Language Detection (`src/lib/language.ts`)

The AI always receives a bilingual prompt (mentions both Burmese and English). Language detection is used for the system prompt language:

```typescript
export function detectLanguage(text: string): "burmese" | "english" {
  const burmeseChars = text.match(/[က-႟]/g)?.length ?? 0;
  return burmeseChars > 0 ? "burmese" : "english";
}
```

Unicode range `U+1000-U+109F` covers Myanmar/Burmese script. Per-entry detection overrides user preference.

## Environment Variables

```
OPENROUTER_API_KEY=sk-or-...       # OpenRouter API key
OPENROUTER_AI_URL=https://openrouter.ai/api/v1  # base URL (optional)
OPENROUTER_AI_MODEL=meta-llama/llama-3-8b-instruct  # model (optional)
```

## Key Decisions

- **Temperature 0.7** — balanced between creative and consistent
- **Max tokens 1024** for analysis, **3000** for reports
- **No streaming** — responses are short enough that streaming adds complexity without benefit
- **Allowlist validation** — AI can only return known mood themes, preventing invalid CSS classes
- **Defensive parsing** — assumes the AI will sometimes return malformed JSON
