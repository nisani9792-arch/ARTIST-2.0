"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { encodeArtistIdForPath } from "@/lib/artist-id";
import { loadArtistsCache, saveArtistsCache } from "@/lib/artists-cache";
import type { Artist, ArtistStats, ArtistStatus } from "@/lib/types";

type ArtistsResponse = { artists: Artist[]; stats: ArtistStats };

async function fetchArtists(q?: string): Promise<ArtistsResponse> {
  const params = q ? `?q=${encodeURIComponent(q)}` : "";
  const res = await fetch(`/api/artists${params}`);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error || `טעינת אומנים נכשלה (${res.status})`);
  }
  const data = (await res.json()) as ArtistsResponse;
  saveArtistsCache(q ?? "", data.artists, data.stats);
  return data;
}

export type CreateArtistInput = {
  name: string;
  status?: ArtistStatus;
  handlerName?: string;
  isOdooApproved?: boolean;
};

export function useArtists(search: string) {
  const queryClient = useQueryClient();
  const cached = loadArtistsCache(search);

  const artistsQuery = useQuery({
    queryKey: ["artists", search],
    queryFn: () => fetchArtists(search || undefined),
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
    placeholderData: cached
      ? { artists: cached.artists, stats: cached.stats }
      : undefined,
  });

  const invalidateArtists = () => queryClient.invalidateQueries({ queryKey: ["artists"] });

  const applyOptimisticPatch = async (
    ids: Set<string>,
    patch: Partial<Artist>,
  ) => {
    await queryClient.cancelQueries({ queryKey: ["artists"] });
    const previous = queryClient.getQueriesData<ArtistsResponse>({ queryKey: ["artists"] });
    queryClient.setQueriesData<ArtistsResponse>({ queryKey: ["artists"] }, (old) =>
      old
        ? {
            ...old,
            artists: old.artists.map((a) => (ids.has(a.id) ? { ...a, ...patch } : a)),
          }
        : old,
    );
    return { previous };
  };

  const createMutation = useMutation({
    mutationFn: async (input: CreateArtistInput | string) => {
      const payload = typeof input === "string" ? { name: input } : input;
      const res = await fetch("/api/artists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || "יצירה נכשלה");
      }
      return (await res.json()).artist as Artist;
    },
    onSuccess: invalidateArtists,
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<
        Pick<
          Artist,
          | "name"
          | "status"
          | "isOdooApproved"
          | "songCount"
          | "handlerName"
          | "email"
          | "notes"
          | "tag"
          | "folderId"
          | "deletedAt"
        >
      >;
    }) => {
      const { status: _skipStatus, ...rest } = patch;
      if (Object.keys(rest).length === 0 && patch.status !== undefined) {
        throw new Error("Use updateStatus for status-only changes");
      }
      const res = await fetch(`/api/artists/${encodeArtistIdForPath(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rest),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || "עדכון נכשל");
      }
      return (await res.json()).artist as Artist;
    },
    onMutate: async ({ id, patch }) => {
      const ids = new Set([id]);
      return applyOptimisticPatch(ids, patch);
    },
    onError: (_err, _vars, context) => {
      context?.previous?.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: invalidateArtists,
  });

  const statusMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: ArtistStatus }) => {
      const res = await fetch("/api/artists/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, status }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        error?: string;
        count?: number;
      };
      if (!res.ok) {
        throw new Error(body.error || "עדכון סטטוס נכשל");
      }
      return body;
    },
    onMutate: async ({ ids, status }) => {
      const idSet = new Set(ids);
      return applyOptimisticPatch(idSet, {
        status,
        lastActionTimestamp: new Date().toISOString(),
      });
    },
    onError: (_err, _vars, context) => {
      context?.previous?.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: invalidateArtists,
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
      if (status !== undefined && handlerName === undefined && isOdooApproved === undefined && songCount === undefined) {
        const res = await fetch("/api/artists/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids, status }),
        });
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) throw new Error(body.error || "עדכון סטטוס נכשל");
        return body;
      }

      const res = await fetch("/api/artists/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, handlerName, status, isOdooApproved, songCount }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || "עדכון מרובה נכשל");
      }
      return res.json();
    },
    onMutate: async ({ ids, status, handlerName, isOdooApproved, songCount }) => {
      const patch: Partial<Artist> = {};
      if (status !== undefined) patch.status = status;
      if (handlerName !== undefined) patch.handlerName = handlerName;
      if (isOdooApproved !== undefined) patch.isOdooApproved = isOdooApproved;
      if (songCount !== undefined) patch.songCount = songCount;
      if (Object.keys(patch).length === 0) return undefined;
      return applyOptimisticPatch(new Set(ids), patch);
    },
    onError: (_err, _vars, context) => {
      context?.previous?.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: invalidateArtists,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/artists/${encodeArtistIdForPath(id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("מחיקה נכשלה");
      return (await res.json()).artist as Artist;
    },
    onSettled: invalidateArtists,
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
    onSuccess: invalidateArtists,
  });

  return {
    artists: artistsQuery.data?.artists ?? cached?.artists ?? [],
    stats: artistsQuery.data?.stats ?? cached?.stats,
    cacheAt: cached?.at ?? null,
    isLoading: artistsQuery.isLoading,
    isFetching: artistsQuery.isFetching,
    isError: artistsQuery.isError,
    error: artistsQuery.error,
    refetch: artistsQuery.refetch,
    createArtist: createMutation.mutateAsync,
    updateArtist: updateMutation.mutateAsync,
    updateStatus: statusMutation.mutateAsync,
    deleteArtist: deleteMutation.mutateAsync,
    bulkUpdate: bulkMutation.mutateAsync,
    runCommand: commandMutation.mutateAsync,
    commandMessage: commandMutation.data?.message,
    isCommandPending: commandMutation.isPending,
  };
}
