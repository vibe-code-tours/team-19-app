import { describe, it, expect } from "vitest";
import { relativeTime } from "@/lib/utils";

describe("relativeTime", () => {
  it("returns 'just now' for dates less than 60 seconds ago", () => {
    const recent = new Date(Date.now() - 30 * 1000).toISOString();
    expect(relativeTime(recent)).toBe("just now");
  });

  it("returns 'just now' for dates less than 1 minute ago", () => {
    const recent = new Date(Date.now() - 59 * 1000).toISOString();
    expect(relativeTime(recent)).toBe("just now");
  });

  it("returns '5m ago' for dates 5 minutes ago", () => {
    const past = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(relativeTime(past)).toBe("5m ago");
  });

  it("returns '59m ago' for dates 59 minutes ago", () => {
    const past = new Date(Date.now() - 59 * 60 * 1000).toISOString();
    expect(relativeTime(past)).toBe("59m ago");
  });

  it("returns '1h ago' for dates 1 hour ago", () => {
    const past = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();
    expect(relativeTime(past)).toBe("1h ago");
  });

  it("returns '3h ago' for dates 3 hours ago", () => {
    const past = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    expect(relativeTime(past)).toBe("3h ago");
  });

  it("returns '23h ago' for dates 23 hours ago", () => {
    const past = new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString();
    expect(relativeTime(past)).toBe("23h ago");
  });

  it("returns '1d ago' for dates 1 day ago", () => {
    const past = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
    expect(relativeTime(past)).toBe("1d ago");
  });

  it("returns '2d ago' for dates 2 days ago", () => {
    const past = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    expect(relativeTime(past)).toBe("2d ago");
  });

  it("returns '6d ago' for dates 6 days ago", () => {
    const past = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString();
    expect(relativeTime(past)).toBe("6d ago");
  });

  it("returns formatted month+day for dates 30 days ago", () => {
    const past = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const result = relativeTime(past);
    // Should contain a month name and day number
    expect(result).toMatch(/\w+ \d+/);
  });

  it("returns formatted month+day for dates 100 days ago", () => {
    const past = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString();
    const result = relativeTime(past);
    expect(result).toMatch(/\w+ \d+/);
  });
});
