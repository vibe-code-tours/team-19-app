export function detectLanguage(text: string): "burmese" | "english" {
  const burmeseChars = text.match(/[က-႟]/g)?.length ?? 0;
  return burmeseChars > 0 ? "burmese" : "english";
}

/**
 * Determine the language for the AI system prompt.
 * Per-entry Unicode detection overrides the user's default preference.
 * SPEC §7: "Unicode detection always overrides user default"
 */
export function getSystemPromptLanguage(
  entryText: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- part of public API, kept for future use
  userDefault: "burmese" | "english"
): "burmese" | "english" {
  const detected = detectLanguage(entryText);
  return detected;
}
