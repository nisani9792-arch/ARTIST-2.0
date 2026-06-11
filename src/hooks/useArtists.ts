"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { encodeArtistIdForPath } from "@/lib/artist-id";
import { loadArtistsCache, saveArtistsCache } from "@/lib/artists-cache";
import { markLocalMutation } from "@/lib/mutation-sync";
import type { Artist, ArtistStats, ArtistStatus } from "@/lib/types";
import type { ViewMode } from "@/stores/useUiStore";

type ArtistsResponse = { artists: Artist[]; stats: ArtistStats };

export type UseArtistsOptions = {
  search: string;
  vaultOpen: boolean;
  viewMode: ViewMode;
};

async function fetchArtistsScope(
  scope: "board" | "vault" | "all",
  q?: string,
): Promise<ArtistsResponse> {
  const params = new URLSearchParams();
  if (q && q.length >= 2) {
    params.set("q", q);
  } else {
    params.set("scope", scope);
  }
  const res = await fetch(`/api/artists?${params}`);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error || `טעינת אומנים נכשלה (${res.status})`);
  }
  const data = (await res.json()) as ArtistsResponse;
  const cacheKey = q && q.length >= 2 ? `search:${q}` : scope;
  saveArtistsCache(cacheKey, data.artists, data.stats);
  return data;
}

export type CreateArtistInput = {
  name: string;
  status?: ArtistStatus;
  handlerName?: string;
  isOdooApproved?: boolean;
};

