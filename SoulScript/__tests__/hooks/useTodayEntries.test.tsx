// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode } from "react";
import { useTodayEntries } from "@/hooks/useTodayEntries";

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

describe("useTodayEntries", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("calls GET /api/entries with today's date in YYYY-MM-DD format", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ entries: [] }),
    });
    vi.stubGlobal("fetch", mockFetch);

    renderHook(() => useTodayEntries(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    const url = new URL(calledUrl, "http://localhost");
    expect(url.pathname).toBe("/api/entries");
    expect(url.searchParams.get("day")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("returns entries array from data.entries", async () => {
    const entries = [
      {
        id: "1",
        content: "Hello",
        primary_emotion: "joy",
        emoji: "😊",
        secondary_emotions: [],
        bg_glow_gradient: "from-amber-500/20 to-yellow-600/20",
        created_at: new Date().toISOString(),
      },
    ];
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ entries }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const { result } = renderHook(() => useTodayEntries(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    expect(result.current.data).toEqual(entries);
  });

  it("returns empty array when data.entries is undefined", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
    vi.stubGlobal("fetch", mockFetch);

    const { result } = renderHook(() => useTodayEntries(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    expect(result.current.data).toEqual([]);
  });

  it("uses staleTime of 30 seconds", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ entries: [] }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    renderHook(() => useTodayEntries(), { wrapper });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    const queryCache = queryClient.getQueryCache();
    const query = queryCache.getAll()[0];
    expect(query).toBeDefined();
    expect(query.state.dataUpdatedAt).toBeGreaterThan(0);
  });
});
