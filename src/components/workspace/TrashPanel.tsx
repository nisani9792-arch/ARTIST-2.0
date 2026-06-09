"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatHebrewDateTime } from "@/lib/format";
import type { Artist } from "@/lib/types";

type TrashPanelProps = {
  open: boolean;
  onClose: () => void;
  onRestore: (id: string) => Promise<void>;
};

async function fetchTrash(): Promise<Artist[]> {
  const res = await fetch("/api/artists/trash");
  if (!res.ok) throw new Error("טעינת סל מחזור נכשלה");
  const data = (await res.json()) as { artists: Artist[] };
  return data.artists;
}

export function TrashPanel({ open, onClose, onRestore }: TrashPanelProps) {
  const queryClient = useQueryClient();
  const { data: artists = [], isLoading } = useQuery({
    queryKey: ["artists-trash"],
    queryFn: fetchTrash,
    enabled: open,
  });

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[85] flex items-end justify-center bg-slate-900/40 backdrop-blur-sm sm:items-center sm:p-4"
      role="presentation"
      onClick={onClose}
    >
      <aside
        className="flex max-h-[80dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:rounded-3xl"
        role="dialog"
        aria-modal="true"
        aria-label="סל מחזור"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-extrabold text-slate-900">סל מחזור ({artists.length})</h2>
          <button
            type="button"
            className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-500"
            onClick={onClose}
          >
            ✕
          </button>
        </header>
        <div className="kanban-scroll flex-1 overflow-y-auto p-3">
          {isLoading ? (
            <p className="text-center text-xs text-gray-500">טוען…</p>
          ) : artists.length === 0 ? (
            <p className="text-center text-xs text-gray-500">סל המחזור ריק</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {artists.map((artist) => (
                <li
                  key={artist.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-900">{artist.name}</p>
                    <p className="text-[10px] text-gray-500">
                      נמחק {formatHebrewDateTime(artist.deletedAt ?? artist.lastActionTimestamp)}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 rounded-full bg-blue-600 px-2.5 py-1 text-[10px] font-bold text-white"
                    onClick={() => {
                      void onRestore(artist.id).then(() => {
                        void queryClient.invalidateQueries({ queryKey: ["artists-trash"] });
                      });
                    }}
                  >
                    שחזר
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}
