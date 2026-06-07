"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Artist } from "@/lib/types";

async function fetchArtists(q?: string): Promise<Artist[]> {
  const params = q ? `?q=${encodeURIComponent(q)}` : "";
  const res = await fetch(`/api/artists${params}`);
  if (!res.ok) throw new Error("טעינה נכשלה");
  const data = await res.json();
  return data.artists;
}

async function fetchStuckIds(): Promise<string[]> {
  const res = await fetch("/api/ai/suggestions");
  if (!res.ok) return [];
  const data = await res.json();
  return data.stuckIds ?? [];
}

export function useArtists(search: string) {
  const queryClient = useQueryClient();

  const artistsQuery = useQuery({
    queryKey: ["artists", search],
    queryFn: () => fetchArtists(search || undefined),
  });

  const stuckQuery = useQuery({
    queryKey: ["stuck-ids"],
    queryFn: fetchStuckIds,
    refetchInterval: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch("/api/artists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("יצירה נכשלה");
      return (await res.json()).artist as Artist;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["artists"] }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<Pick<Artist, "name" | "isSigned" | "isOdooApproved" | "handlerName">>;
    }) => {
      const res = await fetch(`/api/artists/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("עדכון נכשל");
      return (await res.json()).artist as Artist;
    },
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: ["artists"] });
      const previous = queryClient.getQueriesData<Artist[]>({ queryKey: ["artists"] });
      queryClient.setQueriesData<Artist[]>({ queryKey: ["artists"] }, (old) =>
        old?.map((a) => (a.id === id ? { ...a, ...patch } : a)),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      context?.previous?.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["artists"] }),
  });

  const bulkMutation = useMutation({
    mutationFn: async ({
      ids,
      handlerName,
      isSigned,
    }: {
      ids: string[];
      handlerName?: string;
      isSigned?: boolean;
    }) => {
      const res = await fetch("/api/artists/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, handlerName, isSigned }),
      });
      if (!res.ok) throw new Error("עדכון מרובה נכשל");
      return res.json();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["artists"] });
      queryClient.invalidateQueries({ queryKey: ["stuck-ids"] });
    },
  });

  const commandMutation = useMutation({
    mutationFn: async (command: string) => {
      const res = await fetch("/api/ai/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "פקודה נכשלה");
      return data as { message: string; affected: number };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artists"] });
      queryClient.invalidateQueries({ queryKey: ["stuck-ids"] });
    },
  });

  return {
    artists: artistsQuery.data ?? [],
    isLoading: artistsQuery.isLoading,
    stuckIds: new Set(stuckQuery.data ?? []),
    createArtist: createMutation.mutateAsync,
    updateArtist: updateMutation.mutateAsync,
    bulkUpdate: bulkMutation.mutateAsync,
    runCommand: commandMutation.mutateAsync,
    commandMessage: commandMutation.data?.message,
    isCommandPending: commandMutation.isPending,
  };
}
