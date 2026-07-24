"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { JournalEntry } from "@/lib/types";

export function useUpdateMood(monthKey: string) {
  const queryClient = useQueryClient();
  const queryKey = ["entries", "month", monthKey];

  return useMutation({
    mutationFn: async ({
      entryId,
      newMood,
      newEmoji,
    }: {
      entryId: string;
      newMood: string;
      newEmoji: string;
    }) => {
      const res = await fetch(`/api/entries/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primary_emotion: newMood, emoji: newEmoji }),
      });

      if (!res.ok) throw new Error("Failed to update mood");
    },

    onMutate: async ({ entryId, newMood, newEmoji }) => {
      // 1. Cancel in-flight refetches
      await queryClient.cancelQueries({ queryKey });

      // 2. Snapshot current cache for rollback
      const previous = queryClient.getQueryData<JournalEntry[]>(queryKey);

      // 3. Optimistically update the entry in-place
      queryClient.setQueryData<JournalEntry[]>(queryKey, (old) =>
        (old || []).map((e) =>
          e.id === entryId
            ? { ...e, primary_emotion: newMood, emoji: newEmoji }
            : e,
        ),
      );

      // 4. Return snapshot so onError can rollback
      return { previous };
    },

    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },

    onSettled: () => {
      // Always refetch server truth
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
