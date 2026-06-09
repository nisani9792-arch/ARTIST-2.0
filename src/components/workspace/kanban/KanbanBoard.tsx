"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useCallback, useRef, useState, type MouseEvent } from "react";
import { cn } from "@/lib/cn";
import { boardCollisionDetection, resolveBoardDropStatus } from "@/lib/kanban-dnd";
import { STATUS_META, type Artist, type ArtistStatus } from "@/lib/types";
import { useUiStore, type BoardColumnStatus } from "@/stores/useUiStore";
import { selectRangeInColumn } from "./selection";
import { ArtistCard } from "./ArtistCard";
import { KanbanColumn } from "./KanbanColumn";

export type KanbanBoardProps = {
  artists: Artist[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSetSelection: (ids: string[]) => void;
  onOpenDetail: (artist: Artist) => void;
  onBulkStatusChange: (ids: string[], status: ArtistStatus) => void;
  onContextMenu?: (artist: Artist, event: MouseEvent) => void;
  hideBoard?: boolean;
};

export function KanbanBoard({
  artists,
  selectedIds,
  onToggleSelect,
  onSetSelection,
  onOpenDetail,
  onBulkStatusChange,
  onContextMenu,
  hideBoard = false,
}: KanbanBoardProps) {
  const [activeArtist, setActiveArtist] = useState<Artist | null>(null);
  const anchorIdRef = useRef<string | null>(null);

  const columnOrder = useUiStore((s) => s.columnOrder);
  const mobileBoardTab = useUiStore((s) => s.mobileBoardTab);
  const setMobileBoardTab = useUiStore((s) => s.setMobileBoardTab);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const boardArtists = artists.filter(
    (a) => a.status === "in_process" || a.status === "signed",
  );

  const grouped = columnOrder.map((status) => ({
    status,
    meta: STATUS_META[status],
    items: boardArtists.filter((a) => a.status === status),
  }));

  const mobileColumn = grouped.find((g) => g.status === mobileBoardTab) ?? grouped[0];

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
    const targetStatus = resolveBoardDropStatus(event);
    if (!targetStatus) return;

    const artist = event.active.data.current?.artist as Artist | undefined;
    if (!artist || artist.status === targetStatus) return;

    const dragIds = selectedIds.has(artist.id) ? [...selectedIds] : [artist.id];
    onBulkStatusChange([...new Set(dragIds)], targetStatus);
  };

  const handleSelectAllInCol = (status: ArtistStatus, checked: boolean) => {
    const colArtists = boardArtists.filter((a) => a.status === status);
    if (checked) {
      onSetSelection([...new Set([...selectedIds, ...colArtists.map((a) => a.id)])]);
    } else {
      const colIds = new Set(colArtists.map((a) => a.id));
      onSetSelection([...selectedIds].filter((id) => !colIds.has(id)));
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
        <div className="mb-2 flex shrink-0 gap-2 lg:hidden" role="tablist">
          {grouped.map(({ status, meta, items }) => (
            <button
              key={status}
              type="button"
              role="tab"
              aria-selected={mobileBoardTab === status}
              className={cn(
                "flex-1 rounded-full px-3 py-2.5 text-xs font-bold transition",
                mobileBoardTab === status
                  ? status === "signed"
                    ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md"
                    : "bg-gradient-to-r from-amber-500 to-amber-400 text-white shadow-md"
                  : "border border-slate-200 bg-white text-slate-600",
              )}
              onClick={() => setMobileBoardTab(status as BoardColumnStatus)}
            >
              {meta.label} ({items.length.toLocaleString("he-IL")})
            </button>
          ))}
        </div>

        <div className="flex min-h-0 flex-1 lg:hidden">
          {mobileColumn && (
            <KanbanColumn
              status={mobileColumn.status}
              label={mobileColumn.meta.label}
              artists={mobileColumn.items}
              selectedIds={selectedIds}
              onSelectArtist={(artist, event) => handleSelect(mobileColumn.items, artist, event)}
              onOpenDetail={onOpenDetail}
              onContextMenu={onContextMenu}
              onSelectAll={(checked) => handleSelectAllInCol(mobileColumn.status, checked)}
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
