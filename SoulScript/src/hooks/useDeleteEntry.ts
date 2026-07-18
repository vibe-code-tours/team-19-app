"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { JournalEntry } from "@/lib/types";

export function useDeleteEntry() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string, { previous: JournalEntry[] | undefined }>({
    mutationFn: async (entryId: string) => {
      const res = await fetch(`/api/entries/${entryId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete entry");
      }
    },
    onMutate: async (entryId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["entries", "today"] });

      // Snapshot previous value
      const previous = queryClient.getQueryData<JournalEntry[]>(["entries", "today"]);

      // Optimistically remove entry
      queryClient.setQueryData<JournalEntry[]>(["entries", "today"], (old) =>
        (old || []).filter((e) => e.id !== entryId)
      );

      return { previous };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previous !== undefined) {
        queryClient.setQueryData(["entries", "today"], context.previous);
      }
    },
    onSettled: () => {
      // Invalidate to refetch server truth
      queryClient.invalidateQueries({ queryKey: ["entries", "today"] });
    },
  });
}
