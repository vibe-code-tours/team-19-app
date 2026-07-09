import { describe, it, expect } from "vitest";
import { detectLanguage, getSystemPromptLanguage } from "@/lib/language";

describe("language", () => {
  describe("detectLanguage", () => {
    it("detects Burmese text", () => {
      expect(detectLanguage("ကျွန်မနာမည်")).toBe("burmese");
    });

    it("detects English text", () => {
      expect(detectLanguage("Hello world")).toBe("english");
    });

    it("defaults to english for empty string", () => {
      expect(detectLanguage("")).toBe("english");
    });

    it("detects Burmese in mixed text", () => {
      expect(detectLanguage("Hello ကျွန်မ")).toBe("burmese");
    });

    it("detects numbers and punctuation as english", () => {
      expect(detectLanguage("123 !@#")).toBe("english");
    });
  });

  describe("getSystemPromptLanguage", () => {
    it("returns burmese when Burmese characters detected", () => {
      expect(getSystemPromptLanguage("ကျွန်မနာမည်", "english")).toBe("burmese");
    });

    it("returns english when only Latin characters", () => {
      expect(getSystemPromptLanguage("Hello world", "burmese")).toBe("english");
    });

    it("overrides user default with detected language", () => {
      // User default is english, but text is Burmese → returns burmese
      expect(getSystemPromptLanguage("စိတ်ဖိစီးမှု", "english")).toBe("burmese");
    });

    it("returns english for empty text", () => {
      expect(getSystemPromptLanguage("", "burmese")).toBe("english");
    });
  });
});
