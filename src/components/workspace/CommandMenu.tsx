"use client";

import { Command } from "cmdk";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { STATUS_META, type Artist, type ArtistStatus } from "@/lib/types";
import { useUiStore } from "@/stores";

const ALL_STATUSES: ArtistStatus[] = ["unsigned", "in_process", "signed"];

type CommandMenuProps = {
  artists: Artist[];
  onStatusChange: (id: string, status: ArtistStatus) => void;
  onOpenDetail: (artist: Artist) => void;
};

export function CommandMenu({ artists, onStatusChange, onOpenDetail }: CommandMenuProps) {
  const open = useUiStore((s) => s.commandOpen);
  const setCommandOpen = useUiStore((s) => s.setCommandOpen);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setCommandOpen(!open);
      }
      if (e.key === "Escape") setCommandOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setCommandOpen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return artists.slice(0, 50);
    return artists
      .filter(
        (a) =>
          a.name.toLowerCase().includes(q) || a.handlerName.toLowerCase().includes(q),
      )
      .slice(0, 40);
  }, [artists, query]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-slate-900/40 p-4 pt-[12vh] backdrop-blur-sm"
      onClick={() => setCommandOpen(false)}
      role="presentation"
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Command label="חיפוש אומנים" shouldFilter={false}>
          <Command.Input
            className="w-full border-b border-slate-100 px-4 py-3 text-sm font-medium outline-none"
            placeholder="חיפוש אומן או מטפל… (Ctrl+K)"
            value={query}
            onValueChange={setQuery}
            autoFocus
          />
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="px-3 py-6 text-center text-xs text-gray-500">
              לא נמצאו תוצאות
            </Command.Empty>
            {filtered.map((artist) => (
              <Command.Item
                key={artist.id}
                value={artist.id}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm aria-selected:bg-slate-100"
                onSelect={() => {
                  onOpenDetail(artist);
                  setCommandOpen(false);
                }}
              >
                <span className="min-w-0 flex-1 truncate font-bold text-slate-900">
                  {artist.name}
                </span>
                <div className="flex shrink-0 gap-1">
                  {ALL_STATUSES.map((status) => (
                    <button
                      key={status}
                      type="button"
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold transition",
                        artist.status === status
                          ? status === "signed"
                            ? "bg-emerald-600 text-white"
                            : "bg-blue-600 text-white"
                          : "border border-slate-200 text-slate-600 hover:border-blue-300",
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (artist.status !== status) onStatusChange(artist.id, status);
                      }}
                    >
                      {STATUS_META[status].label}
                    </button>
                  ))}
                </div>
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
