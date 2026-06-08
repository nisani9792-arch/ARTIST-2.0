"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Artist, ArtistStats, ArtistStatus } from "@/lib/types";

type ArtistsResponse = { artists: Artist[]; stats: ArtistStats };

async function fetchArtists(q?: string): Promise<ArtistsResponse> {
  const params = q ? `?q=${encodeURIComponent(q)}` : "";
  const res = await fetch(`/api/artists${params}`);
  if (!res.ok) throw new Error("טעינה נכשלה");
  return res.json();
}

export function useArtists(search: string) {
  const queryClient = useQueryClient();

  const artistsQuery = useQuery({
    queryKey: ["artists", search],
    queryFn: () => fetchArtists(search || undefined),
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
      patch: Partial<Pick<Artist, "name" | "status" | "isOdooApproved" | "songCount" | "handlerName">>;
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
      const previous = queryClient.getQueriesData<ArtistsResponse>({ queryKey: ["artists"] });
      queryClient.setQueriesData<ArtistsResponse>({ queryKey: ["artists"] }, (old) =>
        old
          ? {
              ...old,
              artists: old.artists.map((a) => (a.id === id ? { ...a, ...patch } : a)),
            }
          : old,
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
      status,
      isOdooApproved,
      songCount,
    }: {
      ids: string[];
      handlerName?: string;
      status?: ArtistStatus;
      isOdooApproved?: boolean;
      songCount?: number;
    }) => {
      const res = await fetch("/api/artists/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, handlerName, status, isOdooApproved, songCount }),
      });
      if (!res.ok) throw new Error("עדכון מרובה נכשל");
      return res.json();
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["artists"] }),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["artists"] }),
  });

  return {
    artists: artistsQuery.data?.artists ?? [],
    stats: artistsQuery.data?.stats,
    isLoading: artistsQuery.isLoading,
    createArtist: createMutation.mutateAsync,
    updateArtist: updateMutation.mutateAsync,
    bulkUpdate: bulkMutation.mutateAsync,
    runCommand: commandMutation.mutateAsync,
    commandMessage: commandMutation.data?.message,
    isCommandPending: commandMutation.isPending,
  };
}
