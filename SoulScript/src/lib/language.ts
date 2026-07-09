export function detectLanguage(text: string): "burmese" | "english" {
  const burmeseChars = text.match(/[က-႟]/g)?.length ?? 0;
  return burmeseChars > 0 ? "burmese" : "english";
}
