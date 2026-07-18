// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode } from "react";
import { useDeleteEntry } from "@/hooks/useDeleteEntry";
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

const mockEntries: JournalEntry[] = [
  {
    id: "entry-1",
    content: "First entry",
    primary_emotion: "joy",
    emoji: "😊",
    secondary_emotions: [],
    bg_glow_gradient: "from-amber-500/20 to-yellow-600/20",
    created_at: new Date().toISOString(),
  },
  {
    id: "entry-2",
    content: "Second entry",
    primary_emotion: "sadness",
    emoji: "😢",
    secondary_emotions: [],
    bg_glow_gradient: "from-blue-500/20 to-indigo-600/20",
    created_at: new Date().toISOString(),
  },
];

describe("useDeleteEntry", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("calls DELETE /api/entries/[id]", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const { queryClient, Wrapper } = createWrapper();
    queryClient.setQueryData(["entries", "today"], mockEntries);

    const { result } = renderHook(() => useDeleteEntry(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate("entry-1");
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/entries/entry-1", {
      method: "DELETE",
    });
  });

  it("onMutate removes entry from cache", async () => {
    const mockFetch = vi.fn().mockImplementation(() => new Promise(() => {}));
    vi.stubGlobal("fetch", mockFetch);

    const { queryClient, Wrapper } = createWrapper();
    queryClient.setQueryData(["entries", "today"], mockEntries);

    const { result } = renderHook(() => useDeleteEntry(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate("entry-1");
    });

    const cachedData = queryClient.getQueryData<JournalEntry[]>(["entries", "today"]);
    expect(cachedData).toHaveLength(1);
    expect(cachedData![0].id).toBe("entry-2");
  });

  it("onSettled invalidates entries query", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const { queryClient, Wrapper } = createWrapper();
    queryClient.setQueryData(["entries", "today"], mockEntries);
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useDeleteEntry(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate("entry-1");
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["entries", "today"],
      });
    });
  });

  it("onError rolls back cache to previous state", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Delete failed" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const { queryClient, Wrapper } = createWrapper();
    queryClient.setQueryData(["entries", "today"], mockEntries);

    const { result } = renderHook(() => useDeleteEntry(), { wrapper: Wrapper });

    await act(async () => {
      result.current.mutate("entry-1");
    });

    await waitFor(() => {
      const cachedData = queryClient.getQueryData<JournalEntry[]>(["entries", "today"]);
      expect(cachedData).toEqual(mockEntries);
    });
  });
});
