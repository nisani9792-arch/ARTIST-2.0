"use client";

import { useDroppable } from "@dnd-kit/core";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef, type MouseEvent } from "react";
import { cn } from "@/lib/cn";
import type { Artist, ArtistStatus } from "@/lib/types";
import { ARTIST_CARD_HEIGHT, ArtistCard } from "./ArtistCard";

const columnHeaderAccent: Record<ArtistStatus, string> = {
  in_process: "text-amber-700",
  signed: "text-emerald-700",
  unsigned: "text-slate-600",
};

const columnDot: Record<ArtistStatus, string> = {
  in_process: "bg-amber-500",
  signed: "bg-emerald-500",
  unsigned: "bg-slate-400",
};

export type KanbanColumnProps = {
  status: ArtistStatus;
  label: string;
  artists: Artist[];
  selectedIds: Set<string>;
  onSelectArtist: (artist: Artist, event: MouseEvent) => void;
  onOpenDetail: (artist: Artist) => void;
  onSelectAll: (checked: boolean) => void;
};

export function KanbanColumn({
  status,
  label,
  artists,
  selectedIds,
  onSelectArtist,
  onOpenDetail,
  onSelectAll,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const scrollRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: artists.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ARTIST_CARD_HEIGHT + 8,
    overscan: 10,
  });

  const allSelected = artists.length > 0 && artists.every((a) => selectedIds.has(a.id));

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex min-h-0 min-w-0 flex-1 flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4",
        "transition-colors duration-200",
        isOver && "border-cyan-400 bg-cyan-50/40 ring-2 ring-cyan-200",
      )}
    >
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className={cn("size-2 shrink-0 rounded-full", columnDot[status])} aria-hidden />
          <h2 className={cn("truncate text-sm font-extrabold text-slate-800", columnHeaderAccent[status])}>
            {label}
          </h2>
          <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-xs font-bold text-gray-500 shadow-sm">
            {artists.length.toLocaleString("he-IL")}
          </span>
        </div>

        <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-xs font-medium text-gray-500">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(e) => onSelectAll(e.target.checked)}
            className="size-3.5 rounded border-slate-300 accent-cyan-600"
          />
          הכל
        </label>
      </header>

      <div ref={scrollRef} className="kanban-scroll min-h-0 flex-1 overflow-y-auto pe-0.5">
        {artists.length === 0 ? (
          <p className="py-8 text-center text-xs text-gray-500">אין אומנים בעמודה</p>
        ) : (
          <div
            className="relative w-full"
            style={{ height: `${virtualizer.getTotalSize()}px` }}
          >
            {virtualizer.getVirtualItems().map((row) => {
              const artist = artists[row.index];
              return (
                <div
                  key={artist.id}
                  className="absolute start-0 end-0 pb-2"
                  style={{
                    height: `${row.size}px`,
                    transform: `translateY(${row.start}px)`,
                  }}
                >
                  <ArtistCard
                    artist={artist}
                    selected={selectedIds.has(artist.id)}
                    onSelect={(event) => onSelectArtist(artist, event)}
                    onOpenDetail={() => onOpenDetail(artist)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
