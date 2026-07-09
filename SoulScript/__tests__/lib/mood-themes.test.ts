import { describe, it, expect } from "vitest";
import {
  MOOD_THEMES,
  MOOD_EMOJIS,
  DEFAULT_THEME,
  validateGlowTheme,
} from "@/lib/mood-themes";

describe("mood-themes", () => {
  describe("MOOD_THEMES", () => {
    it("contains all 10 mood themes", () => {
      expect(Object.keys(MOOD_THEMES)).toHaveLength(10);
    });

    it("has valid Tailwind gradient classes", () => {
      for (const [key, value] of Object.entries(MOOD_THEMES)) {
        expect(value).toMatch(/^from-\w+-\d+\/\d+ to-\w+-\d+\/\d+$/);
      }
    });
  });

  describe("MOOD_EMOJIS", () => {
    it("has an emoji for each mood", () => {
      for (const key of Object.keys(MOOD_THEMES)) {
        expect(MOOD_EMOJIS[key]).toBeDefined();
        expect(typeof MOOD_EMOJIS[key]).toBe("string");
      }
    });
  });

  describe("validateGlowTheme", () => {
    it("returns the theme if valid", () => {
      expect(validateGlowTheme(MOOD_THEMES.joy)).toBe(MOOD_THEMES.joy);
    });

    it("returns DEFAULT_THEME for invalid input", () => {
      expect(validateGlowTheme("invalid-theme")).toBe(DEFAULT_THEME);
    });

    it("returns DEFAULT_THEME for empty string", () => {
      expect(validateGlowTheme("")).toBe(DEFAULT_THEME);
    });
  });
});
