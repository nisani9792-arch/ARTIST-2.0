"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { Folder } from "@/lib/types";

type FoldersPanelProps = {
  folders: Folder[];
  activeFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
  onCreateFolder: (name: string) => void;
};

export function FoldersPanel({
  folders,
  activeFolderId,
  onSelectFolder,
  onCreateFolder,
}: FoldersPanelProps) {
  const [name, setName] = useState("");

  return (
    <aside className="hidden w-44 shrink-0 flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 xl:flex">
      <h3 className="text-[10px] font-extrabold text-slate-700">תיקיות</h3>
      <button
        type="button"
        className={cn(
          "rounded-lg px-2 py-1.5 text-start text-[10px] font-bold",
          activeFolderId === null ? "bg-blue-600 text-white" : "hover:bg-white",
        )}
        onClick={() => onSelectFolder(null)}
      >
        הכל
      </button>
      {folders.map((folder) => (
        <button
          key={folder.id}
          type="button"
          className={cn(
            "truncate rounded-lg px-2 py-1.5 text-start text-[10px] font-bold",
            activeFolderId === folder.id ? "bg-blue-600 text-white" : "hover:bg-white",
          )}
          onClick={() => onSelectFolder(folder.id)}
        >
          {folder.name}
        </button>
      ))}
      <form
        className="mt-auto flex gap-1"
        onSubmit={(e) => {
          e.preventDefault();
          const trimmed = name.trim();
          if (!trimmed) return;
          onCreateFolder(trimmed);
          setName("");
        }}
      >
        <input
          className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2 py-1 text-[10px]"
          placeholder="+ תיקייה"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </form>
    </aside>
  );
}
