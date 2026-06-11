"use client";

import { DndContext, DragOverlay, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { useCallback, useRef, useState, type MouseEvent } from "react";
import { cn } from "@/lib/cn";
import {
  artistMatchesColumn,
  BOARD_COLUMN_META,
  filterArtistsForColumn,
  type BoardColumnId,
} from "@/lib/board-columns";
import { boardCollisionDetection, resolveBoardDropColumn } from "@/lib/kanban-dnd";
import { useBoardSensors } from "@/lib/useBoardSensors";
import type { Artist } from "@/lib/types";
import { useUiStore } from "@/stores/useUiStore";
import { selectRangeInColumn } from "./selection";
import { ArtistCard } from "./ArtistCard";
import { KanbanColumn } from "./KanbanColumn";

export type KanbanBoardProps = {
  artists: Artist[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSetSelection: (ids: string[]) => void;
  onOpenDetail: (artist: Artist) => void;
  onBulkColumnChange: (ids: string[], columnId: BoardColumnId) => void;
  onContextMenu?: (artist: Artist, event: MouseEvent) => void;
  hideBoard?: boolean;
};

const mobileTabStyle: Record<BoardColumnId, string> = {
  in_process: "bg-gradient-to-r from-amber-500 to-amber-400 text-white shadow-md",
  signed_pending_odoo: "bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-md",
  signed_approved: "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md",
};

export function KanbanBoard({
  artists,
  selectedIds,
  onToggleSelect,
  onSetSelection,
  onOpenDetail,
  onBulkColumnChange,
  onContextMenu,
  hideBoard = false,
}: KanbanBoardProps) {
  const [activeArtist, setActiveArtist] = useState<Artist | null>(null);
  const anchorIdRef = useRef<string | null>(null);

  const columnOrder = useUiStore((s) => s.columnOrder);
  const mobileBoardTab = useUiStore((s) => s.mobileBoardTab);
  const setMobileBoardTab = useUiStore((s) => s.setMobileBoardTab);

  const sensors = useBoardSensors();

  const boardArtists = artists.filter(
    (a) => a.status === "in_process" || a.status === "signed",
  );

  const grouped = columnOrder.map((columnId) => ({
    columnId,
    meta: BOARD_COLUMN_META[columnId],
    items: filterArtistsForColumn(boardArtists, columnId),
  }));

  const mobileColumn = grouped.find((g) => g.columnId === mobileBoardTab) ?? grouped[0];

  const handleSelect = useCallback(
    (columnArtists: Artist[], artist: Artist, event: MouseEvent) => {
      if (event.shiftKey && anchorIdRef.current) {
        onSetSelection(selectRangeInColumn(columnArtists, anchorIdRef.current, artist.id));
        return;
      }
      onToggleSelect(artist.id);
      anchorIdRef.current = artist.id;
    },
    [onSetSelection, onToggleSelect],
  );

  const handleDragStart = (event: DragStartEvent) => {
    const artist = event.active.data.current?.artist as Artist | undefined;
    if (artist) setActiveArtist(artist);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveArtist(null);
    const targetColumn = resolveBoardDropColumn(event);
    if (!targetColumn) return;

    const artist = event.active.data.current?.artist as Artist | undefined;
    if (!artist || artistMatchesColumn(artist, targetColumn)) return;

    const dragIds = selectedIds.has(artist.id) ? [...selectedIds] : [artist.id];
    onBulkColumnChange([...new Set(dragIds)], targetColumn);
  };

  const handleSelectAllInCol = (visibleArtists: Artist[], checked: boolean) => {
    const visibleIds = new Set(visibleArtists.map((a) => a.id));
    if (checked) {
      onSetSelection([...new Set([...selectedIds, ...visibleIds])]);
    } else {
      onSetSelection([...selectedIds].filter((id) => !visibleIds.has(id)));
    }
  };

  if (hideBoard) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
        <p className="text-sm font-bold text-slate-700">כל האומנים ב-Vault</p>
        <p className="text-xs text-gray-500">פתח את רשימת הלא חתומים לצפייה ועריכה</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={boardCollisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="mb-2 flex shrink-0 gap-1.5 overflow-x-auto lg:hidden" role="tablist">
          {grouped.map(({ columnId, meta, items }) => (
            <button
              key={columnId}
              type="button"
              role="tab"
              aria-selected={mobileBoardTab === columnId}
              className={cn(
                "shrink-0 rounded-full px-3 py-2 text-[10px] font-bold transition",
                mobileBoardTab === columnId
                  ? mobileTabStyle[columnId]
                  : "border border-slate-200 bg-white text-slate-600",
              )}
              onClick={() => setMobileBoardTab(columnId)}
            >
              {meta.shortLabel} ({items.length.toLocaleString("he-IL")})
            </button>
          ))}
        </div>

        <div className="flex min-h-0 flex-1 lg:hidden">
          {mobileColumn && (
            <KanbanColumn
              columnId={mobileColumn.columnId}
              artists={mobileColumn.items}
              selectedIds={selectedIds}
              onSelectArtist={(artist, event) => handleSelect(mobileColumn.items, artist, event)}
              onOpenDetail={onOpenDetail}
              onContextMenu={onContextMenu}
              onSelectAll={(checked, visible) => handleSelectAllInCol(visible, checked)}
            />
          )}
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeArtist ? (
          <div className="w-[260px] rotate-1 opacity-95">
            <ArtistCard
              artist={activeArtist}
              selected={selectedIds.has(activeArtist.id)}
              onSelect={() => {}}
              onOpenDetail={() => {}}
              draggable={false}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
