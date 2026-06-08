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
import { STATUS_META, type Artist, type ArtistStatus } from "@/lib/types";
import { useUiStore, type BoardColumnStatus } from "@/stores/useUiStore";
import { selectRangeInColumn } from "./selection";
import { ArtistCard } from "./ArtistCard";
import { ColumnResizeHandle } from "./ColumnResizeHandle";
import { KanbanColumn } from "./KanbanColumn";

export type KanbanBoardProps = {
  artists: Artist[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSetSelection: (ids: string[]) => void;
  onOpenDetail: (artist: Artist) => void;
  onBulkStatusChange: (ids: string[], status: ArtistStatus) => void;
};

const isBoardColumn = (status: ArtistStatus): status is BoardColumnStatus =>
  status === "in_process" || status === "signed";

export function KanbanBoard({
  artists,
  selectedIds,
  onToggleSelect,
  onSetSelection,
  onOpenDetail,
  onBulkStatusChange,
}: KanbanBoardProps) {
  const [activeArtist, setActiveArtist] = useState<Artist | null>(null);
  const [activeColumn, setActiveColumn] = useState<BoardColumnStatus | null>(null);
  const anchorIdRef = useRef<string | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const columnOrder = useUiStore((s) => s.columnOrder);
  const columnWidths = useUiStore((s) => s.columnWidths);
  const moveColumn = useUiStore((s) => s.moveColumn);
  const setColumnOrder = useUiStore((s) => s.setColumnOrder);
  const resizeAdjacentColumns = useUiStore((s) => s.resizeAdjacentColumns);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const boardArtists = artists.filter(
    (a) => a.status === "in_process" || a.status === "signed",
  );

  const grouped = columnOrder.map((status) => ({
    status,
    meta: STATUS_META[status],
    items: boardArtists.filter((a) => a.status === status),
    widthPct: columnWidths[status],
  }));

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
    const type = event.active.data.current?.type as string | undefined;
    if (type === "column-reorder") {
      setActiveColumn(event.active.data.current?.status as BoardColumnStatus);
      return;
    }
    const artist = event.active.data.current?.artist as Artist | undefined;
    if (artist) setActiveArtist(artist);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveArtist(null);
    setActiveColumn(null);
    const { active, over } = event;
    if (!over) return;

    const activeType = active.data.current?.type as string | undefined;

    if (activeType === "column-reorder") {
      const from = active.data.current?.status as BoardColumnStatus | undefined;
      const overType = over.data.current?.type as string | undefined;
      if (!from || overType !== "column-reorder") return;
      const to = over.data.current?.status as BoardColumnStatus | undefined;
      if (!to || from === to) return;

      const order = [...columnOrder];
      const fromIdx = order.indexOf(from);
      const toIdx = order.indexOf(to);
      if (fromIdx < 0 || toIdx < 0) return;
      order.splice(fromIdx, 1);
      order.splice(toIdx, 0, from);
      setColumnOrder(order);
      return;
    }

    const targetStatus = over.id as ArtistStatus;
    if (!isBoardColumn(targetStatus)) return;

    const artist = active.data.current?.artist as Artist | undefined;
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

  const handleResize = (left: BoardColumnStatus, right: BoardColumnStatus, deltaPx: number) => {
    const width = boardRef.current?.offsetWidth ?? 1;
    const deltaPct = (deltaPx / width) * 100;
    resizeAdjacentColumns(left, right, deltaPct);
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div
        ref={boardRef}
        className="kanban-scroll flex min-h-0 flex-1 gap-2 overflow-x-auto snap-x snap-mandatory pb-1 md:gap-0 md:overflow-x-hidden md:pb-0"
      >
        {grouped.map(({ status, meta, items, widthPct }, index) => (
          <div key={status} className="flex min-h-0 shrink-0 md:min-w-0 md:shrink md:flex-1">
            <KanbanColumn
              status={status}
              label={meta.label}
              artists={items}
              selectedIds={selectedIds}
              widthPct={widthPct}
              canMoveEarlier={index > 0}
              canMoveLater={index < grouped.length - 1}
              onMoveEarlier={() => moveColumn(status, -1)}
              onMoveLater={() => moveColumn(status, 1)}
              onSelectArtist={(artist, event) => handleSelect(items, artist, event)}
              onOpenDetail={onOpenDetail}
              onSelectAll={(checked) => handleSelectAllInCol(status, checked)}
            />
            {index < grouped.length - 1 && (
              <ColumnResizeHandle
                onResize={(deltaPx) =>
                  handleResize(status, grouped[index + 1].status, deltaPx)
                }
              />
            )}
          </div>
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeArtist ? (
          <div className="w-[240px] rotate-1 opacity-95">
            <ArtistCard
              artist={activeArtist}
              selected={selectedIds.has(activeArtist.id)}
              onSelect={() => {}}
              onOpenDetail={() => {}}
              draggable={false}
            />
          </div>
        ) : null}
        {activeColumn ? (
          <div className="rounded-2xl border border-blue-300 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 shadow-lg">
            {STATUS_META[activeColumn].label}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
