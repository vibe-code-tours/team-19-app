import { describe, it, expect } from "vitest";
import {
  formatMonth,
  splitInsights,
  parseRecommendations,
  getBarColor,
} from "@/lib/report-utils";

describe("formatMonth", () => {
  it("formats YYYY-MM to Month Year", () => {
    expect(formatMonth("2026-07")).toBe("July 2026");
  });

  it("handles January", () => {
    expect(formatMonth("2026-01")).toBe("January 2026");
  });

  it("handles December", () => {
    expect(formatMonth("2026-12")).toBe("December 2026");
  });
});

describe("splitInsights", () => {
  it("splits sentences by period", () => {
    const result = splitInsights(
      "Your calmest days were weekends. Anxiety peaked late at night. Gratitude appeared in personal entries."
    );
    expect(result).toHaveLength(3);
    expect(result[0]).toContain("calmest");
    expect(result[1]).toContain("Anxiety");
    expect(result[2]).toContain("Gratitude");
  });

  it("handles JSON array format", () => {
    const result = splitInsights(
      '["First insight.","Second insight.","Third insight."]'
    );
    expect(result).toHaveLength(3);
    expect(result[0]).toBe("First insight.");
    expect(result[1]).toBe("Second insight.");
    expect(result[2]).toBe("Third insight.");
  });

  it("returns up to 3 items", () => {
    const result = splitInsights(
      "One. Two. Three. Four. Five."
    );
    expect(result).toHaveLength(3);
  });

  it("handles single insight gracefully", () => {
    const result = splitInsights("Only one insight here.");
    expect(result).toHaveLength(1);
    expect(result[0]).toBe("Only one insight here.");
  });

  it("filters empty entries from JSON array", () => {
    const result = splitInsights('["First.", "", "Third."]');
    expect(result).toHaveLength(2);
    expect(result[0]).toBe("First.");
    expect(result[1]).toBe("Third.");
  });

  it("returns empty array for empty string", () => {
    expect(splitInsights("")).toEqual([]);
  });
});

describe("parseRecommendations", () => {
  it("converts plain strings to objects with title", () => {
    const result = parseRecommendations([
      "Morning Breathing Exercise",
      "Digital Detox",
    ]);
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe("Morning Breathing Exercise");
    expect(result[0].description).toBe("");
  });

  it("parses JSON object strings", () => {
    const result = parseRecommendations([
      JSON.stringify({
        title: "Morning Breathing",
        description: "Do this each morning.",
      }),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Morning Breathing");
    expect(result[0].description).toBe("Do this each morning.");
  });

  it("filters out empty items", () => {
    const result = parseRecommendations(["Valid item", ""]);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Valid item");
  });

  it("handles empty array", () => {
    expect(parseRecommendations([])).toEqual([]);
  });
});

describe("getBarColor", () => {
  it("returns amber for joy", () => {
    expect(getBarColor("joy")).toBe("bg-amber-400");
  });

  it("returns blue for sadness", () => {
    expect(getBarColor("sadness")).toBe("bg-blue-400");
  });

  it("is case-insensitive", () => {
    expect(getBarColor("Joy")).toBe("bg-amber-400");
    expect(getBarColor("JOY")).toBe("bg-amber-400");
  });

  it("returns default violet for unknown emotion", () => {
    expect(getBarColor("unknown")).toBe("bg-violet-400");
  });
});
