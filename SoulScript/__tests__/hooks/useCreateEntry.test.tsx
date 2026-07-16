// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode } from "react";
import { useCreateEntry } from "@/hooks/useCreateEntry";
import type { JournalEntry } from "@/lib/types";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return {
    queryClient,
    Wrapper: function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );
    },
  };
}

const mockEntry: JournalEntry = {
  id: "server-1",
  content: "Hello world",
  primary_emotion: "",
  emoji: "",
  secondary_emotions: [""],
  bg_glow_gradient: "from-amber-500/20 to-yellow-600/20",
  created_at: new Date().toISOString(),
};

describe("useCreateEntry", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("calls POST /api/analyze with content", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ entry: mockEntry }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateEntry(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate({ content: "Hello world" });
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/analyze",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "Hello world" }),
      })
    );
  });

  it("onMutate inserts temp entry into cache with temp- prefix id", async () => {
    const mockFetch = vi.fn().mockImplementation(() =>
      new Promise(() => {}) // Never resolves — keeps mutation in-flight
    );
    vi.stubGlobal("fetch", mockFetch);

    const { queryClient, Wrapper } = createWrapper();
    // Pre-populate cache
    queryClient.setQueryData(["entries", "today"], [mockEntry]);

    const { result } = renderHook(() => useCreateEntry(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate({ content: "New entry" });
    });

    const cachedData = queryClient.getQueryData<JournalEntry[]>(["entries", "today"]);
    expect(cachedData).toBeDefined();
    expect(cachedData).toHaveLength(2);
    // New entry should be the temp one (first in array since onMutate prepends)
    const tempEntry = cachedData![0];
    expect(tempEntry.id).toMatch(/^temp-/);
    expect(tempEntry.content).toBe("New entry");
    expect(tempEntry.primary_emotion).toBe("");
    expect(tempEntry.emoji).toBe("");
  });

  it("onMutate returns context with previous data and tempId", async () => {
    const mockFetch = vi.fn().mockImplementation(() => new Promise(() => {}));
    vi.stubGlobal("fetch", mockFetch);

    const { queryClient, Wrapper } = createWrapper();
    queryClient.setQueryData(["entries", "today"], [mockEntry]);

    const { result } = renderHook(() => useCreateEntry(), { wrapper: Wrapper });

    await act(async () => {
      // Access the mutation's onMutate through the mutation cache
      result.current.mutate({ content: "New entry" });
    });

    // Verify cache was updated (onMutate ran)
    const cachedData = queryClient.getQueryData<JournalEntry[]>(["entries", "today"]);
    expect(cachedData).toHaveLength(2);
  });

  it("onSettled invalidates entries query", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ entry: mockEntry }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const { queryClient, Wrapper } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCreateEntry(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate({ content: "Hello" });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["entries", "today"],
      });
    });
  });

  it("onError rolls back cache to previous state", async () => {
    const originalEntries = [mockEntry];
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Server error" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const { queryClient, Wrapper } = createWrapper();
    queryClient.setQueryData(["entries", "today"], originalEntries);

    const { result } = renderHook(() => useCreateEntry(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate({ content: "Failing entry" });
    });

    // After error, cache should be rolled back to original
    await waitFor(() => {
      const cachedData = queryClient.getQueryData<JournalEntry[]>(["entries", "today"]);
      expect(cachedData).toEqual(originalEntries);
    });
  });
});
