"use client";

import { useDroppable } from "@dnd-kit/core";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useMemo, useRef, type MouseEvent } from "react";
import { cn } from "@/lib/cn";
import {
  BOARD_COLUMN_META,
  filterArtistsByColumnSearch,
  type BoardColumnId,
} from "@/lib/board-columns";
import type { Artist } from "@/lib/types";
import { useUiStore } from "@/stores";
import { BOARD_ARTIST_CARD_HEIGHT, BoardArtistCard } from "./BoardArtistCard";
import { ARTIST_CARD_HEIGHT, ArtistCard } from "./ArtistCard";

type ColumnTone = "in_process" | "signed" | "unsigned" | "signed_pending";

const columnHeaderAccent: Record<ColumnTone, string> = {
  in_process: "text-amber-800",
  signed: "text-emerald-800",
  unsigned: "text-slate-600",
  signed_pending: "text-rose-800",
};

const columnShell: Record<ColumnTone, string> = {
  signed: "border-emerald-200/70 bg-gradient-to-b from-emerald-50/50 to-slate-50/90",
  in_process: "border-amber-200/70 bg-gradient-to-b from-amber-50/40 to-slate-50/90",
  unsigned: "border-slate-200 bg-slate-50/90",
  signed_pending: "border-rose-200/70 bg-gradient-to-b from-rose-50/45 to-slate-50/90",
};

const columnDot: Record<ColumnTone, string> = {
  in_process: "bg-amber-500",
  signed: "bg-emerald-500",
  unsigned: "bg-slate-400",
  signed_pending: "bg-rose-500",
};

export type KanbanColumnProps = {
  columnId: BoardColumnId;
  artists: Artist[];
  selectedIds: Set<string>;
  desktop?: boolean;
  hideHeader?: boolean;
  onExportColumn?: (columnId: BoardColumnId) => void;
  onSelectArtist: (artist: Artist, event: MouseEvent) => void;
  onOpenDetail: (artist: Artist) => void;
  onContextMenu?: (artist: Artist, event: MouseEvent) => void;
  onSelectAll: (checked: boolean, visibleArtists: Artist[]) => void;
};

export function KanbanColumn({
  columnId,
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
  const meta = BOARD_COLUMN_META[columnId];
  const columnSearch = useUiStore((s) => s.columnSearch[columnId] ?? "");
  const setColumnSearch = useUiStore((s) => s.setColumnSearch);

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: columnId,
    data: { type: "artist-column", columnId },
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const filtered = useMemo(
    () => filterArtistsByColumnSearch(artists, columnSearch),
    [artists, columnSearch],
  );
  const isEmpty = filtered.length === 0;
  const cardHeight = desktop ? BOARD_ARTIST_CARD_HEIGHT : ARTIST_CARD_HEIGHT;
  const CardComponent = desktop ? BoardArtistCard : ArtistCard;
  const tone = meta.tone as ColumnTone;

  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => cardHeight + 8,
    overscan: 10,
  });

  const allSelected = filtered.length > 0 && filtered.every((a) => selectedIds.has(a.id));

  return (
    <section
      ref={setDropRef}
      className={cn(
        "flex flex-col gap-2 rounded-2xl border p-3 shadow-inner",
        columnShell[tone],
        desktop ? "min-h-0 min-w-0 h-full w-full overflow-hidden" : "h-full min-h-0 w-full flex-1",
        isOver && "border-cyan-400 bg-cyan-50/50 ring-2 ring-cyan-300/60",
        isEmpty && !desktop && "min-h-0",
      )}
    >
      {!hideHeader && (
        <header className="flex shrink-0 flex-col gap-2 border-b border-slate-200/70 pb-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className={cn("size-2 shrink-0 rounded-full", columnDot[tone])} aria-hidden />
              <h2
                className={cn(
                  "truncate text-sm font-extrabold tracking-tight",
                  columnHeaderAccent[tone],
                )}
                title={meta.label}
              >
                {meta.label}
              </h2>
              <span className="shrink-0 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-slate-600 shadow-sm">
                {filtered.length.toLocaleString("he-IL")}
                {columnSearch && artists.length !== filtered.length && (
                  <span className="text-slate-400"> / {artists.length}</span>
                )}
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              {desktop && onExportColumn && (
                <button
                  type="button"
                  className="rounded-full border border-slate-200/80 bg-white/90 px-2 py-1 text-[10px] font-bold text-slate-600 shadow-sm transition hover:border-cyan-300 hover:text-cyan-700"
                  onClick={() => onExportColumn(columnId)}
                  title={`ייצוא עמודת ${meta.label}`}
                >
                  ייצוא
                </button>
              )}
              <label className="flex cursor-pointer items-center gap-1 text-[10px] font-medium text-slate-500">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onSelectAll(e.target.checked, filtered)}
                  className="size-3 rounded border-slate-300 accent-cyan-600"
                />
                הכל
              </label>
            </div>
          </div>

          <input
            type="search"
            className="w-full rounded-xl border border-slate-200/80 bg-white/90 px-3 py-1.5 text-[11px] outline-none focus:ring-2 focus:ring-cyan-400/40"
            placeholder={`חיפוש ב${meta.shortLabel}…`}
            value={columnSearch}
            onChange={(e) => setColumnSearch(columnId, e.target.value)}
          />
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
            <p className="text-xs font-semibold text-slate-600">
              {columnSearch ? "אין תוצאות בחיפוש" : "אין אומנים בעמודה"}
            </p>
            <p className="text-[10px] text-slate-400">גרור כרטיס לכאן לשינוי סטטוס</p>
          </div>
        ) : (
          <div className="relative w-full" style={{ height: `${virtualizer.getTotalSize()}px` }}>
            {virtualizer.getVirtualItems().map((row) => {
              const artist = filtered[row.index];
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
