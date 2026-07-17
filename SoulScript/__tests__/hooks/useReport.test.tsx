// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode } from "react";
import { useReport } from "@/hooks/useReport";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

const mockResponse = {
  stats: {
    entryCount: 15,
    daysJournaled: 12,
    moodDistribution: [
      { emotion: "joy", emoji: "😊", count: 8, percentage: 53 },
      { emotion: "calm", emoji: "😌", count: 7, percentage: 47 },
    ],
    streak: { current: 3, best: 7 },
  },
  report: {
    summary: "A wonderful month of emotional growth.",
    dominantMood: "joy",
    insights: "You showed consistent positivity throughout the month.",
    recommendations: ["Keep journaling daily", "Try morning meditation"],
  },
};

describe("useReport", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("calls GET /api/report with correct month param", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });
    vi.stubGlobal("fetch", mockFetch);

    renderHook(() => useReport("2026-07"), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    const url = new URL(calledUrl, "http://localhost");
    expect(url.pathname).toBe("/api/report");
    expect(url.searchParams.get("month")).toBe("2026-07");
  });

  it("returns stats and report data from response", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });
    vi.stubGlobal("fetch", mockFetch);

    const { result } = renderHook(() => useReport("2026-07"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    expect(result.current.data?.stats.entryCount).toBe(15);
    expect(result.current.data?.stats.daysJournaled).toBe(12);
    expect(result.current.data?.report?.dominantMood).toBe("joy");
    expect(result.current.data?.report?.recommendations).toHaveLength(2);
  });

  it("returns null report when API returns null report field", async () => {
    const responseNoReport = {
      ...mockResponse,
      report: null,
    };
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(responseNoReport),
    });
    vi.stubGlobal("fetch", mockFetch);

    const { result } = renderHook(() => useReport("2026-07"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    expect(result.current.data?.report).toBeNull();
    expect(result.current.data?.stats.entryCount).toBe(15);
  });

  it("throws error on non-ok response", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Unauthorized" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const { result } = renderHook(() => useReport("2026-07"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe("Unauthorized");
  });

  it("does not fetch when month is empty string", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });
    vi.stubGlobal("fetch", mockFetch);

    renderHook(() => useReport(""), { wrapper: createWrapper() });

    // Wait a tick to ensure no fetch is triggered
    await new Promise((r) => setTimeout(r, 50));

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("does not fetch when month format is invalid", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });
    vi.stubGlobal("fetch", mockFetch);

    renderHook(() => useReport("invalid"), { wrapper: createWrapper() });

    await new Promise((r) => setTimeout(r, 50));

    expect(mockFetch).not.toHaveBeenCalled();
  });
});