export function useArtists({ search, vaultOpen, viewMode }: UseArtistsOptions) {
  const queryClient = useQueryClient();
  const isSearch = search.trim().length >= 2;
  const isList = viewMode === "list";

  const boardQuery = useQuery({
    queryKey: ["artists", "board"],
    queryFn: () => fetchArtistsScope("board"),
    enabled: !isSearch,
    staleTime: 30_000,
    refetchInterval: isList ? false : 90_000,
    refetchIntervalInBackground: false,
    placeholderData: () => {
      const c = loadArtistsCache("board");
      return c ? { artists: c.artists, stats: c.stats } : undefined;
    },
  });

  const vaultQuery = useQuery({
    queryKey: ["artists", "vault"],
    queryFn: () => fetchArtistsScope("vault"),
    enabled: !isSearch && (vaultOpen || isList),
    staleTime: 30_000,
    refetchInterval: false,
    placeholderData: () => {
      const c = loadArtistsCache("vault");
      return c ? { artists: c.artists, stats: c.stats } : undefined;
    },
  });

  const allQuery = useQuery({
    queryKey: ["artists", "all"],
    queryFn: () => fetchArtistsScope("all"),
    enabled: !isSearch && isList,
    staleTime: 30_000,
    refetchInterval: false,
  });

  const searchQuery = useQuery({
    queryKey: ["artists", "search", search.trim()],
    queryFn: () => fetchArtistsScope("all", search.trim()),
    enabled: isSearch,
    staleTime: 15_000,
  });

  const stats =
    boardQuery.data?.stats ??
    vaultQuery.data?.stats ??
    allQuery.data?.stats ??
    searchQuery.data?.stats;

  const artists = useMemo(() => {
    if (isSearch) return searchQuery.data?.artists ?? [];
    if (isList) return allQuery.data?.artists ?? [];
    const map = new Map<string, Artist>();
    for (const a of boardQuery.data?.artists ?? []) map.set(a.id, a);
    if (vaultOpen) {
      for (const a of vaultQuery.data?.artists ?? []) map.set(a.id, a);
    }
    return [...map.values()];
  }, [
    isSearch,
    isList,
    searchQuery.data,
    allQuery.data,
    boardQuery.data,
    vaultQuery.data,
    vaultOpen,
  ]);

  const isLoading =
    (isSearch && searchQuery.isLoading) ||
    (isList && allQuery.isLoading) ||
    (!isSearch && !isList && boardQuery.isLoading) ||
    (vaultOpen && !isSearch && !isList && vaultQuery.isLoading);

  const isError =
    boardQuery.isError || vaultQuery.isError || allQuery.isError || searchQuery.isError;

  const error =
    searchQuery.error ?? allQuery.error ?? boardQuery.error ?? vaultQuery.error;

  const refetch = async () => {
    await Promise.all([
      boardQuery.refetch(),
      vaultOpen ? vaultQuery.refetch() : Promise.resolve(),
      isList ? allQuery.refetch() : Promise.resolve(),
      isSearch ? searchQuery.refetch() : Promise.resolve(),
    ]);
  };

  const patchAllCaches = (ids: Set<string>, patch: Partial<Artist>) => {
    queryClient.setQueriesData<ArtistsResponse>({ queryKey: ["artists"] }, (old) =>
      old
        ? {
            ...old,
            artists: old.artists.map((a) => (ids.has(a.id) ? { ...a, ...patch } : a)),
          }
        : old,
    );
  };

  const applyOptimisticPatch = async (ids: Set<string>, patch: Partial<Artist>) => {
    await queryClient.cancelQueries({ queryKey: ["artists"] });
    const previous = queryClient.getQueriesData<ArtistsResponse>({ queryKey: ["artists"] });
    patchAllCaches(ids, patch);
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
    onSuccess: (artist) => {
      queryClient.setQueriesData<ArtistsResponse>({ queryKey: ["artists"] }, (old) =>
        old ? { ...old, artists: [artist, ...old.artists] } : old,
      );
    },
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
      markLocalMutation();
      return applyOptimisticPatch(new Set([id]), patch);
    },
    onSuccess: (artist) => {
      markLocalMutation();
      patchAllCaches(new Set([artist.id]), artist);
    },
    onError: (_err, _vars, context) => {
      context?.previous?.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
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
      if (!res.ok) throw new Error(body.error || "עדכון סטטוס נכשל");
      return { ids, status, count: body.count ?? ids.length };
    },
    onMutate: async ({ ids, status }) => {
      markLocalMutation();
      return applyOptimisticPatch(new Set(ids), {
        status,
        lastActionTimestamp: new Date().toISOString(),
      });
    },
    onSuccess: () => markLocalMutation(),
    onError: (_err, _vars, context) => {
      context?.previous?.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
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
      if (
        status !== undefined &&
        handlerName === undefined &&
        isOdooApproved === undefined &&
        songCount === undefined
      ) {
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
      markLocalMutation();
      const patch: Partial<Artist> = {
        lastActionTimestamp: new Date().toISOString(),
      };
      if (status !== undefined) patch.status = status;
      if (handlerName !== undefined) patch.handlerName = handlerName;
      if (isOdooApproved !== undefined) patch.isOdooApproved = isOdooApproved;
      if (songCount !== undefined) patch.songCount = songCount;
      return applyOptimisticPatch(new Set(ids), patch);
    },
    onSuccess: (data) => {
      markLocalMutation();
      const artists = (data as { artists?: Artist[] }).artists;
      if (artists?.length) {
        for (const artist of artists) {
          patchAllCaches(new Set([artist.id]), artist);
        }
      }
    },
    onError: (_err, _vars, context) => {
      context?.previous?.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/artists/${encodeArtistIdForPath(id)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("מחיקה נכשלה");
      return (await res.json()).artist as Artist;
    },
    onSuccess: (artist) => {
      queryClient.setQueriesData<ArtistsResponse>({ queryKey: ["artists"] }, (old) =>
        old ? { ...old, artists: old.artists.filter((a) => a.id !== artist.id) } : old,
      );
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
      markLocalMutation();
      window.setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: ["artists"], refetchType: "active" });
      }, 600);
    },
  });

  const cacheAt = loadArtistsCache(isSearch ? `search:${search}` : "board")?.at ?? null;

  return {
    artists,
    stats,
    cacheAt,
    isLoading,
    isFetching:
      boardQuery.isFetching ||
      vaultQuery.isFetching ||
      allQuery.isFetching ||
      searchQuery.isFetching,
    isError,
    error,
    refetch,
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
