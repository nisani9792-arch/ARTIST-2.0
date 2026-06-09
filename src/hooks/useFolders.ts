"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Folder } from "@/lib/types";

async function fetchFolders(): Promise<Folder[]> {
  const res = await fetch("/api/folders");
  if (!res.ok) throw new Error("טעינת תיקיות נכשלה");
  const data = (await res.json()) as { folders: Folder[] };
  return data.folders;
}

export function useFolders() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["folders"],
    queryFn: fetchFolders,
    staleTime: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("יצירת תיקייה נכשלה");
      return (await res.json()).folder as Folder;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["folders"] }),
  });

  return {
    folders: query.data ?? [],
    isLoading: query.isLoading,
    createFolder: createMutation.mutateAsync,
  };
}
