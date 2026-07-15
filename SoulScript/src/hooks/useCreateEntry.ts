"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { JournalEntry } from "@/lib/types";

export function useCreateEntry() {
  const queryClient = useQueryClient();

  return useMutation<JournalEntry, Error, { content: string }>({
    mutationFn: async ({ content }) => {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create entry");
      }
      const { entry } = await res.json();
      return entry;
    },
    onMutate: async ({ content }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["entries", "today"] });

      // Snapshot previous value
      const previous = queryClient.getQueryData<JournalEntry[]>(["entries", "today"]);

      // Optimistically insert temp entry
      const tempId = `temp-${crypto.randomUUID()}`;
      const tempEntry: JournalEntry = {
        id: tempId,
        content,
        primary_emotion: "calm",
        emoji: "😌",
        secondary_emotions: [],
        bg_glow_gradient: "from-sky-500/20 to-blue-600/20",
        created_at: new Date().toISOString(),
      };

      queryClient.setQueryData<JournalEntry[]>(["entries", "today"], (old) => [
        tempEntry,
        ...(old || []),
      ]);

      return { previous, tempId };
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
