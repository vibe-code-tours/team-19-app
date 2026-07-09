// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import MonthlyReport from "@/components/MonthlyReport";

const mockReport = {
  summary_overview: "A month of growth and reflection.",
  dominant_mood: "calm",
  pattern_insights:
    "Your calmest days fell on weekends. Anxiety peaks followed late-night sessions. Gratitude appeared in personal connection entries.",
  actionable_recommendations: [
    "Morning Breathing Exercise",
    "Digital Detox Evenings",
    "Gratitude Journaling",
  ],
};

describe("MonthlyReport", () => {
  it("renders the Big Picture section", () => {
    render(
      <MonthlyReport report={mockReport} entryCount={12} daysInMonth={31} />
    );
    expect(screen.getByText("THE BIG PICTURE")).toBeDefined();
    expect(screen.getByText("😌")).toBeDefined();
    expect(screen.getByText("calm")).toBeDefined();
  });

  it("displays correct entry count", () => {
    render(
      <MonthlyReport report={mockReport} entryCount={12} daysInMonth={31} />
    );
    expect(
      screen.getByText(/This month, you felt calm on 12 of 31 days/)
    ).toBeDefined();
  });

  it("renders Pattern Recognition section", () => {
    render(
      <MonthlyReport report={mockReport} entryCount={12} daysInMonth={31} />
    );
    expect(screen.getByText("PATTERN RECOGNITION")).toBeDefined();
    expect(
      screen.getByText(/Your calmest days fell on weekends/)
    ).toBeDefined();
  });

  it("renders Actionable Frameworks section", () => {
    render(
      <MonthlyReport report={mockReport} entryCount={12} daysInMonth={31} />
    );
    expect(screen.getByText("ACTIONABLE FRAMEWORKS")).toBeDefined();
    expect(screen.getByText("Morning Breathing Exercise")).toBeDefined();
    expect(screen.getByText("Digital Detox Evenings")).toBeDefined();
    expect(screen.getByText("Gratitude Journaling")).toBeDefined();
  });

  it("handles single insight gracefully", () => {
    const singleInsight = {
      ...mockReport,
      pattern_insights: "Only one insight here.",
    };
    render(
      <MonthlyReport report={singleInsight} entryCount={5} daysInMonth={30} />
    );
    expect(screen.getByText("Only one insight here.")).toBeDefined();
  });

  it("handles empty recommendations", () => {
    const noRecs = { ...mockReport, actionable_recommendations: [] };
    render(
      <MonthlyReport report={noRecs} entryCount={10} daysInMonth={31} />
    );
    expect(screen.getByText("ACTIONABLE FRAMEWORKS")).toBeDefined();
  });
});
