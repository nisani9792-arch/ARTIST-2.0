"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
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
  widthPct: number;
  canMoveEarlier: boolean;
  canMoveLater: boolean;
  onMoveEarlier: () => void;
  onMoveLater: () => void;
  onSelectArtist: (artist: Artist, event: MouseEvent) => void;
  onOpenDetail: (artist: Artist) => void;
  onSelectAll: (checked: boolean) => void;
};

export function KanbanColumn({
  status,
  label,
  artists,
  selectedIds,
  widthPct,
  canMoveEarlier,
  canMoveLater,
  onMoveEarlier,
  onMoveLater,
  onSelectArtist,
  onOpenDetail,
  onSelectAll,
}: KanbanColumnProps) {
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: status,
    data: { type: "artist-column", status },
  });
  const { setNodeRef: setColumnDropRef, isOver: isColumnOver } = useDroppable({
    id: `column-drop:${status}`,
    data: { type: "column-reorder", status },
  });
  const {
    attributes: dragAttrs,
    listeners: dragListeners,
    setNodeRef: setDragRef,
    isDragging: isColumnDragging,
  } = useDraggable({
    id: `column:${status}`,
    data: { type: "column-reorder", status },
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: artists.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ARTIST_CARD_HEIGHT + 6,
    overscan: 12,
  });

  const allSelected = artists.length > 0 && artists.every((a) => selectedIds.has(a.id));

  const setRefs = (node: HTMLElement | null) => {
    setDropRef(node);
    setColumnDropRef(node);
  };

  return (
    <section
      ref={setRefs}
      style={{ flex: `0 0 ${widthPct}%` }}
      className={cn(
        "flex min-h-0 w-[min(88vw,320px)] shrink-0 snap-center flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-3",
        "transition-colors duration-200 md:w-auto md:min-w-[160px] md:max-w-[78%] md:snap-align-none",
        isOver && "border-cyan-400 bg-cyan-50/40 ring-2 ring-cyan-200",
        isColumnOver && "ring-2 ring-blue-300",
        isColumnDragging && "opacity-60",
      )}
    >
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <button
            type="button"
            ref={setDragRef}
            {...dragAttrs}
            {...dragListeners}
            className="hidden shrink-0 cursor-grab rounded-md px-1 py-0.5 text-[10px] text-gray-400 hover:bg-white active:cursor-grabbing md:inline"
            aria-label={`גרור לשינוי מיקום עמודת ${label}`}
            title="גרור לשינוי סדר"
          >
            ⋮⋮
          </button>
          <span className={cn("size-1.5 shrink-0 rounded-full", columnDot[status])} aria-hidden />
          <h2
            className={cn(
              "truncate text-xs font-extrabold text-slate-800",
              columnHeaderAccent[status],
            )}
          >
            {label}
          </h2>
          <span className="shrink-0 rounded-full bg-white px-1.5 py-0.5 text-[10px] font-bold text-gray-500 shadow-sm">
            {artists.length.toLocaleString("he-IL")}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            disabled={!canMoveEarlier}
            onClick={onMoveEarlier}
            className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-500 disabled:opacity-30 md:hidden"
            aria-label="הזז עמודה"
          >
            →
          </button>
          <button
            type="button"
            disabled={!canMoveLater}
            onClick={onMoveLater}
            className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-500 disabled:opacity-30 md:hidden"
            aria-label="הזז עמודה"
          >
            ←
          </button>
          <label className="flex cursor-pointer items-center gap-1 text-[10px] font-medium text-gray-500">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(e) => onSelectAll(e.target.checked)}
              className="size-3 rounded border-slate-300 accent-cyan-600"
            />
            הכל
          </label>
        </div>
      </header>

      <div ref={scrollRef} className="kanban-scroll min-h-0 flex-1 overflow-y-auto">
        {artists.length === 0 ? (
          <p className="py-6 text-center text-[10px] text-gray-500">אין אומנים בעמודה</p>
        ) : (
          <div className="relative w-full" style={{ height: `${virtualizer.getTotalSize()}px` }}>
            {virtualizer.getVirtualItems().map((row) => {
              const artist = artists[row.index];
              return (
                <div
                  key={artist.id}
                  className="absolute start-0 end-0 pb-1.5"
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
