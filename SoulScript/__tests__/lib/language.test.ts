import { describe, it, expect } from "vitest";
import { detectLanguage } from "@/lib/language";

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
});
