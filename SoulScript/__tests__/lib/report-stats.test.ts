import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  computeMoodDistribution,
  computeDaysJournaled,
  computeStreak,
  MoodDistributionItem,
  StreakResult,
} from "@/lib/report-stats";

describe("report-stats", () => {
  describe("computeMoodDistribution", () => {
    it("returns empty array for empty input", () => {
      const result = computeMoodDistribution([]);
      expect(result).toEqual([]);
    });

    it("returns single item with 100% for one entry", () => {
      const entries = [
        { primary_emotion: "joy", emoji: "😊", created_at: "2026-07-01T10:00:00Z" },
      ];
      const result = computeMoodDistribution(entries);
      expect(result).toEqual([
        { emotion: "joy", emoji: "😊", count: 1, percentage: 100 },
      ]);
    });

    it("returns sorted by count descending with correct percentages", () => {
      const entries = [
        { primary_emotion: "joy", emoji: "😊", created_at: "2026-07-01T10:00:00Z" },
        { primary_emotion: "joy", emoji: "😊", created_at: "2026-07-02T10:00:00Z" },
        { primary_emotion: "sadness", emoji: "😢", created_at: "2026-07-03T10:00:00Z" },
      ];
      const result = computeMoodDistribution(entries);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ emotion: "joy", emoji: "😊", count: 2, percentage: 67 });
      expect(result[1]).toEqual({ emotion: "sadness", emoji: "😢", count: 1, percentage: 33 });
    });

    it("uses emoji from first entry seen for each emotion", () => {
      const entries = [
        { primary_emotion: "joy", emoji: "😊", created_at: "2026-07-01T10:00:00Z" },
        { primary_emotion: "joy", emoji: "😄", created_at: "2026-07-02T10:00:00Z" },
      ];
      const result = computeMoodDistribution(entries);
      expect(result[0].emoji).toBe("😊");
    });

    it("rounds percentages to nearest integer", () => {
      const entries = [
        { primary_emotion: "joy", emoji: "😊", created_at: "2026-07-01T10:00:00Z" },
        { primary_emotion: "joy", emoji: "😊", created_at: "2026-07-02T10:00:00Z" },
        { primary_emotion: "sadness", emoji: "😢", created_at: "2026-07-03T10:00:00Z" },
        { primary_emotion: "anger", emoji: "😠", created_at: "2026-07-04T10:00:00Z" },
      ];
      const result = computeMoodDistribution(entries);
      expect(result[0].percentage).toBe(50); // 2/4
      expect(result[1].percentage).toBe(25); // 1/4
      expect(result[2].percentage).toBe(25); // 1/4
    });
  });

  describe("computeDaysJournaled", () => {
    it("returns 0 for empty input", () => {
      expect(computeDaysJournaled([])).toBe(0);
    });

    it("returns 3 for entries on 3 unique days", () => {
      const entries = [
        { created_at: "2026-07-01T10:00:00Z" },
        { created_at: "2026-07-02T10:00:00Z" },
        { created_at: "2026-07-03T10:00:00Z" },
      ];
      expect(computeDaysJournaled(entries)).toBe(3);
    });

    it("counts same day once even with multiple entries", () => {
      const entries = [
        { created_at: "2026-07-01T10:00:00Z" },
        { created_at: "2026-07-01T14:00:00Z" },
        { created_at: "2026-07-01T22:00:00Z" },
      ];
      expect(computeDaysJournaled(entries)).toBe(1);
    });
  });

  describe("computeStreak", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("returns {current: 0, best: 0} for empty input", () => {
      vi.setSystemTime(new Date("2026-07-10T12:00:00Z"));
      expect(computeStreak([])).toEqual({ current: 0, best: 0 });
    });

    it("returns best equal to run length for consecutive days", () => {
      vi.setSystemTime(new Date("2026-07-05T12:00:00Z"));
      const entries = [
        { created_at: "2026-07-01T10:00:00Z" },
        { created_at: "2026-07-02T10:00:00Z" },
        { created_at: "2026-07-03T10:00:00Z" },
        { created_at: "2026-07-04T10:00:00Z" },
      ];
      const result = computeStreak(entries);
      expect(result.best).toBe(4);
    });

    it("counts current streak backwards from today", () => {
      vi.setSystemTime(new Date("2026-07-05T12:00:00Z"));
      const entries = [
        { created_at: "2026-07-05T10:00:00Z" },
        { created_at: "2026-07-04T10:00:00Z" },
        { created_at: "2026-07-03T10:00:00Z" },
      ];
      const result = computeStreak(entries);
      expect(result.current).toBe(3);
      expect(result.best).toBe(3);
    });

    it("counts current streak from yesterday if today has no entry", () => {
      vi.setSystemTime(new Date("2026-07-05T12:00:00Z"));
      const entries = [
        { created_at: "2026-07-04T10:00:00Z" },
        { created_at: "2026-07-03T10:00:00Z" },
      ];
      const result = computeStreak(entries);
      expect(result.current).toBe(2);
    });

    it("stops current streak at gap", () => {
      vi.setSystemTime(new Date("2026-07-05T12:00:00Z"));
      const entries = [
        { created_at: "2026-07-05T10:00:00Z" },
        { created_at: "2026-07-04T10:00:00Z" },
        // gap: no entry on 2026-07-03
        { created_at: "2026-07-02T10:00:00Z" },
      ];
      const result = computeStreak(entries);
      expect(result.current).toBe(2);
      expect(result.best).toBe(2);
    });

    it("best streak can be longer than current streak", () => {
      vi.setSystemTime(new Date("2026-07-10T12:00:00Z"));
      const entries = [
        // long streak earlier
        { created_at: "2026-07-01T10:00:00Z" },
        { created_at: "2026-07-02T10:00:00Z" },
        { created_at: "2026-07-03T10:00:00Z" },
        { created_at: "2026-07-04T10:00:00Z" },
        { created_at: "2026-07-05T10:00:00Z" },
        // gap
        { created_at: "2026-07-08T10:00:00Z" },
        { created_at: "2026-07-09T10:00:00Z" },
      ];
      const result = computeStreak(entries);
      expect(result.best).toBe(5);
      expect(result.current).toBe(2);
    });
  });
});
