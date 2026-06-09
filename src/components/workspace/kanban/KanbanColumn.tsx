"use client";

import { useDroppable } from "@dnd-kit/core";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef, type MouseEvent } from "react";
import { cn } from "@/lib/cn";
import type { Artist, ArtistStatus } from "@/lib/types";
import { BOARD_ARTIST_CARD_HEIGHT, BoardArtistCard } from "./BoardArtistCard";
import { ARTIST_CARD_HEIGHT, ArtistCard } from "./ArtistCard";

const columnHeaderAccent: Record<ArtistStatus, string> = {
  in_process: "text-amber-800",
  signed: "text-emerald-800",
  unsigned: "text-slate-600",
};

const columnShell: Record<ArtistStatus, string> = {
  signed: "border-emerald-200/70 bg-gradient-to-b from-emerald-50/50 to-slate-50/90",
  in_process: "border-amber-200/70 bg-gradient-to-b from-amber-50/40 to-slate-50/90",
  unsigned: "border-slate-200 bg-slate-50/90",
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
  widthPct?: number;
  desktop?: boolean;
  hideHeader?: boolean;
  onExportColumn?: (status: ArtistStatus) => void;
  onSelectArtist: (artist: Artist, event: MouseEvent) => void;
  onOpenDetail: (artist: Artist) => void;
  onContextMenu?: (artist: Artist, event: MouseEvent) => void;
  onSelectAll: (checked: boolean) => void;
};

export function KanbanColumn({
  status,
  label,
  artists,
  selectedIds,
  desktop = false,
  hideHeader = false,
  onExportColumn,
  onSelectArtist,
  onOpenDetail,
  onContextMenu,
  onSelectAll,
}: KanbanColumnProps) {
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: status,
    data: { type: "artist-column", status },
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const isEmpty = artists.length === 0;
  const cardHeight = desktop ? BOARD_ARTIST_CARD_HEIGHT : ARTIST_CARD_HEIGHT;
  const CardComponent = desktop ? BoardArtistCard : ArtistCard;

  const virtualizer = useVirtualizer({
    count: artists.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => cardHeight + 8,
    overscan: 10,
  });

  const allSelected = artists.length > 0 && artists.every((a) => selectedIds.has(a.id));

  return (
    <section
      ref={setDropRef}
      className={cn(
        "flex flex-col gap-2 rounded-2xl border p-3 shadow-inner",
        columnShell[status],
        desktop ? "min-h-0 min-w-0 h-full w-full overflow-hidden" : "h-full min-h-0 w-full flex-1",
        isOver && "border-cyan-400 bg-cyan-50/50 ring-2 ring-cyan-300/60",
        isEmpty && !desktop && "min-h-0",
      )}
    >
      {!hideHeader && (
        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200/70 pb-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <span className={cn("size-2 shrink-0 rounded-full", columnDot[status])} aria-hidden />
            <h2
              className={cn(
                "truncate text-sm font-extrabold tracking-tight",
                columnHeaderAccent[status],
              )}
            >
              {label}
            </h2>
            <span className="shrink-0 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-slate-600 shadow-sm">
              {artists.length.toLocaleString("he-IL")}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {desktop && onExportColumn && (
              <button
                type="button"
                className="rounded-full border border-slate-200/80 bg-white/90 px-2 py-1 text-[10px] font-bold text-slate-600 shadow-sm transition hover:border-cyan-300 hover:text-cyan-700"
                onClick={() => onExportColumn(status)}
                title={`ייצוא עמודת ${label}`}
              >
                ייצוא
              </button>
            )}
            <label className="flex cursor-pointer items-center gap-1 text-[10px] font-medium text-slate-500">
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
      )}

      <div
        ref={scrollRef}
        className={cn(
          "kanban-scroll overflow-y-auto",
          isEmpty ? "min-h-[120px] flex-none" : "min-h-0 flex-1",
          !desktop && !isEmpty && "min-h-[200px]",
        )}
      >
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <span className="text-2xl opacity-30" aria-hidden>
              ◇
            </span>
            <p className="text-xs font-semibold text-slate-600">אין אומנים בעמודה</p>
            <p className="text-[10px] text-slate-400">גרור כרטיס לכאן לשינוי סטטוס</p>
          </div>
        ) : (
          <div className="relative w-full" style={{ height: `${virtualizer.getTotalSize()}px` }}>
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
                  <CardComponent
                    artist={artist}
                    selected={selectedIds.has(artist.id)}
                    onSelect={(event) => onSelectArtist(artist, event)}
                    onOpenDetail={() => onOpenDetail(artist)}
                    onContextMenu={(event) => onContextMenu?.(artist, event)}
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
